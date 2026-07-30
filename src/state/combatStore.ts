/**
 * useCombatStore — điều phối vòng đời trận đánh (7.12 + luồng 2 lượt 6.2):
 * AI phát <combat_trigger> → dựng "Trận Đang Diễn" (seed cố định từ 5bis.1)
 * → (≥ Giao Tranh: hỏi Tự Chỉ Huy / Giao Cho Tướng) → engine phân giải →
 * áp patch state (quân chết vĩnh viễn, HP/EXP) → reportBlock chờ lượt kế
 * cho AI tường thuật. Reroll lượt kể KHÔNG đổi kết quả (report giữ nguyên
 * tới khi người chơi gửi tin mới).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMvuStore, currentSeedInfo, currentDay } from "./mvuStore";
import { eventSeed, makeRng } from "../probability/rng";
import { resolveBattle, battlePower, type BattleResult, type BattleSideInput, type WeatherCondition } from "../combat/battleResolver";
import { troopMatchup, compositionFromUnits, type MatchupSide } from "../combat/troopMatchup";
import { adjustWarScore, warScoreForOutcome, setWarStatus } from "../strategy/war";
import { captiveOpsFromGeneral } from "../strategy/betrayal";
import { dragonSideFactor, dragonBurnsGate } from "../combat/dragon";
import { newDragon, battleReadyDragons } from "../strategy/dragons";
import { awardBattleExperience } from "../strategy/army";
import { playerHouseId } from "../territory/territoryEngine";
import type { Dragon } from "../mvu/schema";
import { startDuel, runDuelRound, autoDuel, type DuelState, type DuelAction } from "../combat/duel";
import { initInteractiveBattle, initSiegeBattle, playArmyRound, autoPickArmyTactic, type InteractiveBattleState, type TacticId } from "../combat/battleEngine";
import { resolveSkirmish, type SkirmishDirective, type SkirmishSide } from "../combat/skirmish";
import { resolveNaval, playerFleetSide, enemyFleetFromAttrs, seaConditionFromAttrs, fleetMatchup } from "../combat/naval";
import { playerBattleSide, playerDuelist, enemyBattleSideFromAttrs, enemyDuelistFromAttrs } from "../combat/playerForces";
import { formatBattleReport, formatDuelReport, formatSkirmishReport, formatNavalReport } from "../combat/reportFormat";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import type { CombatScale, Terrain, StatData } from "../mvu/schema";
import { TerrainSchema } from "../mvu/schema";
import { createLogger } from "../lib/log";

const log = createLogger("combat");

export type CombatPhase = "idle" | "awaiting-choice" | "duel" | "army_battle" | "done";

/** So sánh lực lượng 2 phe (11.5-11.6) — ước lượng, không phải kết quả đã chốt. */
export interface ForcePreview {
  scale: CombatScale;
  terrain?: Terrain;
  condition?: string;
  playerLabel: string;
  enemyLabel: string;
  playerTroops: number;
  enemyTroops: number;
  /** chiến lực ước tính (đã tính chất lượng + ưu khuyết binh chủng + rồng). */
  playerStrength: number;
  enemyStrength: number;
  matchup: number;
}

interface CombatState {
  phase: CombatPhase;
  scale: CombatScale;
  terrain?: Terrain;
  description: string;
  attrs: Record<string, string>;
  battleSeed: number;
  /** duel tương tác đang chạy. */
  duelState: DuelState | null;
  /** army battle tương tác đang chạy. */
  armyBattleState: InteractiveBattleState | null;
  /** log kết quả hiển thị ở panel sau khi phân giải. */
  resultLog: string[];
  resultOutcome: string | null;
  /** khối <battle_report> + dữ liệu chờ AI tường thuật lượt kế (persist). */
  reportBlock: string | null;
  /** đã có 1 phản hồi AI tường thuật với report này (giữ qua reroll — 19.1). */
  reportNarrated: boolean;
  markNarrated: () => void;

