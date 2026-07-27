import fs from 'fs';
import path from 'path';

const ERAS_DIR = path.join(process.cwd(), 'src/content/westeros/eras');

function addDebtToCharacter(filename, charId, debts) {
  const filepath = path.join(ERAS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  const charBlockRegex = new RegExp(`(\\{\\s*id:\\s*["']${charId}["'][\\s\\S]*?(?=\\n\\s*\\{|\\n\\s*\\]))`, 'g');
  
  let match = charBlockRegex.exec(content);
  if (match) {
    let block = match[0];
    if (block.includes('startDebts:')) return; // Already has debt

    const debtStr = `,\n    startDebts: ${JSON.stringify(debts, null, 2).replace(/\n/g, '\n    ')}`;
    const startResourcesRegex = /(startResources:\s*\{[^}]+\})/;
    if (startResourcesRegex.test(block)) {
      const newBlock = block.replace(startResourcesRegex, `$1${debtStr}`);
      content = content.replace(block, newBlock);
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Added debts to ${charId} in ${filename}`);
    }
  } else {
    console.log(`${charId} not found in ${filename}`);
  }
}

// Robert Baratheon (Rebellion)
addDebtToCharacter('robertsRebellion.ts', 'robert-baratheon', {
  'Iron Bank': { amount: 1000000, interest: 5, duration: 100 }
});
addDebtToCharacter('robertsRebellion.ts', 'aerys-ii-targaryen', {
  'Iron Bank': { amount: 500000, interest: 5, duration: 50 }
});
addDebtToCharacter('windsOfWinter.ts', 'jon-snow', {
  'Iron Bank': { amount: 20000, interest: 10, duration: 50 }
});

