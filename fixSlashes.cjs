const fs = require('fs');
let code = fs.readFileSync('src/content/westeros/timeline.ts', 'utf8');

// The file has literal backslash-escaped characters that should just be characters
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\${/g, '${');

fs.writeFileSync('src/content/westeros/timeline.ts', code);
console.log('Fixed escaped backticks and dollar signs');
