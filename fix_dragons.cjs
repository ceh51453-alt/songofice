const fs = require('fs');
const path = require('path');

// Fix dragon stats in danceOfDragons.ts + other era files
// Dragon stats: HP → not a DragonStat! DragonStats are: "Sức Lửa","Sức Bay","Giáp Vảy","Hung Dữ","Trung Thành"
// Dragon size: "Lớn" → "Trưởng Thành", "Nhỏ" → "Non", "Khổng Lồ" → "Khổng Lồ (Balerion-class)"

const files = [
  'src/content/westeros/eras/danceOfDragons.ts',
];

for (const f of files) {
  const fp = path.resolve(__dirname, f);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Fix dragon sizes
  content = content.replace(/"Lớn"/g, '"Trưởng Thành"');
  content = content.replace(/"Nhỏ"/g, '"Non"');
  // "Khổng Lồ" (without Balerion-class) → "Khổng Lồ (Balerion-class)"
  // But be careful not to replace "Khổng Lồ (Balerion-class)" again
  content = content.replace(/"Khổng Lồ"(?!\s*\()/g, '"Khổng Lồ (Balerion-class)"');

  // Fix dragon stats object: { HP: ..., ATK: ..., DEF: ..., SPD: ..., LYL: ... }
  // → { "Sức Lửa": ..., "Sức Bay": ..., "Giáp Vảy": ..., "Hung Dữ": ..., "Trung Thành": ... }
  // These appear in dragon stats objects only
  content = content.replace(/\bHP:/g, '"Sức Lửa":');
  content = content.replace(/\bATK:/g, '"Sức Bay":');
  content = content.replace(/\bDEF:/g, '"Giáp Vảy":');
  content = content.replace(/\bSPD:/g, '"Hung Dữ":');
  content = content.replace(/\bLYL:/g, '"Trung Thành":');
  
  // Fix equipment slot: "Tay Phải" → "Vũ Khí Chính"
  content = content.replace(/"Tay Phải"/g, '"Vũ Khí Chính"');

  fs.writeFileSync(fp, content, 'utf8');
  console.log('Fixed dragon stats/sizes in:', f);
}

// Fix "Tay Phải" in other files too
const slotFiles = [
  'src/content/westeros/eras/blackfyreRebellion.ts',
  'src/content/westeros/eras/robertsRebellion.ts',
];
for (const f of slotFiles) {
  const fp = path.resolve(__dirname, f);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/"Tay Phải"/g, '"Vũ Khí Chính"');
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Fixed equipment slots in:', f);
}

console.log('Done!');
