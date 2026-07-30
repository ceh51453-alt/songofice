/**
 * useMilitaryStore — UI quân sự (11.5 + đại tu M19) + điều phối hành động engine.
 *
 * Nguồn chân lý quân/chủ quyền ở mvuStore; store này giữ trạng thái chọn đơn vị
 * + chế độ điều quân, và gọi engine (tuyển/thuê/hiệu triệu/điều rồng/vây/chiến)
 * qua applyPatch (engine giữ số — được ghi field `_`, khác đường AI/extractor).
 *
 * TUYỂN QUÂN là hành động duy nhất người chơi bấm tay được; mọi thứ còn lại
 * (điều quân, vây thành, rồng ra trận) đi theo lời kể — nhưng thẻ AI cũng đi
 * qua đúng các hàm dưới đây, nên hai đường không bao giờ lệch luật.
 */
import { create } from "zustand";
import { useMvuStore } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import { recruitUnit, moveArmy, hireMercenaries, disbandUnit, extendService } from "../strategy/army";
import { callBanners, dismissVassal, type BannerResponse } from "../strategy/muster";
import { flyDragon, feedDragon } from "../strategy/dragons";
import { addSellswordOffer } from "../strategy/sellswords";
import type { MilitaryTagType } from "../ui/tags/parseNarrative";
import { startSiege, declareWar, makePeace, adjustWarScore } from "../strategy/war";
import { amphibiousLandingOps, blockadeOps } from "../combat/naval";
import type { TroopTypeAll } from "../content/westeros/troopTypes";
import type { ArmyBranch } from "../mvu/schema";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { createLogger } from "../lib/log";

const log = createLogger("military");

function applyEngineOps(ops: PatchOp[]): void {
  if (ops.length === 0) return;
  const mvu = useMvuStore.getState();
  const { state, warnings } = applyPatch(mvu.stat, ops);
  for (const w of warnings) log.warn(`Engine op: ${w.reason}`);
  useMvuStore.setState({ stat: state });
}

function pushEvent(text: string, kind: "territory" | "military" = "military"): void {
  useMvuStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { kind, text }] }));
}

interface MilitaryState {
  /** đơn vị đang chọn (điều quân/vây). */
  selectedUnit: string | null;
  selectUnit: (name: string | null) => void;
  /** chế độ điều quân trên bản đồ (highlight đích). */
  moveMode: boolean;
  setMoveMode: (v: boolean) => void;

  /** tuyển quân theo NGẠCH (M19) — mặc định Chính Quy cho tương thích cũ. */
  recruit: (territoryId: string, type: TroopTypeAll, count: number, opts?: { branch?: ArmyBranch; name?: string; commander?: string } | string) => { ok: boolean; error?: string; unit?: string };
  /** ký khế ước với một đoàn đánh thuê đang chào giá. */
  hire: (companyKey: string, count: number, stationTerritoryId?: string) => { ok: boolean; error?: string; unit?: string };
  /** cho quân về nhà (dân về ruộng, chư hầu về thành). */
  disband: (unitName: string) => { ok: boolean; error?: string };
  /** giữ dân phục dịch thêm một kỳ — tốn vàng và lòng dân. */
  extendLevy: (unitName: string, days?: number) => { ok: boolean; error?: string };

  /** phất cờ hiệu triệu chư hầu (toàn bộ / theo vùng / một nhà). */
  callBanners: (scope?: string) => { ok: boolean; error?: string; responses: BannerResponse[] };
  dismissBanner: (vassalId: string) => { ok: boolean; error?: string };

  /** điều rồng bay tới lãnh địa khác. */
  flyDragon: (dragonKey: string, targetTerritoryId: string) => { ok: boolean; error?: string; days?: number };
  /** cho rồng ăn từ kho lãnh địa. */
  feedDragon: (dragonKey: string, territoryId: string) => { ok: boolean; error?: string };