  /** AI phát thẻ → mở trận. */
  startFromTrigger: (attrs: Record<string, string>, description: string) => void;
  /** ≥ Giao Tranh: Tự Chỉ Huy (kèm chỉ đạo) / Giao Cho Tướng. */
  resolveArmy: (mode: "self" | "delegate", directive?: SkirmishDirective) => void;
  /** Ước lượng lực lượng 2 phe (11.5-11.6) — cho panel so sánh trước khi giải. */
  forcePreview: () => ForcePreview | null;
  /** Đấu tay đôi: chọn kỹ năng/item mỗi vòng / hoặc auto. */
  duelRound: (action: DuelAction) => void;
  autoResolveDuel: () => void;
  /** Đại chiến tương tác: chọn chiến thuật mỗi vòng. */
  armyBattleRound: (tactic: TacticId) => void;
  /** Kết thúc đại chiến tương tác và áp dụng kết quả. */
  endArmyBattle: () => void;
  /** người chơi gửi tin mới → report đã dùng xong. */
  clearReport: () => void;
  /** đóng panel (giữ reportBlock cho lượt tường thuật). */
  closePanel: () => void;
  dismiss: () => void;
}

function scaleFromAttrs(attrs: Record<string, string>): CombatScale {
  const s = (attrs.scale || "").toLowerCase();
  if (s === "giao tranh" || s === "đại chiến" || s === "vây thành" || s === "hải chiến") {
    if (s === "giao tranh") return "Giao Tranh";
    if (s === "đại chiến") return "Đại Chiến";
    if (s === "vây thành") return "Vây Thành";
    return "Hải Chiến";
  }
  if (s === "đấu tay đôi") return "Đấu Tay Đôi";
  // suy từ enemy_size nếu AI quên scale
  const size = Number(attrs.enemy_size);
  if (!isNaN(size)) {
    if (size >= 20) return "Đại Chiến";
    return "Giao Tranh";
  }
  return "Giao Tranh"; // default fallback
}

function getSiegeWallHp(stat: any, attrs: Record<string, string>, playerRole: "attacker" | "defender" | undefined): number {
  let level = 1;
  if (playerRole === "defender") {
    // Tìm cấp lâu đài cao nhất của người chơi
    const territories = Object.values(stat["Lãnh Địa"] || {}) as any[];
    for (const t of territories) {
      const buildings = t["Các Công Trình"] || [];
      const castle = buildings.find((b: any) => b["Loại"] === "Lâu Đài");
      if (castle && castle["Cấp Độ"] > level) {
        level = castle["Cấp Độ"];
      }
    }
  } else {
    // Người chơi đi công thành, lấy cấp độ từ AI (hoặc random/dựa vào size)
    if (attrs.enemy_castle_level) {
      level = parseInt(attrs.enemy_castle_level, 10);
      if (isNaN(level)) level = 1;
    } else {
      // Suy ra từ enemy_size
      const size = Number(attrs.enemy_size) || 10;
      if (size >= 30) level = 3;
      else if (size >= 15) level = 2;
      else level = 1;
    }
  }

  // Chuyển level thành HP
  if (level === 3) return 10000;
  if (level === 2) return 6000;
  return 3000; // level 1
}

function terrainFromAttrs(attrs: Record<string, string>): Terrain | undefined {
  const parsed = TerrainSchema.safeParse(attrs.terrain);
  return parsed.success ? parsed.data : undefined;
}

/** Hệ số rồng ĐỊCH từ attrs combat_trigger (AI khai enemy_dragon="Trưởng Thành"/"true"/số). */
function enemyDragon(attrs: Record<string, string>): number {
  const raw = attrs.enemy_dragon;
  if (!raw || raw === "false" || raw === "0") return 1.0;
  const size: Dragon["Kích Cỡ"] =
    raw === "Khổng Lồ" || raw.includes("Khổng Lồ") ? "Khổng Lồ (Balerion-class)" : raw === "Non" ? "Non" : "Trưởng Thành";
  return dragonSideFactor([newDragon({
    "Tên": "Rồng địch", "Kích Cỡ": size, "Tình Trạng": "Khỏe", "_HP": 1000, "_HP Tối Đa": 1000,
    "Màu Sắc": "Đen", "Tuổi": 50,
    "Chỉ Số": { "Sức Lửa": 10, "Sức Bay": 10, "Giáp Vảy": 10, "Hung Dữ": 10, "Trung Thành": 10 },
    "Kỵ Sĩ": attrs.enemy_dragonrider || "Kỵ sĩ địch",
    "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 70,
  })]);
}

