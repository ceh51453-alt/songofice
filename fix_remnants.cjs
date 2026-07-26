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

// 1. imports
applyFixes('src/content/westeros/eras/warOfFiveKings.ts', [
  ['import type { CanonCharacter } from "../../../mvu/schema";', 'import type { CanonCharacter } from "../eras";']
]);

applyFixes('src/content/westeros/eras/windsOfWinter.ts', [
  ['import type { CanonCharacter } from "../../../mvu/schema";', 'import type { CanonCharacter } from "../eras";']
]);

// 2. tourneyEngine.ts
applyFixes('src/minigame/tourneyEngine.ts', [
  ['eventType: TourneyEventType,', '_eventType: TourneyEventType,']
]);

// 3. UI unused vars (some might already be prefixed, so we remove the line or the prefix)
applyFixes('src/ui/tavern/ArmWrestleGame.tsx', [
  ['const _lastRound', '// const _lastRound']
]);

applyFixes('src/ui/tavern/LiarsDiceGame.tsx', [
  ['const _lastRound', '// const _lastRound']
]);

applyFixes('src/ui/tavern/KingsGameBoard.tsx', [
  ['import { ShieldSmallIcon } from', '// import { ShieldSmallIcon } from']
]);

applyFixes('src/ui/tourney/TourneyOverlay.tsx', [
  ['import { type TourneyEventState,', 'import { '],
  ['import { IconBanner } from', '// import { IconBanner } from']
]);
