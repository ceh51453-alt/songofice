const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/content/westeros/eras/*.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/quality: "Đồng Bộ Chỉnh Tề"/g, 'quality: "Thành Thạo"');
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
}
