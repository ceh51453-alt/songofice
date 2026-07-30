import { describe, expect, it } from "vitest";
import { makeDefaultState } from "../../mvu/schema";
import { NpcSchema } from "../../mvu/npcSchema";
import { getRelationshipEdges, getRelationshipPeople } from "./relationshipData";

describe("relationshipData", () => {
  it("gộp quan hệ với người chơi, gia phả và mạng NPC vào cùng một danh sách", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
    state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Arya Stark"] = NpcSchema.parse({
      "Họ Tên": "Arya Stark",
      "Loại Quan Hệ": ["Người Thân"],
      "Đánh Giá": "Em gái của Robb",
      "Anh Chị Em": ["Sansa Stark"],
    });
    state["Mối Quan Hệ"]["NPC Chính"]["Sansa Stark"] = NpcSchema.parse({
      "Họ Tên": "Sansa Stark",
      "Mạng Lưới Quan Hệ": {
        "Arya Stark": {
          "Loại Quan Hệ": "Anh Chị Em",
          "Độ Hảo Cảm": 25,
          "Độ Tin Cậy": 30,
          "Công Khai": true,
          "Chi Tiết": "Hai chị em thường bất đồng nhưng vẫn che chở nhau.",
        },
      },
    });

    const people = getRelationshipPeople(state);
    const edges = getRelationshipEdges(people, "Robb Stark");

    expect(people.map((person) => person.name)).toEqual(["Arya Stark", "Sansa Stark"]);
    expect(edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: "player", targetName: "Arya Stark", label: "Người Thân" }),
      expect.objectContaining({ sourceName: "Arya Stark", targetName: "Sansa Stark", label: "Anh Chị Em", inferred: true }),
      expect.objectContaining({ sourceName: "Sansa Stark", targetName: "Arya Stark", label: "Anh Chị Em", detail: "Hai chị em thường bất đồng nhưng vẫn che chở nhau." }),
    ]));
  });

  it("bổ sung quan hệ canon cho save cũ khi người chơi thuộc roster lịch sử", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Họ Tên"] = "Rhaenys Targaryen";
    state["Mối Quan Hệ"]["NPC Chính"]["loren-lannister"] = NpcSchema.parse({ "Họ Tên": "Loren Lannister" });
    state["Mối Quan Hệ"]["NPC Chính"]["mern-ix-gardener"] = NpcSchema.parse({ "Họ Tên": "Mern IX Gardener" });
    state["Mối Quan Hệ"]["NPC Chính"]["aegon-targaryen"] = NpcSchema.parse({ "Họ Tên": "Aegon Targaryen" });

    const edges = getRelationshipEdges(getRelationshipPeople(state), "Rhaenys Targaryen");

    expect(edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: "player", targetName: "Loren Lannister", label: "Kẻ Thù", affinity: -65 }),
      expect.objectContaining({ sourceId: "player", targetName: "Mern IX Gardener", label: "Kẻ Thù", affinity: -65 }),
      expect.objectContaining({ sourceName: "Loren Lannister", targetName: "Mern IX Gardener", label: "Đồng Minh" }),
    ]));
  });
});
