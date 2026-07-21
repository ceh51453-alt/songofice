import { registerCoreMacros } from "./core";
import { registerStateMacros } from "./stateMacros";

let registered = false;

/** Đăng ký toàn bộ macro built-in — gọi 1 lần lúc khởi động (idempotent). */
export function registerBuiltinMacros(): void {
  if (registered) return;
  registerCoreMacros();
  registerStateMacros();
  registered = true;
}
