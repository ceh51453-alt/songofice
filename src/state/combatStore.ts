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
import { resolveBattle, battlePower, normalizeWeather, type BattleResult, type BattleSideInput } from "../combat/battleResolver";
import { troopMatchup, compositionFromUnits, type MatchupSide } from "../combat/troopMatchup";
import { adjustWarScore, warScoreForOutcome, setWarStatus } from "../strategy/war";
import { captiveOpsFromGeneral } from "../strategy/betrayal";
import { dragonSideFactor, dragonBurnsGate } from "../combat/dragon";
import { newDragon, battleReadyDragons, battleReadyDragonEntries } from "../strategy/dragons";
import { awardBattleExperience } from "../strategy/army";
import { playerHouseId } from "../territory/territoryEngine";
import type { Dragon } from "../mvu/schema";
import {
  startDuel, runDuelRound, autoDuel, pickDuelAction, DUEL_GROUNDS,
  type DuelState, type DuelAction, type DuelGround, type DuelLight, type DuelBand,
} from "../combat/duel";
import {
  initInteractiveBattle, initSiegeBattle, playArmyRound, autoPickArmyTactic,
  sectionsFromHolding, supplyDaysFromHolding, describeBattle, describeSiege,
  type InteractiveBattleState, type TacticId, type RoundOptions,
} from "../combat/battleEngine";
import { resolveSkirmish, type SkirmishDirective, type SkirmishSide } from "../combat/skirmish";
import { resolveNaval, playerFleetSide, enemyFleetFromAttrs, seaConditionFromAttrs, fleetMatchup } from "../combat/naval";
import { playerBattleSideDetailed, playerDuelist, enemyBattleSideFromAttrs, enemyDuelistFromAttrs } from "../combat/playerForces";
import {
  mobilizeAt, homeSupportAt, battleLocation, describeMobilization,
  type MobilizationReport, type HomeSupport,
} from "../combat/mobilization";
import {
  initAerialDuel, playAerialRound, autoAerialDuel, pickAerialAction, makeAerialUnit,
  unitAlive, describeAerial,
  type AerialDuelState, type AerialAction, type AerialSide, type AerialUnit,
} from "../combat/aerialDuel";
import { formatBattleReport, formatDuelReport, formatSkirmishReport, formatNavalReport } from "../combat/reportFormat";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import { clamp } from "../mvu/helpers";
import { moraleEnumFromScore } from "../combat/scales";
import type { CombatScale, Terrain, StatData } from "../mvu/schema";
import { TerrainSchema } from "../mvu/schema";
import { createLogger } from "../lib/log";

const log = createLogger("combat");

export type CombatPhase = "idle" | "awaiting-choice" | "duel" | "army_battle" | "aerial" | "done";

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
  /** M23 — ai có mặt, ai vắng và vì sao. */
  mobilization?: MobilizationReport;
  /** M23 — công trình + lãnh địa đóng góp gì cho quân tại chỗ. */
  support?: HomeSupport;
}

interface CombatState {
  phase: CombatPhase;
  scale: CombatScale;
  terrain?: Terrain;
  description: string;
  attrs: Record<string, string>;
  battleSeed: number;
  /** M23 — địa điểm giao chiến; quyết định đơn vị nào có mặt và lãnh địa nào hậu thuẫn. */
  location: string;
  /** duel tương tác đang chạy. */
  duelState: DuelState | null;
  /** army battle tương tác đang chạy. */
  armyBattleState: InteractiveBattleState | null;
  /** M23 — không chiến rồng nhiều phe đang chạy. */
  aerialState: AerialDuelState | null;
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
  /** Đại chiến tương tác: chọn chiến thuật + mũi nhọn (hoặc đoạn tường) mỗi vòng. */
  armyBattleRound: (tactic: TacticId, opts?: RoundOptions) => void;
  /** Kết thúc đại chiến tương tác và áp dụng kết quả. */
  endArmyBattle: () => void;
  /** M23 — không chiến: chọn nước đi cho từng con rồng của ta mỗi vòng. */
  aerialRound: (actions: AerialAction[]) => void;
  autoResolveAerial: () => void;
  endAerialDuel: () => void;
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
  if (s === "không chiến" || s === "đấu rồng") return "Không Chiến";
  if (s === "đấu tay đôi") return "Đấu Tay Đôi";
  // suy từ enemy_size nếu AI quên scale
  const size = Number(attrs.enemy_size);
  if (!isNaN(size)) {
    if (size >= 20) return "Đại Chiến";
    return "Giao Tranh";
  }
  return "Giao Tranh"; // default fallback
}

