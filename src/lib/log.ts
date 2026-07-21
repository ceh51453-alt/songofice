/**
 * Logger có cấu trúc (mục 1 — "không console.log rải rác").
 * Bật/tắt verbose qua setVerbose (nối Settings > verbose logging).
 */
let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

export interface Logger {
  debug: (msg: string, data?: unknown) => void;
  info: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
}

function emit(level: "debug" | "info" | "warn" | "error", scope: string, msg: string, data?: unknown): void {
  if (level === "debug" && !verbose) return;
  const line = `[${scope}] ${msg}`;
  // eslint-disable-next-line no-console
  const fn = level === "debug" ? console.debug : console[level];
  if (data !== undefined) fn(line, data);
  else fn(line);
}

export function createLogger(scope: string): Logger {
  return {
    debug: (msg, data) => emit("debug", scope, msg, data),
    info: (msg, data) => emit("info", scope, msg, data),
    warn: (msg, data) => emit("warn", scope, msg, data),
    error: (msg, data) => emit("error", scope, msg, data),
  };
}

/** Mask API key khi log/hiển thị: 4 ký tự đầu + 4 cuối (mục 2.1/23). */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
