/**
 * Lịch sử vĩ đại của thế giới A Song of Ice and Fire
 * Bao gồm các sự kiện quan trọng nhất để làm khung bối cảnh (timeline) cho AI, tránh tình trạng hallucination.
 */

export interface TimelineEvent {
    startYear: number;
    endYear?: number;
    title: string;
    description: string;
    keyFigures?: string[];
}


export interface Monarch {
    startYear: number;
    endYear: number;
    name: string;
    house: string;
}

export const MONARCHS: Monarch[] = [
    { startYear: 1, endYear: 37, name: "Aegon I Targaryen (The Conqueror)", house: "Targaryen" },
    { startYear: 37, endYear: 42, name: "Aenys I Targaryen", house: "Targaryen" },
    { startYear: 42, endYear: 48, name: "Maegor I Targaryen (The Cruel)", house: "Targaryen" },
    { startYear: 48, endYear: 103, name: "Jaehaerys I Targaryen (The Conciliator)", house: "Targaryen" },
    { startYear: 103, endYear: 129, name: "Viserys I Targaryen", house: "Targaryen" },
    { startYear: 129, endYear: 131, name: "Aegon II Targaryen (cùng Rhaenyra Targaryen)", house: "Targaryen" },
    { startYear: 131, endYear: 157, name: "Aegon III Targaryen (Dragonbane)", house: "Targaryen" },
    { startYear: 157, endYear: 161, name: "Daeron I Targaryen (The Young Dragon)", house: "Targaryen" },
    { startYear: 161, endYear: 171, name: "Baelor I Targaryen (The Blessed)", house: "Targaryen" },
    { startYear: 171, endYear: 172, name: "Viserys II Targaryen", house: "Targaryen" },
    { startYear: 172, endYear: 184, name: "Aegon IV Targaryen (The Unworthy)", house: "Targaryen" },
    { startYear: 184, endYear: 209, name: "Daeron II Targaryen (The Good)", house: "Targaryen" },
    { startYear: 209, endYear: 221, name: "Aerys I Targaryen", house: "Targaryen" },
    { startYear: 221, endYear: 233, name: "Maekar I Targaryen", house: "Targaryen" },
    { startYear: 233, endYear: 259, name: "Aegon V Targaryen (The Unlikely)", house: "Targaryen" },
    { startYear: 259, endYear: 262, name: "Jaehaerys II Targaryen", house: "Targaryen" },
    { startYear: 262, endYear: 283, name: "Aerys II Targaryen (The Mad King)", house: "Targaryen" },
    { startYear: 283, endYear: 298, name: "Robert I Baratheon", house: "Baratheon" },
    { startYear: 298, endYear: 300, name: "Joffrey I Baratheon", house: "Baratheon" },
    { startYear: 300, endYear: 9999, name: "Tommen I Baratheon", house: "Baratheon" }
];

