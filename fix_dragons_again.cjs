const fs = require('fs');
const path = require('path');

const p = path.resolve(__dirname, 'src/content/westeros/eras/danceOfDragons.ts');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/stats: \{ "Sức Lửa": \d+, "Sức Mạnh": \d+, "Nhanh Nhẹn": \d+, "Trí Tuệ": \d+, "Tinh Tường": \d+ \}/g, 'stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }');
// Also check for trailing commas inside the stats
c = c.replace(/stats: \{ "Sức Lửa": \d+, "Sức Mạnh": \d+, "Nhanh Nhẹn": \d+, "Trí Tuệ": \d+, "Tinh Tường": \d+,\s* \}/g, 'stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }');
// And just in case they have a different spacing
c = c.replace(/stats:\s*\{\s*"Sức Lửa":\s*\d+,\s*"Sức Mạnh":\s*\d+,\s*"Nhanh Nhẹn":\s*\d+,\s*"Trí Tuệ":\s*\d+,\s*"Tinh Tường":\s*\d+[^}]*\}/g, 'stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed dragons again');
