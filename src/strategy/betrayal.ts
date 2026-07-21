/**
 * betrayal + hostages (7.7):
 * - Tướng "Phản Trắc" + Trung Thành < -30 → mỗi turn engine roll làm phản: mang
 *   quân bỏ đi (hoặc dâng thành — AI tường thuật, engine quyết có xảy ra không).
 * - Tướng bại trận bị bắt → làm CON TIN (Tù Binh) — nối tiền chuộc/trao đổi M11.
 * Engine giữ số (seed → tái lập); AI chỉ kể lại.
 */
import type { StatData, General } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerTurnListener } from "../mvu/effects";
import { eventSeed, makeRng } from "../probability/rng";
import { clamp } from "../mvu/helpers";

export const BETRAY_LOYALTY_THRESHOLD = -30;

/** Roll làm phản: chỉ khi có "Phản Trắc" + Trung Thành thấp; càng thấp càng dễ. */
export function checkBetrayal(rng: () => number, general: General): boolean {
  if (!general["Đặc Tính"].includes("Phản Trắc")) return false;
  if (general["Trung Thành"] >= BETRAY_LOYALTY_THRESHOLD) return false;
  const chance = clamp(0.1 + ((BETRAY_LOYALTY_THRESHOLD - general["Trung Thành"]) / 70) * 0.4, 0.1, 0.5);
  return rng() < chance;
}

/** Ops tạo 1 con tin từ tướng địch bị bắt (7.7) — engine áp sau trận. */
export function captiveOpsFromGeneral(generalName: string, general: General | undefined, byHouseId: string, turn: number): PatchOp[] {
  const command = general?.["Chỉ Số Thống Soái"] ?? 50;
  const ransom = 500 + command * 30; // tướng giỏi chuộc đắt hơn
  return [
    {
      op: "replace", path: `stat_data.Tù Binh.${generalName}`,
      value: { "Họ Tên": generalName, "Vai Trò": "Tướng", "Bị Bắt Bởi": byHouseId, "Giá Chuộc": ransom, "_Turn Bắt": turn },
    },
  ];
}

/** 1 tick: các tướng phản trắc có thể làm phản (mang quân bỏ đi). MUTATE state. */
export function tickBetrayal(state: StatData): void {
  const turn = state["_engineMeta"]["turnCount"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  for (const [name, g] of Object.entries(state["Tướng Lĩnh"])) {
    if (!g["Còn Sống"]) continue;
    if (!g["Đặc Tính"].includes("Phản Trắc") || g["Trung Thành"] >= BETRAY_LOYALTY_THRESHOLD) continue;
    const rng = makeRng(eventSeed(rootSeed, turn, `betray-${name}`));
    if (!checkBetrayal(rng, g)) continue;
    // làm phản: tướng bỏ đi + mang theo các đơn vị hắn chỉ huy (7.7)
    delete state["Tướng Lĩnh"][name];
    for (const [uName, u] of Object.entries(state["Biên Chế Quân Sự"])) {
      if (u["Tướng Chỉ Huy"] === name) delete state["Biên Chế Quân Sự"][uName];
    }
  }
}

let registered = false;
export function registerBetrayalLoop(): void {
  if (registered) return;
  registerTurnListener("betrayal", tickBetrayal);
  registered = true;
}