/**
 * Cấp toà thành đang bị vây. Bản trước đọc `t["Các Công Trình"]` như một MẢNG —
 * field thật tên "Công Trình" và là RECORD, nên nhánh phòng thủ luôn rơi về cấp
 * 1 dù người chơi đã nâng lâu đài lên cấp 5.
 */
function siegeCastleLevel(stat: StatData, attrs: Record<string, string>, playerRole: "attacker" | "defender" | undefined): number {
  if (playerRole === "defender") {
    let level = 1;
    for (const t of Object.values(stat["Lãnh Địa"] ?? {})) {
      for (const b of Object.values(t["Công Trình"] ?? {})) {
        if (b["Loại"] === "Lâu Đài" && (b["Cấp Độ"] ?? 1) > level) level = b["Cấp Độ"];
      }
    }
    return level;
  }
  const declared = parseInt(attrs.enemy_castle_level ?? "", 10);
  if (Number.isFinite(declared) && declared > 0) return declared;
  const size = Number(attrs.enemy_size) || 10;
  return size >= 30 ? 3 : size >= 15 ? 2 : 1;
}

function getSiegeWallHp(stat: StatData, attrs: Record<string, string>, playerRole: "attacker" | "defender" | undefined): number {
  const level = siegeCastleLevel(stat, attrs, playerRole);
  return clamp(2000 + level * 2200, 3000, 16000);
}

/** Lãnh địa nào của người chơi đang bị vây (ưu tiên cái AI chỉ đích danh). */
function besiegedHoldingId(stat: StatData, attrs: Record<string, string>): string | undefined {
  const holdings = stat["Lãnh Địa"] ?? {};
  const named = attrs.territory ?? attrs.holding ?? attrs.siege_target;
  if (named && holdings[named]) return named;
  const underSiege = Object.entries(holdings).find(([, h]) => h["Tình Trạng"] === "Bị Vây");
  return underSiege?.[0] ?? Object.keys(holdings)[0];
}

/**
 * Dựng trận không chiến từ rồng THẬT của người chơi + các phe địch AI khai.
 *
 * AI mô tả phe địch bằng `enemy_dragons` — chuỗi `"tên:kỵ sĩ:cỡ|tên:kỵ sĩ:cỡ"`,
 * và `enemy_sides` nếu muốn nhiều hơn hai phe (`"Đen|Xanh|Trung Lập"`). Nhờ vậy
 * một trận 1v2v3 chỉ là một thẻ combat_trigger, không cần UI dựng phe.
 */