export const TIMELINE: TimelineEvent[] = [
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
    },
    {
        startYear: -12000,
        endYear: -10000,
        title: "Kỷ Nguyên Bình Minh (The Dawn Age)",
        description: "Thời đại của Những Đứa Trẻ Rừng Rậm (Children of the Forest) và Người Khổng Lồ. Tiền Nhân (First Men) từ Essos vượt Cánh Tay Xứ Dorne (Arm of Dorne) tiến vào Westeros. Xung đột kéo dài ngàn năm cho đến khi Hiệp Ước (The Pact) được ký kết tại Đảo Những Gương Mặt.",
        keyFigures: ["Children of the Forest", "First Men"]
    },
    {
        startYear: -8000,
        title: "Đêm Trường (The Long Night)",
        description: "Mùa đông kéo dài cả một thế hệ. Bóng Trắng (White Walkers/Others) tràn xuống từ phương Bắc xa xôi. Bị đánh bại trong Trận Chiến Vì Bình Minh (Battle for the Dawn). Bức Tường (The Wall) được xây dựng sau đó.",
        keyFigures: ["Azor Ahai", "The Last Hero", "Brandon the Builder"]
    },
    {
        startYear: -6000,
        title: "Cuộc Xâm Lăng Của Người Andal (Andal Invasion)",
        description: "Người Andal với vũ khí thép và Tôn giáo Thất Diện Thần (Faith of the Seven) đổ bộ vào Westeros. Họ đánh bại Tiền Nhân ở miền Nam nhưng không thể chinh phục Phương Bắc.",
        keyFigures: ["Andals", "First Men"]
    },
    {
        startYear: -5000,
        endYear: -114,
        title: "Sự Trỗi Dậy Của Valyria (Valyrian Freehold)",
        description: "Những người chăn cừu Valyria tìm thấy rồng trên Bán đảo Mười Bốn Lửa. Họ làm chủ loài rồng, xây dựng nên đế chế vĩ đại nhất Essos, tiêu diệt Đế chế Ghis và Rhoynar.",
        keyFigures: ["Valyrians", "Ghiscar", "Rhoynar"]
    },
    {
        startYear: -114,
        title: "Ngày Tàn Của Valyria (Doom of Valyria)",
        description: "Một thảm họa núi lửa kinh hoàng phá hủy bán đảo Valyria. Đế chế sụp đổ chỉ trong một đêm. Gần như toàn bộ rồng và người Valyria bị xóa sổ, trừ nhà Targaryen đã di cư đến Dragonstone trước đó.",
        keyFigures: ["Targaryens"]
    },
    {
        startYear: -1,
        endYear: 1,
        title: "Cuộc Chinh Phạt Của Aegon (Aegon's Conquest)",
        description: "Aegon Targaryen cùng hai chị em gái (Visenya, Rhaenys) và ba con rồng (Balerion, Vhagar, Meraxes) đổ bộ Westeros. Chinh phục 6 trên 7 vương quốc, thống nhất lục địa (trừ Dorne) và lập ra Ngôi Báu Sắt.",
        keyFigures: ["Aegon the Conqueror", "Visenya", "Rhaenys", "Harren the Black", "Torrhen Stark", "Loren Lannister"]
    },
    {
        startYear: 37,
        endYear: 48,
        title: "Cuộc Nổi Dậy Của Đức Tin (Faith Militant Uprising)",
        description: "Thất Diện Thần nổi loạn chống lại nhà Targaryen vì tập tục loạn luân. Vua Maegor Tàn Bạo dùng bạo lực trấn áp, kết thúc khi Jaehaerys I lên ngôi và ký kết hòa bình, tước bỏ quyền vũ trang của Giáo hội.",
        keyFigures: ["Maegor the Cruel", "Jaehaerys the Conciliator", "Faith Militant"]
    },
    {
        startYear: 129,
        endYear: 131,
        title: "Vũ Điệu Của Bầy Rồng (Dance of the Dragons)",
        description: "Nội chiến đẫm máu giữa Aegon II (Phe Xanh) và người chị cùng cha khác mẹ Rhaenyra (Phe Đen) tranh giành Ngôi Báu Sắt. Gần như toàn bộ rồng chết trong cuộc chiến này.",
        keyFigures: ["Aegon II", "Rhaenyra Targaryen", "Daemon Targaryen", "Aemond Targaryen"]
    },
    {
        startYear: 157,
        endYear: 161,
        title: "Chinh Phạt Dorne Lần 1 (Conquest of Dorne)",
        description: "Vua trẻ Daeron I chinh phục Dorne thành công nhưng không thể giữ được. Hàng vạn người chết, và chính nhà vua cũng tử trận.",
        keyFigures: ["Daeron I (The Young Dragon)"]
    },
    {
        startYear: 196,
        endYear: 196,
        title: "Cuộc Nổi Loạn Blackfyre Lần 1 (First Blackfyre Rebellion)",
        description: "Daemon Blackfyre (con hoang được hợp pháp hóa của Aegon IV) nổi dậy tranh ngôi với Daeron II. Trận Cỏ Đỏ (Redgrass Field) diễn ra đẫm máu, kết thúc với cái chết của Daemon.",
        keyFigures: ["Daemon Blackfyre", "Daeron II", "Bloodraven", "Bittersteel"]
    },
    {
        startYear: 260,
        endYear: 260,
        title: "Chiến Tranh Chín Vua Đồng Tiền (War of the Ninepenny Kings)",
        description: "Liên minh các thế lực lưu vong và lính đánh thuê tại Essos (dưới trướng Maelys the Monstrous - kẻ mang dòng máu Blackfyre cuối cùng) tấn công Stepstones. Westeros phái quân dẹp loạn.",
        keyFigures: ["Maelys Blackfyre", "Barristan Selmy", "Brynden Tully"]
    },
    {
        startYear: 282,
        endYear: 283,
        title: "Cuộc Nổi Loạn Của Robert (Robert's Rebellion / War of the Usurper)",
        description: "Rhaegar Targaryen bắt cóc (hoặc bỏ trốn cùng) Lyanna Stark. Vua Điên Aerys thiêu sống Lãnh chúa Rickard Stark. Robert Baratheon, Ned Stark, và Jon Arryn khởi binh lật đổ triều đại Targaryen kéo dài 3 thế kỷ.",
        keyFigures: ["Robert Baratheon", "Ned Stark", "Rhaegar Targaryen", "Aerys II (The Mad King)"]
    },
    {
        startYear: 289,
        endYear: 289,
        title: "Cuộc Nổi Loạn Greyjoy (Greyjoy Rebellion)",
        description: "Balon Greyjoy tự xưng Vua Quần Đảo Sắt, nổi dậy chống lại Ngôi Báu Sắt. Bị đánh bại bởi lực lượng liên hợp của Vua Robert và Lãnh chúa Ned Stark. Theon Greyjoy bị bắt làm con tin.",
        keyFigures: ["Balon Greyjoy", "Robert Baratheon", "Ned Stark", "Stannis Baratheon"]
    },
    {
        startYear: 298,
        endYear: 300,
        title: "Cuộc Chiến Năm Vị Vua (War of the Five Kings)",
        description: "Cái chết của Vua Robert gây ra cuộc nội chiến thảm khốc. Joffrey, Stannis, Renly cùng tranh Ngôi Báu Sắt, trong khi Robb Stark và Balon Greyjoy đòi độc lập. Cùng lúc, Daenerys nuôi lớn 3 con rồng ở Essos.",
        keyFigures: ["Robb Stark", "Joffrey Baratheon", "Stannis Baratheon", "Renly Baratheon", "Balon Greyjoy", "Tywin Lannister"]
    }
];

