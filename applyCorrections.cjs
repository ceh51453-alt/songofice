const fs = require('fs');

// 1. Cập nhật characterInit.ts để gán tự động Huyết Mạch và Văn Hóa theo Gia Tộc
let charCode = fs.readFileSync('src/character/characterInit.ts', 'utf8');

const getBloodlineFn = `
function autoAssignBloodlineAndCulture(house: string, name: string): { bloodline: string, culture: string } {
  const h = (house || "").trim();
  if (["Targaryen", "Velaryon", "Celtigar", "Blackfyre"].includes(h) || name.includes("Targaryen")) return { bloodline: "Máu Valyria Cổ Đại", culture: "Valyrian" };
  if (["Stark", "Bolton", "Umber", "Karstark", "Mormont", "Glover", "Dustin", "Reed", "Tallhart", "Ryswell", "Blackwood", "Royce", "Dayne"].includes(h) || name.includes("Stark")) return { bloodline: "Máu Tiền Nhân", culture: "First Men" };
  if (["Greyjoy", "Harlaw", "Goodbrother", "Drumm", "Botley", "Blacktyde"].includes(h)) return { bloodline: "Máu Ironborn", culture: "Ironborn" };
  if (["Martell", "Yronwood", "Fowler", "Manwoody", "Gargalen", "Uller", "Qorgyle", "Toland"].includes(h)) return { bloodline: "Máu Rhoynar", culture: "Dornish" };
  if (!h || h === "Không Rõ") return { bloodline: "Không Rõ Huyết Mạch", culture: "Thường Dân" };
  return { bloodline: "Máu Andal", culture: "Andal" };
}
`;

if (!charCode.includes('autoAssignBloodlineAndCulture')) {
    // Chèn hàm vào trước buildStateFromCanon
    charCode = charCode.replace(
        'export function buildStateFromCanon(',
        getBloodlineFn + '\nexport function buildStateFromCanon('
    );
    
    // Tìm chỗ gán Văn Hoá = "First Men" và thay thế
    charCode = charCode.replace('info["Văn Hoá"] = "First Men";', `const bc = autoAssignBloodlineAndCulture(adjustedC.house as string, adjustedC.name);
  info["Văn Hoá"] = (adjustedC as any).culture || bc.culture;
  info["Huyết Mạch"] = (adjustedC as any).bloodline || bc.bloodline;`);

    fs.writeFileSync('src/character/characterInit.ts', charCode);
    console.log('Fixed characterInit.ts for Bloodline & Culture');
}

// 2. Cập nhật DRAGON_MECHANICS_PROMPT trong mvuPrompt.ts để bổ sung dòng thời gian ấp trứng
let mvuCode = fs.readFileSync('src/mvu/mvuPrompt.ts', 'utf8');

const updatedPrompt = `export const DRAGON_MECHANICS_PROMPT = \`# CƠ CHẾ TƯƠNG TÁC VÀ THU PHỤC RỒNG (DRAGON TAMING)

Ngươi phải quản lý việc tương tác, ấp trứng và thu phục rồng cực kỳ nghiêm ngặt dựa trên Lore của A Song of Ice and Fire:

1. HUYẾT MẠCH LÀ ĐIỀU KIỆN TIÊN QUYẾT:
   - Hãy kiểm tra chỉ số "Huyết Mạch" của nhân vật trong bảng trạng thái. NẾU VÀ CHỈ NẾU nhân vật sở hữu "Máu Valyria Cổ Đại" (hoặc mang phép thuật máu cổ xưa), họ mới có khả năng thu phục rồng. 
   - Nếu không có "Máu Valyria Cổ Đại" mà dám lại gần đòi cưỡi/thu phục rồng, tỉ lệ thất bại là 99.9%. Rồng sẽ phun lửa thiêu rụi hoặc ăn thịt kẻ mạo phạm.

2. CƠ CHẾ XÁC SUẤT (DICE ROLL) THU PHỤC:
   - Độ Khó (DC): Rồng hoang dã (DC 25+), Rồng đã từng có chủ (DC 20+). Phải đổ xúc xắc Uy Tín.
   - Thất bại nhẹ (kém 1-3 điểm): Rồng hất văng, dọa khè lửa hoặc bỏ lơ.
   - Thất bại nặng (kém 4-8 điểm): Phỏng nặng, gãy xương.
   - Thất bại thảm hại: Rồng nhai đầu hoặc thiêu chết.

3. TĂNG ĐỘ HẢO CẢM & ẤP TRỨNG (THEO DÒNG THỜI GIAN):
   - TRƯỚC VÀ TRONG VŨ ĐIỆU CỦA BẦY RỒNG (Trước năm 153 AC): Trứng rồng có thể nở bình thường nếu được đặt trong nôi của trẻ em Targaryen hoặc được ấp ở nơi có nhiệt độ núi lửa cực lớn (như Dragonmont).
   - SAU KHI LOÀI RỒNG TUYỆT DIỆT (Sau năm 153 AC): Toàn bộ trứng rồng còn sót lại đều hóa đá. Trứng KHÔNG THỂ nở bằng nhiệt độ thông thường. CHỈ CÓ THỂ nở nếu xuất hiện một hiện tượng thiên văn kỳ vĩ (như Sao Chổi Đỏ) KẾT HỢP với nghi thức hiến tế ma thuật máu (đốt sống một nhân mạng có giá trị pháp thuật/hoàng gia). Nếu người chơi ở kỷ nguyên này mà ném trứng vào lò sưởi, trứng sẽ mãi là đá.
   - Hảo cảm (Affinity) tăng rất chậm (1-5 điểm/lần thành công). Bắt buộc gieo xúc xắc mỗi khi tương tác.\`;`;

const regex = /export const DRAGON_MECHANICS_PROMPT = `[\s\S]*?`;/m;
if (mvuCode.match(regex)) {
    mvuCode = mvuCode.replace(regex, updatedPrompt);
    fs.writeFileSync('src/mvu/mvuPrompt.ts', mvuCode);
    console.log('Fixed egg hatching lore in mvuPrompt.ts');
}
