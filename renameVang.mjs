import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('e:/iceandfire/src');
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We replace specific patterns for "Vàng" -> "Ngân Khố"
    content = content.replace(/\["Vàng"\]/g, '["Ngân Khố"]');
    content = content.replace(/\{ "Vàng":/g, '{ "Ngân Khố":');
    content = content.replace(/\{"Vàng":/g, '{"Ngân Khố":');
    content = content.replace(/, "Vàng":/g, ', "Ngân Khố":');
    content = content.replace(/,"Vàng":/g, ',"Ngân Khố":');
    content = content.replace(/Vàng:/g, 'Ngân Khố:'); // e.g. Vàng: 100
    content = content.replace(/name="Vàng"/g, 'name="Ngân Khố"'); // Icon component
    content = content.replace(/"Vàng", "Lương Thực"/g, '"Ngân Khố", "Lương Thực"');
    content = content.replace(/"Vàng"\s*\|\s*"Lương Thực"/g, '"Ngân Khố" | "Lương Thực"');
    // For format functions or text UI
    content = content.replace(/Vàng \{info\["Vàng/g, 'Ngân Khố {info["Ngân Khố');

    // Make sure we don't accidentally replace DRAGON_COLORS = ["Đen", "Đỏ", "Vàng", ...]
    // The regexes above only target structural objects and arrays like ["Vàng"] not "Vàng" in an array (unless it's [ "Vàng", "Lương Thực" ])
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Changed ${changedFiles} files.`);
