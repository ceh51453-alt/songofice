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
});
