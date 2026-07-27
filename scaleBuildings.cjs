const fs = require('fs');
let content = fs.readFileSync('src/content/westeros/buildings.ts', 'utf8');
content = content.replace(/import type { BUILDING_TYPES } from \"..\/..\/mvu\/schema\";/, "import type { BUILDING_TYPES } from '../../mvu/schema';\nimport { EXCHANGE_RATES } from '../../economy/currency';");

content = content.replace(/\"Ngân Khố\":\s*(\d+)/g, (match, p1) => {
    return '\"Ngân Khố\": ' + p1 + ' * EXCHANGE_RATES.GOLD_TO_COPPER';
});

fs.writeFileSync('src/content/westeros/buildings.ts', content, 'utf8');
