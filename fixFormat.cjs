const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
}

// In TabMapGrid.tsx
let f = 'src/ui/territory/TabMapGrid.tsx';
let txt = fs.readFileSync(f, 'utf8');
if (!txt.includes('formatCurrencyShort')) {
  txt = txt.replace('import { useMvuStore } from "../../state/mvuStore";', 'import { useMvuStore } from "../../state/mvuStore";\nimport { formatCurrencyShort, EXCHANGE_RATES } from "../../economy/currency";');
}
// Scale the base cost in BUILDING_TEMPLATES
txt = txt.replace(/\"Ngân Khố\":\s*(\d+)/g, (match, p1) => {
    return '\"Ngân Khố\": ' + p1 + ' * EXCHANGE_RATES.GOLD_TO_COPPER';
});
txt = txt.replace(/\{tpl\.cost\[\"Ngân Khố\"\]\}/g, '{formatCurrencyShort(tpl.cost[\"Ngân Khố\"])}');
fs.writeFileSync(f, txt, 'utf8');

// In TabDecree.tsx
f = 'src/ui/territory/TabDecree.tsx';
txt = fs.readFileSync(f, 'utf8');
if (!txt.includes('formatCurrencyShort')) {
  txt = txt.replace('import { useMvuStore } from "../../state/mvuStore";', 'import { useMvuStore } from "../../state/mvuStore";\nimport { formatCurrencyShort, EXCHANGE_RATES } from "../../economy/currency";');
}
txt = txt.replace(/costGold:\s*(\d+)/g, (match, p1) => {
    return 'costGold: ' + p1 + ' * EXCHANGE_RATES.GOLD_TO_COPPER';
});
txt = txt.replace(/\{tpl\.costGold\}/g, '{formatCurrencyShort(tpl.costGold)}');
fs.writeFileSync(f, txt, 'utf8');

// In TerritoryPanel.tsx
f = 'src/ui/territory/TerritoryPanel.tsx';
txt = fs.readFileSync(f, 'utf8');
txt = txt.replace(/signed\(yld\[\"Ngân Khố\"\]\)/g, 'formatCurrencyShort(yld[\"Ngân Khố\"])');
fs.writeFileSync(f, txt, 'utf8');

