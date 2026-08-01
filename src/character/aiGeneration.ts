import { streamChat } from "../api/client";
import { useConnectionStore } from "../state/connectionStore";
import { CORE_STATS, type WizardData } from "./characterInit";
import type { ApiChatMessage } from "../types/connection";
import type { CanonCharacter, EraData } from "../content/westeros/eras";
import { ERAS_BY_ID } from "../content/westeros/eras";
import { ORIGINS_BY_ID, originsForContinent, type OriginDef } from "../content/westeros/origins";
import { HOUSES_BY_ID, HOUSES_DATA, housesForContinent, rolesForHouse } from "../content/westeros/houses";
import { CULTURES_BY_ID, culturesForContinent } from "../content/westeros/cultures";
import { CONTINENTS, REGIONS_BY_ID, regionsForContinent, type ContinentId } from "../content/world/geography";
import { SKILLS_BY_ID } from "../content/westeros/skills";
import { TALENTS_BY_ID } from "../content/westeros/talents";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const CONTINENT_IDS = new Set(CONTINENTS.map((continent) => continent.id));

function finiteNumber(value: unknown, fallback: number, min = 0, max = 100_000): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

function normalizeCustomOrigin(value: Record<string, unknown>, current: WizardData, continentId: ContinentId): OriginDef {
  const previous = current.customOrigin;
  const stats = isRecord(value.statBonus) ? value.statBonus : previous?.statBonus ?? {};
  const assets = isRecord(value.assets) ? value.assets : previous?.assets ?? {};
  const reputation = isRecord(value.reputation) ? value.reputation : previous?.reputation ?? {};
  const validCultureIds = new Set(culturesForContinent(continentId).map((culture) => culture.id));
  const regionIds = Array.isArray(value.regionIds)
    ? value.regionIds.filter((id): id is string => typeof id === "string" && REGIONS_BY_ID[id]?.continentId === continentId)
    : [];
  return {
    id: "custom",
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : previous?.name ?? "Xuất Thân Tùy Chỉnh",
    desc: typeof value.desc === "string" ? value.desc : previous?.desc ?? "Xuất thân được tạo riêng cho nhân vật.",
    continentIds: [continentId],
    regionIds,
    cultureIds: Array.isArray(value.cultureIds)
      ? value.cultureIds.filter((id): id is string => typeof id === "string" && validCultureIds.has(id))
      : previous?.cultureIds,
    statBonus: Object.fromEntries(CORE_STATS.flatMap((stat) =>
      typeof stats[stat] === "number" && Number.isFinite(stats[stat])
        ? [[stat, Math.max(-5, Math.min(5, Math.round(stats[stat] as number)))]]
        : [],
    )),
    extraPointBuy: finiteNumber(value.extraPointBuy, previous?.extraPointBuy ?? 0, 0, 10),
    giftTalentIds: Array.isArray(value.giftTalentIds)
      ? value.giftTalentIds.filter((id): id is string => typeof id === "string" && Boolean(TALENTS_BY_ID[id]))
      : previous?.giftTalentIds ?? [],
    equipment: Array.isArray(value.equipment) ? value.equipment as OriginDef["equipment"] : previous?.equipment ?? [],
    items: Array.isArray(value.items) ? value.items as OriginDef["items"] : previous?.items ?? [],
    assets: {
      vang: finiteNumber(assets.vang, previous?.assets.vang ?? 100),
      luongThuc: finiteNumber(assets.luongThuc, previous?.assets.luongThuc ?? 50),
      thuNhapKy: finiteNumber(assets.thuNhapKy, previous?.assets.thuNhapKy ?? 0),
      chiPhiKy: finiteNumber(assets.chiPhiKy, previous?.assets.chiPhiKy ?? 10),
      moTa: typeof assets.moTa === "string" ? assets.moTa : previous?.assets.moTa ?? "Tài sản khởi đầu tùy chỉnh",
    },
    reputation: {
      vinhDu: finiteNumber(reputation.vinhDu, previous?.reputation.vinhDu ?? 0, -100, 100),
      nhanTu: finiteNumber(reputation.nhanTu, previous?.reputation.nhanTu ?? 0, -100, 100),
      uyDung: finiteNumber(reputation.uyDung, previous?.reputation.uyDung ?? 0, -100, 100),
      xaoQuyet: finiteNumber(reputation.xaoQuyet, previous?.reputation.xaoQuyet ?? 0, -100, 100),
    },
    ghiChu: typeof value.ghiChu === "string" ? value.ghiChu : previous?.ghiChu ?? "Tạo bằng AI",
    tuocVi: typeof value.tuocVi === "string" ? value.tuocVi : previous?.tuocVi ?? "Thường Dân",
  };
}

