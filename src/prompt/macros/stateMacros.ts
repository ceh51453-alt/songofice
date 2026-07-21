/**
 * Họ macro STATE của ST (3.1b.3) — cách preset MVU điều khiển biến:
 *   {{setvar::key::value}}  đặt biến ván     → vars.setChat (M4: bắc cầu MVU stat_data)
 *   {{getvar::key}}         đọc biến ván
 *   {{addvar::key::value}}  cộng dồn (số cộng số, chuỗi nối chuỗi)
 *   {{incvar::key}}/{{decvar::key}}  ±1, trả về giá trị mới
 *   {{setglobalvar}}/{{getglobalvar}} biến toàn cục xuyên chat
 *   {{var::key}} / {{var::key::value}}  scratch scope trong 1 lần build
 * setvar/addvar/setglobalvar trả về "" (đúng hành vi ST — ghi im lặng).
 */
import { registerMacro } from "../macroEngine";

export function registerStateMacros(): void {
  registerMacro("setvar", (args, ctx) => {
    const [key, ...rest] = args;
    if (!key) return "";
    ctx.vars.setChat(key.trim(), rest.join("::"));
    return "";
  });

  registerMacro("getvar", (args, ctx) => {
    const key = (args[0] ?? "").trim();
    return key ? ctx.vars.getChat(key) : "";
  });

  registerMacro("addvar", (args, ctx) => {
    const [key, ...rest] = args;
    if (!key) return "";
    ctx.vars.addChat(key.trim(), rest.join("::"));
    return "";
  });

  registerMacro("incvar", (args, ctx) => {
    const key = (args[0] ?? "").trim();
    if (!key) return "";
    ctx.vars.addChat(key, "1");
    return ctx.vars.getChat(key);
  });

  registerMacro("decvar", (args, ctx) => {
    const key = (args[0] ?? "").trim();
    if (!key) return "";
    ctx.vars.addChat(key, "-1");
    return ctx.vars.getChat(key);
  });

  registerMacro("setglobalvar", (args, ctx) => {
    const [key, ...rest] = args;
    if (!key) return "";
    ctx.vars.setGlobal(key.trim(), rest.join("::"));
    return "";
  });

  registerMacro("getglobalvar", (args, ctx) => {
    const key = (args[0] ?? "").trim();
    return key ? ctx.vars.getGlobal(key) : "";
  });

  registerMacro("addglobalvar", (args, ctx) => {
    const [key, ...rest] = args;
    if (!key) return "";
    ctx.vars.addGlobal(key.trim(), rest.join("::"));
    return "";
  });

  // {{var::key}} đọc scratch (fallback biến ván); {{var::key::value}} ghi scratch
  registerMacro("var", (args, ctx) => {
    const key = (args[0] ?? "").trim();
    if (!key) return "";
    if (args.length >= 2) {
      ctx.scratch.set(key, args.slice(1).join("::"));
      return "";
    }
    return ctx.scratch.get(key) ?? ctx.vars.getChat(key);
  });
}