  moveUnit: (unitName: string, targetTerritoryId: string) => { ok: boolean; error?: string; days?: number };
  siege: (unitName: string, targetTerritoryId: string) => { ok: boolean; error?: string };
  setWar: (houseId: string, atWar: boolean) => void;
  bumpWarScore: (houseId: string, delta: number) => void;

  /** Đổ bộ (7.8): hạm đội chở bộ binh → lãnh địa ven biển địch → tạo quân đổ bộ. */
  amphibiousLanding: (fleetName: string, targetTerritoryId: string) => { ok: boolean; error?: string; unit?: string };
  /** Phong toả cảng địch (7.8) — cắt tiếp tế đường biển. */
  blockade: (fleetName: string, targetTerritoryId: string) => { ok: boolean; error?: string };

  /**
   * Thẻ quân sự do AI phát (M19) đi qua ĐÚNG các hàm engine ở trên — lời kể
   * không được phép đẻ ra quân mà không trả giá. Trả về nhật ký để log/toast.
   */
  applyMilitaryTags: (tags: { type: MilitaryTagType; attrs: Record<string, string>; content: string }[]) => string[];
}

export const useMilitaryStore = create<MilitaryState>()((set) => ({
  selectedUnit: null,
  selectUnit: (selectedUnit) => set({ selectedUnit }),
  moveMode: false,
  setMoveMode: (moveMode) => set({ moveMode }),

  recruit: (territoryId, type, count, opts) => {
    const o = typeof opts === "string" ? { unitName: opts } : { branch: opts?.branch, unitName: opts?.name, commander: opts?.commander };
    const r = recruitUnit(useMvuStore.getState().stat, territoryId, type, count, o);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true, unit: r.unitName };
  },

  hire: (companyKey, count, stationTerritoryId) => {
    const r = hireMercenaries(useMvuStore.getState().stat, companyKey, count, stationTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    pushEvent(`Ngươi ký khế ước với ${companyKey}: ${count.toLocaleString("vi-VN")} tay giáo về dưới cờ.`);
    return { ok: true, unit: r.unitName };
  },

  disband: (unitName) => {
    const r = disbandUnit(useMvuStore.getState().stat, unitName);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  extendLevy: (unitName, days) => {
    const r = extendService(useMvuStore.getState().stat, unitName, days);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  callBanners: (scope) => {
    const r = callBanners(useMvuStore.getState().stat, scope);
    if (!r.ok) return { ok: false, error: r.error, responses: [] };
    applyEngineOps(r.ops);
    const sent = r.responses.filter((x) => !x.refused).reduce((s, x) => s + x.troops, 0);
    const refused = r.responses.filter((x) => x.refused).length;
    pushEvent(
      `Cờ hiệu đã phất: ${sent.toLocaleString("vi-VN")} quân chư hầu đang trên đường` +
        (refused > 0 ? `, ${refused} nhà từ chối.` : "."),
    );
    return { ok: true, responses: r.responses };
  },

  dismissBanner: (vassalId) => {
    const r = dismissVassal(useMvuStore.getState().stat, vassalId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  flyDragon: (dragonKey, targetTerritoryId) => {
    const r = flyDragon(useMvuStore.getState().stat, dragonKey, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true, days: r.days };
  },

  feedDragon: (dragonKey, territoryId) => {
    const r = feedDragon(useMvuStore.getState().stat, dragonKey, territoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  moveUnit: (unitName, targetTerritoryId) => {
    const r = moveArmy(useMvuStore.getState().stat, unitName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    set({ moveMode: false, selectedUnit: null });
    return { ok: true, days: r.days };
  },

  siege: (unitName, targetTerritoryId) => {
    const r = startSiege(useMvuStore.getState().stat, unitName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    set({ moveMode: false, selectedUnit: null });
    const region = REGIONS_BY_ID[targetTerritoryId];
    pushEvent(`Ngươi khởi binh vây ${region?.name ?? targetTerritoryId}.`, "territory");
    return { ok: true };
  },

  setWar: (houseId, atWar) => applyEngineOps(atWar ? declareWar(houseId) : makePeace(houseId)),
  bumpWarScore: (houseId, delta) => applyEngineOps(adjustWarScore(houseId, delta)),

  amphibiousLanding: (fleetName, targetTerritoryId) => {
    const r = amphibiousLandingOps(useMvuStore.getState().stat, fleetName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    const region = REGIONS_BY_ID[targetTerritoryId];
    pushEvent(`Quân ngươi đổ bộ lên ${region?.name ?? targetTerritoryId}.`, "territory");
    return { ok: true, unit: r.landingUnit };
  },

  blockade: (fleetName, targetTerritoryId) => {
    const r = blockadeOps(useMvuStore.getState().stat, fleetName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  applyMilitaryTags: (tags) => {
    const notes: string[] = [];
    const store = useMilitaryStore.getState();
    for (const tag of tags) {
      const a = tag.attrs;
      switch (tag.type) {
        case "recruit": {
          const territory = a.territory || a.region || "";
          const count = Math.max(1, Math.round(Number(a.count) || 0));
          const branch = (a.ngach || a.branch || "Chính Quy") as ArmyBranch;
          const r = store.recruit(territory, (a.type || "Bộ Binh") as TroopTypeAll, count, {
            branch, name: a.name, commander: a.commander,
          });
          notes.push(r.ok ? `Tuyển ${count} ${a.type} [${branch}] tại ${territory}` : `Tuyển quân thất bại: ${r.error}`);
          break;
        }
        case "banner_call": {
          const r = store.callBanners(a.house || a.region || undefined);
          notes.push(r.ok ? `Hiệu triệu: ${r.responses.length} nhà hồi đáp` : `Hiệu triệu thất bại: ${r.error}`);
          break;
        }
        case "sellsword_offer": {
          const mvu = useMvuStore.getState();
          const next = applyPatch(mvu.stat, []).state;
          const offer = addSellswordOffer(next, { ...a, desc: tag.content });
          if (offer) {
            useMvuStore.setState({ stat: next });
            notes.push(`Đoàn ${offer["Tên Đoàn"]} chào giá ${offer["Quân Số"]} quân tại ${offer["Đang Ở"]}`);
          }
          break;
        }
        case "army_order": {
          const unit = a.unit || a.name || "";
          const action = (a.action || "march").toLowerCase();
          if (action === "disband") {
            const r = store.disband(unit);
            notes.push(r.ok ? `Giải ngũ ${unit}` : `Giải ngũ thất bại: ${r.error}`);
          } else if (action === "siege") {
            const r = store.siege(unit, a.target || "");
            notes.push(r.ok ? `${unit} khởi binh vây ${a.target}` : `Vây thành thất bại: ${r.error}`);
          } else {
            const r = store.moveUnit(unit, a.target || "");
            notes.push(r.ok ? `${unit} hành quân tới ${a.target} (${r.days} ngày)` : `Điều quân thất bại: ${r.error}`);
          }
          break;
        }
        case "dragon_order": {
          const key = a.dragon || a.name || "";
          const action = (a.action || "fly").toLowerCase();
          if (action === "feed") {
            const r = store.feedDragon(key, a.target || "");
            notes.push(r.ok ? `Cho ${key} ăn tại ${a.target}` : `Cho rồng ăn thất bại: ${r.error}`);
          } else if (action === "rest") {
            notes.push(`${key} nghỉ ngơi`);
          } else {
            const r = store.flyDragon(key, a.target || "");
            notes.push(r.ok ? `${key} bay tới ${a.target} (${r.days} ngày)` : `Điều rồng thất bại: ${r.error}`);
          }
          break;
        }
      }
    }
    for (const n of notes) log.info(`Thẻ quân sự: ${n}`);
    return notes;
  },
}));