/** Keep AI suggestions inside the same catalogs used by the visible wizard. */
export function sanitizeWizardPatch(value: unknown, current: WizardData): Partial<WizardData> {
  if (!isRecord(value)) throw new Error("AI phải trả về một object JSON.");
  const result = { ...value } as Record<string, unknown>;
  const requestedContinent = typeof result.continent === "string" && CONTINENT_IDS.has(result.continent as ContinentId)
    ? result.continent as ContinentId
    : current.continent;
  if (result.continent !== undefined && requestedContinent === current.continent && result.continent !== current.continent) {
    delete result.continent;
  }

  const validCultures = culturesForContinent(requestedContinent);
  if (result.culture !== undefined && !validCultures.some((culture) => culture.id === result.culture)) {
    delete result.culture;
  }
  const currentEra = ERAS_BY_ID[current.eraId];
  const validHouses = housesForContinent(requestedContinent, { eraId: current.eraId, year: currentEra?.startYear }).filter((house) =>
    requestedContinent !== "westeros"
    || house.id === "custom"
    || (currentEra?.id === "long-night" && house.kind === "people")
    || Boolean(currentEra?.id && house.availableEras?.includes(currentEra.id))
    || (currentEra?.availableHouses ?? []).includes(house.id),
  );
  if (result.houseId !== undefined && result.houseId !== null && !validHouses.some((house) => house.id === result.houseId)) {
    delete result.houseId;
    delete result.houseRole;
  }
  const effectiveHouse = typeof result.houseId === "string" ? result.houseId : current.houseId;
  if (result.houseRole !== undefined && !rolesForHouse(effectiveHouse).includes(String(result.houseRole))) {
    delete result.houseRole;
  }

  const validOrigins = originsForContinent(requestedContinent);
  if (result.originId !== undefined && result.originId !== "custom" && !validOrigins.some((origin) => origin.id === result.originId)) {
    delete result.originId;
  }
  if (Array.isArray(result.originIds)) {
    const validOriginIds = new Set(validOrigins.map((origin) => origin.id));
    result.originIds = result.originIds
      .filter((id): id is string => typeof id === "string" && (id === "custom" || validOriginIds.has(id)))
      .slice(0, 2);
  }
  if (isRecord(result.customOrigin)) {
    result.customOrigin = normalizeCustomOrigin(result.customOrigin, current, requestedContinent);
  }

  if (result.startingLocation !== undefined) {
    const region = typeof result.startingLocation === "string" ? REGIONS_BY_ID[result.startingLocation] : undefined;
    if (!region || region.continentId !== requestedContinent) delete result.startingLocation;
  }
  if (isRecord(result.pointBuy)) {
    const allocations: Record<string, number> = {};
    for (const stat of CORE_STATS) {
      const raw = result.pointBuy[stat];
      if (typeof raw === "number" && Number.isFinite(raw)) allocations[stat] = Math.max(1, Math.min(20, Math.round(raw)));
    }
    result.pointBuy = allocations;
  }
  return result as Partial<WizardData>;
}

