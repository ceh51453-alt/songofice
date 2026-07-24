const fs = require('fs');
let code = fs.readFileSync('src/mvu/mvuPrompt.ts', 'utf8');

const updatedDragonPrompt = `export const DRAGON_MECHANICS_PROMPT = \`# CƠ CHẾ TƯƠNG TÁC VÀ THU PHỤC RỒNG (DRAGON TAMING)

Ngươi phải quản lý việc tương tác, ấp trứng và thu phục rồng cực kỳ nghiêm ngặt dựa trên Lore của A Song of Ice and Fire:

1. HUYẾT MẠCH LÀ ĐIỀU KIỆN TIÊN QUYẾT:
   - Hãy kiểm tra chỉ số "Huyết Mạch" của nhân vật trong bảng trạng thái. NẾU VÀ CHỈ NẾU nhân vật sở hữu "Máu Valyria Cổ Đại" (hoặc mang phép thuật máu cổ xưa), họ mới có khả năng thu phục rồng. 
   - Nếu không có "Máu Valyria Cổ Đại" mà dám lại gần đòi cưỡi/thu phục rồng, tỉ lệ thất bại là 99.9%. Rồng sẽ phun lửa thiêu rụi hoặc ăn thịt kẻ mạo phạm ngay lập tức.
   - Ngay cả khi có "Máu Valyria Cổ Đại", rủi ro vẫn tồn tại. Không phải người Valyria nào cũng được rồng chấp nhận.

2. CƠ CHẾ XÁC SUẤT (DICE ROLL) THU PHỤC:
   - Khi cố gắng thu phục (Claim/Tame) một con rồng đã trưởng thành, ngươi PHẢI ép hệ thống đổ xúc xắc ngầm: [Kiểm tra Uy Tín + Kỹ Năng (nếu có)]. 
   - Độ Khó (DC) cực kỳ cao: Rồng hoang dã chưa từng bị thuần hóa (DC 25+), Rồng đã từng có chủ trước đây (DC 20+).
   - Nếu Thất bại: Không phải lúc nào cũng chết. Tùy vào độ chênh lệch của xúc xắc:
     + Thất bại suýt soát (kém 1-3 điểm): Rồng chỉ khè lửa dọa dẫm, hất văng hoặc bỏ lơ nhân vật.
     + Thất bại nặng (kém 4-8 điểm): Nhân vật bị phỏng, bị đuôi quật gãy xương (trừ HP nặng).
     + Thất bại thảm hại (Critical Fail): Rồng nổi điên, thiêu cháy hoặc cắn đứt chi của nhân vật.

3. TĂNG ĐỘ HẢO CẢM & ẤP TRỨNG:
   - Trứng rồng không nở bằng cách ấp như gà hay đặt trong lò sưởi thông thường. Theo Lore gốc, trứng rồng (đặc biệt là trứng đã hóa đá) yêu cầu một ngọn lửa cực lớn (như núi lửa Dragonmont, hoặc giàn thiêu) VÀ/HOẶC nghi thức hiến tế ma thuật máu (Blood Magic) để nở. Nếu chỉ ôm ấp hoặc đốt lửa trại bình thường, trứng sẽ mãi là đá hoặc chậm chí chỉ ấm lên một chút.
   - Hảo cảm (Affinity) tăng rất chậm. Không thể cho rồng ăn 1 miếng thịt mà đòi Hảo cảm tăng 50%. Mỗi lần tương tác thành công (Vuốt ve, huấn luyện) chỉ tăng 1-5 điểm và phải gieo xúc xắc. Nếu xúc xắc thấp, rồng sẽ gắt gỏng.
   - Người chơi không thể cưỡi rồng nếu Mức Độ Thuần Hóa chưa đạt 100% hoặc Độ Hảo Cảm quá thấp.\`;`;

const regex = /export const DRAGON_MECHANICS_PROMPT = `[\s\S]*?`;/m;
if (code.match(regex)) {
    code = code.replace(regex, updatedDragonPrompt);
    fs.writeFileSync('src/mvu/mvuPrompt.ts', code);
    console.log('Updated DRAGON_MECHANICS_PROMPT');
} else {
    console.log('Failed to find DRAGON_MECHANICS_PROMPT');
}