/**
 * Lấy bối cảnh lịch sử xung quanh năm hiện tại
 */
export function getTimelineContext(currentYear: number): string {
    const lines: string[] = [];
    
    // 1. Xác định Vua đang trị vì (nếu là AC)
    if (currentYear >= 1) {
        const monarch = MONARCHS.find(m => currentYear >= m.startYear && currentYear < m.endYear);
        if (monarch) {
            lines.push(`👑 VUA TRỊ VÌ TẠI NGÔI BÁU SẮT (Năm ${currentYear}): ${monarch.name} (Nhà ${monarch.house}).`);
        }
    }

    // 2. Sự kiện đang diễn ra
    const ongoing = TIMELINE.filter(e => currentYear >= e.startYear && (!e.endYear || currentYear <= e.endYear));
    if (ongoing.length > 0) {
        lines.push(`⚔️ SỰ KIỆN ĐANG DIỄN RA:`);
        ongoing.forEach(e => {
            lines.push(`  - ${e.title}: ${e.description} (Nhân vật trọng tâm: ${e.keyFigures?.join(', ') || 'Nhiều'})`);
        });
    }

    // 3. Sự kiện vừa kết thúc (Lịch sử gần - lấy 2 sự kiện gần nhất)
    const past = TIMELINE
        .filter(e => (e.endYear || e.startYear) < currentYear)
        .sort((a, b) => (b.endYear || b.startYear) - (a.endYear || a.startYear))
        .slice(0, 2);
        
    if (past.length > 0) {
        lines.push(`📜 BỐI CẢNH LỊCH SỬ GẦN:`);
        past.forEach(e => {
            const timeStr = e.endYear ? `(${e.startYear} - ${e.endYear})` : `(${e.startYear})`;
            lines.push(`  - ${e.title} ${timeStr}: ${e.description}`);
        });
    }

    return lines.join('\\n');
}