export function sanitizeCanonCharacter(value: unknown): CanonCharacter {
  if (!isRecord(value)) throw new Error("AI phải trả về một object nhân vật JSON.");
  const knownHouseNames = new Set(["Không Nhà", ...HOUSES_DATA.map((house) => house.schemaName)]);
  const house = typeof value.house === "string" && knownHouseNames.has(value.house) ? value.house : "Không Nhà";
  const coreSource = isRecord(value.coreStats) ? value.coreStats : {};
  const coreStats = Object.fromEntries(CORE_STATS.map((stat) => {
    const raw = coreSource[stat];
    const number = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : 8;
    return [stat, Math.max(1, Math.min(20, number))];
  })) as CanonCharacter["coreStats"];
  const skills = isRecord(value.skills)
    ? Object.fromEntries(Object.entries(value.skills).filter(([id, level]) =>
      Boolean(SKILLS_BY_ID[id]) && typeof level === "number" && Number.isFinite(level),
    ).map(([id, level]) => [id, Math.max(0, Math.min(10, Math.round(level as number)))]))
    : {};
  const continentInput = typeof value.continent === "string" ? value.continent : "westeros";
  const continent = CONTINENTS.find((entry) =>
    entry.id === continentInput.toLocaleLowerCase("en-US")
    || entry.name.toLocaleLowerCase("vi") === continentInput.toLocaleLowerCase("vi"),
  );

  return {
    ...(value as Partial<CanonCharacter>),
    id: typeof value.id === "string" && value.id.startsWith("custom-ai-") ? value.id : `custom-ai-${Date.now()}`,
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : "Nhân Vật Vô Danh",
    tuocVi: typeof value.tuocVi === "string" ? value.tuocVi : "Thường Dân",
    house,
    role: typeof value.role === "string" ? value.role : "Lữ khách",
    religion: typeof value.religion === "string" ? value.religion : "Không Tín Ngưỡng",
    blurb: typeof value.blurb === "string" ? value.blurb : "Nhân vật do AI tạo.",
    continent: continent?.id ?? "westeros",
    age: typeof value.age === "number" && Number.isFinite(value.age) ? Math.max(0, Math.min(100, Math.round(value.age))) : 25,
    coreStats,
    talentIds: Array.isArray(value.talentIds)
      ? value.talentIds.filter((id): id is string => typeof id === "string" && Boolean(TALENTS_BY_ID[id]))
      : [],
    skills,
    equipment: Array.isArray(value.equipment) ? value.equipment as CanonCharacter["equipment"] : [],
    items: Array.isArray(value.items) ? value.items as CanonCharacter["items"] : [],
    gold: typeof value.gold === "number" && Number.isFinite(value.gold) ? Math.max(0, Math.round(value.gold)) : 0,
    startingHookIds: Array.isArray(value.startingHookIds)
      ? value.startingHookIds.filter((id): id is string => typeof id === "string")
      : [],
    startRegions: Array.isArray(value.startRegions)
      ? value.startRegions.filter((id): id is string => typeof id === "string" && Boolean(REGIONS_BY_ID[id]))
      : undefined,
  };
}

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

  const contextContinent = CONTINENT_IDS.has(currentData.continent) ? currentData.continent : "westeros";
  const continent = CONTINENTS.find((entry) => entry.id === contextContinent);
  const validCultures = culturesForContinent(contextContinent);
  const validHouses = housesForContinent(contextContinent, {
    eraId: currentData.eraId,
    year: ERAS_BY_ID[currentData.eraId]?.startYear,
  }).filter((house) =>
    contextContinent !== "westeros"
    || house.id === "custom"
    || (ERAS_BY_ID[currentData.eraId]?.id === "long-night" && house.kind === "people")
    || Boolean(ERAS_BY_ID[currentData.eraId]?.id && house.availableEras?.includes(ERAS_BY_ID[currentData.eraId].id))
    || (ERAS_BY_ID[currentData.eraId]?.availableHouses ?? []).includes(house.id),
  );
  const validOrigins = originsForContinent(contextContinent);
  const validRegions = regionsForContinent(contextContinent);

  let contextInfo = `- Lục địa: ${continent?.name ?? contextContinent} (${contextContinent}) — ${continent?.description ?? ""}\n`;
  contextInfo += `- ID văn hóa hợp lệ: ${validCultures.map((culture) => `${culture.id} (${culture.name})`).join(", ")}\n`;
  contextInfo += `- ID thế lực hợp lệ: ${validHouses.map((house) => `${house.id} (${house.name})`).join(", ")}\n`;
  contextInfo += `- ID xuất thân hợp lệ: ${validOrigins.map((origin) => `${origin.id} (${origin.name})`).join(", ")} và custom\n`;
  contextInfo += `- ID vùng khởi đầu hợp lệ: ${validRegions.map((region) => `${region.id} (${region.name}/${region.seat})`).join(", ")}\n`;
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
    "continentIds": ["${contextContinent}"],
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
- Các trường continent/culture/houseId/originId/startingLocation phải dùng đúng ID trong catalog hợp lệ ở trên; không tự bịa ID mới.
- pointBuy chỉ dùng đúng 6 khóa: ${CORE_STATS.join(", ")}.
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
    return sanitizeWizardPatch(parsed, currentData);
  } catch (e) {
    console.error("AI Generation JSON Parse Error:", e, jsonStr);
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON.");
  }
}