/** Parse chuỗi thành phần binh chủng địch từ attrs (JSON `{"Kỵ Binh":0.7}` hoặc "loại:tỷ,..."). */
function safeComposition(raw: string): Record<string, number> {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    if (Object.keys(out).length > 0) return out;
  } catch {
    /* rơi xuống parse "loại:tỷ,loại:tỷ" */
    const out: Record<string, number> = {};
    for (const pair of raw.split(",")) {
      const [k, v] = pair.split(":");
      const n = Number(v);
      if (k && Number.isFinite(n) && n > 0) out[k.trim()] = n;
    }
    if (Object.keys(out).length > 0) return out;
  }
  return { "Bộ Binh": 1 };
}

/** Engine ghi kết quả vào state (được phép ghi field `_` — khác đường AI/extractor). */
function applyEngineOps(ops: PatchOp[]): void {
  const mvu = useMvuStore.getState();
  const { state, warnings } = applyPatch(mvu.stat, ops);
  for (const w of warnings) log.warn(`Engine op warning: ${w.reason}`);
  useMvuStore.setState({ stat: state });
}

/** Trừ thuyền chìm vào các hạm đội theo tỷ lệ; hạm đội về 0 → xoá (7.8). */
function shipCasualtyOps(stat: StatData, totalLoss: number): PatchOp[] {
  const fleets = Object.entries(stat["Hạm Đội"]).filter(([, f]) => f["Số Chiến Thuyền"] > 0);
  const total = fleets.reduce((s, [, f]) => s + f["Số Chiến Thuyền"], 0);
  if (total === 0) return [];
  const ops: PatchOp[] = [];
  for (const [name, f] of fleets) {
    const loss = Math.min(f["Số Chiến Thuyền"], Math.round((totalLoss * f["Số Chiến Thuyền"]) / total));
    if (f["Số Chiến Thuyền"] - loss <= 0) {
      ops.push({ op: "remove", path: `stat_data.Hạm Đội.${name}` });
    } else {
      ops.push({ op: "replace", path: `stat_data.Hạm Đội.${name}.Số Chiến Thuyền`, value: f["Số Chiến Thuyền"] - loss });
      if (loss > 0) ops.push({ op: "replace", path: `stat_data.Hạm Đội.${name}.Tình Trạng`, value: "Hư Hại" });
    }
  }
  return ops;
}

/**
 * Trừ thương vong vào các đơn vị theo tỷ lệ; đơn vị về 0 → xoá (7.9.5).
 * M19: không phải ai ngã xuống cũng chết — một phần ba là THƯƠNG BINH, nằm trại
 * và quay lại hàng ngũ dần nếu hậu cần còn tử tế (strategy/army.tickArmy).
 */
function casualtyOps(stat: StatData, totalLoss: number, newMorale: string): PatchOp[] {
  const units = Object.entries(stat["Biên Chế Quân Sự"]).filter(([, u]) => u["Số Lượng"] > 0);
  const total = units.reduce((s, [, u]) => s + u["Số Lượng"], 0);
  if (total === 0) return [];
  const ops: PatchOp[] = [];
  for (const [name, u] of units) {
    const loss = Math.min(u["Số Lượng"], Math.round((totalLoss * u["Số Lượng"]) / total));
    if (u["Số Lượng"] - loss <= 0) {
      ops.push({ op: "remove", path: `stat_data.Biên Chế Quân Sự.${name}` }); // quân chết là chết
    } else {
      const wounded = Math.round(loss / 3);
      ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Số Lượng`, value: u["Số Lượng"] - loss });
      ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Sĩ Khí`, value: newMorale });
      if (wounded > 0) {
        ops.push({ op: "delta", path: `stat_data.Biên Chế Quân Sự.${name}.Thương Binh`, value: wounded });
      }
    }
  }
  return ops;
}

/** Đơn vị còn sống tham chiến — dùng để cộng kinh nghiệm sau trận (M19). */
function engagedUnitNames(stat: StatData): string[] {
  return Object.entries(stat["Biên Chế Quân Sự"])
    .filter(([, u]) => u["Số Lượng"] > 0 && u["Ngày Tập Hợp Còn Lại"] <= 0 && u["Ngày Huấn Luyện"] <= 0)
    .map(([name]) => name);
}

