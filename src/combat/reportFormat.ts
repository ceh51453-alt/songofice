/**
 * Định dạng khối <battle_report> (7.10) — ENGINE điền từ kết quả đã chốt,
 * đưa cho AI trong context ẩn lượt kế; AI chèn nguyên văn thẻ + viết văn
 * tường thuật BÊN NGOÀI thẻ (bút pháp 7.11).
 */
import type { BattleResult, BattleSideInput } from "./battleResolver";
import type { DuelResult } from "./duel";
import type { SkirmishResult, SkirmishSide } from "./skirmish";
import type { NavalResult, FleetSideInput } from "./naval";
import type { CombatScale, Terrain } from "../mvu/schema";
import { qualityBand } from "./scales";

export function formatBattleReport(
  result: BattleResult,
  player: BattleSideInput,
  enemy: BattleSideInput,
  scale: CombatScale,
  terrain?: Terrain,
): string {
  const lines = [
    `<battle_report outcome="${result.outcome}" scale="${scale}"${terrain ? ` terrain="${terrain}"` : ""}>`,
    `Binh lực: Quân ta ${player.totalTroops.toLocaleString("vi-VN")} | Quân địch ${enemy.totalTroops.toLocaleString("vi-VN")}`,
    `Tố chất: Ta ${qualityBand(player.training)} | Địch ${qualityBand(enemy.training)}`,
    player.general || enemy.general
      ? `Tướng: Ta ${player.general ? `${player.general.name} (Thống ${Math.round(player.general.command)})` : "khuyết"} | Địch ${enemy.general ? `${enemy.general.name} (Thống ${Math.round(enemy.general.command)})` : "khuyết"}`
      : "",
    `Xúc xắc: 2D6=${result.fog.dice[0]}+${result.fog.dice[1]}, nhiễu loạn ${result.fog.mod >= 0 ? "+" : ""}${result.fog.mod}`,
    `Diễn biến then chốt: ${result.keyEvent}`,
    `Thương vong: Ta tổn ${result.casualtiesPlayer.toLocaleString("vi-VN")} | Địch tổn ${result.casualtiesEnemy.toLocaleString("vi-VN")}`,
    `Sĩ khí: Ta ${result.moraleShiftPlayer >= 0 ? "+" : ""}${result.moraleShiftPlayer} (→ ${result.newMoralePlayer}) | Địch ${result.moraleShiftEnemy >= 0 ? "+" : ""}${result.moraleShiftEnemy} (→ ${result.newMoraleEnemy})`,
    result.generalFate ? `Số phận tướng: ${result.generalFate.general} (${result.generalFate.side === "player" ? "ta" : "địch"}) ${result.generalFate.fate}` : "",
    `</battle_report>`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function formatDuelReport(result: DuelResult, playerName: string): string {
  const playerWon = result.winner === playerName;
  return [
    `<battle_report outcome="${playerWon ? "Thắng" : "Bại"}" scale="Đấu Tay Đôi">`,
    `Đối đầu: ${result.winner} hạ ${result.loser} sau ${result.rounds} vòng`,
    `HP còn lại người thắng: ${result.hpLeftWinner}`,
    `</battle_report>`,
  ].join("\n");
}

export function formatNavalReport(result: NavalResult, player: FleetSideInput, enemy: FleetSideInput): string {
  return [
    `<battle_report outcome="${result.outcome}" scale="Hải Chiến" condition="${result.condition}">`,
    `Hạm đội: Ta ${player.name} — ${player.ships.toLocaleString("vi-VN")} thuyền (${player.type}) | Địch ${enemy.name} — ${enemy.ships.toLocaleString("vi-VN")} thuyền (${enemy.type})`,
    `Điều kiện biển: ${result.condition}`,
    `Xúc xắc: 2D6=${result.fog.dice[0]}+${result.fog.dice[1]}, nhiễu loạn ${result.fog.mod >= 0 ? "+" : ""}${result.fog.mod}`,
    `Diễn biến then chốt: ${result.keyEvent}`,
    `Thuyền chìm: Ta ${result.shipsLostPlayer.toLocaleString("vi-VN")} | Địch ${result.shipsLostEnemy.toLocaleString("vi-VN")}`,
    `</battle_report>`,
  ].join("\n");
}

export function formatSkirmishReport(result: SkirmishResult, player: SkirmishSide, enemy: SkirmishSide): string {
  const outcome = result.winner === "player" ? "Thắng" : result.winner === "enemy" ? "Bại" : "Rút Lui";
  return [
    `<battle_report outcome="${outcome}" scale="Giao Tranh">`,
    `Binh lực: Ta ${player.troops} | Địch ${enemy.troops}`,
    `Tổn thất: Ta ${result.playerLosses} | Địch ${result.enemyLosses}`,
    result.keyFighterInjured ? `Bị thương: ${result.keyFighterInjured}` : "",
    `Sau ${result.rounds} đợt giao tranh`,
    `</battle_report>`,
  ].filter(Boolean).join("\n");
}