export async function generateCanonCharacter(
  prompt: string,
  era: EraData,
  signal?: AbortSignal
): Promise<CanonCharacter> {
  const profile = useConnectionStore.getState().activeProfile();
  if (!profile) {
    throw new Error("Không tìm thấy connection profile. Vui lòng thiết lập AI trong Cấu hình.");
  }

  const overrideProfile = { ...profile, params: { ...profile.params, stream: false } };
  const factionCatalog = HOUSES_DATA.map((house) => `${house.schemaName} [${house.id}]`).join(", ");
  const regionCatalog = Object.values(REGIONS_BY_ID).map((region) => `${region.id} (${region.name})`).join(", ");
  const skillCatalog = Object.keys(SKILLS_BY_ID).join(", ");
  const talentCatalog = Object.keys(TALENTS_BY_ID).join(", ");

  const systemPrompt = `Bạn là một Game Master lão luyện trong vũ trụ A Song of Ice and Fire.
Người chơi đang muốn dùng AI để tạo ra một "Nhân vật có sẵn" (Canon Character) hoàn toàn mới hoặc một biến thể (What-if) cho kỷ nguyên: ${era.name} (${era.blurb}).
Kỷ nguyên này có magic: ${era.hasMagic}.

Nhiệm vụ của bạn:
1. Đọc yêu cầu của người chơi.
2. Tự động sáng tạo ra các giá trị phù hợp chuẩn lore ASOIAF (chỉ số, vật phẩm, trang bị, tiểu sử).
   - Hãy cân bằng sức mạnh của nhân vật theo yêu cầu, nhưng nên giới hạn budget sao cho phù hợp với tước vị.
   - coreStats dùng CHÍNH XÁC 6 khóa: ${CORE_STATS.join(", ")}. Giá trị thường từ 1 đến 15.
   - house phải dùng schemaName trong catalog: ${factionCatalog}.
   - startRegions chỉ dùng region id trong catalog: ${regionCatalog}.
   - skills chỉ dùng id: ${skillCatalog}.
   - talentIds chỉ dùng id: ${talentCatalog}.
   - equipment: mảng các món đồ, phamChat có thể là "Thô Kệch", "Thường", "Tinh Xảo", "Thượng Hạng", "Thép Valyria", "Vô Giá".
   - id: tạo 1 id duy nhất dạng "custom-ai-...".
3. Trả về kết quả là một JSON duy nhất có cấu trúc chính xác của interface CanonCharacter.

Cấu trúc mẫu (JSON):
{
  "id": "custom-ai-robb",
  "name": "Robb Stark (What if)",
  "tuocVi": "Lãnh Chúa",
  "house": "Stark",
  "role": "Chiến binh",
  "religion": "Cựu Thần",
  "blurb": "Một Sói Trẻ hung hãn...",
  "birthYear": 283,
  "age": 16,
  "coreStats": {
    "Sức Mạnh": 8, "Nhanh Nhẹn": 7, "Thể Chất": 8,
    "Trí Tuệ": 5, "Tinh Tường": 6, "Uy Tín": 8
  },
  "talentIds": [],
  "skills": { "sword-shield": 3, "command": 2 },
  "equipment": [
    {
      "slot": "Vũ Khí Chính",
      "ten": "Kiếm Thép",
      "phamChat": "Tinh Xảo",
      "thuocTinh": { "Sát Thương Cận": 10 },
      "moTa": "Thép tốt từ Winterfell"
    }
  ],
  "items": [],
  "gold": 500,
  "startingHookIds": []
}

CHÚ Ý QUAN TRỌNG:
- CHỈ trả về một block JSON duy nhất.
- KHÔNG kèm markdown \`\`\`json hay bất kỳ text giải thích nào khác.
- JSON phải parse được bằng JSON.parse().`;

  const messages: ApiChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt.trim() || "Tạo một nhân vật ngẫu nhiên chuẩn lore cho kỷ nguyên này." },
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
    return sanitizeCanonCharacter(parsed);
  } catch (e) {
    console.error("AI Canon Generation JSON Parse Error:", e, jsonStr);
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON.");
  }
}
