const fs = require('fs');
let code = fs.readFileSync('src/mvu/mvuPrompt.ts', 'utf8');

const mvuInstruction = `
- TƯƠNG TÁC RỒNG VÀ TRỨNG (Mới): Dùng "replace" hoặc "delta" với path stat_data.Rồng.<Tên rồng> hoặc stat_data.Trứng Rồng.<Tên trứng>. 
  Cập nhật Đặc Tính, Độ Hảo Cảm, Trạng Thái Thu Phục ("Đang Cảm Hóa", "Đã Có Chủ"), Tình Trạng Trứng ("Hóa Đá", "Đang Ấp", "Nứt Vỏ").
  Ví dụ tăng hảo cảm rồng: { "op": "delta", "path": "stat_data.Rồng.Drogon.Độ Hảo Cảm.Jon Snow", "value": 10 }`;

if (!code.includes('TƯƠNG TÁC RỒNG VÀ TRỨNG')) {
    code = code.replace('- THÊM NPC MỚI:', mvuInstruction.trim() + '\n- THÊM NPC MỚI:');
}

const sqlInstruction = `
- Rồng & Trứng rồng: UPDATE bảng rong (hoặc trung_rong) để thay đổi do_hao_cam, trang_thai_thu_phuc, tinh_trang_trung tuỳ theo lời kể (tăng hảo cảm, thuần hóa, ấp trứng).`;

if (!code.includes('Rồng & Trứng rồng')) {
    code = code.replace('- Vật phẩm: INSERT khi nhận mới, UPDATE so_luong khi nhận thêm, DELETE khi dùng hết.', '- Vật phẩm: INSERT khi nhận mới, UPDATE so_luong khi nhận thêm, DELETE khi dùng hết.\n' + sqlInstruction.trim());
}

fs.writeFileSync('src/mvu/mvuPrompt.ts', code);
console.log('mvuPrompt updated');
