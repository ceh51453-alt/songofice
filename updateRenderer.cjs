const fs = require('fs');
let code = fs.readFileSync('src/mvu/stateRenderer.ts', 'utf8');

const newDragonRenderStr = `  // rồng (7.15 mở rộng)
  const dragons = Object.entries(state["Rồng"]);
  if (dragons.length > 0) {
    lines.push("", "Rồng:");
    for (const [, drg] of dragons) {
      const stats = drg["Chỉ Số"];
      const drgSkills = Object.entries(drg["Kỹ Năng"]).filter(([, lv]) => lv > 0);
      const affinity = Object.entries(drg["Độ Hảo Cảm"] || {}).map(([n, a]) => \`\${n}(\${a})\`).join(", ");
      
      lines.push(
        \`• \${drg["Tên"]} (\${drg["Kích Cỡ"]}, màu \${drg["Màu Sắc"]}, \${drg["Tuổi"]} tuổi, \${drg["Trạng Thái Thu Phục"]}). \` +
          \`HP \${drg["_HP"]}/\${drg["_HP Tối Đa"]}. Tình Trạng: \${drg["Tình Trạng"]}. \` +
          (drg["Đang Bị Xích"] ? \`ĐANG BỊ XÍCH (\${drg["Nơi Ổ"] || "Chưa rõ"}). \` : "") +
          (drg["Kỵ Sĩ"] ? \` Kỵ Sĩ: \${drg["Kỵ Sĩ"]}. \` : \` Mức Độ Thuần Hóa: \${drg["Mức Độ Thuần Hóa"]}/100. \`) +
          (affinity ? \` Hảo cảm: \${affinity}. \` : "")
      );
      if (stats) {
        lines.push(
          \`  Chỉ số: Sức Lửa \${stats["Sức Lửa"]} · Sức Bay \${stats["Sức Bay"]} · Giáp Vảy \${stats["Giáp Vảy"]} · \` +
            \`Hung Dữ \${stats["Hung Dữ"]} · Trung Thành \${stats["Trung Thành"]}.\`
        );
      }
      const dTraits = drg["Đặc Tính"] || [];
      if (dTraits.length > 0) {
        lines.push(\`  Đặc tính: \${dTraits.join(", ")}\`);
      }
      if (drgSkills.length > 0) {
        lines.push(\`  Kỹ năng: \${drgSkills.map(([name, lv]) => \`\${name} cấp \${lv}\`).join(" · ")}.\`);
      }
      if (drg["Mô Tả"]) {
        lines.push(\`  Mô tả: \${drg["Mô Tả"]}\`);
      }
    }
  }

  // trứng rồng
  const eggs = Object.entries(state["Trứng Rồng"] || {});
  if (eggs.length > 0) {
    lines.push("", "Trứng rồng:");
    for (const [id, egg] of eggs) {
      lines.push(\`• \${egg["Tên"] || id} (Màu: \${egg["Màu Sắc"]}) — Nhiệt độ: \${egg["Nhiệt Độ"]}, Tình trạng: \${egg["Tình Trạng"]}\${egg["Chủ Nhân"] ? \`, Chủ nhân: \${egg["Chủ Nhân"]}\` : ""}. \${egg["Mô Tả"]}\`);
    }
  }`;

// Find the section to replace: from "// rồng (7.15 mở rộng)" down to "// NPC"
const startIdx = code.indexOf('  // rồng (7.15 mở rộng)');
const endIdx = code.indexOf('  // NPC — ưu tiên');

if (startIdx > -1 && endIdx > -1) {
    const replacement = newDragonRenderStr + '\n\n' + code.substring(endIdx, endIdx); 
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    fs.writeFileSync('src/mvu/stateRenderer.ts', code);
    console.log('Renderer updated');
} else {
    console.log('Could not find replace targets');
}
