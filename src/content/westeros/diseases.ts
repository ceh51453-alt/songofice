import type { CharacterDisease } from "../../mvu/schema";

export type DiseaseId = CharacterDisease["Tên"];

export interface DiseaseConfig {
  id: DiseaseId;
  type: "Truyền Nhiễm" | "Tình Dục" | "Mãn Tính" | "Khác";
  desc: string;
  // Giảm HP/Thể lực mỗi turn
  hpPerTurn: number;
  staminaPerTurn: number;
  // Trừ trực tiếp chỉ số nhân vật (Nhanh Nhẹn, Uy Tín...)
  attributeDebuffs: Partial<Record<string, number>>;
  // Tỷ lệ lây lan cơ bản (0-1) mỗi turn nếu tiếp xúc
  spreadRate: number;
  // Bệnh có tự khỏi không?
  canCure: boolean;
  // Số ngày trung bình mắc bệnh (cơ sở)
  baseDurationDays: number;
}

export const DISEASE_CATALOG: Record<DiseaseId, DiseaseConfig> = {
  "Bệnh Vảy Xám": {
    id: "Bệnh Vảy Xám",
    type: "Truyền Nhiễm",
    desc: "Bệnh nan y khiến da cứng như vảy đá, lây lan chậm nhưng gần như vô phương cứu chữa.",
    hpPerTurn: 2,
    staminaPerTurn: 1,
    attributeDebuffs: { "Thể Chất": -10, "Uy Tín": -20, "Nhanh Nhẹn": -10 },
    spreadRate: 0.1, // 10% lây khi chạm
    canCure: false, // Trừ phép màu hoặc học sĩ cực giỏi
    baseDurationDays: 9999,
  },
  "Sốt Mùa Hè": {
    id: "Sốt Mùa Hè",
    type: "Truyền Nhiễm",
    desc: "Gây sốt cao, ớn lạnh, thường bùng phát vào mùa hè ngột ngạt.",
    hpPerTurn: 5,
    staminaPerTurn: 5,
    attributeDebuffs: { "Thể Chất": -5, "Sức Mạnh": -3 },
    spreadRate: 0.2,
    canCure: true,
    baseDurationDays: 14, // 2 tuần
  },
  "Sốt Lạnh": { // Tương tự Winter Fever
    id: "Sốt Lạnh",
    type: "Truyền Nhiễm",
    desc: "Sốt rét run người, rất nguy hiểm trong mùa Đông.",
    hpPerTurn: 8,
    staminaPerTurn: 5,
    attributeDebuffs: { "Thể Chất": -8 },
    spreadRate: 0.3,
    canCure: true,
    baseDurationDays: 20,
  },
  "Cảm Lạnh": {
    id: "Cảm Lạnh",
    type: "Khác",
    desc: "Bệnh nhẹ, dễ tự khỏi.",
    hpPerTurn: 1,
    staminaPerTurn: 2,
    attributeDebuffs: { "Thể Chất": -1 },
    spreadRate: 0.4,
    canCure: true,
    baseDurationDays: 5,
  },
  "Bệnh Kiết Lỵ": { // Bloody Flux
    id: "Bệnh Kiết Lỵ",
    type: "Truyền Nhiễm",
    desc: "Đi ngoài ra máu, thường xuất hiện ở các doanh trại bẩn thỉu.",
    hpPerTurn: 10,
    staminaPerTurn: 10,
    attributeDebuffs: { "Thể Chất": -15, "Sức Mạnh": -10 },
    spreadRate: 0.5,
    canCure: true,
    baseDurationDays: 30,
  },
  "Dịch Tả": {
    id: "Dịch Tả",
    type: "Truyền Nhiễm",
    desc: "Lây qua nguồn nước bẩn, làm kiệt quệ cơ thể nhanh chóng.",
    hpPerTurn: 15,
    staminaPerTurn: 15,
    attributeDebuffs: { "Thể Chất": -20 },
    spreadRate: 0.6,
    canCure: true,
    baseDurationDays: 20,
  },
  "Giang Mai": { // The Pox
    id: "Giang Mai",
    type: "Tình Dục",
    desc: "Lây qua đường tình dục, gây lở loét và điên loạn ở giai đoạn cuối.",
    hpPerTurn: 1,
    staminaPerTurn: 2,
    attributeDebuffs: { "Uy Tín": -5, "Tinh Tường": -5, "Trí Tuệ": -5 },
    spreadRate: 0.05, // Khó lây nếu không quan hệ
    canCure: true,
    baseDurationDays: 90,
  },
  "Bệnh Lậu": {
    id: "Bệnh Lậu",
    type: "Tình Dục",
    desc: "Bệnh lây qua đường tình dục, gây đau đớn khó chịu.",
    hpPerTurn: 0,
    staminaPerTurn: 3,
    attributeDebuffs: { "Uy Tín": -2, "Sức Mạnh": -2 },
    spreadRate: 0.05,
    canCure: true,
    baseDurationDays: 45,
  },
  "Bệnh Hoa Liễu": {
    id: "Bệnh Hoa Liễu",
    type: "Tình Dục",
    desc: "Thuật ngữ chung cho các bệnh tình dục, làm suy nhược cơ thể.",
    hpPerTurn: 1,
    staminaPerTurn: 2,
    attributeDebuffs: { "Thể Chất": -3 },
    spreadRate: 0.05,
    canCure: true,
    baseDurationDays: 60,
  },
  "Thương Hàn": {
    id: "Thương Hàn",
    type: "Truyền Nhiễm",
    desc: "Gây sốt cao, mê sảng và suy kiệt.",
    hpPerTurn: 6,
    staminaPerTurn: 8,
    attributeDebuffs: { "Thể Chất": -10, "Tinh Tường": -5 },
    spreadRate: 0.25,
    canCure: true,
    baseDurationDays: 25,
  },
  "Bệnh Dại": {
    id: "Bệnh Dại",
    type: "Khác",
    desc: "Do chó soi hoặc thú hoang cắn, phát điên và chết.",
    hpPerTurn: 20,
    staminaPerTurn: 10,
    attributeDebuffs: { "Trí Tuệ": -20, "Tinh Tường": -20 },
    spreadRate: 0.01,
    canCure: false,
    baseDurationDays: 14,
  },
  "Lao Phổi": {
    id: "Lao Phổi",
    type: "Truyền Nhiễm",
    desc: "Ho ra máu, gầy mòn. Lây qua đường không khí.",
    hpPerTurn: 3,
    staminaPerTurn: 5,
    attributeDebuffs: { "Thể Chất": -10, "Sức Mạnh": -5 },
    spreadRate: 0.15,
    canCure: false, // Nan y ở thời trung cổ
    baseDurationDays: 365,
  },
};
