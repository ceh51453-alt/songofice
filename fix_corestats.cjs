const fs = require('fs');
const path = require('path');

const files = [
  'src/content/westeros/eras/aegonConquest.ts',
  'src/content/westeros/eras/blackfyreRebellion.ts',
  'src/content/westeros/eras/danceOfDragons.ts',
  'src/content/westeros/eras/dunkAndEgg.ts',
  'src/content/westeros/eras/robertsRebellion.ts',
];

const replacements = [
  [/\bSTR:/g, '"Sức Mạnh":'],
  [/\bAGI:/g, '"Nhanh Nhẹn":'],
  [/\bEND:/g, '"Thể Chất":'],
  [/\bINT:/g, '"Trí Tuệ":'],
  [/\bWIL:/g, '"Tinh Tường":'],
  [/\bCHA:/g, '"Uy Tín":'],
];

for (const f of files) {
  const fp = path.resolve(__dirname, f);
  let content = fs.readFileSync(fp, 'utf8');
  for (const [re, rep] of replacements) {
    content = content.replace(re, rep);
  }
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Fixed CoreStat keys in:', f);
}
console.log('Done!');