function buildAerialSetup(stat: StatData, attrs: Record<string, string>, seed: number) {
  const mine = battleReadyDragonEntries(stat).filter(([, d]) => d["_HP"] > 0);
  if (mine.length === 0) return null;

  const playerName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const sides: AerialSide[] = [{ id: "ta", name: attrs.player_side || `Phe ${stat["Thông Tin Nhân Vật"]["Nhà"] || playerName}` }];
  const units: AerialUnit[] = mine.map(([key, d], i) =>
    makeAerialUnit({
      id: `ta-${i}`, side: "ta", dragon: d, dragonKey: key,
      riderName: d["Kỵ Sĩ"] || (i === 0 ? playerName : undefined),
      riderHp: d["Kỵ Sĩ"] === playerName || (i === 0 && !d["Kỵ Sĩ"]) ? stat["Chỉ Số Sinh Tồn"]["HP"] : undefined,
    }),
  );

  // các phe địch: mặc định một phe, AI khai thêm thì tách ra
  const sideNames = (attrs.enemy_sides || attrs.enemy || "Phe địch").split("|").map((x) => x.trim()).filter(Boolean);
  const specs = (attrs.enemy_dragons || "").split("|").map((x) => x.trim()).filter(Boolean);
  const perSide = Math.max(1, Math.ceil(Math.max(specs.length, 1) / sideNames.length));

  sideNames.forEach((name, si) => {
    const sideId = `dich-${si}`;
    sides.push({ id: sideId, name });
    const slice = specs.length > 0 ? specs.slice(si * perSide, (si + 1) * perSide) : [""];
    slice.forEach((spec, i) => {
      const [dname, rider, size] = spec.split(":").map((x) => x.trim());
      units.push(makeAerialUnit({
        id: `${sideId}-${i}`,
        side: sideId,
        riderName: rider || `Kỵ sĩ ${name}`,
        dragon: newDragon({
          "Tên": dname || `Rồng ${name}`,
          "Kích Cỡ": size?.includes("Khổng Lồ") ? "Khổng Lồ (Balerion-class)" : size === "Non" ? "Non" : "Trưởng Thành",
          "Kỵ Sĩ": rider || `Kỵ sĩ ${name}`,
          "_HP": 1000, "_HP Tối Đa": 1000, "Tình Trạng": "Khỏe",
          "Chỉ Số": { "Sức Lửa": 14, "Sức Bay": 13, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
          "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 85,
        }),
      }));
    });
  });

  return { seed, weather: normalizeWeather(stat["Thế Giới"]["Thời Tiết"]), sides, units };
}

function terrainFromAttrs(attrs: Record<string, string>): Terrain | undefined {
  const parsed = TerrainSchema.safeParse(attrs.terrain);
  return parsed.success ? parsed.data : undefined;
}

/** Địa hình chiến trường → mặt sân của trận đấu tay đôi (M22). */
function duelGround(terrain: Terrain | undefined, attrs: Record<string, string>): DuelGround {
  const declared = attrs.ground as DuelGround | undefined;
  if (declared && declared in DUEL_GROUNDS) return declared;
  switch (terrain) {
    case "Đầm Lầy":
    case "Sông/Lối Vượt Sông": return "Bùn Lầy";
    case "Đồi Núi":
    case "Hẻm Núi": return "Dốc Đá";
    case "Tuyết/Băng Giá": return "Tuyết Dày";
    case "Sa Mạc": return "Cát Lún";
    case "Thành Trì (thủ)": return "Sàn Hẹp";
    default: return "Bằng Phẳng";
  }
}

/** Ánh sáng: AI khai giờ trong ngày, không thì mặc định ban ngày. */
function duelLight(attrs: Record<string, string>): DuelLight {
  const t = (attrs.time_of_day ?? attrs.light ?? "").toLowerCase();
  if (/đêm|night|khuya/.test(t)) return "Đêm Tối";
  if (/chạng vạng|hoàng hôn|rạng|dusk|dawn/.test(t)) return "Chạng Vạng";
  return "Ban Ngày";
}

/** Cự ly mở màn: bị bắn tỉa từ xa khác hẳn bị vồ trong hành lang hẹp. */
function duelStartBand(attrs: Record<string, string>): DuelBand {
  const d = (attrs.distance ?? attrs.start_distance ?? "").toLowerCase();
  if (/xa|ranged|tầm xa/.test(d)) return "Tầm Xa";
  if (/áp sát|vật|grapple|ôm/.test(d)) return "Áp Sát";
  if (attrs.enemy_class === "cung_thu") return "Tầm Xa";
  return "Cận Chiến";
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
function casualtyOps(
  stat: StatData,
  totalLoss: number,
  newMorale: string,
  opts: { location?: string; medic?: number } = {},
): PatchOp[] {
  // M23: máu chỉ đổ trên đầu đơn vị THẬT SỰ RA TRẬN. Trước đây thương vong chia
  // đều cho cả biên chế, nên một đạo quân đóng cách đó nghìn dặm vẫn chết lính
  // trong một trận nó không hề tham gia.
  const fielded = opts.location !== undefined
    ? mobilizeAt(stat, opts.location).fielded
    : Object.entries(stat["Biên Chế Quân Sự"]);
  const units = fielded.filter(([, u]) => u["Số Lượng"] > 0);
  const total = units.reduce((s, [, u]) => s + u["Số Lượng"], 0);
  if (total === 0) return [];
  // học sĩ trong lãnh địa kéo thêm được một phần người ngã xuống về trại thương
  const woundedShare = clamp(1 / 3 + (opts.medic ?? 0), 0.2, 0.7);
  const ops: PatchOp[] = [];
  for (const [name, u] of units) {
    const loss = Math.min(u["Số Lượng"], Math.round((totalLoss * u["Số Lượng"]) / total));
    if (u["Số Lượng"] - loss <= 0) {
      ops.push({ op: "remove", path: `stat_data.Biên Chế Quân Sự.${name}` }); // quân chết là chết
    } else {
      const wounded = Math.round(loss * woundedShare);
      ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Số Lượng`, value: u["Số Lượng"] - loss });
      ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Sĩ Khí`, value: newMorale });
      if (wounded > 0) {
        ops.push({ op: "delta", path: `stat_data.Biên Chế Quân Sự.${name}.Thương Binh`, value: wounded });
      }
    }
  }
  return ops;
}

