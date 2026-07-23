import { streamChat } from "../api/client";
import { useConnectionStore } from "../state/connectionStore";
import type { WizardData } from "./characterInit";
import type { ApiChatMessage } from "../types/connection";
import { ERAS_BY_ID } from "../content/westeros/eras";
import { ORIGINS_BY_ID } from "../content/westeros/origins";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { CULTURES_BY_ID } from "../content/westeros/cultures";

export async function generateWizardData(
  prompt: string,
  currentData: WizardData,
  stepStr?: string,
  signal?: AbortSignal
): Promise<Partial<WizardData>> {
  const profile = useConnectionStore.getState().activeProfile();
  if (!profile) {
    throw new Error("Không tìm thấy connection profile. Vui lòng thiết lập AI trong Cấu hình.");
  }

  // Force non-streaming for simpler JSON extraction here if we want, or keep streaming but just await the end
  const overrideProfile = { ...profile, params: { ...profile.params, stream: false } };

  let contextInfo = "";
  if (currentData.eraId && ERAS_BY_ID[currentData.eraId]) {
    contextInfo += `- Kỷ nguyên (Era): ${ERAS_BY_ID[currentData.eraId].name} - ${ERAS_BY_ID[currentData.eraId].blurb}\n`;
  }
  if (currentData.originId && ORIGINS_BY_ID[currentData.originId]) {
    const org = ORIGINS_BY_ID[currentData.originId];
    contextInfo += `- Xuất thân (Origin): ${org.name} - ${org.desc}. (Bonus: ${JSON.stringify(org.statBonus)})\n`;
  } else if (currentData.originId === "custom" && currentData.customOrigin) {
    contextInfo += `- Xuất thân (Origin): [Tùy Chỉnh] ${currentData.customOrigin.name} - ${currentData.customOrigin.desc}\n`;
  }
  if (currentData.houseId && HOUSES_BY_ID[currentData.houseId]) {
    const h = HOUSES_BY_ID[currentData.houseId];
    contextInfo += `- Gia tộc (House): ${h.name} (${h.words}) - Seat: ${h.seat}, Region: ${h.region}\n`;
  }
  if (currentData.culture && CULTURES_BY_ID[currentData.culture]) {
    const c = CULTURES_BY_ID[currentData.culture];
    contextInfo += `- Văn hóa (Culture): ${c.name} - ${c.desc}\n`;
  }

  const systemPrompt = `Bạn là một Game Master lão luyện trong vũ trụ A Song of Ice and Fire.
Người chơi đang sử dụng Wizard để tạo nhân vật và muốn bạn điền/tạo dữ liệu cho nhân vật dựa trên yêu cầu.

Thông tin bối cảnh hiện tại:
${contextInfo}
Thông tin hiện tại của nhân vật (dạng JSON):
${JSON.stringify(currentData, null, 2)}
${stepStr ? `\nNgười chơi đang ở bước: ${stepStr}. Hãy tập trung vào việc tạo/cập nhật thông tin liên quan đến bước này.` : ""}

Nhiệm vụ của bạn:
1. Đọc yêu cầu của người chơi.
2. Nếu người chơi không có yêu cầu cụ thể, hãy tự động sáng tạo ra các giá trị phù hợp và logic với thông tin hiện tại (ví dụ: tuổi tác, điểm chỉ số, tiểu sử, ngoại hình) phù hợp với Era và Origin đã chọn.
3. Trả về kết quả là một object JSON chứa các trường cần được cập nhật vào thông tin nhân vật. Các trường trả về phải trùng khớp với cấu trúc của WizardData (như age, name, pointBuy, persona...).

Ví dụ nếu người chơi yêu cầu tạo ngoại hình và tiểu sử, trả về:
{
  "persona": {
    "ngoaiHinh": "Cao lớn, sẹo ở mặt...",
    "tieuSu": "Là một lính đánh thuê...",
    "tinhCach": "Lạnh lùng",
    "mauMat": "Đen",
    "mauToc": "Đen",
    "chieuCao": "1m85"
  }
}

Nếu người chơi yêu cầu tạo XUẤT THÂN TÙY CHỈNH (custom origin), hãy trả về trường "customOrigin" với cấu trúc:
{
  "customOrigin": {
    "id": "custom",
    "name": "Tên xuất thân (VD: Kỵ sĩ lang thang)",
    "desc": "Mô tả ngắn gọn về xuất thân...",
    "statBonus": { "Sức Mạnh": 1, "Nhanh Nhẹn": 1 },
    "extraPointBuy": 0,
    "giftTalentIds": [],
    "equipment": [],
    "items": [],
    "assets": { "vang": 100, "luongThuc": 50, "thuNhapKy": 0, "chiPhiKy": 10, "moTa": "Vài đồng bạc lẻ" },
    "reputation": { "vinhDu": 0 },
    "ghiChu": "Tạo bằng AI",
    "tuocVi": "Thường Dân"
  }
}

CHÚ Ý QUAN TRỌNG:
- CHỈ trả về một block JSON duy nhất.
- KHÔNG kèm markdown \`\`\`json hay bất kỳ text giải thích nào khác.
- JSON phải parse được bằng JSON.parse().`;

  const userPrompt = prompt.trim() || "Hãy tự động tạo dữ liệu phù hợp với thông tin hiện tại.";

  const messages: ApiChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let fullText = "";

  const result = await streamChat(
    overrideProfile,
    messages,
    {
      onText: (t) => { fullText += t; },
    },
    signal
  );

  let jsonStr = result.text.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as Partial<WizardData>;
  } catch (e) {
    console.error("AI Generation JSON Parse Error:", e, jsonStr);
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON.");
  }
}
