/**
 * Nguồn dữ liệu chung cho Mạng lưới quan hệ và Sổ tay.
 *
 * State lưu quan hệ ở nhiều nơi (gia phả, hôn ước, mạng NPC và quan hệ với
 * người chơi). Gom chúng ở đây để hai màn hình kể cùng một câu chuyện.
 */
import type { StatData } from "../../mvu/schema";
import type { Npc } from "../../mvu/npcSchema";
import { ERAS, type CanonCharacter, type EraData } from "../../content/westeros/eras";

export type PersonGroup = "family" | "npc";
export type RelationshipTone = "family" | "intimate" | "alliance" | "enemy" | "duty" | "neutral";

export interface RelationshipPerson {
  id: string;
  name: string;
  group: PersonGroup;
  npc: Npc;
}

export interface RelationshipEdge {
  id: string;
  sourceId: string;
  sourceName: string;
  targetId?: string;
  targetName: string;
  label: string;
  tone: RelationshipTone;
  affinity: number;
  trust: number;
  isPublic: boolean;
  detail?: string;
  inferred: boolean;
}

interface CanonicalRelation {
  targetId: string;
  label: string;
  affinity: number;
  trust: number;
  detail?: string;
}

function relationValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" && value ? [value] : [];
}

export function relationTone(label: string, affinity = 0): RelationshipTone {
  const text = label.toLowerCase();
  if (/cha|mẹ|con|anh|chị|em|vợ|chồng|hôn ước|gia tộc|người thân/.test(text)) return "family";
  if (/tình nhân|người tình|thiếp|người yêu/.test(text)) return "intimate";
  if (/kẻ thù|đối thủ|con nợ|thù/.test(text) || affinity <= -15) return "enemy";
  if (/cấp trên|thuộc hạ|chư hầu|chủ quân|lãnh chúa|liege|thầy|trò/.test(text)) return "duty";
  if (/đồng minh|bằng hữu|ân nhân|chiến hữu/.test(text) || affinity >= 15) return "alliance";
  return "neutral";
}

function relationshipId(sourceId: string, targetName: string, label: string): string {
  return `${sourceId}:${targetName}:${label}`.toLocaleLowerCase();
}

function canonicalRelationValues(label: string): Pick<CanonicalRelation, "affinity" | "trust"> {
  switch (relationTone(label)) {
    case "family": return { affinity: 70, trust: 75 };
    case "intimate": return { affinity: 80, trust: 75 };
    case "alliance": return { affinity: 60, trust: 60 };
    case "enemy": return { affinity: -65, trust: -60 };
    case "duty": return { affinity: 35, trust: 55 };
    default: return { affinity: 0, trust: 0 };
  }
}

/** Quan hệ theo vai vế cần đảo chiều khi được trình bày từ phía người chơi. */
function reverseRelationshipLabel(label: string): string {
  const normalized = label.trim().toLocaleLowerCase();
  if (normalized === "cha/mẹ") return "Con Cái";
  if (normalized === "con cái") return "Cha/Mẹ";
  if (normalized === "chủ" || normalized === "chủ quân") return "Chư Hầu";
  if (normalized === "chư hầu" || normalized === "thuộc hạ") return "Chủ Quân";
  return label;
}

/**
 * Chuẩn hoá các trường quan hệ trong roster canon thành cạnh của đồ thị.
 * `relationshipDetails` được ưu tiên vì có mô tả và chỉ số cụ thể; các trường
 * gia phả/đồng minh/đối thủ lấp những quan hệ mà dữ liệu cũ chưa materialize.
 */
function canonicalRelations(character: CanonCharacter): CanonicalRelation[] {
  const relations = new Map<string, CanonicalRelation>();
  const put = (targetId: string | undefined, label: string, detail?: string, affinity?: number, trust?: number) => {
    if (!targetId) return;
    const defaults = canonicalRelationValues(label);
    relations.set(`${targetId}:${label}`, {
      targetId,
      label,
      detail,
      affinity: affinity ?? defaults.affinity,
      trust: trust ?? defaults.trust,
    });
  };

  put(character.father, "Cha/Mẹ");
  put(character.mother, "Cha/Mẹ");
  put(character.spouse, "Vợ/Chồng");
  for (const id of character.children ?? []) put(id, "Con Cái");
  for (const id of character.siblings ?? []) put(id, "Anh Chị Em");
  for (const id of character.allies ?? []) put(id, "Đồng Minh");
  for (const id of character.rivals ?? []) put(id, "Kẻ Thù");
  put(character.liege, "Chư Hầu");

  for (const [targetId, relation] of Object.entries(character.relationshipDetails ?? {})) {
    put(targetId, relation.type || "Khác", relation.detail, relation.affinity, relation.trust);
  }

  return [...relations.values()];
}