/** Đơn vị CÓ MẶT ở chiến trường — dùng để cộng kinh nghiệm sau trận (M19+M23). */
function engagedUnitNames(stat: StatData, location?: string): string[] {
  return mobilizeAt(stat, location ?? "")
    .fielded.filter(([, u]) => u["Số Lượng"] > 0)
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
      location: "",
      duelState: null,
      armyBattleState: null,
      aerialState: null,
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
        const battleAt = battleLocation(useMvuStore.getState().stat, attrs);
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

        if (scale === "Không Chiến") {
          const stat = useMvuStore.getState().stat;
          const setup = buildAerialSetup(stat, attrs, battleSeed);
          if (!setup) {
            applyEngineOps([{ op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false }]);
            set({ phase: "done", scale, resultOutcome: "Rút Lui", resultLog: ["Ngươi không có con rồng nào bay được để lên trời."], reportBlock: null });
            return;
          }
          set({
            phase: "aerial", scale, terrain, description, attrs, battleSeed, location: battleAt,
            aerialState: initAerialDuel(setup), duelState: null, armyBattleState: null,
            resultLog: [], resultOutcome: null,
          });
          return;
        }

        if (scale === "Đấu Tay Đôi") {
          const stat = useMvuStore.getState().stat;
          const mounted = attrs.mounted === "true" || attrs.player_mounted === "true";
          const duel = startDuel(
            playerDuelist(stat, { mounted }),
            enemyDuelistFromAttrs(attrs),
            battleSeed,
            { ground: duelGround(terrain, attrs), light: duelLight(attrs), distance: duelStartBand(attrs) },
          );
          set({ phase: "duel", scale, terrain, description, attrs, battleSeed, location: battleAt, duelState: duel, armyBattleState: null, resultLog: [], resultOutcome: null });
        } else {
          set({ phase: "awaiting-choice", scale, terrain, description, attrs, battleSeed, location: battleAt, duelState: null, armyBattleState: null, resultLog: [], resultOutcome: null });
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
        // M23: chỉ quân ĐANG Ở chiến trường mới ra trận, và lãnh địa đứng sau
        // lưng (công trình, kho lương, lòng dân) cộng thẳng vào chất lượng quân.
        const location = battleLocation(stat, attrs);
        const detailed = playerBattleSideDetailed(stat, { location });
        const player: BattleSideInput = { ...detailed.side };
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
        const weather = normalizeWeather(stat["Thế Giới"]["Thời Tiết"]);
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
        // M23 — đàn rồng THẬT: mỗi con một thực thể có máu, ra trận và có thể chết
        player.dragons = battleReadyDragonEntries(stat).map(([key, dragon]) => ({ key, dragon }));
        // ụ nỏ bắn rồng: ta lấy từ công trình lãnh địa, địch do AI khai
        enemy.scorpions = Number(attrs.enemy_scorpions) || 0;
        if (enemyDragonFactor > 1) {
          enemy.dragons = [{
            key: "enemy-dragon",
            dragon: newDragon({
              "Tên": attrs.enemy_dragon_name || "Rồng địch",
              "Kích Cỡ": attrs.enemy_dragon?.includes("Khổng Lồ") ? "Khổng Lồ (Balerion-class)" : attrs.enemy_dragon === "Non" ? "Non" : "Trưởng Thành",
              "Kỵ Sĩ": attrs.enemy_dragonrider || undefined,
              "_HP": 1000, "_HP Tối Đa": 1000, "Tình Trạng": "Khỏe",
              "Chỉ Số": { "Sức Lửa": 14, "Sức Bay": 13, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
              "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 80,
            }),
          }];
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
          player.composition = taSide.composition;
          enemy.composition = dichSide.composition;
          let ibState: InteractiveBattleState;
          if (scale === "Vây Thành") {
            // M22: nếu người chơi là phe THỦ thì tường thật mà họ đã xây trong
            // lãnh địa (territory/walls.ts) chính là tường phải giữ, và kho lương
            // của lãnh địa chính là đồng hồ đếm ngược của cuộc vây.
            const defending = player.siegeRole === "defender";
            const holdingId = defending ? besiegedHoldingId(stat, attrs) : undefined;
            const sections = defending ? sectionsFromHolding(stat, holdingId) ?? undefined : undefined;
            const garrison = defending ? player.totalTroops : enemy.totalTroops;
            const civilians = defending
              ? (holdingId ? (stat["Lãnh Địa"][holdingId]?.["Dân Số"] ?? 0) : 0)
              : Number(attrs.enemy_civilians) || 0;
            const supplyDays = defending
              ? supplyDaysFromHolding(stat, garrison + civilians * 0.35, holdingId)
              : Number(attrs.enemy_supply_days) || 120;
            ibState = initSiegeBattle(
              player, enemy, terrain, weather, battleSeed,
              getSiegeWallHp(stat, attrs, player.siegeRole),
              { sections, supplyDays, civilians },
            );
          } else {
            ibState = initInteractiveBattle(player, enemy, terrain, weather, battleSeed);
          }
          set({ phase: "army_battle", armyBattleState: ibState });
          return;
        }

        const result: BattleResult = resolveBattle({ player, enemy, terrain, seed: battleSeed, difficulty });
        const report = formatBattleReport(result, player, enemy, scale, terrain);

        const wonBattle = result.outcome.includes("Thắng");
        const ops: PatchOp[] = [
          ...casualtyOps(stat, result.casualtiesPlayer, result.newMoralePlayer, { location, medic: detailed.support.medic }),
          // lính sống sót lên tay: kinh nghiệm đẩy bậc Huấn Luyện (M19)
          ...awardBattleExperience(stat, engagedUnitNames(stat, location), wonBattle),
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
        const loc = get().location || battleLocation(stat, attrs);
        const detail = playerBattleSideDetailed(stat, { location: loc });
        const player: BattleSideInput = { ...detail.side };
        const enemy = enemyBattleSideFromAttrs(attrs);
        const playerUnits = Object.values(stat["Biên Chế Quân Sự"]).filter((u) => u["Số Lượng"] > 0);
        const taSide: MatchupSide = { composition: playerUnits.length > 0 ? compositionFromUnits(playerUnits) : { [player.troopType]: 1 }, training: player.training, house: player.house };
        const dichSide: MatchupSide = { composition: attrs.enemy_composition ? safeComposition(attrs.enemy_composition) : { [enemy.troopType]: 1 }, training: enemy.training, house: enemy.house };
        const siegeCtx = scale === "Vây Thành";
        const weather = normalizeWeather(stat["Thế Giới"]["Thời Tiết"]);
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
          mobilization: detail.mobilization,
          support: detail.support,
        };
      },

      duelRound: (action: DuelAction) => {
        const { duelState, battleSeed } = get();
        if (!duelState || duelState.finished) return;

        // AI địch: chấm điểm theo tình thế và gieo bằng RNG CÓ HẠT GIỐNG. Bản
        // trước dùng Math.random() nên cùng một seed cho hai diễn biến khác nhau,
        // phá vỡ giao kèo "reroll không đổi kết quả" của cả hệ (5bis.1).
        const rng = makeRng((battleSeed ^ ((duelState.round + 1) * 0x85ebca6b)) >>> 0);
        const enemyAction = pickDuelAction(duelState.b, duelState.a, duelState.distance, rng);

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

      armyBattleRound: (tactic: TacticId, opts: RoundOptions = {}) => {
        const { armyBattleState, battleSeed } = get();
        if (!armyBattleState || armyBattleState.finished) return;

        const stat = useMvuStore.getState().stat;
        const weather = normalizeWeather(stat["Thế Giới"]["Thời Tiết"]);
        const rng = makeRng(battleSeed + armyBattleState.round * 77);
        const enemyTactic = autoPickArmyTactic(
          armyBattleState.enemy, weather, rng, armyBattleState.isSiege, armyBattleState,
        );

        const nextState = playArmyRound(armyBattleState, tactic, enemyTactic, opts);
        set({ armyBattleState: nextState });
      },

      endArmyBattle: () => {
        const { armyBattleState, attrs, scale, location } = get();
        if (!armyBattleState || !armyBattleState.finished) return;

        const stat = useMvuStore.getState().stat;
        const pLoss = Math.max(0, armyBattleState.player.totalTroops - armyBattleState.player.currentTroops);
        const eLoss = Math.max(0, armyBattleState.enemy.totalTroops - armyBattleState.enemy.currentTroops);

        const pWin = armyBattleState.winner === "player";
        const eWin = armyBattleState.winner === "enemy";
        // thang 7 bậc: thắng mà mất quá nửa quân thì không gọi là đại thắng được
        const lossPct = armyBattleState.player.totalTroops > 0 ? pLoss / armyBattleState.player.totalTroops : 0;
        const outcome: BattleResult["outcome"] = pWin
          ? (lossPct < 0.1 ? "Đại Thắng" : lossPct < 0.3 ? "Thắng" : "Tiểu Thắng")
          : eWin
            ? (lossPct > 0.6 ? "Đại Bại" : lossPct > 0.35 ? "Bại" : "Tiểu Bại")
            : "Giằng Co";

        // M22: sĩ khí sau trận lấy từ sĩ khí THẬT còn lại trên chiến trường
        const newMorale = moraleEnumFromScore(clamp(armyBattleState.player.currentMorale, 0, 100));

        const ops: PatchOp[] = [
          ...casualtyOps(stat, pLoss, newMorale, { location, medic: homeSupportAt(stat, location).medic }),
          ...awardBattleExperience(stat, engagedUnitNames(stat, location), pWin),
          { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: armyBattleState.log },
        ];

        // ── vây thành: hậu quả ghi ngược vào lãnh địa ──
        const siege = armyBattleState.siege;
        if (siege && armyBattleState.player.siegeRole === "defender") {
          const holdingId = besiegedHoldingId(stat, attrs);
          const holding = holdingId ? stat["Lãnh Địa"][holdingId] : undefined;
          if (holdingId && holding) {
            // tường thật bị bắn phá bao nhiêu thì Nguyên Vẹn tụt bấy nhiêu
            const lines = (holding["Tường Thành"] ?? []).map((w) => {
              const sec = siege.sections.find((s) => s.id === w["Mã"]);
              if (!sec) return w;
              const intact = sec.breached ? 0 : Math.round((sec.hp / Math.max(1, sec.maxHp)) * 100);
              return { ...w, "Nguyên Vẹn": clamp(intact, 0, 100) };
            });
            ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${holdingId}.Tường Thành`, value: lines });
            // lương thực đã ăn hết trong những ngày bị vây
            const eaten = Math.round((holding["Tài Nguyên"]?.["Lương Thực"] ?? 0) * clamp(siege.days / 180, 0, 0.9));
            if (eaten > 0) {
              ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${holdingId}.Tài Nguyên.Lương Thực`, value: -eaten });
            }
            // đói và dịch bệnh giết dân, không chỉ giết lính
            if (siege.diseaseInside > 30 || siege.supplyDays <= 0) {
              const dead = Math.round((holding["Dân Số"] ?? 0) * clamp(siege.diseaseInside / 400 + (siege.supplyDays <= 0 ? 0.05 : 0), 0, 0.2));
              if (dead > 0) ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${holdingId}.Dân Số`, value: -dead });
            }
            ops.push({
              op: "replace", path: `stat_data.Lãnh Địa.${holdingId}.Tình Trạng`,
              value: eWin ? "Mới Chiếm" : "Ổn Định",
            });
          }
        }

        // ── M23: rồng ra trận thì rồng cũng chảy máu ──
        const myDragons = armyBattleState.siege
          ? (armyBattleState.player.siegeRole === "attacker" ? armyBattleState.siege.air.attacker : armyBattleState.siege.air.defender)
          : armyBattleState.air.player;
        for (const d of myDragons) {
          if (!stat["Rồng"]?.[d.key]) continue;
          const base = `stat_data.Rồng.${d.key}`;
          ops.push({ op: "replace", path: `${base}._HP`, value: Math.max(0, d.hp) });
          if (d.downed) {
            // rơi khỏi bầu trời không phải lúc nào cũng là chết — nhưng gần như thế
            ops.push({ op: "replace", path: `${base}.Tình Trạng`, value: "Đang Hồi Phục" });
            ops.push({ op: "replace", path: `${base}.Ngày Hồi Phục Còn Lại`, value: 180 });
            ops.push({ op: "replace", path: `${base}.Sẵn Sàng Chiến Đấu`, value: false });
          } else if (d.wounded) {
            ops.push({ op: "replace", path: `${base}.Tình Trạng`, value: "Bị Thương" });
            ops.push({ op: "replace", path: `${base}.Ngày Hồi Phục Còn Lại`, value: 30 });
          } else if (d.fled) {
            ops.push({ op: "replace", path: `${base}.Tình Trạng`, value: "Kiệt Sức" });
          }
        }
        // kỵ sĩ rơi theo rồng: nếu là tướng của ta thì tướng ấy chết
        const lostRiders = armyBattleState.siege ? armyBattleState.siege.ridersLost : armyBattleState.ridersLost;
        for (const rider of lostRiders) {
          if (stat["Tướng Lĩnh"]?.[rider]) {
            ops.push({ op: "replace", path: `stat_data.Tướng Lĩnh.${rider}.Còn Sống`, value: false });
          }
          if (rider === stat["Thông Tin Nhân Vật"]["Họ Tên"]) {
            ops.push({ op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: 1 });
          }
        }

        const enemyHouse = attrs.enemy_house;
        if (enemyHouse) {
          ops.push(...setWarStatus(enemyHouse, "Chiến Tranh"));
          ops.push(...adjustWarScore(enemyHouse, warScoreForOutcome(outcome)));
        }
        if (pWin) {
          ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Kinh Nghiệm", value: 80 });
        }

        applyEngineOps(ops);

        const report = [
          "<battle_report>",
          `Quy mô: ${scale} · Kết quả: ${outcome}`,
          location ? `Chiến trường: ${location} — ${describeMobilization(mobilizeAt(stat, location))}` : "",
          describeBattle(armyBattleState),
          `Thương vong: ta ${pLoss} · địch ${eLoss}`,
          siege ? describeSiege(siege) : "",
          "Diễn biến then chốt:",
          ...armyBattleState.log.filter((l) => /\[|VỠ|💀|⚠️|🔥/.test(l)).slice(-8),
          "</battle_report>",
        ].filter(Boolean).join("\n");

        set({ phase: "done", resultLog: armyBattleState.log, resultOutcome: outcome, reportBlock: report, armyBattleState: null });
      },

      aerialRound: (actions) => {
        const { aerialState, battleSeed } = get();
        if (!aerialState || aerialState.finished) return;
        // phe địch tự chọn nước đi bằng RNG có hạt giống
        const rng = makeRng((battleSeed ^ (aerialState.round * 0x27d4eb2f)) >>> 0);
        const mine = new Set(actions.map((a) => a.unitId));
        const enemyActions = aerialState.units
          .filter((u) => unitAlive(u) && !mine.has(u.id) && u.side !== "ta")
          .map((u) => pickAerialAction(aerialState, u, rng));
        set({ aerialState: playAerialRound(aerialState, [...actions, ...enemyActions]) });
      },

      autoResolveAerial: () => {
        const { aerialState, battleSeed } = get();
        if (!aerialState) return;
        set({
          aerialState: autoAerialDuel({
            seed: battleSeed, weather: aerialState.weather,
            sides: aerialState.sides, units: aerialState.units,
          }),
        });
      },

      endAerialDuel: () => {
        const { aerialState } = get();
        if (!aerialState || !aerialState.finished) return;
        const stat = useMvuStore.getState().stat;
        const won = aerialState.winner === "ta";
        const ops: PatchOp[] = [
          { op: "replace", path: "stat_data.Trận Đang Diễn._Đang Chiến Đấu", value: false },
          { op: "replace", path: "stat_data.Trận Đang Diễn._Log", value: aerialState.log },
        ];

        // ghi thương tích rồng ngược vào bảng "Rồng"
        for (const u of aerialState.units.filter((x) => x.side === "ta" && x.dragonKey)) {
          if (!stat["Rồng"]?.[u.dragonKey!]) continue;
          const base = `stat_data.Rồng.${u.dragonKey}`;
          ops.push({ op: "replace", path: `${base}._HP`, value: Math.max(0, u.dragonHp) });
          if (u.downed) {
            ops.push({ op: "replace", path: `${base}.Tình Trạng`, value: "Đang Hồi Phục" });
            ops.push({ op: "replace", path: `${base}.Ngày Hồi Phục Còn Lại`, value: 240 });
            ops.push({ op: "replace", path: `${base}.Sẵn Sàng Chiến Đấu`, value: false });
          } else if (u.dragonHp < u.dragonMaxHp * 0.6) {
            ops.push({ op: "replace", path: `${base}.Tình Trạng`, value: "Bị Thương" });
            ops.push({ op: "replace", path: `${base}.Ngày Hồi Phục Còn Lại`, value: 45 });
          }
          // mất kỵ sĩ thì con rồng hoang trở lại
          if (u.unhorsed) {
            ops.push({ op: "replace", path: `${base}.Mức Độ Thuần Hóa`, value: Math.max(0, u.bond) });
          }
        }

        // kỵ sĩ chết: chính người chơi hoặc tướng của ta
        const playerName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
        for (const rider of aerialState.ridersDead) {
          if (rider === playerName) {
            ops.push({ op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: 0 });
          } else if (stat["Tướng Lĩnh"]?.[rider]) {
            ops.push({ op: "replace", path: `stat_data.Tướng Lĩnh.${rider}.Còn Sống`, value: false });
          }
        }
        // kỵ sĩ ta còn sống: đồng bộ máu về Sinh Tồn
        const me = aerialState.units.find((u) => u.riderName === playerName);
        if (me && !aerialState.ridersDead.includes(playerName)) {
          ops.push({ op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: Math.max(1, me.riderHp) });
        }
        if (won) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Kinh Nghiệm", value: 120 });

        applyEngineOps(ops);
        const report = [
          "<battle_report>",
          `Quy mô: Không Chiến · Kết quả: ${won ? "Thắng" : "Bại"}`,
          describeAerial(aerialState),
          aerialState.ridersDead.length > 0 ? `Kỵ sĩ tử nạn: ${aerialState.ridersDead.join(", ")}` : "",
          "Diễn biến then chốt:",
          ...aerialState.log.filter((l) => /💀|ĐÃ RƠI|rơi|hất khỏi yên/.test(l)).slice(-8),
          "</battle_report>",
        ].filter(Boolean).join("\n");
        set({ phase: "done", resultLog: aerialState.log, resultOutcome: won ? "Thắng" : "Bại", reportBlock: report, aerialState: null });
      },

      clearReport: () => set({ reportBlock: null, reportNarrated: false, phase: "idle", resultLog: [], resultOutcome: null, duelState: null, aerialState: null }),

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
