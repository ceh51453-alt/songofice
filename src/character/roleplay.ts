import { StatData } from "../mvu/schema";
import { playerHouseId } from "../territory/territoryEngine";

export type RoleplayPrivilege = 
  | "Thu Thuế Toàn Cõi"
  | "Phân Phong Lãnh Chúa"
  | "Triệu Tập Chư Hầu (Toàn Lục Địa)"
  | "Triệu Tập Chư Hầu (Vùng)"
  | "Thu Thuế Chư Hầu (Vùng)"
  | "Quản Lý Vùng"
  | "Quản Lý Lãnh Địa"
  | "Xây Dựng Cơ Sở"
  | "Lập Quân Đồn Trú";

export function getPrivilegesByTitle(tuocVi: string): RoleplayPrivilege[] {
  switch (tuocVi) {
    case "Vua Bảy Vương Quốc":
    case "Hoàng Đế":
      return [
        "Thu Thuế Toàn Cõi",
        "Phân Phong Lãnh Chúa",
        "Triệu Tập Chư Hầu (Toàn Lục Địa)",
        "Triệu Tập Chư Hầu (Vùng)",
        "Thu Thuế Chư Hầu (Vùng)",
        "Quản Lý Vùng",
        "Quản Lý Lãnh Địa",
        "Xây Dựng Cơ Sở",
        "Lập Quân Đồn Trú",
      ];
    case "Quốc Vương":
    case "Vua":
    case "Đại Lãnh Chúa":
      return [
        "Triệu Tập Chư Hầu (Vùng)",
        "Thu Thuế Chư Hầu (Vùng)",
        "Quản Lý Vùng",
        "Quản Lý Lãnh Địa",
        "Xây Dựng Cơ Sở",
        "Lập Quân Đồn Trú",
      ];
    case "Lãnh Chúa Thành Trì":
    case "Lãnh Chúa":
      return [
        "Quản Lý Lãnh Địa",
        "Xây Dựng Cơ Sở",
        "Lập Quân Đồn Trú",
      ];
    case "Hiệp Sĩ":
    case "Thường Dân":
    default:
      return [];
  }
}

export function getTitleLevel(tuocVi: string): number {
  switch (tuocVi) {
    case "Vua Bảy Vương Quốc":
    case "Hoàng Đế":
      return 3;
    case "Quốc Vương":
    case "Vua":
    case "Đại Lãnh Chúa":
      return 2;
    case "Lãnh Chúa Thành Trì":
    case "Lãnh Chúa":
      return 1;
    default:
      return 0;
  }
}

export function hasPrivilege(state: StatData, privilege: RoleplayPrivilege): boolean {
  const tuocVi = state["Thông Tin Nhân Vật"]["Tước Vị"];
  return getPrivilegesByTitle(tuocVi).includes(privilege);
}

export function canManageDomain(state: StatData): boolean {
  return hasPrivilege(state, "Quản Lý Lãnh Địa");
}

export function canManageRegion(state: StatData): boolean {
  return hasPrivilege(state, "Quản Lý Vùng");
}

export function canControlHolding(state: StatData, territoryId: string): boolean {
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return false;
  
  // Trực tiếp kiểm soát
  if (terr["Người Kiểm Soát"] === state["Thông Tin Nhân Vật"]["Họ Tên"]) {
    return true;
  }
  
  // Vua Bảy Vương Quốc hoặc quyền quản lý vùng (vĩ mô)
  const isKing = hasPrivilege(state, "Thu Thuế Toàn Cõi");
  const isRegionalLord = hasPrivilege(state, "Quản Lý Vùng");
  
  if (isKing) {
    // Nếu là Vua 7 Vương Quốc, có thể kiểm soát các thành không thuộc phe địch
    // Nhưng để đơn giản, có thể dùng Là Của Người Chơi hoặc Nhà Kiểm Soát
    // Vua 7 vương quốc được coi là cai trị mọi nơi trừ khi vùng đó là độc lập/địch
    return true; 
  }
  
  if (isRegionalLord) {
    const regionId = terr["Thuộc Vùng"];
    const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
    return sov && sov["Là Của Người Chơi"];
  }
  
  return false;
}

/** Check if player can ascend to the Iron Throne */
export function canClaimIronThrone(state: StatData): boolean {
  if (state["Thông Tin Nhân Vật"]["Tước Vị"] === "Vua Bảy Vương Quốc" || state["Thông Tin Nhân Vật"]["Tước Vị"] === "Hoàng Đế") {
    return false; // Đã là vua
  }
  
  const pHouse = playerHouseId(state);
  if (!pHouse) return false;

  let controlledRegions = 0;
  let ownsKingLanding = false;

  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    if (sov["Nhà Kiểm Soát"] === pHouse) {
      controlledRegions++;
      if (regionId === "the-crownlands") {
        ownsKingLanding = true;
      }
    }
  }

  // Điều kiện: Kiểm soát Vương Đô và ít nhất 2 vùng khác (tổng 3)
  return ownsKingLanding && controlledRegions >= 3;
}

/** Ascend to the Iron Throne (mutates state) */
export function claimIronThrone(state: StatData): void {
  if (!canClaimIronThrone(state)) return;
  state["Thông Tin Nhân Vật"]["Tước Vị"] = "Vua Bảy Vương Quốc";
  // Tăng danh vọng
  state["Danh Vọng"]["Uy Dũng"] = Math.min(100, state["Danh Vọng"]["Uy Dũng"] + 50);
}
