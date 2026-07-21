/**
 * Macro cơ bản bắt buộc (mục 3.2): char/user/persona/description/personality/
 * scenario/mesExamples/time/date/random/roll/lastMessage/newline/trim.
 * ({{// comment}} xử lý trong core resolver.)
 */
import { registerMacro, TRIM_SENTINEL } from "../macroEngine";

/** Roll xúc xắc dạng "d20", "2d6", "3d6+2", "d100-10". */
export function rollDice(notation: string, rng: () => number): number {
  const m = notation.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) throw new Error(`Ký hiệu xúc xắc không hợp lệ: "${notation}"`);
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    throw new Error(`Xúc xắc ngoài giới hạn: "${notation}"`);
  }
  let total = mod;
  for (let i = 0; i < count; i++) total += 1 + Math.floor(rng() * sides);
  return total;
}

export function registerCoreMacros(): void {
  registerMacro("char", (_a, ctx) => ctx.char);
  registerMacro("user", (_a, ctx) => ctx.user);
  registerMacro("persona", (_a, ctx) => ctx.persona);
  registerMacro("description", (_a, ctx) => ctx.description);
  registerMacro("personality", (_a, ctx) => ctx.personality);
  registerMacro("scenario", (_a, ctx) => ctx.scenario);
  registerMacro("mesExamples", (_a, ctx) => ctx.mesExamples);
  registerMacro("lastMessage", (_a, ctx) => ctx.lastMessage);
  registerMacro("time", (_a, ctx) => ctx.now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
  registerMacro("date", (_a, ctx) => ctx.now.toLocaleDateString("vi-VN"));
  registerMacro("newline", () => "\n");
  registerMacro("trim", () => TRIM_SENTINEL);

  // {{random:a,b,c}} hoặc {{random::a::b::c}} — chọn ngẫu nhiên 1 phương án
  registerMacro("random", (args, ctx) => {
    const options = args.length > 1 ? args : (args[0] ?? "").split(",");
    const cleaned = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleaned.length === 0) return "";
    return cleaned[Math.floor(ctx.rng() * cleaned.length)];
  });

  // {{roll:d20}} / {{roll::2d6+1}}
  registerMacro("roll", (args, ctx) => String(rollDice(args[0] ?? "d20", ctx.rng)));
}
