const fs = require('fs');
let code = fs.readFileSync('src/mvu/stateRenderer.ts', 'utf8');

if (!code.includes('import { getTimelineContext }')) {
    code = code.replace(
        'import { ERAS_BY_ID } from "../content/westeros/eras";',
        'import { ERAS_BY_ID } from "../content/westeros/eras";\nimport { getTimelineContext } from "../content/westeros/timeline";'
    );
}

const targetStr = `      \`[BỐI CẢNH THỜI KỲ] \${eraData.name} | Năm: \${world["Năm"]} AC | Mùa: \${world["Mùa"]}\`,`;
const replacementStr = `      \`[BỐI CẢNH THỜI KỲ] \${eraData.name} | Năm: \${world["Năm"]} AC | Mùa: \${world["Mùa"]}\`,\n      getTimelineContext(world["Năm"]),`;

if (code.includes(targetStr) && !code.includes('getTimelineContext(world["Năm"])')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/mvu/stateRenderer.ts', code);
    console.log('stateRenderer.ts updated with timeline context.');
} else {
    console.log('Failed to patch stateRenderer.ts (target string not found or already patched).');
}