export const useCombatStore = create<CombatState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      scale: "Đấu Tay Đôi",
      terrain: undefined,
      description: "",
      attrs: {},
      battleSeed: 0,
      duelState: null,
      armyBattleState: null,
      resultLog: [],
      resultOutcome: null,
      reportBlock: null,
      reportNarrated: false,

      markNarrated: () => set({ reportNarrated: true }),

      startFromTrigger: (attrs, description) => {
        const { rootSeed, tick } = currentSeedInfo();
        const battleSeed = eventSeed(rootSeed, tick, "combat");
        const scale = scaleFromAttrs(attrs);
        const terrain = terrainFromAttrs(attrs);
        log.info(`Trận mới: ${scale} seed=${battleSeed}`, attrs);

        // dựng "Trận Đang Diễn" (7.12) — engine ghi field _
        applyEngineOps([
          { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: true },
          { op: "replace", path: "stat_data.Trận Đang Diễn.Quy Mô", value: scale },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Seed", value: battleSeed },
          ...(terrain ? [{ op: "replace" as const, path: "stat_data.Trận Đang Diễn.Địa Hình", value: terrain }] : []),
          { op: "replace", path: "stat_data.Trận Đang Diễn.Mô Tả", value: description },
          { op: "replace", path: "stat_data.Trận Đang Diễn.Phe Địch", value: [attrs.enemy ?? "Địch"] },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: [] },
        ]);

        if (scale === "Đấu Tay Đôi") {
          const stat = useMvuStore.getState().stat;
          const duel = startDuel(playerDuelist(stat), enemyDuelistFromAttrs(attrs), battleSeed);
          set({ phase: "duel", scale, terrain, description, attrs, battleSeed, duelState: duel, armyBattleState: null, resultLog: [], resultOutcome: null });
        } else {
          set({ phase: "awaiting-choice", scale, terrain, description, attrs, battleSeed, duelState: null, armyBattleState: null, resultLog: [], resultOutcome: null });
        }
      },

      resolveArmy: (mode, directive) => {
        const { attrs, battleSeed, scale, terrain } = get();
        const stat = useMvuStore.getState().stat;
        const difficulty = stat["Cài Đặt Ván"]["Độ Khó Chiến Đấu"];

        if (scale === "Giao Tranh") {
          // ---- tầng Giao Tranh (7.13) ----
          const player: SkirmishSide = {
            name: "Phe ta",
            troops: Math.min(50, Math.max(3, Number(attrs.ally_size) || 8)),
            quality: "Thường",
            morale: 70,
            logistics: "Tạm Được",
            troopType: "Bộ Binh",
            keyFighters: [{ name: stat["Thông Tin Nhân Vật"]["Họ Tên"], damagePerRound: 8 + stat["Chỉ Số Phái Sinh"]["_Sát Thương Cận"] }],
            ambusher: attrs.ambush === "player",
          };
          const enemy: SkirmishSide = {
            name: attrs.enemy ?? "Địch",
            troops: Math.min(50, Math.max(3, Number(attrs.enemy_size) || 10)),
            quality: (attrs.enemy_quality === "Tinh Nhuệ" ? "Tinh Nhuệ" : attrs.enemy_quality === "Rời Rạc" ? "Ô Hợp" : "Thường"),
            morale: 60,
            logistics: "Tạm Được",
            troopType: "Bộ Binh",
            keyFighters: [],
            ambusher: attrs.ambush === "enemy",
          };
          const r = resolveSkirmish(player, enemy, mode === "self" ? (directive ?? "Đánh Thẳng") : "Đánh Thẳng", battleSeed);
          const report = formatSkirmishReport(r, player, enemy);
          const ops: PatchOp[] = [
            { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
            { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: r.log },
          ];
          if (r.winner === "player") {
            ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Kinh Nghiệm", value: 30 });
          }
          if (r.keyFighterInjured === stat["Thông Tin Nhân Vật"]["Họ Tên"]) {
            ops.push({ op: "delta", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -Math.round(stat["Chỉ Số Phái Sinh"]["_HP Tối Đa"] * 0.2) });
          }
          applyEngineOps(ops);
          set({ phase: "done", resultLog: r.log, resultOutcome: r.winner === "player" ? "Thắng" : r.winner === "enemy" ? "Bại" : "Rút Lui", reportBlock: report });
          return;
        }

        if (scale === "Hải Chiến") {
          // ---- Hải chiến (7.8) qua Battle Resolver + điều kiện biển ----
          const pf = playerFleetSide(stat);
          const ef = enemyFleetFromAttrs(attrs);
          const condition = seaConditionFromAttrs(attrs);
          if (!pf) {
            // không có hạm đội → không thể hải chiến, đóng trận
            applyEngineOps([{ op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false }]);
            set({ phase: "done", resultOutcome: "Rút Lui", resultLog: ["Ngươi không có hạm đội để giao chiến trên biển."], reportBlock: null });
            return;
          }
          const result = resolveNaval({ playerFleet: pf, enemyFleet: ef, condition, seed: battleSeed, difficulty });
          const report = formatNavalReport(result, pf, ef);
          const ops: PatchOp[] = [
            ...shipCasualtyOps(stat, result.shipsLostPlayer),
            { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
            { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: result.log },
          ];
          const enemyHouseN = attrs.enemy_house;
          if (enemyHouseN) {
            ops.push(...setWarStatus(enemyHouseN, "Chiến Tranh"));
            ops.push(...adjustWarScore(enemyHouseN, warScoreForOutcome(result.outcome)));
          }
          applyEngineOps(ops);
          set({ phase: "done", resultLog: result.log, resultOutcome: result.outcome, reportBlock: report });
          return;
        }

        // ---- Đại Chiến / Vây Thành qua Battle Resolver (7.9) ----
        const player: BattleSideInput = { ...playerBattleSide(stat) };
        const enemy = enemyBattleSideFromAttrs(attrs);
        if (scale === "Vây Thành") {
          const defending = attrs.siege_role !== "attacker";
          player.siegeRole = defending ? "defender" : "attacker";
          enemy.siegeRole = defending ? "attacker" : "defender";
        }
        // ưuKhuyếtBinhChủng 4 lớp (7.9.2b): tính từ thành phần binh chủng 2 phe
        const siege = scale === "Vây Thành";
        const playerUnits = Object.values(stat["Biên Chế Quân Sự"]).filter((u) => u["Số Lượng"] > 0);
        const taSide: MatchupSide = {
          composition: playerUnits.length > 0 ? compositionFromUnits(playerUnits) : { [player.troopType]: 1 },
          training: player.training,
          house: player.house,
        };
        const dichSide: MatchupSide = {
          composition: attrs.enemy_composition ? safeComposition(attrs.enemy_composition) : { [enemy.troopType]: 1 },
          training: enemy.training,
          house: enemy.house,
        };
        const weather = stat["Thế Giới"]["Thời Tiết"] as import("../combat/battleResolver").WeatherCondition;
        player.matchupFactor = troopMatchup(taSide, dichSide, { terrain, weather, siege });
        enemy.matchupFactor = troopMatchup(dichSide, taSide, { terrain, weather, siege });

        // rồng/siêu nhiên (7.15 + M19) — chỉ rồng SẴN SÀNG mới ra trận: con đang
        // bị xích, đang dưỡng thương hay chưa thuần thì không cộng vào chiến lực
        const playerDragons = battleReadyDragons(stat);
        const playerDragonFactor = dragonSideFactor(playerDragons);
        const enemyDragonFactor = enemyDragon(attrs);
        if (playerDragonFactor > 1 && playerDragons.length > 0) {
          const avgDragonPower = (playerDragonFactor - 1) * 2 + 1.5;
          player.dragon = { name: playerDragons[0]["Đang Bị Xích"] ? "Rồng (xích)" : playerDragons[0]["Tên"], isRidden: !!playerDragons[0]["Kỵ Sĩ"], power: avgDragonPower, loyalty: playerDragons[0]["Chỉ Số"]["Trung Thành"] };
        }
        if (enemyDragonFactor > 1) {
          enemy.dragon = { name: "Rồng địch", isRidden: true, power: (enemyDragonFactor - 1) * 2 + 1.5, loyalty: 15 };
        }
        if (scale === "Vây Thành" && dragonBurnsGate(playerDragons) && enemy.siegeRole === "defender") {
          enemy.siegeRole = undefined; // rồng đốt cổng → bỏ qua biến tường thành (7.15)
        }

        // "Tự Chỉ Huy": người chơi trực tiếp cầm quân — thay tướng bằng chính mình,
        // chỉ đạo cho bonus nhỏ (khoảnh khắc quyết định 7.12)
        if (mode === "self") {
          const commandSkill = stat["Kỹ Năng"]["Chỉ Huy Quân"]?.["Cấp"] ?? 0;
          player.general = {
            name: stat["Thông Tin Nhân Vật"]["Họ Tên"],
            command: Math.min(100, 30 + commandSkill * 7 + stat["Chỉ Số Cốt Lõi"]["Uy Tín"] * 1.5),
            cunning: Math.min(100, stat["Chỉ Số Cốt Lõi"]["Trí Tuệ"] * 4),
            traits: directive === "Đánh Thẳng" ? ["Táo Bạo"] : directive === "Bảo Vệ Nhân Vật Then Chốt" ? ["Thận Trọng"] : [],
          };
        }
        if (mode === "self" && (scale === "Đại Chiến" || scale === "Vây Thành")) {
          // Đối với Giao Tranh, tạm thời ép kiểu sang BattleSideInput cho tương thích minigame
          const p = player as any;
          const e = enemy as any;
          const ibState = scale === "Vây Thành" 
            ? initSiegeBattle(p, e, terrain, weather, battleSeed, getSiegeWallHp(stat, attrs, p.siegeRole)) 
            : initInteractiveBattle(p, e, terrain, weather, battleSeed);
          set({ phase: "army_battle", armyBattleState: ibState });
          return;
        }

        const result: BattleResult = resolveBattle({ player, enemy, terrain, seed: battleSeed, difficulty });
        const report = formatBattleReport(result, player, enemy, scale, terrain);

        const wonBattle = result.outcome.includes("Thắng");
        const ops: PatchOp[] = [
          ...casualtyOps(stat, result.casualtiesPlayer, result.newMoralePlayer),
          // lính sống sót lên tay: kinh nghiệm đẩy bậc Huấn Luyện (M19)
          ...awardBattleExperience(stat, engagedUnitNames(stat), wonBattle),
          { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: result.log },
        ];
        // War Score + trạng thái chiến tranh với Nhà địch (12.1)
        const enemyHouse = attrs.enemy_house;
        if (enemyHouse) {
          ops.push(...setWarStatus(enemyHouse, "Chiến Tranh"));
          ops.push(...adjustWarScore(enemyHouse, warScoreForOutcome(result.outcome)));
        }
        // số phận tướng (7.7): tử trận/bị bắt
        if (result.generalFate) {
          const gname = result.generalFate.general;
          const capturedOn = currentDay();
          if (result.generalFate.side === "player" && stat["Tướng Lĩnh"][gname]) {
            // tướng TA: ghi vào Tướng Lĩnh
            if (result.generalFate.fate === "tử trận") {
              ops.push({ op: "replace", path: `stat_data.Tướng Lĩnh.${gname}.Còn Sống`, value: false });
            } else if (result.generalFate.fate === "bị bắt") {
              ops.push({ op: "replace", path: `stat_data.Tướng Lĩnh.${gname}.Bị Bắt Bởi`, value: enemy.name });
            }
          } else if (result.generalFate.side === "enemy" && result.generalFate.fate === "bị bắt") {
            // tướng ĐỊCH bị ta bắt → làm con tin (7.7 → tiền chuộc M11)
            ops.push(...captiveOpsFromGeneral(gname, undefined, playerHouseId(stat), capturedOn));
          }
        }
        applyEngineOps(ops);
        set({ phase: "done", resultLog: result.log, resultOutcome: result.outcome, reportBlock: report });
      },

      forcePreview: () => {
        const { attrs, scale, terrain } = get();
        if (scale === "Đấu Tay Đôi") return null;
        const stat = useMvuStore.getState().stat;

        if (scale === "Hải Chiến") {
          const pf = playerFleetSide(stat);
          const ef = enemyFleetFromAttrs(attrs);
          const condition = seaConditionFromAttrs(attrs);
          const m = pf ? fleetMatchup(pf, ef, condition) : 1;
          return {
            scale, condition,
            playerLabel: pf?.name ?? "(không hạm đội)", enemyLabel: ef.name,
            playerTroops: pf?.ships ?? 0, enemyTroops: ef.ships,
            playerStrength: Math.round((pf?.ships ?? 0) * m), enemyStrength: ef.ships, matchup: m,
          };
        }
        if (scale === "Giao Tranh") {
          const pt = Math.min(50, Math.max(3, Number(attrs.ally_size) || 8));
          const et = Math.min(50, Math.max(3, Number(attrs.enemy_size) || 10));
          return { scale, terrain, playerLabel: "Phe ta", enemyLabel: attrs.enemy ?? "Địch", playerTroops: pt, enemyTroops: et, playerStrength: pt, enemyStrength: et, matchup: 1 };
        }
        // Đại Chiến / Vây Thành
        const player: BattleSideInput = { ...playerBattleSide(stat) };
        const enemy = enemyBattleSideFromAttrs(attrs);
        const playerUnits = Object.values(stat["Biên Chế Quân Sự"]).filter((u) => u["Số Lượng"] > 0);
        const taSide: MatchupSide = { composition: playerUnits.length > 0 ? compositionFromUnits(playerUnits) : { [player.troopType]: 1 }, training: player.training, house: player.house };
        const dichSide: MatchupSide = { composition: attrs.enemy_composition ? safeComposition(attrs.enemy_composition) : { [enemy.troopType]: 1 }, training: enemy.training, house: enemy.house };
        const siegeCtx = scale === "Vây Thành";
        const weather = (stat["Thế Giới"]["Thời Tiết"] ?? "Trời Quang") as import("../combat/battleResolver").WeatherCondition;
        player.matchupFactor = troopMatchup(taSide, dichSide, { terrain, weather, siege: siegeCtx });
        enemy.matchupFactor = troopMatchup(dichSide, taSide, { terrain, weather, siege: siegeCtx });
        const playerDragonsP = battleReadyDragons(stat);
        const playerDragonFactorP = dragonSideFactor(playerDragonsP);
        const enemyDragonFactorP = enemyDragon(attrs);
        if (playerDragonFactorP > 1 && playerDragonsP.length > 0) {
          player.dragon = { name: playerDragonsP[0]["Tên"], isRidden: !!playerDragonsP[0]["Kỵ Sĩ"], power: (playerDragonFactorP - 1) * 2 + 1.5, loyalty: playerDragonsP[0]["Chỉ Số"]["Trung Thành"] };
        }
        if (enemyDragonFactorP > 1) {
          enemy.dragon = { name: "Rồng địch", isRidden: true, power: (enemyDragonFactorP - 1) * 2 + 1.5, loyalty: 15 };
        }
        return {
          scale, terrain,
          playerLabel: "Quân ta", enemyLabel: attrs.enemy ?? "Quân địch",
          playerTroops: player.totalTroops, enemyTroops: enemy.totalTroops,
          playerStrength: battlePower(player, enemy, terrain, weather), enemyStrength: battlePower(enemy, player, terrain, weather),
          matchup: player.matchupFactor ?? 1,
        };
      },

      duelRound: (action: import("../combat/duel").DuelAction) => {
        const { duelState, battleSeed } = get();
        if (!duelState || duelState.finished) return;
        
        // AI địch tự chọn action đơn giản
        const enemy = duelState.b;
        let enemyAction: import("../combat/duel").DuelAction = { type: "skill", skillId: "tan_cong_thuong" };
        if (enemy.hp < enemy.maxHp * 0.3 && enemy.inventory.includes("Bình Máu")) {
          enemyAction = { type: "item", itemId: "Bình Máu" };
        } else {
          const availableSkills = enemy.skills.filter(s => s.staminaCost <= enemy.stamina);
          if (availableSkills.length > 0) {
            enemyAction = { type: "skill", skillId: availableSkills[Math.floor(Math.random() * availableSkills.length)].id };
          }
        }
        
        const { state: next } = runDuelRound(duelState, action, enemyAction, battleSeed);
        if (next.finished) {
          finishDuel(next, set);
        } else {
          set({ duelState: next });
        }
      },

      autoResolveDuel: () => {
        const { duelState, battleSeed } = get();
        if (!duelState) return;
        const r = autoDuel(duelState.a, duelState.b, battleSeed);
        const synthetic: DuelState = { ...duelState, finished: true, winner: r.winner, log: r.log, round: r.rounds };
        finishDuel(synthetic, set);
      },

      armyBattleRound: (tactic: TacticId) => {
        const { armyBattleState, battleSeed } = get();
        if (!armyBattleState || armyBattleState.finished) return;

        const stat = useMvuStore.getState().stat;
        const weather = stat["Thế Giới"]["Thời Tiết"] as WeatherCondition;
        const rng = makeRng(battleSeed + armyBattleState.round * 77);
        const enemyTactic = autoPickArmyTactic(armyBattleState.enemy, weather, rng, armyBattleState.isSiege);

        const nextState = playArmyRound(armyBattleState, tactic, enemyTactic);
        set({ armyBattleState: nextState });
      },

      endArmyBattle: () => {
        const { armyBattleState, attrs } = get();
        if (!armyBattleState || !armyBattleState.finished) return;

        const stat = useMvuStore.getState().stat;
        const pLoss = armyBattleState.player.totalTroops - armyBattleState.player.currentTroops;

        const pWin = armyBattleState.winner === "player";
        const eWin = armyBattleState.winner === "enemy";
        const outcome = pWin ? "Thắng" : eWin ? "Bại" : "Giằng Co";

        const ops: PatchOp[] = [
          ...casualtyOps(stat, pLoss, pWin ? "Cao" : "Thấp"),
          { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: armyBattleState.log },
        ];

        const enemyHouse = attrs.enemy_house;
        if (enemyHouse) {
          ops.push(...setWarStatus(enemyHouse, "Chiến Tranh"));
          ops.push(...adjustWarScore(enemyHouse, warScoreForOutcome(outcome as any)));
        }

        applyEngineOps(ops);
        set({ phase: "done", resultLog: armyBattleState.log, resultOutcome: outcome, reportBlock: "Trận chiến kết thúc.", armyBattleState: null });
      },

      clearReport: () => set({ reportBlock: null, reportNarrated: false, phase: "idle", resultLog: [], resultOutcome: null, duelState: null }),

      closePanel: () => set({ phase: "idle", duelState: null }),

      dismiss: () => {
        applyEngineOps([{ op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false }]);
        set({ phase: "idle", duelState: null });
      },
    }),
    {
      name: "asoiaf-combat",
      version: 1,
      partialize: (s) => ({ reportBlock: s.reportBlock, reportNarrated: s.reportNarrated }),
    },
  ),
);

