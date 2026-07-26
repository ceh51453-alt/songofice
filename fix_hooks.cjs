const fs = require('fs');
const path = require('path');

const files = [
  'src/content/westeros/eras/warOfFiveKings.ts',
  'src/content/westeros/eras/windsOfWinter.ts'
];

for (const file of files) {
  const fp = path.resolve(__dirname, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find "gold: <number>," and append startingHookIds: [] if it doesn't already exist on that object.
  // Using a regex with lookahead to ensure we don't duplicate.
  content = content.replace(/gold:\s*(\d+)(?!.*?startingHookIds)/g, 'gold: $1, startingHookIds: []');
  
  // The above regex might be flaky if startingHookIds is on the next line.
  // Actually, let's just do a simple replace, and if it duplicates, we fix it.
  content = content.replace(/gold:\s*(\d+),/g, 'gold: $1, startingHookIds: [],');
  
  // Clean up any double startingHookIds
  content = content.replace(/startingHookIds:\s*\[\],\s*startingHookIds:\s*\[\],/g, 'startingHookIds: [],');
  content = content.replace(/startingHookIds:\s*\[\],\s*startArmy/g, 'startingHookIds: [], startArmy');
  content = content.replace(/startingHookIds:\s*\[\],\s*startHoldings/g, 'startingHookIds: [], startHoldings');
  
  fs.writeFileSync(fp, content, 'utf8');
}
console.log('Fixed startingHookIds in WOT5K and WOW');
