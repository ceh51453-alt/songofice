import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { makeHolding, seedRegionControl } from "../territory/territoryEngine";
import {
  canClaimIronThrone,
  canControlHolding,
  canManageRegion,
  getPrivilegesByTitle,
} from "../character/roleplay";
import { buildFeudalHierarchyPrompt, titleDefinition } from "./feudalHierarchy";

function landed(title = "Nam Tước"): StatData {
  const state = makeDefaultState();
  state["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  state["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  state["Thông Tin Nhân Vật"]["Tước Vị"] = title;
  seedRegionControl(state, "war-of-five-kings", { createIfMissing: true });
  return StatDataSchema.parse(state);
}

describe("phân cấp tước vị và tước địa", () => {
  it("phân biệt hiệp sĩ, hầu quốc, công quốc và vương quốc", () => {
    expect(titleDefinition("Hiệp Sĩ").jurisdiction).toBe("Không Có Đất");
    expect(titleDefinition("Hầu Tước").jurisdiction).toBe("Hầu Quốc");
    expect(titleDefinition("Công Tước").jurisdiction).toBe("Công Quốc");
    expect(titleDefinition("Quốc Vương").jurisdiction).toBe("Vương Quốc");
    expect(titleDefinition("Hoàng Đế").jurisdiction).toBe("Đế Quốc");
  });

  it("vương tử là huyết thống, không tự thành Thân Vương trị vì", () => {
    expect(titleDefinition("Vương Tử").sovereign).toBe(false);
    expect(titleDefinition("Vương Tử").jurisdiction).toBe("Không Có Đất");
    expect(titleDefinition("Thân Vương").sovereign).toBe(true);
    expect(titleDefinition("Thân Vương").jurisdiction).toBe("Thân Vương Quốc");
  });

  it("hôn phối, kế vị và chức vụ giữ đúng danh xưng nhưng không sinh quyền đất", () => {
    expect(titleDefinition("Vương Hậu").title).toContain("Vương Hậu");
    expect(titleDefinition("Vương Hậu").canHoldStronghold).toBe(false);
    expect(titleDefinition("Người Thừa Kế").title).toBe("Người Thừa Kế");
    expect(titleDefinition("Người Thừa Kế").canReceiveVassals).toBe(false);
    expect(titleDefinition("Nhiếp Chính").sovereign).toBe(false);
    expect(titleDefinition("Bàn Tay Nhà Vua").jurisdiction).toBe("Không Có Đất");
  });

  it("quyền chức năng tăng đúng theo bản chất tước vị", () => {
    expect(getPrivilegesByTitle("Hiệp Sĩ")).not.toContain("Quản Trị Thành Trì");
    expect(getPrivilegesByTitle("Nam Tước")).toContain("Quản Trị Lãnh Địa Trực Thuộc");
    expect(getPrivilegesByTitle("Hầu Tước")).toContain("Triệu Tập Chư Hầu (Vùng)");
    expect(getPrivilegesByTitle("Quốc Vương")).toContain("Ban Luật Toàn Cõi");
  });
});

describe("quyền sở hữu không bị tước vị cao ghi đè", () => {
  it("vua chỉ điều khiển thành trực thuộc, không điều khiển thành của chư hầu", () => {
    const state = landed("Quốc Vương");
    const direct = Object.keys(state["Lãnh Địa"])[0];
    (state["Lãnh Địa"] as Record<string, unknown>)["vassal-castle"] =
      makeHolding({ regionId: "the-north", name: "Thành Chư Hầu", lord: "Roose Bolton" });
    const parsed = StatDataSchema.parse(state);

    expect(canControlHolding(parsed, direct)).toBe(true);
    expect(canControlHolding(parsed, "vassal-castle")).toBe(false);
  });

  it("quyền quản vùng chỉ áp tại lãnh thổ thực sự thuộc người chơi", () => {
    const state = landed("Công Tước");
    state["Chủ Quyền Lãnh Thổ"]["the-crownlands"]["Là Của Người Chơi"] = false;
    expect(canManageRegion(state, "the-north")).toBe(true);
    expect(canManageRegion(state, "the-crownlands")).toBe(false);
  });

  it("prompt nói rõ khóa legacy không phải chủ quyền toàn vùng", () => {
    const prompt = buildFeudalHierarchyPrompt(landed("Quốc Vương"));
    expect(prompt).toContain("Chiếm vùng không tự động biến thành trì của chư hầu");
    expect(prompt).toContain("stat_data.Lãnh Địa");
    expect(prompt).toContain("KHÔNG trực tiếp xây dựng trong mọi thành");
  });

  it("người cùng Nhà không thể đòi Ngai Sắt bằng đất của họ hàng", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Họ Tên"] = "Một người con Nhà Lannister";
    state["Thông Tin Nhân Vật"]["Nhà"] = "Lannister";
    state["Thông Tin Nhân Vật"]["Tước Vị"] = "Thường Dân";
    seedRegionControl(state, "war-of-five-kings", { createIfMissing: false });
    expect(canClaimIronThrone(StatDataSchema.parse(state))).toBe(false);
  });
});
