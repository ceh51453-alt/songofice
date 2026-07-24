const fs = require('fs');
let code = fs.readFileSync('src/mvu/schema.ts', 'utf8');

const dragonEggSchemaStr = `
/** Trứng rồng (Hóa đá, đang ấp, chuẩn bị nở) */
export const DragonEggSchema = z
  .object({
    "Tên": safeString().optional(),
    "Màu Sắc": safeString().prefault("Đen Tuyền"),
    "Nhiệt Độ": z.enum(["Nguội Lạnh", "Ấm", "Nóng Rực"]).catch("Nguội Lạnh").prefault("Nguội Lạnh"),
    "Tình Trạng": z.enum(["Hóa Đá", "Đang Ấp", "Nứt Vỏ"]).catch("Hóa Đá").prefault("Hóa Đá"),
    "Chủ Nhân": safeString().optional(),
    "Mô Tả": safeString().prefault("Một quả trứng to bằng đầu người."),
  })
  .prefault({});
export type DragonEgg = z.infer<typeof DragonEggSchema>;
`;

// Insert DragonEggSchema before DragonSchema
code = code.replace('/** Rồng (7.15) — hệ số phi đối xứng, gate theo Era. */', dragonEggSchemaStr + '\n/** Rồng (7.15) — hệ số phi đối xứng, gate theo Era. */');

const oldDragonSchemaStart = `    "Tên": safeString().prefault(""),
    "Kích Cỡ": z.enum(DRAGON_SIZES).catch("Non").prefault("Non"),
    "Kỵ Sĩ": safeString().optional(),`;

const newDragonSchemaStart = `    "Tên": safeString().prefault(""),
    "Kích Cỡ": z.enum(DRAGON_SIZES).catch("Non").prefault("Non"),
    "Kỵ Sĩ": safeString().optional(),
    "Độ Hảo Cảm": z.record(safeString(), clampedStat(0, 100, 0)).catch({}).prefault({}),
    "Mức Độ Thuần Hóa": clampedStat(0, 100, 0),
    "Trạng Thái Thu Phục": z.enum(["Hoang Dã", "Đang Cảm Hóa", "Đã Có Chủ"]).catch("Hoang Dã").prefault("Hoang Dã"),
    "Đặc Tính": z.array(z.enum(["Hung Dữ", "Hiền Hòa", "Lười Biếng", "Khát Máu", "Trung Thành", "Bất Trị"])).catch([]).prefault([]),
    "Đang Bị Xích": z.boolean().catch(false).prefault(false),
    "Nơi Ổ": safeString().optional(),`;

code = code.replace(oldDragonSchemaStart, newDragonSchemaStart);

const statDataInjection = `    // ── RỒNG (7.15) — gate theo Era; hệ số phi đối xứng vào chiến lực. ──
    "Rồng": z.record(safeString(), DragonSchema).catch({}).prefault({}),
    "Trứng Rồng": z.record(safeString(), DragonEggSchema).catch({}).prefault({}),`;

code = code.replace(`    // ── RỒNG (7.15) — gate theo Era; hệ số phi đối xứng vào chiến lực. ──
    "Rồng": z.record(safeString(), DragonSchema).catch({}).prefault({}),`, statDataInjection);

fs.writeFileSync('src/mvu/schema.ts', code);
console.log('Schema updated.');
