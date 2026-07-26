const fs = require('fs');
const path = require('path');

const applyFixes = (filePath, fixes) => {
  const fp = path.resolve(__dirname, filePath);
  if (!fs.existsSync(fp)) return;
  let content = fs.readFileSync(fp, 'utf8');
  for (const [find, replace] of fixes) {
    content = content.replace(find, replace);
  }
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Fixed:', filePath);
};

// 1. armWrestle.ts
applyFixes('src/minigame/armWrestle.ts', [
  ['export function createArmWrestle(seed: number)', 'export function createArmWrestle(_seed: number)']
]);

// 2. kingsGame.ts
applyFixes('src/minigame/kingsGame.ts', [
  ['type TrapCondition, type SpellEffect,', 'type _TrapCondition, type _SpellEffect,'],
  ['rng: RNG,', '_rng: RNG,'],
  ['penalty: number,', '_penalty: number,']
]);

// 3. tavernGameEngine.ts
applyFixes('src/minigame/tavernGameEngine.ts', [
  ['playerGold: number,', '_playerGold: number,']
]);

// 4. tourneyEngine.ts
applyFixes('src/minigame/tourneyEngine.ts', [
  ['GENERIC_TOURNEY_NPCS,', ''],
  ['eventType: TourneyEventType,', '_eventType: TourneyEventType,'],
  ['const info = TOURNEY_EVENTS[eventType];', '']
]);

// 5. tourneyStore.ts
applyFixes('src/state/tourneyStore.ts', [
  ['finishTourney,', ''],
  ['TOURNEY_EVENTS,', ''],
  ['type CanonTourney,', '']
]);

// 6. ArmWrestleGame.tsx
applyFixes('src/ui/tavern/ArmWrestleGame.tsx', [
  ['const lastRound', 'const _lastRound']
]);

// 7. CoinFlipGame.tsx
applyFixes('src/ui/tavern/CoinFlipGame.tsx', [
  ['import { IconCoin } from', '// import { IconCoin } from']
]);

// 8. KingsGameBoard.tsx
applyFixes('src/ui/tavern/KingsGameBoard.tsx', [
  ['ShieldSmallIcon,', '']
]);

// 9. LiarsDiceGame.tsx
applyFixes('src/ui/tavern/LiarsDiceGame.tsx', [
  ['IconDice, ', ''],
  ['const lastRound', 'const _lastRound']
]);

// 10. TourneyOverlay.tsx
applyFixes('src/ui/tourney/TourneyOverlay.tsx', [
  ['type TourneyEventState,', ''],
  ['IconBanner,', '']
]);

// 11. regexEngine.ts (log.warn takes 2 arguments usually, or err goes inside string)
applyFixes('src/preset/regexEngine.ts', [
  ['log.warn("Lỗi biên dịch regex:", regexString, err);', 'log.warn(`Lỗi biên dịch regex: ${regexString}`, err);']
]);

console.log('All unused variable fixes applied.');
