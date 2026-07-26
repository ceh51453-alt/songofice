const fs = require('fs');
const path = require('path');

const dir = 'e:/iceandfire/src/content/westeros/eras';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.push('../eras.ts'); // Also process eras.ts

for (const file of files) {
  const filePath = path.resolve(dir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  content = content.replace(/"Thiện Chiến"/g, '"Thành Thạo"');
  content = content.replace(/"Tân Binh"/g, '"Mới Lập Đội"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
