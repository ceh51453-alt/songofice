const fs = require('fs');

let file = 'src/territory/territoryEngine.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('import { findGeneralAtHolding } from "./army";\r\n', '');
content = content.replace('import { findGeneralAtHolding } from "./army";\n', '');
fs.writeFileSync(file, content, 'utf8');

file = 'src/ui/territory/TerritoryPanel.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace('import { hasPrivilege, canManageDomain }', 'import { canManageDomain }');
fs.writeFileSync(file, content, 'utf8');
