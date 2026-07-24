const fs = require('fs');
let code = fs.readFileSync('src/mvu/mvuPrompt.ts', 'utf8');

const dragonMechanicsPrompt = `
export const DRAGON_MECHANICS_PROMPT = \`# CƠ CHẾ TƯƠNG TÁC VÀ THU PHỤC RỒNG (DRAGON TAMING)

Ngươi phải quản lý việc tương tác, ấp trứng và thu phục rồng cực kỳ nghiêm ngặt dựa trên Lore của A Song of Ice and Fire:

1. HUYẾT MẠCH LÀ ĐIỀU KIỆN TIÊN QUYẾT:
   - Rồng KHÔNG PHẢI thú cưng thông thường. Nếu một nhân vật KHÔNG có huyết mạch Valyria (Targaryen, Velaryon, Celtigar...) hoặc không có Ma thuật Máu cổ xưa mà dám lại gần đòi cưỡi/thu phục rồng, tỉ lệ thất bại là 99.9%. Rồng sẽ phun lửa thiêu rụi hoặc ăn thịt kẻ mạo phạm ngay lập tức.
   - Kể cả có huyết mạch Valyria (như các Dragonseed), máu càng loãng thì rủi ro bị rồng từ chối và giết chết càng cao.

2. CƠ CHẾ XÁC SUẤT (DICE ROLL) THU PHỤC:
   - Khi cố gắng thu phục (Claim/Tame) một con rồng đã trưởng thành, ngươi PHẢI ép hệ thống đổ xúc xắc ngầm: [Kiểm tra Uy Tín + Huyết Mạch]. 
   - Độ Khó (DC) cực kỳ cao: Rồng hoang (DC 25+), Rồng đã từng có chủ (DC 20+).
   - Nếu Thất bại: Nhân vật bị bỏng nặng (trừ HP), mất một chi, hoặc chết cháy. Ngươi phải mô tả sự hung tợn của loài rồng.

3. TĂNG ĐỘ HẢO CẢM & ẤP TRỨNG:
   - Trứng rồng không nở bằng cách ấp như gà. Phải có phép thuật máu, lửa lớn, hoặc một phép màu (như Daenerys). Nếu người chơi chỉ ôm ấp bình thường, trứng sẽ mãi là đá.
   - Hảo cảm (Affinity) tăng rất chậm. Không thể cho rồng ăn 1 miếng thịt mà đòi Hảo cảm tăng 50%. Mỗi lần tương tác thành công chỉ tăng 1-5 điểm. Hãy gieo xúc xắc cho mỗi lần tương tác (Vuốt ve, huấn luyện). Nếu xúc xắc thấp, rồng sẽ gắt gỏng khè lửa.
   - Người chơi không thể cưỡi rồng nếu Mức Độ Thuần Hóa chưa đạt 100% hoặc Độ Hảo Cảm quá thấp.\`;
`;

if (!code.includes('DRAGON_MECHANICS_PROMPT')) {
    code += '\n' + dragonMechanicsPrompt;
    fs.writeFileSync('src/mvu/mvuPrompt.ts', code);
    console.log('Added DRAGON_MECHANICS_PROMPT.');
} else {
    console.log('Already exists.');
}