function getMatchingCanonEra(people: RelationshipPerson[], playerName: string): EraData | undefined {
  const names = new Set([playerName, ...people.map((person) => person.name)].map((name) => name.toLocaleLowerCase()));
  let best: { era: EraData; score: number } | undefined;

  for (const era of ERAS) {
    const hasPlayer = era.canonCharacters.some((character) => character.name.toLocaleLowerCase() === playerName.toLocaleLowerCase());
    if (!hasPlayer) continue;
    const score = era.canonCharacters.reduce(
      (total, character) => total + (names.has(character.name.toLocaleLowerCase()) ? 1 : 0),
      0,
    );
    if (!best || score > best.score) best = { era, score };
  }

  // Cần đủ một lát cắt roster trước khi áp lore. Nhờ vậy một game tuỳ chỉnh
  // tình cờ dùng tên canon (ví dụ Robb, Arya và Sansa) vẫn tôn trọng dữ liệu
  // quan hệ do người chơi đã tạo.
  return best && best.score >= 4 ? best.era : undefined;
}

export function getRelationshipPeople(stat: StatData): RelationshipPerson[] {
  const toPeople = (group: PersonGroup, entries: [string, Npc][]) => entries.map(([key, npc]) => ({
    // Giữ prefix này đồng bộ với RelationshipNetworkPanel cũ để chọn node ổn định.
    id: `npc_${key}`,
    name: npc["Họ Tên"] || key,
    group,
    npc,
  }));

  return [
    ...toPeople("family", Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"])),
    ...toPeople("npc", Object.entries(stat["Mối Quan Hệ"]["NPC Chính"])),
  ];
}

export function getRelationshipEdges(
  people: RelationshipPerson[],
  playerName: string,
): RelationshipEdge[] {
  const idByName = new Map(people.map((person) => [person.name.toLocaleLowerCase(), person.id]));
  const edges = new Map<string, RelationshipEdge>();
  const directState = new Map<string, { labels: string[]; affinity: number; trust: number; detail?: string }>();

  const add = (edge: Omit<RelationshipEdge, "id" | "targetId">) => {
    const key = relationshipId(edge.sourceId, edge.targetName, edge.label);
    const duplicate = edges.get(key);
    const targetId = idByName.get(edge.targetName.toLocaleLowerCase());
    if (!duplicate) edges.set(key, { ...edge, id: key, targetId });
  };

  for (const person of people) {
    const { npc } = person;
    const relationWithPlayer = relationValues(npc["Loại Quan Hệ"]);
    directState.set(person.id, {
      labels: relationWithPlayer,
      affinity: npc["Độ Hảo Cảm"],
      trust: npc["Tin Cậy"],
      detail: npc["Đánh Giá"] || npc["Giải Thích"] || undefined,
    });

    for (const [targetName, relation] of Object.entries(npc["Mạng Lưới Quan Hệ"] ?? {})) {
      add({
        sourceId: person.id,
        sourceName: person.name,
        targetName,
        label: relation["Loại Quan Hệ"],
        tone: relationTone(relation["Loại Quan Hệ"], relation["Độ Hảo Cảm"]),
        affinity: relation["Độ Hảo Cảm"],
        trust: relation["Độ Tin Cậy"],
        isPublic: relation["Công Khai"],
        detail: relation["Chi Tiết"],
        inferred: false,
      });
    }

    const inferred: [string, string][] = [
      ...npc["Cha/Mẹ"].map((name) => [name, "Cha/Mẹ"] as [string, string]),
      ...npc["Con Cái"].map((name) => [name, "Con Cái"] as [string, string]),
      ...npc["Anh Chị Em"].map((name) => [name, "Anh Chị Em"] as [string, string]),
      ...(npc["Đã Kết Hôn Với"] ? [[npc["Đã Kết Hôn Với"], "Vợ/Chồng"] as [string, string]] : []),
      ...(npc["Hôn Ước Với"] ? [[npc["Hôn Ước Với"], "Hôn Ước"] as [string, string]] : []),
    ];
    for (const [targetName, label] of inferred) {
      add({
        sourceId: person.id,
        sourceName: person.name,
        targetName,
        label,
        tone: relationTone(label),
        affinity: 0,
        trust: 0,
        isPublic: true,
        inferred: true,
      });
    }
  }

  // Save cũ đã được tạo trước khi các trường allies/rivals/liege được đưa vào
  // Mạng Lưới Quan Hệ. Bổ sung phần lore còn thiếu ở thời điểm hiển thị, nhưng
  // không đè dữ liệu quan hệ đã được lưu trong ván chơi.
  const canonEra = getMatchingCanonEra(people, playerName);
  const canonicalDirect = new Map<string, CanonicalRelation[]>();
  if (canonEra) {
    const characterById = new Map(canonEra.canonCharacters.map((character) => [character.id, character]));
    const characterByName = new Map(canonEra.canonCharacters.map((character) => [character.name.toLocaleLowerCase(), character]));

    for (const person of people) {
      const source = characterByName.get(person.name.toLocaleLowerCase());
      if (!source) continue;

      for (const relation of canonicalRelations(source)) {
        const target = characterById.get(relation.targetId);
        if (!target) continue;
        const targetName = target.name;
        const targetExists = targetName.toLocaleLowerCase() === playerName.toLocaleLowerCase()
          || idByName.has(targetName.toLocaleLowerCase());
        if (!targetExists) continue;

        const alreadyKnown = [...edges.values()].some((edge) =>
          edge.sourceId === person.id && edge.targetName.toLocaleLowerCase() === targetName.toLocaleLowerCase(),
        );
        if (alreadyKnown) continue;

        add({
          sourceId: person.id,
          sourceName: person.name,
          targetName,
          label: relation.label,
          tone: relationTone(relation.label, relation.affinity),
          affinity: relation.affinity,
          trust: relation.trust,
          isPublic: true,
          detail: relation.detail,
          inferred: false,
        });
      }
    }

    const playerCharacter = characterByName.get(playerName.toLocaleLowerCase());
    if (playerCharacter) {
      for (const relation of canonicalRelations(playerCharacter)) {
        const target = characterById.get(relation.targetId);
        const personId = target ? idByName.get(target.name.toLocaleLowerCase()) : undefined;
        if (!personId) continue;
        const current = canonicalDirect.get(personId) ?? [];
        current.push(relation);
        canonicalDirect.set(personId, current);
      }
    }
  }

  for (const person of people) {
    const stored = directState.get(person.id)!;
    const hasSpecificStoredRelation = stored.labels.some((label) => !/^(người thân|quen biết|xa lạ|chưa chạm mặt)$/i.test(label.trim()));
    const loreFromPlayer = canonicalDirect.get(person.id) ?? [];
    const loreFromCounterparty = [...edges.values()]
      .filter((edge) => edge.sourceId === person.id && edge.targetName.toLocaleLowerCase() === playerName.toLocaleLowerCase())
      .map((edge) => ({
        targetId: "player",
        label: reverseRelationshipLabel(edge.label),
        affinity: edge.affinity,
        trust: edge.trust,
        detail: edge.detail,
      }));
    const fallback = loreFromPlayer.length > 0 ? loreFromPlayer : loreFromCounterparty;
    const selectedRelations = hasSpecificStoredRelation
      ? stored.labels.map((label) => ({ targetId: person.id, label, affinity: stored.affinity, trust: stored.trust, detail: stored.detail }))
      : fallback;
    const labels = [...new Set(selectedRelations.map((relation) => relation.label))];
    const primary = selectedRelations[0];
    const label = labels.join(" · ") || (person.group === "family" ? "Người Thân" : "Chưa Chạm Mặt");

    add({
      sourceId: "player",
      sourceName: playerName,
      targetName: person.name,
      label,
      tone: relationTone(label, primary?.affinity ?? stored.affinity),
      affinity: primary?.affinity ?? stored.affinity,
      trust: primary?.trust ?? stored.trust,
      isPublic: true,
      detail: primary?.detail ?? stored.detail,
      inferred: false,
    });
  }

  return [...edges.values()];
}

export function edgesForPerson(edges: RelationshipEdge[], personId: string): RelationshipEdge[] {
  return edges.filter((edge) => edge.sourceId === personId || edge.targetId === personId);
}

export function relationshipCounterparty(edge: RelationshipEdge, personId: string, playerName: string): string {
  if (edge.sourceId === personId) return edge.targetName;
  if (edge.targetId === personId) return edge.sourceName;
  return edge.sourceId === "player" ? playerName : edge.sourceName;
}
