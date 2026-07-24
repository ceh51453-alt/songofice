const fs = require('fs');
let code = fs.readFileSync('src/content/westeros/eras.ts', 'utf8');

const replacements = [
  { search: '    canonCharacters: [\n      {\n        id: "aegon-targaryen",', replace: '    canonCharacters: [\n      ...aegonConquestCharacters,\n      {\n        id: "aegon-targaryen",' },
  { search: '    canonCharacters: [\n      {\n        id: "rhaenyra-targaryen",', replace: '    canonCharacters: [\n      ...danceOfDragonsCharacters,\n      {\n        id: "rhaenyra-targaryen",' },
  { search: '    canonCharacters: [\n      {\n        id: "daemon-blackfyre",', replace: '    canonCharacters: [\n      ...blackfyreRebellionCharacters,\n      {\n        id: "daemon-blackfyre",' },
  { search: '    canonCharacters: [\n      {\n        id: "duncan-the-tall",', replace: '    canonCharacters: [\n      ...dunkAndEggCharacters,\n      {\n        id: "duncan-the-tall",' },
  { search: '    canonCharacters: [\n      {\n        id: "robert-baratheon",', replace: '    canonCharacters: [\n      ...robertsRebellionCharacters,\n      {\n        id: "robert-baratheon",' }
];

for (const r of replacements) {
  code = code.replace(r.search, r.replace);
}

fs.writeFileSync('src/content/westeros/eras.ts', code);
