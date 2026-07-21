/**
 * MacroContext — mọi thứ macro cần khi render (3.1b.3 / 3.2).
 * Các field nhân vật/persona ở M2 có thể rỗng (character card tới ở M5) —
 * marker/macro render rỗng thì block bị bỏ qua, không lỗi.
 */
export interface VariableBridge {
  getChat: (key: string) => string;
  setChat: (key: string, value: string) => void;
  addChat: (key: string, delta: string) => void;
  getGlobal: (key: string) => string;
  setGlobal: (key: string, value: string) => void;
  addGlobal: (key: string, delta: string) => void;
}

export interface MacroContext {
  char: string;
  user: string;
  persona: string;
  description: string;
  personality: string;
  scenario: string;
  mesExamples: string;
  lastMessage: string;
  /** RNG 0..1 — inject seedable từ 5bis khi có (M4); mặc định Math.random. */
  rng: () => number;
  now: Date;
  vars: VariableBridge;
  /** Scratch scope 1 lần build ({{var::key}}) — tạo mới mỗi buildPrompt. */
  scratch: Map<string, string>;
  /** Cảnh báo gom trong lúc render (macro lạ...) — hiện ở Prompt Inspector. */
  warnings: string[];
}

export function makeEmptyMacroContext(partial?: Partial<MacroContext>): MacroContext {
  return {
    char: "",
    user: "",
    persona: "",
    description: "",
    personality: "",
    scenario: "",
    mesExamples: "",
    lastMessage: "",
    rng: Math.random,
    now: new Date(),
    vars: {
      getChat: () => "",
      setChat: () => {},
      addChat: () => {},
      getGlobal: () => "",
      setGlobal: () => {},
      addGlobal: () => {},
    },
    scratch: new Map(),
    warnings: [],
    ...partial,
  };
}
