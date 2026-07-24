const fs = require('fs');
let code = fs.readFileSync('src/content/westeros/timeline.ts', 'utf8');

const fixPart1 = `export interface TimelineEvent {
    startYear: number;
    endYear?: number;
    title: string;
    description: string;
    keyFigures?: string[];
}`;

const badRegex = /export interface TimelineEvent[\s\S]*?keyFigures: \["Daeron II Targaryen", "Bloodraven"\]\n    },/m;
code = code.replace(badRegex, fixPart1);

const newEvents = `
    {
        startYear: -700,
        title: "Cuộc Di Cư Của Người Rhoynar (Rhoynar Migration)",
        description: "Công chúa Nymeria dẫn dắt 10.000 con thuyền chở người Rhoynar chạy trốn khỏi sự bành trướng của Đế chế Valyria tại Essos. Họ cập bến Dorne ở Westeros, liên minh với nhà Martell để thống nhất Dorne.",
        keyFigures: ["Nymeria", "Mors Martell"]
    },
    {
        startYear: -100,
        endYear: -1,
        title: "Thế Kỷ Máu (Century of Blood)",
        description: "Sau sự sụp đổ của Valyria, Essos chìm trong hỗn loạn. Người Dothraki cưỡi ngựa tràn ra từ thảo nguyên, tiêu diệt nhiều thành bang. Các Thành Bang Tự Do (Free Cities) ở bờ tây Essos giao tranh liên miên để giành quyền thống trị.",
        keyFigures: ["Dothraki", "Volantis"]
    },
    {
        startYear: 209,
        title: "Đại Dịch Mùa Xuân (Great Spring Sickness)",
        description: "Một dịch bệnh khủng khiếp tàn phá Westeros, cướp đi sinh mạng của Vua Daeron II, hai hoàng tử, và hàng vạn dân thường. Vương quốc chìm trong tang tóc và bất ổn kéo dài.",
        keyFigures: ["Daeron II Targaryen", "Bloodraven"]
    },`;

code = code.replace('export const TIMELINE: TimelineEvent[] = [', 'export const TIMELINE: TimelineEvent[] = [' + newEvents);

fs.writeFileSync('src/content/westeros/timeline.ts', code);
console.log('Fixed timeline.ts syntax!');
