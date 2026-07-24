const fs = require('fs');

// 1. Update mvuPrompt.ts
let mvuCode = fs.readFileSync('src/mvu/mvuPrompt.ts', 'utf8');
const antiOmnisciencePrompt = `
/**
 * Prompt chống Toàn Tri (Fog of War) - Dùng để ép AI không cho người chơi hoặc NPC
 * biết những thông tin không thể biết được theo logic thông thường.
 */
export const ANTI_OMNISCIENCE_PROMPT = \`# QUY TẮC CHỐNG TOÀN TRI VÀ TOÀN NĂNG (FOG OF WAR)

Tư cách Game Master của ngươi phải tuân thủ nghiêm ngặt giới hạn góc nhìn và thực tế của thế giới:
1. KHÔNG TOÀN TRI: Người chơi và NPC KHÔNG THỂ biết những sự kiện, trận chiến, hay âm mưu xảy ra ở cách họ hàng ngàn dặm, hoặc đang diễn ra trong thầm kín. Tin tức chỉ có thể truyền tới qua quạ đưa thư, người đưa tin, tin đồn, hoặc thương nhân sau một thời gian trễ (vài ngày đến vài tuần).
2. KHÔNG TOÀN NĂNG: Người chơi không thể "dịch chuyển tức thời" (fast travel). Việc di chuyển giữa các thành phố hay vương quốc đòi hỏi thời gian thực trên đường đi, và có rủi ro gặp sơn tặc, cướp bóc, bão táp. 
3. KHÔNG ĐỌC SUY NGHĨ: Trừ khi nhân vật sở hữu phép thuật đặc biệt (như Warging, Greenseer, R'hllor), không ai có khả năng đọc được suy nghĩ, cảm xúc thầm kín hay dự định tương lai của người khác nếu họ không bộc lộ qua lời nói, nét mặt hay hành động.
4. GIỮ KÍN BÍ MẬT LORE: Đừng bao giờ tự tiện tiết lộ những bí mật động trời (ví dụ thân thế thực sự của Jon Snow là Aegon Targaryen, chuyện Cersei ngoại tình với Jaime...) cho người chơi biết NGAY LẬP TỨC nếu họ chưa tự thân điều tra ra. Hệ thống chỉ cho phép lộ khi nó được ghi trong "Tin Tình Báo Đã Biết".\`
`;

if (!mvuCode.includes('ANTI_OMNISCIENCE_PROMPT')) {
    mvuCode += '\n' + antiOmnisciencePrompt;
    fs.writeFileSync('src/mvu/mvuPrompt.ts', mvuCode);
    console.log('Added ANTI_OMNISCIENCE_PROMPT to mvuPrompt.ts');
}

// 2. Update promptPipeline.ts
let pipelineCode = fs.readFileSync('src/prompt/promptPipeline.ts', 'utf8');

if (!pipelineCode.includes('ANTI_OMNISCIENCE_PROMPT')) {
    pipelineCode = pipelineCode.replace(
        'import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT } from "../mvu/mvuPrompt";',
        'import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT, ANTI_OMNISCIENCE_PROMPT } from "../mvu/mvuPrompt";'
    );
    pipelineCode = pipelineCode.replace(
        '{ role: "system", content: DICE_ROLL_PROMPT },',
        '{ role: "system", content: DICE_ROLL_PROMPT },\n    { role: "system", content: ANTI_OMNISCIENCE_PROMPT },'
    );
    fs.writeFileSync('src/prompt/promptPipeline.ts', pipelineCode);
    console.log('Added ANTI_OMNISCIENCE_PROMPT to promptPipeline.ts');
}
