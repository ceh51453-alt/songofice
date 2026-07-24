const fs = require('fs');
let code = fs.readFileSync('src/content/westeros/eras.ts', 'utf8');

const imports = `import { dawnAgeCharacters } from "./eras/dawnAge";
import { aegonConquestCharacters } from "./eras/aegonConquest";
import { danceOfDragonsCharacters } from "./eras/danceOfDragons";
import { blackfyreRebellionCharacters } from "./eras/blackfyreRebellion";
import { dunkAndEggCharacters } from "./eras/dunkAndEgg";
import { robertsRebellionCharacters } from "./eras/robertsRebellion";
import { warOfFiveKingsCharacters } from "./eras/warOfFiveKings";
import { windsOfWinterCharacters } from "./eras/windsOfWinter";
`;

if (!code.includes('dawnAgeCharacters')) {
  code = code.replace('import type { DragonStat, DragonSize } from "../../mvu/schema";', 'import type { DragonStat, DragonSize } from "../../mvu/schema";\n' + imports);
}

const replacements = [
  { firstId: 'id: "last-hero", name: "Anh Hùng Cuối Cùng"', arr: 'dawnAgeCharacters' },
  { firstId: 'id: "aegon-targaryen", name: "Aegon Targaryen"', arr: 'aegonConquestCharacters' },
  { firstId: 'id: "rhaenyra-targaryen", name: "Rhaenyra Targaryen"', arr: 'danceOfDragonsCharacters' },
  { firstId: 'id: "daemon-blackfyre", name: "Daemon Blackfyre"', arr: 'blackfyreRebellionCharacters' },
  { firstId: 'id: "duncan-the-tall", name: "Ser Duncan Cao Lớn"', arr: 'dunkAndEggCharacters' },
  { firstId: 'id: "robert-baratheon", name: "Robert Baratheon"', arr: 'robertsRebellionCharacters' },
  { firstId: 'id: "balon-greyjoy", name: "Balon Greyjoy"', arr: 'warOfFiveKingsCharacters' }, // Oh wait, I see Balon greyjoy is line 706 but Eddard Stark is line 784. The era is Greyjoy's Rebellion at 706! Let's check this again!
  { firstId: 'id: "eddard-stark", name: "Eddard Stark"', arr: 'warOfFiveKingsCharacters' },
  { firstId: 'id: "jon-snow-resurrected", name: "Jon Snow"', arr: 'windsOfWinterCharacters' }
];

for (const r of replacements) {
  const target1 = `    canonCharacters: [\n      {\n        ${r.firstId}`;
  const target2 = `    canonCharacters: [\r\n      {\r\n        ${r.firstId}`;
  
  const replacement = `    canonCharacters: [\n      ...${r.arr},\n      {\n        ${r.firstId}`;
  if (!code.includes(`...${r.arr}`)) {
    if (code.includes(target1)) code = code.replace(target1, replacement);
    else if (code.includes(target2)) code = code.replace(target2, replacement);
  }
}

fs.writeFileSync('src/content/westeros/eras.ts', code);