function finishDuel(duel: DuelState, set: (p: Partial<CombatState>) => void): void {
  const stat = useMvuStore.getState().stat;
  const playerName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const playerSide = duel.a.name === playerName ? duel.a : duel.b;
  const playerWon = duel.winner === playerName;

  const ops: PatchOp[] = [
    // HP/Thể Lực sau trận áp thẳng vào sinh tồn (7.3)
    { op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: Math.max(playerWon ? 1 : 0, playerSide.hp) },
    { op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.Thể Lực", value: playerSide.stamina },
    { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
    { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: duel.log },
  ];

  // Sync back anatomical injuries
  if (playerSide.body) {
    for (const [partName, partData] of Object.entries(playerSide.body)) {
      ops.push({ op: "replace", path: `stat_data.Cơ Thể.${partName}`, value: partData });
    }
  }

  // Sync back equipment durability
  if (playerSide.equipped) {
    for (const [slot, itemData] of Object.entries(playerSide.equipped)) {
      if (itemData) {
        ops.push({ op: "replace", path: `stat_data.Trang Bị Đang Mặc.${slot}`, value: itemData });
      }
    }
  }
  if (playerWon) {
    ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Kinh Nghiệm", value: 50 });
  }
  applyEngineOps(ops);

  const report = formatDuelReport(
    { winner: duel.winner!, loser: duel.winner === duel.a.name ? duel.b.name : duel.a.name, rounds: duel.round, hpLeftWinner: duel.winner === duel.a.name ? duel.a.hp : duel.b.hp, log: duel.log },
    playerName,
  );
  set({ phase: "done", duelState: duel, resultLog: duel.log, resultOutcome: playerWon ? "Thắng" : "Bại", reportBlock: report });
}
