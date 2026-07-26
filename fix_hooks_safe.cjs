const fs = require('fs');
const path = require('path');

const files = [
  'src/content/westeros/eras/aegonConquest.ts',
  'src/content/westeros/eras/blackfyreRebellion.ts',
  'src/content/westeros/eras/danceOfDragons.ts',
  'src/content/westeros/eras/dawnAge.ts',
  'src/content/westeros/eras/dunkAndEgg.ts',
  'src/content/westeros/eras/robertsRebellion.ts',
  'src/content/westeros/eras/warOfFiveKings.ts',
  'src/content/westeros/eras/windsOfWinter.ts'
];

for (const file of files) {
  const fp = path.resolve(__dirname, file);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  // Clean up any existing startingHookIds just to be sure we don't duplicate
  content = content.replace(/,\s*startingHookIds:\s*\[[^\]]*\]/g, '');
  content = content.replace(/startingHookIds:\s*\[[^\]]*\],\s*/g, '');
  
  // Now add it safely
  content = content.replace(/gold:\s*(\d+)/g, 'gold: $1, startingHookIds: []');
  
  fs.writeFileSync(fp, content, 'utf8');
}
console.log('Fixed hooks in all eras');
