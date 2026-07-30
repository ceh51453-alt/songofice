/**
 * Nguồn dữ liệu chung cho Mạng lưới quan hệ và Sổ tay.
 *
 * State lưu quan hệ ở nhiều nơi (gia phả, hôn ước, mạng NPC và quan hệ với
 * người chơi). Gom chúng ở đây để hai màn hình kể cùng một câu chuyện.
 */
import type { StatData } from "../../mvu/schema";
import type { Npc } from "../../mvu/npcSchema";

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

function relationValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" && value ? [value] : [];
}

export function relationTone(label: string, affinity = 0): RelationshipTone {
  const text = label.toLowerCase();
  if (/cha|mẹ|con|anh|chị|em|vợ|chồng|hôn ước|gia tộc|người thân/.test(text)) return "family";
  if (/tình nhân|người tình|thiếp|người yêu/.test(text)) return "intimate";
  if (/kẻ thù|đối thủ|con nợ|thù/.test(text) || affinity <= -15) return "enemy";
  if (/cấp trên|thuộc hạ|thầy|trò/.test(text)) return "duty";
  if (/đồng minh|bằng hữu|ân nhân/.test(text) || affinity >= 15) return "alliance";
  return "neutral";
}

function relationshipId(sourceId: string, targetName: string, label: string): string {
  return `${sourceId}:${targetName}:${label}`.toLocaleLowerCase();
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

  const add = (edge: Omit<RelationshipEdge, "id" | "targetId">) => {
    const key = relationshipId(edge.sourceId, edge.targetName, edge.label);
    const duplicate = edges.get(key);
    const targetId = idByName.get(edge.targetName.toLocaleLowerCase());
    if (!duplicate) edges.set(key, { ...edge, id: key, targetId });
  };

  for (const person of people) {
    const { npc } = person;
    const relationWithPlayer = relationValues(npc["Loại Quan Hệ"]);
    const playerLabel = relationWithPlayer.join(" · ") || (person.group === "family" ? "Người thân" : "Quen biết");
    add({
      sourceId: "player",
      sourceName: playerName,
      targetName: person.name,
      label: playerLabel,
      tone: relationTone(playerLabel, npc["Độ Hảo Cảm"]),
      affinity: npc["Độ Hảo Cảm"],
      trust: npc["Tin Cậy"],
      isPublic: true,
      detail: npc["Đánh Giá"] || npc["Giải Thích"] || undefined,
      inferred: false,
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
