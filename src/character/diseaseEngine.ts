import type { StatData } from "../mvu/schema";
import { DISEASE_CATALOG } from "../content/westeros/diseases";
import { registerTurnListener } from "../mvu/effects";
import { createLogger } from "../lib/log";

const log = createLogger("health/diseases");

function applyDiseaseEffects(character: { "Các Loại Bệnh": any[] }, state: StatData, isPlayer: boolean) {
  const diseases = character["Các Loại Bệnh"];
  if (!diseases || diseases.length === 0) return;

  for (let i = diseases.length - 1; i >= 0; i--) {
    const disease = diseases[i];
    const config = DISEASE_CATALOG[disease["Tên"] as keyof typeof DISEASE_CATALOG];
    if (!config) continue;

    // Trừ HP và Thể Lực (chỉ áp dụng cho Player, vì General ko track HP hiện tại)
    if (isPlayer) {
      state["Chỉ Số Sinh Tồn"]["HP"] = Math.max(0, state["Chỉ Số Sinh Tồn"]["HP"] - config.hpPerTurn);
      state["Chỉ Số Sinh Tồn"]["Thể Lực"] = Math.max(0, state["Chỉ Số Sinh Tồn"]["Thể Lực"] - config.staminaPerTurn);
    }

    // Tiến triển bệnh
    disease["Ngày Còn Lại"] = Math.max(0, disease["Ngày Còn Lại"] - 1);
    
    // Tự khỏi nếu hết ngày và canCure
    if (disease["Ngày Còn Lại"] === 0 && config.canCure) {
      diseases.splice(i, 1);
    }
  }
}

export function tickDiseases(state: StatData) {
  // 1. Áp dụng cho Player
  applyDiseaseEffects(state["Thông Tin Nhân Vật"], state, true);

  // 2. Áp dụng cho Tướng lĩnh (General)
  for (const general of Object.values(state["Tướng Lĩnh"] || {})) {
    if (general["Còn Sống"]) {
      applyDiseaseEffects(general, state, false);
    }
  }
}

let registered = false;
export function registerDiseaseLoop() {
  if (registered) return;
  registerTurnListener("diseases", tickDiseases);
  registered = true;
  log.info("Disease loop registered");
}
