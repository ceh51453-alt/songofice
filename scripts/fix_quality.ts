import fs from 'fs';
import path from 'path';

const dir = 'src/content/westeros/eras';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('quality: "Đồng Bộ Chỉnh Tề"')) {
    content = content.replace(/quality: "Đồng Bộ Chỉnh Tề"/g, 'quality: "Thành Thạo"');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
}
