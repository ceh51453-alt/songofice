import { StatData } from "../mvu/schema";

/**
 * Lấy Ngân Khố của một nhân vật (Player hoặc NPC)
 */
export function getMoney(state: StatData, characterId: string | "Player"): number {
  if (characterId === "Player") {
    return state["Thông Tin Nhân Vật"]["Ngân Khố"];
  }
  const npc = state["Mối Quan Hệ"]["NPC Chính"][characterId];
  return npc ? (npc["Ngân Khố"] || 0) : 0;
}

/**
 * Cộng/Trừ tiền của một nhân vật
 */
export function addMoney(state: StatData, characterId: string | "Player", amount: number) {
  if (characterId === "Player") {
    state["Thông Tin Nhân Vật"]["Ngân Khố"] += amount;
    if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < 0) state["Thông Tin Nhân Vật"]["Ngân Khố"] = 0;
  } else {
    const npc = state["Mối Quan Hệ"]["NPC Chính"][characterId];
    if (npc) {
      npc["Ngân Khố"] = (npc["Ngân Khố"] || 0) + amount;
      if (npc["Ngân Khố"] < 0) npc["Ngân Khố"] = 0;
    }
  }
}

/**
 * Lấy số lượng một vật phẩm của nhân vật
 */
export function getItemQuantity(state: StatData, characterId: string | "Player", itemId: string): number {
  if (characterId === "Player") {
    return state["Túi Đồ"][itemId]?.["Số Lượng"] || 0;
  }
  const npc = state["Mối Quan Hệ"]["NPC Chính"][characterId];
  return npc?.["Túi Đồ"]?.[itemId]?.["Số Lượng"] || 0;
}

/**
 * Thêm hoặc bớt vật phẩm của nhân vật
 */
export function addItem(state: StatData, characterId: string | "Player", itemId: string, amount: number, description: string = "") {
  const inventory = characterId === "Player" 
    ? state["Túi Đồ"] 
    : state["Mối Quan Hệ"]["NPC Chính"][characterId]?.["Túi Đồ"];

  if (!inventory) return;

  if (!inventory[itemId]) {
    if (amount > 0) {
      inventory[itemId] = { "Số Lượng": amount, "Mô Tả": description };
    }
  } else {
    inventory[itemId]["Số Lượng"] += amount;
    if (inventory[itemId]["Số Lượng"] <= 0) {
      delete inventory[itemId];
    }
  }
}

/**
 * Thực hiện giao dịch giữa 2 bên. 
 * itemsTransfer là mảng các vật phẩm: { id: string, amount: number, from: "Player" | "Npc", desc?: string }
 * moneyTransfer là số tiền: dương = Player trả NPC, âm = NPC trả Player
 */
export function executeTrade(
  state: StatData, 
  npcId: string, 
  itemsTransfer: { id: string, amount: number, from: "Player" | "Npc", desc?: string }[],
  moneyTransfer: number
): boolean {
  
  // 1. Kiểm tra tiền
  if (moneyTransfer > 0) { // Player trả
    if (getMoney(state, "Player") < moneyTransfer) return false;
  } else if (moneyTransfer < 0) { // NPC trả
    if (getMoney(state, npcId) < -moneyTransfer) return false;
  }

  // 2. Kiểm tra vật phẩm
  for (const item of itemsTransfer) {
    const owner = item.from === "Player" ? "Player" : npcId;
    if (getItemQuantity(state, owner, item.id) < item.amount) return false;
  }

  // 3. Thực hiện chuyển tiền
  if (moneyTransfer !== 0) {
    addMoney(state, "Player", -moneyTransfer);
    addMoney(state, npcId, moneyTransfer);
  }

  // 4. Thực hiện chuyển vật phẩm
  for (const item of itemsTransfer) {
    if (item.from === "Player") {
      addItem(state, "Player", item.id, -item.amount);
      addItem(state, npcId, item.id, item.amount, item.desc);
    } else {
      addItem(state, npcId, item.id, -item.amount);
      addItem(state, "Player", item.id, item.amount, item.desc);
    }
  }

  return true;
}
