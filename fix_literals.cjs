const fs = require("fs");
const path = require("path");

const filesToProcess = [
  "e:/iceandfire/src/content/westeros/eras/blackfyreRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/warOfFiveKings.ts",
  "e:/iceandfire/src/content/westeros/eras/aegonConquest.ts",
  "e:/iceandfire/src/content/westeros/eras/danceOfDragons.ts",
  "e:/iceandfire/src/content/westeros/eras/robertsRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/windsOfWinter.ts",
  "e:/iceandfire/src/content/westeros/eras/dawnAge.ts",
  "e:/iceandfire/src/content/westeros/eras/dunkAndEgg.ts"
];

for (const filePath of filesToProcess) {
  let content = fs.readFileSync(filePath, "utf-8");
  
  // Fix Army Quality
  content = content.replace(/"Bình Thường"/g, '"Mới Lập Đội"');
  content = content.replace(/"Đồng Bộ Chỉnh Tề"/g, '"Thành Thạo"');
  content = content.replace(/"Yếu"/g, '"Rời Rạc"');
  
  // Fix Item slot
  content = content.replace(/"Mũ"/g, '"Vật Phẩm Đặc Biệt"');
  
  // Fix Item Quality
  content = content.replace(/"Tuyệt Phẩm"/g, '"Thượng Hạng"');
  content = content.replace(/"Cũ"/g, '"Thường"');
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Fixed", path.basename(filePath));
}
