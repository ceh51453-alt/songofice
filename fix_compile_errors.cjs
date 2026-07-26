const fs = require('fs');
const path = require('path');

// 1. Fix dawnAge.ts equipment slot
const dawnAgePath = path.resolve(__dirname, 'src/content/westeros/eras/dawnAge.ts');
if (fs.existsSync(dawnAgePath)) {
  let content = fs.readFileSync(dawnAgePath, 'utf8');
  content = content.replace(/slot: "Vương Miện"/g, 'slot: "Vật Phẩm Đặc Biệt"');
  fs.writeFileSync(dawnAgePath, content, 'utf8');
  console.log('Fixed dawnAge.ts equipment slot');
}

// 2. Fix dragon stats in danceOfDragons.ts
const dancePath = path.resolve(__dirname, 'src/content/westeros/eras/danceOfDragons.ts');
if (fs.existsSync(dancePath)) {
  let content = fs.readFileSync(dancePath, 'utf8');
  // Seasmoke: { "Sức Lửa": 200, "Sức Mạnh": 15, "Nhanh Nhẹn": 18, "Trí Tuệ": 12, "Tinh Tường": 14 }
  // Should be: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }
  // We'll just replace the specific stats lines since there are only a few.
  content = content.replace(
    /stats: \{ "Sức Lửa": 200, "Sức Mạnh": 15, "Nhanh Nhẹn": 18, "Trí Tuệ": 12, "Tinh Tường": 14 \}/g,
    'stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }'
  );
  
  // Sheepstealer
  content = content.replace(
    /stats: \{ "Sức Lửa": 180, "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Trí Tuệ": 18, "Tinh Tường": 10 \}/g,
    'stats: { "Sức Lửa": 14, "Sức Bay": 14, "Giáp Vảy": 12, "Hung Dữ": 18, "Trung Thành": 8 }'
  );

  // Tessarion
  content = content.replace(
    /stats: \{ "Sức Lửa": 150, "Sức Mạnh": 14, "Nhanh Nhẹn": 20, "Trí Tuệ": 14, "Tinh Tường": 12 \}/g,
    'stats: { "Sức Lửa": 12, "Sức Bay": 20, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }'
  );

  // Moondancer
  content = content.replace(
    /stats: \{ "Sức Lửa": 100, "Sức Mạnh": 10, "Nhanh Nhẹn": 22, "Trí Tuệ": 10, "Tinh Tường": 18 \}/g,
    'stats: { "Sức Lửa": 10, "Sức Bay": 22, "Giáp Vảy": 8, "Hung Dữ": 15, "Trung Thành": 18 }'
  );
  
  // Morning (if present)
  content = content.replace(
    /stats: \{ "Sức Lửa": 20, "Sức Mạnh": 5, "Nhanh Nhẹn": 10, "Trí Tuệ": 15, "Tinh Tường": 20 \}/g,
    'stats: { "Sức Lửa": 5, "Sức Bay": 10, "Giáp Vảy": 5, "Hung Dữ": 5, "Trung Thành": 20 }'
  );

  fs.writeFileSync(dancePath, content, 'utf8');
  console.log('Fixed dragon stats in danceOfDragons.ts');
}
