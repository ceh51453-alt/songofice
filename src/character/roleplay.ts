import type { StatData } from "../mvu/schema";
import {
  controlsRegionCompletely,
  playerHouseId,
  holdingOwnedByPlayer,
} from "../territory/territoryEngine";
import { getTitleRank, titleDefinition } from "../strategy/feudalHierarchy";

export type RoleplayPrivilege =
  | "Quản Trị Thành Trì"
  | "Quản Trị Lãnh Địa Trực Thuộc"
  | "Quản Lý Lãnh Địa" // alias save/code cũ
  | "Xây Dựng Cơ Sở"
  | "Lập Quân Đồn Trú"
  | "Quản Lý Vùng"
  | "Thu Thuế Chư Hầu (Vùng)"
  | "Triệu Tập Chư Hầu (Vùng)"
  | "Phân Phong Lãnh Chúa"
  | "Ngoại Giao Chủ Quyền"
  | "Ban Luật Toàn Cõi"
  | "Thu Thuế Toàn Cõi"
  | "Triệu Tập Chư Hầu (Toàn Lục Địa)";

/** Quyền đi theo bản chất tước vị; quyền sử dụng tại một nơi còn cần sở hữu hợp pháp nơi đó. */
export function getPrivilegesByTitle(tuocVi: string): RoleplayPrivilege[] {
  const title = titleDefinition(tuocVi);
  const privileges: RoleplayPrivilege[] = [];

  if (title.canHoldStronghold) privileges.push("Quản Trị Thành Trì", "Xây Dựng Cơ Sở", "Lập Quân Đồn Trú");
  if (title.canManageDemesne) privileges.push("Quản Trị Lãnh Địa Trực Thuộc", "Quản Lý Lãnh Địa");
  if (title.canGovernTerritory) privileges.push("Quản Lý Vùng");
  if (title.canReceiveVassals) privileges.push("Thu Thuế Chư Hầu (Vùng)", "Triệu Tập Chư Hầu (Vùng)");
  if (title.canGrantTitles) privileges.push("Phân Phong Lãnh Chúa");
  if (title.sovereign) privileges.push(
    "Ngoại Giao Chủ Quyền", "Ban Luật Toàn Cõi", "Thu Thuế Toàn Cõi", "Triệu Tập Chư Hầu (Toàn Lục Địa)",
  );
  return privileges;
}

/**
 * Cấp thẩm quyền tương thích với danh mục pháp lệnh cũ: 0 không đất, 1 trực
 * thuộc, 2 có chư hầu, 3 chủ quyền. Dùng getTitleRank khi cần thứ bậc chi tiết.
 */
export function getTitleLevel(tuocVi: string): number {
  const title = titleDefinition(tuocVi);
  if (title.sovereign) return 3;
  if (title.canReceiveVassals) return 2;
  if (title.canManageDemesne) return 1;
  return 0;
}

export { getTitleRank, titleDefinition };

export function hasPrivilege(state: StatData, privilege: RoleplayPrivilege): boolean {
  return getPrivilegesByTitle(state["Thông Tin Nhân Vật"]["Tước Vị"]).includes(privilege);
}

export function canManageDomain(state: StatData): boolean {
  return hasPrivilege(state, "Quản Trị Lãnh Địa Trực Thuộc")
    && Object.keys(state["Lãnh Địa"]).some((id) => holdingOwnedByPlayer(state, id));
}

export function canManageRegion(state: StatData, regionId?: string): boolean {
  if (!hasPrivilege(state, "Quản Lý Vùng")) return false;
  if (!regionId) return Object.values(state["Chủ Quyền Lãnh Thổ"]).some((sov) => sov["Là Của Người Chơi"]);
  return state["Chủ Quyền Lãnh Thổ"][regionId]?.["Là Của Người Chơi"] === true;
}

/**
 * Tước cao không biến thành trì của chư hầu thành tài sản trực thuộc. Vua chỉ
 * được xây ở thành do chính mình trực tiếp giữ, giống mọi lãnh chúa khác.
 */
export function canControlHolding(state: StatData, territoryId: string): boolean {
  return hasPrivilege(state, "Quản Trị Thành Trì") && holdingOwnedByPlayer(state, territoryId);
}

/** Check if player can ascend to the Iron Throne. */
export function canClaimIronThrone(state: StatData): boolean {
  if (titleDefinition(state["Thông Tin Nhân Vật"]["Tước Vị"]).sovereign) return false;
  const pHouse = playerHouseId(state);
  if (!pHouse) return false;

  let controlledRegions = 0;
  let ownsKingLanding = false;
  for (const [regionId, sovereignty] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    // Huyết thống cùng Nhà không phải chủ quyền cá nhân. Chỉ vùng đã ghi nhận
    // người chơi là chủ và đã khuất phục đủ thành/chư hầu mới nâng yêu sách.
    if (!sovereignty["Là Của Người Chơi"] || !controlsRegionCompletely(state, regionId, pHouse)) continue;
    controlledRegions++;
    if (regionId === "the-crownlands") ownsKingLanding = true;
  }
  return ownsKingLanding && controlledRegions >= 3;
}

/** Ascend to the Iron Throne (mutates state). */
export function claimIronThrone(state: StatData): void {
  if (!canClaimIronThrone(state)) return;
  state["Thông Tin Nhân Vật"]["Tước Vị"] = "Vua Bảy Vương Quốc";
  state["Danh Vọng"]["Uy Dũng"] = Math.min(100, state["Danh Vọng"]["Uy Dũng"] + 50);
}
