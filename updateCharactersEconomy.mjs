import fs from 'fs';
import path from 'path';

const ERAS_DIR = path.join(process.cwd(), 'src/content/westeros/eras');

const eraFiles = [
  'aegonConquest.ts',
  'blackfyreRebellion.ts',
  'danceOfDragons.ts',
  'dawnAge.ts',
  'dunkAndEgg.ts',
  'robertsRebellion.ts',
  'warOfFiveKings.ts',
  'windsOfWinter.ts'
];

function getMultiplier(tuocVi) {
  switch (tuocVi) {
    case 'Vua Bảy Vương Quốc':
    case 'Hoàng Đế':
      return 15;
    case 'Quốc Vương':
    case 'Vua':
      return 10;
    case 'Đại Lãnh Chúa':
      return 5;
    case 'Lãnh Chúa Thành Trì':
    case 'Lãnh Chúa':
      return 2;
    case 'Hiệp Sĩ':
      return 1;
    default:
      return 0.2;
  }
}

function generateResources(house, tuocVi, gold) {
  const mult = getMultiplier(tuocVi);
  let wood = 100 * mult;
  let iron = 50 * mult;
  let stone = 100 * mult;
  let food = 500 * mult;
  let horses = 20 * mult;

  if (house === 'Stark' || house === 'Glover' || house === 'Mormont' || house === 'Umber' || house === 'Bolton' || house === 'Karstark') {
    wood *= 3;
    food *= 0.8;
    stone *= 1.2;
    iron *= 1.2;
  } else if (house === 'Lannister' || house === 'Reyne' || house === 'Crakehall' || house === 'Brax') {
    iron *= 3;
    stone *= 1.5;
    wood *= 0.5;
    food *= 1.2;
  } else if (house === 'Tyrell' || house === 'Hightower' || house === 'Redwyne' || house === 'Tarly' || house === 'Florent') {
    food *= 4;
    horses *= 1.5;
    wood *= 1.5;
    iron *= 0.5;
  } else if (house === 'Arryn' || house === 'Royce' || house === 'Corbray' || house === 'Waynwood') {
    stone *= 4;
    iron *= 1.5;
    horses *= 1.2;
    food *= 0.8;
  } else if (house === 'Greyjoy' || house === 'Harlaw' || house === 'Goodbrother') {
    iron *= 2.5;
    wood *= 1.5;
    stone *= 1.5;
    food *= 0.4;
    horses *= 0.1;
  } else if (house === 'Martell' || house === 'Yronwood' || house === 'Dayne') {
    food *= 0.7;
    horses *= 3;
    stone *= 1.2;
    wood *= 0.5;
  } else if (house === 'Baratheon' || house === 'Tarth' || house === 'Connington') {
    wood *= 2;
    stone *= 1.5;
    iron *= 1.2;
    food *= 1.1;
  } else if (house === 'Tully' || house === 'Blackwood' || house === 'Bracken' || house === 'Mallister' || house === 'Frey') {
    food *= 2;
    wood *= 1.5;
    iron *= 0.8;
  }

  return {
    "Gỗ": Math.floor(wood),
    "Quặng Sắt": Math.floor(iron),
    "Đá": Math.floor(stone),
    "Lương Thực": Math.floor(food),
    "Ngựa": Math.floor(horses),
    "Thép Valyria": 0
  };
}

function processEraFile(filename) {
  const filepath = path.join(ERAS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // Find blocks for characters. A block usually starts with { id: "something", ... 
  // and ends when a new character starts or the array ends.
  const charsRegex = /\{\s*id:\s*["'][^"']+["'][\s\S]*?(?=\n\s*\{|\n\s*\])/g;
  
  let modifiedContent = content;

  let match;
  while ((match = charsRegex.exec(content)) !== null) {
    let block = match[0];
    
    const idMatch = block.match(/id:\s*["']([^"']+)["']/);
    const tuocViMatch = block.match(/tuocVi:\s*["']([^"']+)["']/);
    const houseMatch = block.match(/house:\s*["']([^"']+)["']/);
    const goldMatch = block.match(/gold:\s*(\d+)/);

    if (!idMatch) continue;
    
    const id = idMatch[1];
    const tuocVi = tuocViMatch ? tuocViMatch[1] : 'Thường Dân';
    const house = houseMatch ? houseMatch[1] : 'Không Rõ';
    const gold = goldMatch ? parseInt(goldMatch[1], 10) : 100;

    const resources = generateResources(house, tuocVi, gold);
    
    let debts = {};
    if (id === 'robert-baratheon' && filename.includes('warOfFiveKings')) {
       debts['Iron Bank'] = { amount: 3000000, interest: 5, duration: 200 };
    }
    if (id === 'stannis-baratheon' && (filename.includes('warOfFiveKings') || filename.includes('windsOfWinter'))) {
       debts['Iron Bank'] = { amount: 500000, interest: 7, duration: 100 };
    }
    if (id === 'cersei-lannister' && filename.includes('windsOfWinter')) {
       debts['Iron Bank'] = { amount: 2000000, interest: 10, duration: 150 };
       debts['Faith of the Seven'] = { amount: 1000000, interest: 0, duration: 999 };
    }

    const resourceStr = `startResources: ${JSON.stringify(resources, null, 2).replace(/\n/g, '\n    ')}`;
    const debtStr = Object.keys(debts).length > 0 ? `,\n    startDebts: ${JSON.stringify(debts, null, 2).replace(/\n/g, '\n    ')}` : ``;
    
    if (block.includes('startResources:')) continue;

    const goldRegex = /(gold:\s*\d+,?)/;
    if (goldRegex.test(block)) {
      const newBlock = block.replace(goldRegex, `$1\n    ${resourceStr}${debtStr},`);
      modifiedContent = modifiedContent.replace(block, newBlock);
    }
  }

  fs.writeFileSync(filepath, modifiedContent, 'utf8');
  console.log(`Processed ${filename}`);
}

eraFiles.forEach(processEraFile);
console.log("All eras processed.");
