/**
 * Luồng Bắt Đầu Mới (8.3): chọn Era → 2 trục chế độ + độ khó → tuyến
 * (canon 8.4/8.4b hoặc wizard tự tạo 10 bước 8.5) → xác nhận → startGame (8.6).
 * Preview nhân vật cập nhật REALTIME bên cạnh wizard.
 */
import { useMemo, useRef, useState } from "react";
import { ERAS, ERAS_BY_ID, parseHookYear, type CanonCharacter, type StartingHook } from "../../content/westeros/eras";
import { humanAgeLabel } from "../../character/ageSystem";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { ORIGINS, ORIGINS_BY_ID } from "../../content/westeros/origins";
import { REGIONS } from "../../content/westeros/regions";
import { availableTalents, TALENTS_BY_ID, type TalentDef } from "../../content/westeros/talents";
import { availableSkills, type SkillDef } from "../../content/westeros/skills";
import { availableCrises } from "../../content/westeros/startingCrises";
import { COMPANIONS } from "../../content/westeros/companions";
import {
  getCalculatedBudgets, CORE_STATS, STAT_BASE, STAT_MAX_CREATE, STAT_MIN_CREATE, SKILL_MAX_CREATE,
  DRAGON_STAT_BASE, DRAGON_STAT_BUDGET, DRAGON_STAT_MAX_CREATE, DRAGON_STAT_MIN_CREATE,
  DRAGON_SKILL_BUDGET, DRAGON_SKILL_MAX_CREATE,
  buildStateFromCanon, buildStateFromWizard, flawRefund, pointBuySpent, resolveCrisisDesc, talentSlots,
  type Difficulty, type WizardData, type DragonWizardData,
} from "../../character/characterInit";
import { DRAGON_STATS, DRAGON_SKILLS, DRAGON_SIZES, RELIGIONS, PATRON_GODS, BLOODLINES, type DragonStat, type DragonSkill } from "../../mvu/schema";
import { startNewGame } from "../../character/startGame";
import { savePortrait } from "../../state/db";
import { CULTURES } from "../../content/westeros/cultures";
import { genId } from "../../lib/id";
import { useUiStore } from "../../state/uiStore";
import { CharacterPreview } from "./CharacterPreview";
import { StartingLocationMap } from "./StartingLocationMap";
import { AiWizardAssistant } from "./AiWizardAssistant";
import { AiCanonAssistant } from "./AiCanonAssistant";
import { CustomOriginEditor } from "./CustomOriginEditor";
import { WizardEquipment } from "./WizardEquipment";
import { GlassButton } from "../components/GlassButton";
import { GlassInput, GlassTextarea } from "../components/GlassInput";
import { IconCheck, IconChevronLeft, IconSpinner } from "../icons";
import type { CoreStat } from "../../content/westeros/skills";

type Stage = "era" | "modes" | "path" | "canon-char" | "canon-hook" | "canon-confirm" | `w${number}` | "starting";

const WIZARD_STEPS = 14;

function freshWizard(): WizardData {
  return {
    eraId: "", houseId: null, houseRole: "Trực hệ", originId: "",
    narrativeMode: "Diễn Giải Tự Do", scenarioMode: "Người Chơi Là Trung Tâm", difficulty: "Cân Bằng",
    continent: "Westeros", culture: "First Men", religion: "Thất Diện Thần", patronGod: "", bloodline: "none", startingLocation: "",
    name: "", age: 25, pointBuy: Object.fromEntries(CORE_STATS.map((s) => [s, STAT_BASE])) as Record<CoreStat, number>,
    talentIds: [], skillAllocations: {}, customForce: { npcs: [], units: [] }, familyMembers: [],
    persona: { ngoaiHinh: "", tinhCach: "", tieuSu: "", mauMat: "", mauToc: "", chieuCao: "" },
    crisisId: null, companionId: null, hookId: "ai-random",
    dragon: null,
    canonRelation: undefined,
    hasCustomTerritory: false,
    customTerritoryLevel: 1,
    customTerritoryName: "",
  };
}

function Card({ selected, onClick, children, disabled }: { selected?: boolean; onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`glass relative w-full px-4 py-3 pr-9 text-left transition-all hover:bg-[var(--glass-bg-hover)] disabled:opacity-35 disabled:pointer-events-none ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent),0_0_18px_-4px_var(--accent)]"
          : "hover:border-[var(--glass-border-bright)]"
      }`}
    >
      {/* dấu chọn rõ ràng — phản hồi thị giác không thể nhầm (6.4) */}
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)]">
          <IconCheck size={12} color="var(--accent-text)" strokeWidth={2.2} />
        </span>
      )}
      {children}
    </button>
  );
}

function StepHeader({ step, title, hint }: { step?: string; title: string; hint?: string }) {
  return (
    <div className="mb-4">
      {step && <span className="block text-[11px] tracking-[0.25em] text-[var(--text-faint)]">{step}</span>}
      <h2 className="font-display text-xl tracking-wide text-[var(--accent-text)]">{title}</h2>
      {hint && <span className="block mt-1 text-[13px] text-[var(--text-muted)]">{hint}</span>}
    </div>
  );
}

export function NewGameFlow() {
  const setScreen = useUiStore((s) => s.setScreen);
  const [stage, setStage] = useState<Stage>("era");
  const [wiz, setWiz] = useState<WizardData>(freshWizard);
  const [canonChar, setCanonChar] = useState<CanonCharacter | null>(null);
  const [customCanonChars, setCustomCanonChars] = useState<CanonCharacter[]>([]);
  const [canonHook, setCanonHook] = useState<StartingHook | null>(null);
  const [customStartYear, setCustomStartYear] = useState<number | undefined>(undefined);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [isMapOpen, setMapOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const era = wiz.eraId ? ERAS_BY_ID[wiz.eraId] : null;
  const origin = wiz.originId ? ORIGINS_BY_ID[wiz.originId] : null;
  const patch = (p: Partial<WizardData>) => setWiz((w) => ({ ...w, ...p }));

  // preview realtime (8.5) — dựng lại state nháp mỗi khi wizard đổi
  const previewState = useMemo(() => {
    if (!era || !origin || stage === "era" || stage === "modes" || stage === "path") return null;
    try {
      return buildStateFromWizard({ ...wiz, name: wiz.name || "(chưa đặt tên)" });
    } catch {
      return null;
    }
  }, [wiz, era, origin, stage]);

  const canonPreview = useMemo(() => {
    if (stage.startsWith("canon-")) {
      if (!canonChar) return null;
      return buildStateFromCanon(canonChar, era!, wiz, { hookId: canonHook?.id, customStartYear });
    }
    return null;
  }, [canonChar, era, wiz, canonHook, customStartYear, stage]);

  async function confirmAndStart() {
    if (!era) return;
    setStage("starting");
    try {
      let portraitKey: string | undefined;
      if (portraitFile) {
        portraitKey = await savePortrait(genId("portrait"), portraitFile);
      }
      if (canonChar) {
        const state = buildStateFromCanon(canonChar, era, wiz, { portraitKey, hookId: canonHook?.id, customStartYear });
        await startNewGame(state, era, canonHook, null);
      } else {
        const hook = era.startingHooks.find((h) => h.id === wiz.hookId) ?? null;
        const state = buildStateFromWizard({ ...wiz, portraitKey });
        await startNewGame(state, era, hook, resolveCrisisDesc(wiz.crisisId));
      }
      setScreen("game");
    } catch (e) {
      alert(`Không khởi tạo được ván: ${e instanceof Error ? e.message : String(e)}`);
      setStage(canonChar ? "canon-confirm" : "w11");
    }
  }

  // ─────────────────────────── các màn ───────────────────────────
  function renderStage(): React.ReactNode {
    switch (stage) {
      case "era":
        return (
          <div>
            <StepHeader title="Chọn Thời Kỳ" hint="Thời Kỳ quyết định nhân vật, Nhà và bối cảnh khả dụng." />
            <div className="grid gap-3 sm:grid-cols-2">
              {ERAS.map((e) => (
                <Card key={e.id} selected={wiz.eraId === e.id} onClick={() => { patch({ eraId: e.id }); setStage("modes"); }}>
                  <span className="font-display block text-[15px] text-[var(--text-soft)]">{e.name}</span>
                  <span className="text-[12px] text-[var(--accent-text)]">{e.yearRange}{e.hasMagic ? " · có yếu tố siêu nhiên" : ""}</span>
                  <span className="block mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">{e.blurb}</span>
                </Card>
              ))}
            </div>
          </div>
        );

      case "modes":
        return (
          <div className="space-y-5">
            <StepHeader title="Cách Kể Chuyện" hint="Hai trục độc lập — và độ khó khởi đầu." />
            <div>
              <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Chế độ tường thuật — bám văn bản gốc tới đâu?</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["Theo Sát Nguyên Tác", "Diễn Giải Tự Do"] as const).map((m) => (
                  <Card key={m} selected={wiz.narrativeMode === m} onClick={() => patch({ narrativeMode: m })}>
                    <span className="text-[14px] text-[var(--text-soft)]">{m}</span>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Hướng kịch bản — ai điều khiển bánh xe lịch sử?</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["Người Chơi Là Trung Tâm", "Người Chơi Là Bối Cảnh"] as const).map((m) => (
                  <Card key={m} selected={wiz.scenarioMode === m} onClick={() => patch({ scenarioMode: m })}>
                    <span className="text-[14px] text-[var(--text-soft)]">{m}</span>
                    <span className="block mt-0.5 text-[12px] text-[var(--text-faint)]">
                      {m === "Người Chơi Là Trung Tâm" ? "Canon uốn theo hành động của ngươi" : "Đại cục vẫn chảy theo quỹ đạo nguyên tác"}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Độ khó (quỹ điểm tạo nhân vật co giãn theo)</span>
              <div className="grid grid-cols-3 gap-2">
                {(["Nhàn Hạ", "Cân Bằng", "Chân Thực"] as Difficulty[]).map((m) => (
                  <Card key={m} selected={wiz.difficulty === m} onClick={() => patch({ difficulty: m })}>
                    <span className="block text-[15px] font-medium text-[var(--text-bright)]">{m}</span>
                    <span className="block text-[11px] text-[var(--text-faint)]">{getCalculatedBudgets(m, wiz.age).pointBuy} điểm · {getCalculatedBudgets(m, wiz.age).skillPoints} kỹ năng</span>
                  </Card>
                ))}
              </div>
            </div>
            <NavButtons onBack={() => setStage("era")} onNext={() => setStage("path")} />
          </div>
        );

      case "path": {
        const hasCanon = (era?.canonCharacters.length ?? 0) > 0;
        return (
          <div>
            <StepHeader title="Chọn Tuyến Nhân Vật" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Card disabled={!hasCanon} onClick={() => setStage("canon-char")}>
                <span className="font-display block text-[15px] text-[var(--text-soft)]">Đóng Vai Nhân Vật Có Sẵn</span>
                <span className="block mt-1 text-[12.5px] text-[var(--text-muted)]">
                  {hasCanon ? `Nhập vai nhân vật canon đã thành hình — chỉ số đúng nguyên tác (${era!.canonCharacters.length} nhân vật)` : "Era này không có roster canon"}
                </span>
              </Card>
              <Card onClick={() => setStage("w1")}>
                <span className="font-display block text-[15px] text-[var(--accent-text)]">Tự Tạo Nhân Vật</span>
                <span className="block mt-1 text-[12.5px] text-[var(--text-muted)]">Wizard đầy đủ: xuất thân, point-buy, thiên phú, kỹ năng, khủng hoảng...</span>
              </Card>
            </div>
            <NavButtons onBack={() => setStage("modes")} />
          </div>
        );
      }

      case "canon-char":
        return (
          <div>
            <StepHeader title="Chọn Nhân Vật Canon" hint={era?.name} />
            <div className="grid gap-3 sm:grid-cols-2">
              {era?.canonCharacters.map((c) => {
                const hookYear = parseHookYear(null, era?.startYear ?? 0);
                const notBorn = c.birthYear !== undefined && c.birthYear > hookYear;
                const displayAge = c.birthYear !== undefined ? Math.max(0, hookYear - c.birthYear) : c.age;
                return (
                <Card key={c.id} selected={canonChar?.id === c.id} onClick={() => { setCanonChar(c); setCanonHook(null); setCustomStartYear(undefined); setStage("canon-hook"); }}>
                  <span className="font-display block text-[15px] text-[var(--text-soft)]">{c.name}</span>
                  <span className="text-[12px] text-[var(--accent-text)]">
                    Nhà {c.house} · {c.role} · {notBorn
                      ? <span className="text-amber-400">chưa sinh (sinh năm {c.birthYear} AC)</span>
                      : `${displayAge} tuổi`}
                  </span>
                  <span className="block mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">{c.blurb}</span>
                </Card>
                );
              })}
              {customCanonChars.map((c) => (
                <Card key={c.id} selected={canonChar?.id === c.id} onClick={() => { setCanonChar(c); setCanonHook(null); setCustomStartYear(undefined); setStage("canon-hook"); }}>
                  <span className="font-display block text-[15px] text-[var(--text-soft)]">{c.name} <span className="text-[10px] text-[var(--accent)] border border-[var(--accent-border)] rounded-sm px-1 py-0.5 ml-1 bg-[rgba(234,179,8,0.1)]">AI Tự Tạo</span></span>
                  <span className="text-[12px] text-[var(--accent-text)]">
                    Nhà {c.house} · {c.role} · {c.age} tuổi
                  </span>
                  <span className="block mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">{c.blurb}</span>
                </Card>
              ))}
            </div>
            
            {era && (
              <AiCanonAssistant 
                era={era} 
                onGenerated={(char) => {
                  setCustomCanonChars((prev) => [...prev, char]);
                  setCanonChar(char);
                  setCanonHook(null);
                }} 
              />
            )}
            
            <NavButtons onBack={() => setStage("path")} />
          </div>
        );

      case "canon-hook": {
        const eraHooks = era?.startingHooks.filter((h) => canonChar?.startingHookIds.includes(h.id)) ?? [];
        const personalHooks = canonChar?.personalHooks ?? [];
        const allHooks = [...eraHooks, ...personalHooks];
        
        // Setup year slider bounds
        const defaultStartYear = era?.startYear ?? 0;
        const minYear = canonChar?.birthYear !== undefined ? canonChar.birthYear + 14 : (era?.startYear ?? 0);
        const maxYear = canonChar?.deathYear !== undefined ? canonChar.deathYear : (minYear + 80);
        
        return (
          <div>
            <StepHeader title="Chọn Điểm Bắt Đầu" hint={canonChar?.name} />
            <div className="space-y-2.5">
              {allHooks.length === 0 && (
                <Card selected={canonHook === null && customStartYear === undefined} onClick={() => { setCanonHook(null); setCustomStartYear(undefined); setStage("canon-confirm"); }}>
                  <span className="text-[14px] text-[var(--text-soft)]">Bắt đầu ở tình trạng mặc định</span>
                  <span className="block mt-0.5 text-[12.5px] text-[var(--text-muted)]">Tiếp nối bối cảnh và mốc thời gian gốc của nhân vật trong kỷ nguyên này.</span>
                </Card>
              )}
              {allHooks.map((h) => (
                <Card key={h.id} selected={canonHook?.id === h.id} onClick={() => { setCanonHook(h); setCustomStartYear(h.numericYear ?? parseHookYear(h, defaultStartYear)); setStage("canon-confirm"); }}>
                  <span className="text-[14px] text-[var(--text-soft)]">{h.title}</span>
                  <span className="ml-2 text-[12px] text-[var(--accent-text)]">{h.year}</span>
                  <span className="block mt-0.5 text-[12.5px] text-[var(--text-muted)]">{h.desc}</span>
                </Card>
              ))}

              {canonChar?.birthYear !== undefined && (
                <div className="p-4 border border-[var(--border)] rounded-md bg-[var(--surface-bg)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[14px] text-[var(--text-soft)]">Hoặc chọn năm bắt đầu tuỳ chỉnh:</span>
                    <span className="text-[14px] text-[var(--accent-text)] font-semibold">{customStartYear ?? defaultStartYear} AC</span>
                  </div>
                  <input 
                    type="range" 
                    min={minYear} 
                    max={maxYear} 
                    value={customStartYear ?? defaultStartYear}
                    onChange={(e) => {
                      setCustomStartYear(parseInt(e.target.value));
                      setCanonHook(null);
                    }}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-[12px] text-[var(--text-muted)]">
                    <span>{minYear} AC</span>
                    <span>{maxYear} AC</span>
                  </div>
                  <button 
                    className="mt-3 w-full py-2 bg-[var(--accent)]/10 text-[var(--accent-text)] text-[13px] rounded hover:bg-[var(--accent)]/20 transition-colors"
                    onClick={() => { setStage("canon-confirm"); }}
                  >
                    Bắt đầu ở năm {customStartYear ?? defaultStartYear} AC
                  </button>
                </div>
              )}
            </div>
            <NavButtons onBack={() => setStage("canon-char")} />
          </div>
        );
      }

      case "canon-confirm":
        return (
          <div>
            <StepHeader title="Xác Nhận" hint={`${canonChar?.name} — ${canonHook?.title}`} />
            {canonPreview && <CharacterPreview state={canonPreview} />}
            <div className="mt-4 flex gap-2">
              <GlassButton onClick={() => setStage("canon-hook")}>
                <IconChevronLeft size={14} /> Lùi
              </GlassButton>
              <GlassButton variant="accent" className="flex-1" onClick={() => void confirmAndStart()}>
                Bước Vào Loạn Thế
              </GlassButton>
            </div>
          </div>
        );

      case "starting":
        return (
          <div className="flex flex-col items-center gap-3 py-16 text-[var(--text-muted)]">
            <IconSpinner size={22} />
            <span className="block font-display tracking-wide">Đang dệt câu chuyện của ngươi...</span>
          </div>
        );

      default:
        const stepNameMap: Record<string, string> = {
          "w1": "Nhà & Xuất Thân",
          "w2": "Huyết Thống & Đặc Quyền",
          "w3": "Tên & Tuổi",
          "w4": "Phân Bổ Chỉ Số",
          "w5": "Thiên Phú & Khiếm Khuyết",
          "w6": "Kỹ Năng Khởi Đầu",
          "w7": "Thế Lực Tuỳ Tùng",
          "w8": "Nhân Dạng & Tiểu Sử",
          "w9": "Khủng Hoảng Khởi Đầu",
          "w10": "Một Tâm Phúc Khởi Đầu",
          "w11": "Điểm Bắt Đầu",
          "w12": "Cuộn Giấy Vận Mệnh"
        };
        const currentStepName = stepNameMap[stage as string];

        return (
          <div className="flex flex-col">
            {renderWizardStep()}
            {isWizard && currentStepName && stage !== "w12" && (
              <AiWizardAssistant
                currentData={wiz}
                stepName={currentStepName}
                onApplyPatch={patch}
              />
            )}
          </div>
        );
    }
  }

  // ─────────────────────────── wizard 10 bước ───────────────────────────
  function renderWizardStep(): React.ReactNode {
    const stepNum = Number(String(stage).slice(1));
    const back = () => {
      let prev = stepNum - 1;
      if (prev === 6 && !(era?.hasMagic)) prev = 5;
      setStage(prev === 0 ? "path" : (`w${prev}` as Stage));
    };
    const next = () => {
      let n = stepNum + 1;
      if (n === 6 && !(era?.hasMagic)) n = 7;
      setStage(`w${n}` as Stage);
    };
    const stepLabel = `TỰ TẠO NHÂN VẬT — BƯỚC ${stepNum}/${WIZARD_STEPS}`;

    switch (stepNum) {
      case 1: {
        return (
          <div>
            <StepHeader step={stepLabel} title="Nhà & Xuất Thân" hint="Xuất thân là 'class nền' — bonus chỉ số, kỹ năng, gói tài sản thật." />
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div>
                <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Lục Địa</span>
                <div className="flex gap-2">
                  <Card selected={wiz.continent === "Westeros"} onClick={() => patch({ continent: "Westeros" })}>
                    <span className="text-[13px]">Westeros</span>
                  </Card>
                  <Card selected={wiz.continent === "Essos"} onClick={() => patch({ continent: "Essos" })}>
                    <span className="text-[13px]">Essos</span>
                  </Card>
                </div>
              </div>
              <div>
                <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Văn Hoá & Tôn Giáo</span>
                <div className="space-y-2">
                  <select
                    className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)] mb-2"
                    value={wiz.culture}
                    onChange={(e) => {
                      const selCulture = CULTURES.find(c => c.id === e.target.value);
                      patch({
                        culture: e.target.value,
                        ...(selCulture?.defaultReligion && (!wiz.religion || wiz.religion === "Khác...") ? { religion: selCulture.defaultReligion } : {})
                      });
                    }}
                  >
                    {CULTURES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[var(--bg-panel)]">{c.name}</option>
                    ))}
                  </select>
                  {CULTURES.find(c => c.id === wiz.culture) && (
                    <div className="text-[12px] text-[var(--text-dim)] mb-2 px-1">
                      Buff: {Object.entries(CULTURES.find(c => c.id === wiz.culture)?.statBonus || {}).map(([k, v]) => `${k} +${v}`).join(", ")}
                    </div>
                  )}
                  <select
                    className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                    value={RELIGIONS.includes(wiz.religion as any) ? wiz.religion : (wiz.religion ? "Khác..." : "")}
                    onChange={(e) => {
                      if (e.target.value === "Khác...") patch({ religion: "", patronGod: "" });
                      else patch({ religion: e.target.value, patronGod: "" });
                    }}
                  >
                    <option value="" disabled className="bg-[var(--bg-panel)]">Chọn Tôn Giáo...</option>
                    {RELIGIONS.map((r) => (
                      <option key={r} value={r} className="bg-[var(--bg-panel)]">{r}</option>
                    ))}
                  </select>
                  {!RELIGIONS.includes(wiz.religion as any) && (
                    <GlassInput placeholder="Nhập tôn giáo tuỳ chỉnh..." value={wiz.religion} onChange={(e) => patch({ religion: e.target.value, patronGod: "" })} />
                  )}
                  {PATRON_GODS[wiz.religion] && (
                    <div className="mt-3">
                      <span className="block mb-1 text-[12px] text-[var(--text-muted)]">Thần Bảo Hộ (Buff Chỉ Số)</span>
                      <select
                        className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                        value={wiz.patronGod}
                        onChange={(e) => patch({ patronGod: e.target.value })}
                      >
                        <option value="" disabled className="bg-[var(--bg-panel)]">Chọn Thần Bảo Hộ...</option>
                        {PATRON_GODS[wiz.religion].map((god) => (
                          <option key={god.id} value={god.name} className="bg-[var(--bg-panel)]">
                            {god.name}
                          </option>
                        ))}
                      </select>
                      {wiz.patronGod && (
                        <div className="mt-1.5 text-[11px] text-[var(--text-muted)] italic">
                          {PATRON_GODS[wiz.religion].find(g => g.name === wiz.patronGod)?.desc}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Huyết Mạch</span>
                <select
                  className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                  value={wiz.bloodline}
                  onChange={(e) => patch({ bloodline: e.target.value })}
                >
                  {BLOODLINES.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[var(--bg-panel)]">{b.name}</option>
                  ))}
                </select>
                {wiz.bloodline !== "none" && (
                  <div className="mt-1.5 text-[11px] text-[var(--accent-text)] italic">
                    {BLOODLINES.find(b => b.id === wiz.bloodline)?.desc}
                  </div>
                )}
              </div>
            </div>

            <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Nhà / Thế Lực</span>
            <div className="mb-4 flex flex-wrap gap-2">
              <Card selected={wiz.houseId === null} onClick={() => patch({ houseId: null })}>
                <span className="text-[13px]">Không thuộc Nhà lớn</span>
              </Card>
              {(() => {
                const essosIds = ["targaryen-essos", "dothraki", "braavos", "mercenary", "ghiscar", "qarth", "free-cities"];
                const baseIds = era?.availableHouses ?? [];
                const renderIds = wiz.continent === "Westeros" 
                  ? [...baseIds.filter((id) => !essosIds.includes(id)), "custom"]
                  : [...baseIds.filter((id) => id === "targaryen"), ...essosIds, "custom"];
                return renderIds.map((hid) => {
                  const h = HOUSES_BY_ID[hid];
                  if (!h) return null;
                  return (
                    <Card key={hid} selected={wiz.houseId === hid} onClick={() => patch({ houseId: hid })}>
                      <span className="text-[13px]" style={{ color: h.themeColor.primary }}>{h.name}</span>
                    </Card>
                  );
                });
              })()}
            </div>
            
            {wiz.houseId && (
              <div className="mb-4 glass p-3 space-y-3">
                <span className="block text-[13px] text-[var(--text-muted)] border-b border-[var(--glass-border)] pb-1">Vị Thế Trong Nhà</span>
                <div className="flex gap-2">
                  {(["Trực hệ", "Nhánh phụ", "Bề tôi", "Kẻ đánh thuê"] as const).map(role => (
                    <Card key={role} selected={wiz.houseRole === role} onClick={() => patch({ houseRole: role })}>
                      <span className="text-[13px]">{role}</span>
                    </Card>
                  ))}
                </div>
                {(wiz.houseRole === "Trực hệ" || wiz.houseRole === "Nhánh phụ") && (
                  <div className="pt-2 border-t border-[var(--glass-border)]">
                    <span className="block mb-1.5 text-[12px] text-[var(--text-muted)]">Quan Hệ Với Nhân Vật Nguyên Tác (Tuỳ chọn)</span>
                    <div className="flex gap-2">
                      <select
                        className="glass flex-1 px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                        value={wiz.canonRelation?.characterId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            patch({ canonRelation: undefined });
                          } else {
                            patch({ canonRelation: { characterId: val, relation: wiz.canonRelation?.relation || "" } });
                          }
                        }}
                      >
                        <option value="" className="bg-[var(--bg-panel)]">Không có quan hệ đặc biệt</option>
                        {era?.canonCharacters.map(c => (
                          <option key={c.id} value={c.id} className="bg-[var(--bg-panel)]">{c.name} ({c.house})</option>
                        ))}
                      </select>
                      {wiz.canonRelation && (
                        <GlassInput 
                          placeholder="Vai vế (VD: Anh trai, Kẻ thù...)" 
                          value={wiz.canonRelation.relation} 
                          onChange={(e) => patch({ canonRelation: { ...wiz.canonRelation!, relation: e.target.value } })} 
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {wiz.houseId === "custom" && (
              <div className="glass p-3 mb-4 space-y-3">
                <span className="block text-[13px] text-[var(--text-muted)] border-b border-[var(--glass-border)] pb-1 mb-2">Tùy Chỉnh Thế Lực</span>
                <GlassInput placeholder="Tên Gia Tộc / Thế Lực" value={wiz.customHouseName || ""} onChange={(e) => patch({ customHouseName: e.target.value })} />
                <GlassInput placeholder="Khẩu Hiệu (Ví dụ: Lửa và Máu)" value={wiz.customHouseWords || ""} onChange={(e) => patch({ customHouseWords: e.target.value })} />
                <div>
                  <span className="block mb-1 text-[12px] text-[var(--text-muted)]">Gia Huy (Tùy chọn)</span>
                  <div className="flex gap-2">
                    {wiz.customHouseSigilKey ? (
                      <div className="relative w-12 h-12 bg-black/40 rounded border border-[var(--accent)] overflow-hidden">
                        <img src={`/api/portrait/${wiz.customHouseSigilKey}`} alt="Sigil" className="w-full h-full object-cover" />
                        <button onClick={() => patch({ customHouseSigilKey: undefined })} className="absolute top-0 right-0 bg-red-500/80 text-white w-4 h-4 text-[10px] flex items-center justify-center hover:bg-red-500">×</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-dashed border-[var(--glass-border-bright)] rounded px-3 py-1.5 text-[12px] text-[var(--text-soft)] transition-colors">
                        Tải ảnh lên...
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const key = "sigil_" + genId();
                          await savePortrait(key, file);
                          patch({ customHouseSigilKey: key });
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            <span className="block mb-1.5 text-[13px] text-[var(--text-muted)]">Xuất thân</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {ORIGINS.filter((o) => {
                const essosOrigins = ["dothraki-rider", "braavosi-bravo", "magister-heir"];
                const westerosOnly = ["north-clansman", "ironborn-reaver", "wildling"];
                if (wiz.continent === "Westeros" && essosOrigins.includes(o.id)) return false;
                if (wiz.continent === "Essos" && westerosOnly.includes(o.id)) return false;
                return true;
              }).map((o) => (
                <Card key={o.id} selected={wiz.originId === o.id} onClick={() => patch({ originId: o.id })}>
                  <span className="text-[14px] text-[var(--text-soft)]">{o.name} <span className="text-[12px] opacity-70">[{o.tuocVi}]</span></span>
                  <span className="block mt-0.5 text-[12px] leading-relaxed text-[var(--text-faint)]">{o.desc}</span>
                  <span className="block mt-1 text-[11.5px] text-[var(--accent-text)]">
                    {Object.entries(o.statBonus).map(([s, v]) => `${s} +${v}`).join(", ")} · {o.assets.moTa.split(":")[0]}
                  </span>
                </Card>
              ))}
              <Card selected={wiz.originId === "custom"} onClick={() => patch({ originId: "custom" })}>
                <span className="text-[14px] text-[var(--accent-text)]">Tùy Chỉnh (Tạo bằng AI)</span>
                <span className="block mt-0.5 text-[12px] leading-relaxed text-[var(--text-faint)]">
                  {wiz.customOrigin ? wiz.customOrigin.desc : "Hãy dùng Trợ lý AI bên dưới để tạo chi tiết xuất thân của bạn."}
                </span>
                {wiz.customOrigin && (
                  <span className="block mt-1 text-[11.5px] text-[var(--accent-text)]">
                    {wiz.customOrigin.name} · {Object.entries(wiz.customOrigin.statBonus || {}).map(([s, v]) => `${s} +${v}`).join(", ")}
                  </span>
                )}
              </Card>
            </div>
            
            {wiz.originId === "custom" && (
              <CustomOriginEditor
                origin={wiz.customOrigin}
                onChange={(o) => patch({ customOrigin: o })}
              />
            )}

            {/* ── Tuổi ── */}
            <span className="block mb-1.5 mt-4 text-[13px] text-[var(--text-muted)]">Tuổi</span>
            <div className="glass flex items-center gap-3 px-4 py-3">
              <input
                type="range" min={6} max={70} value={wiz.age}
                onChange={(e) => patch({ age: parseInt(e.target.value, 10) })}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="min-w-[52px] text-right font-mono text-[15px] text-[var(--text-soft)]">{wiz.age} tuổi</span>
            </div>
            <span className="block mt-1 text-[12px] text-[var(--accent-text)]">
              {humanAgeLabel(wiz.age)}
            </span>

            {/* ── Nơi Bắt Đầu ── */}
            <span className="block mb-1.5 mt-4 text-[13px] text-[var(--text-muted)]">Nơi Bắt Đầu Khởi Nghiệp</span>
            <div className="glass p-3 mb-4 space-y-3">
              <div className="flex gap-2 items-center">
                <select
                  value={wiz.startingLocation || ""}
                  onChange={(e) => patch({ startingLocation: e.target.value })}
                  className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1.5 flex-1"
                >
                  <option value="">(Mặc định theo Kịch Bản)</option>
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <GlassButton
                  onClick={() => setMapOpen(!isMapOpen)}
                  className="px-3 py-1.5 text-[12px]"
                >
                  {isMapOpen ? "Đóng Bản Đồ" : "Chọn trên Bản Đồ"}
                </GlassButton>
              </div>
              {isMapOpen && (
                <StartingLocationMap
                  selectedLocation={wiz.startingLocation || ""}
                  onSelect={(id) => patch({ startingLocation: id })}
                />
              )}
            </div>

            <NavButtons onBack={back} onNext={wiz.originId ? next : undefined} blockedReason="Hãy chọn một Xuất Thân" />
          </div>
        );
      }

      case 2: {
        const BUDGET_GOLD = 5000;
        const UNIT_COSTS: Record<string, number> = {
          "Bộ Binh": 300, "Trường Thương": 350, "Kỵ Binh": 800, 
          "Kỵ Binh Nhẹ": 600, "Cung Thủ": 400, "Công Thành": 1000, "Lính Đánh Thuê": 500
        };
        const NPC_COST = 500;
        
        const forces = wiz.customForce || { npcs: [], units: [] };
        const spent = forces.npcs.length * NPC_COST + forces.units.reduce((s, u) => s + (UNIT_COSTS[u.type] || 300) * (u.count / 1000), 0);
        
        const addNpc = () => {
          if (spent + NPC_COST > BUDGET_GOLD) return;
          patch({ customForce: { ...forces, npcs: [...forces.npcs, { 
            id: genId(), name: "NPC Mới", role: "Tướng Lĩnh", statPreset: "Cân Bằng",
            nangLuc: { voLuc: 14, thongSoai: 16, triMuu: 12, ngoaiGiao: 10 },
            tuoi: 30, netTinhCach: "Trung Thành",
            gioiTinh: "Nam", loai: "Người", thanHinh: "", nsfw: ""
          }] } });
        };
        const removeNpc = (id: string) => patch({ customForce: { ...forces, npcs: forces.npcs.filter(n => n.id !== id) } });
        const updateNpc = (id: string, data: any) => patch({ customForce: { ...forces, npcs: forces.npcs.map(n => n.id === id ? { ...n, ...data } : n) } });

        const addUnit = () => {
          patch({ customForce: { ...forces, units: [...forces.units, { id: genId(), type: "Bộ Binh", count: 1000, commander: "" }] } });
        };
        const removeUnit = (id: string) => patch({ customForce: { ...forces, units: forces.units.filter(u => u.id !== id) } });
        const updateUnit = (id: string, data: any) => patch({ customForce: { ...forces, units: forces.units.map(u => u.id === id ? { ...u, ...data } : u) } });

        const addFamilyMember = () => {
          patch({ familyMembers: [...(wiz.familyMembers || []), { 
            id: genId(), name: "", relation: "Anh em", age: 20, 
            gioiTinh: "Nam", loai: "Người", nsfw: "",
            nangLuc: { voLuc: 10, thongSoai: 10, triMuu: 10, ngoaiGiao: 10 },
            persona: { ngoaiHinh: "", tinhCach: "" } 
          }] });
        };
        const updateFamily = (id: string, data: any) => {
          patch({ familyMembers: (wiz.familyMembers || []).map(m => m.id === id ? { ...m, ...data } : m) });
        };
        const removeFamily = (id: string) => {
          patch({ familyMembers: (wiz.familyMembers || []).filter(m => m.id !== id) });
        };

        return (
          <div>
            <StepHeader step={stepLabel} title="Tông Tộc & Thế Lực" hint={wiz.houseId === "custom" ? `Ngân sách thế lực: ${BUDGET_GOLD - spent}/${BUDGET_GOLD} Vàng` : "Thiết lập các thành viên trong gia đình bạn."} />
            <div className="space-y-4">
              
              {/* Gia Đình & Người Thân */}
              <div>
                <div className="flex justify-between items-center mb-2 border-b border-[var(--glass-border)] pb-1">
                  <span className="text-[13px] text-[var(--text-muted)] font-medium">Người Thân / Gia Đình</span>
                  <GlassButton size="sm" onClick={addFamilyMember}>+ Thêm Người Thân</GlassButton>
                </div>
                <div className="space-y-2">
                  {(wiz.familyMembers || []).map(m => (
                    <div key={m.id} className="glass p-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input type="text" placeholder="Họ Tên" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1" value={m.name} onChange={e => updateFamily(m.id, { name: e.target.value })} />
                        <input type="text" placeholder="Vai vế (Vợ, Con, ...)" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-1/4" value={m.relation} onChange={e => updateFamily(m.id, { relation: e.target.value })} />
                        <select className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-20" value={m.gioiTinh || "Nam"} onChange={e => updateFamily(m.id, { gioiTinh: e.target.value })}>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] text-[var(--text-muted)]">Tuổi:</span>
                          <input type="number" min="0" max="100" placeholder="Tuổi" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-12" value={m.age} onChange={e => updateFamily(m.id, { age: parseInt(e.target.value) || 0 })} />
                        </div>
                        <button onClick={() => removeFamily(m.id)} className="text-red-400 hover:text-red-300 ml-auto">×</button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input type="text" placeholder="Loài (VD: Người, Tiên...)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-1/4" value={m.loai || ""} onChange={e => updateFamily(m.id, { loai: e.target.value })} />
                        <input type="text" placeholder="Thân Hình / Ngoại Hình" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1" value={m.persona.ngoaiHinh} onChange={e => updateFamily(m.id, { persona: { ...m.persona, ngoaiHinh: e.target.value } })} />
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Võ:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={m.nangLuc?.voLuc ?? 10} onChange={e => updateFamily(m.id, { nangLuc: { ...(m.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), voLuc: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Thống:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={m.nangLuc?.thongSoai ?? 10} onChange={e => updateFamily(m.id, { nangLuc: { ...(m.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), thongSoai: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Trí:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={m.nangLuc?.triMuu ?? 10} onChange={e => updateFamily(m.id, { nangLuc: { ...(m.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), triMuu: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Ngoại:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={m.nangLuc?.ngoaiGiao ?? 10} onChange={e => updateFamily(m.id, { nangLuc: { ...(m.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), ngoaiGiao: parseInt(e.target.value)||0 } })} /></div>
                        <input type="text" placeholder="Tính cách" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-0.5 flex-1 min-w-[120px]" value={m.persona.tinhCach} onChange={e => updateFamily(m.id, { persona: { ...m.persona, tinhCach: e.target.value } })} />
                      </div>
                      <textarea placeholder="Thông tin NSFW / Sở thích ẩn (Dành cho AI)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-full text-[var(--text-soft)] h-12 resize-none" value={m.nsfw || ""} onChange={e => updateFamily(m.id, { nsfw: e.target.value })} />
                    </div>
                  ))}
                  {(wiz.familyMembers || []).length === 0 && <span className="text-[12px] text-[var(--text-faint)] block italic">Chưa có người thân nào</span>}
                </div>
              </div>

              {wiz.houseId === "custom" && (
                <>
              {/* Đạo Quân */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-[var(--text-muted)]">Quân Đội (Vàng / 1000 lính)</span>
                  <GlassButton size="sm" onClick={addUnit}>+ Thêm Đạo Quân</GlassButton>
                </div>
                <div className="space-y-2">
                  {forces.units.map(u => {
                    const cost = (UNIT_COSTS[u.type] || 300) * (u.count / 1000);
                    return (
                      <div key={u.id} className="glass p-3 flex flex-wrap gap-2 items-center">
                        <select className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1" value={u.type} onChange={e => updateUnit(u.id, { type: e.target.value })}>
                          {Object.keys(UNIT_COSTS).map(t => <option key={t} value={t} className="bg-[var(--bg-panel)]">{t}</option>)}
                        </select>
                        <input type="number" min="100" step="100" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-24" value={u.count} onChange={e => updateUnit(u.id, { count: parseInt(e.target.value) || 0 })} />
                        <span className="text-[12px] text-[var(--text-faint)]">lính</span>
                        <input type="text" placeholder="Tên Chỉ huy" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1 min-w-[120px]" value={u.commander} onChange={e => updateUnit(u.id, { commander: e.target.value })} />
                        <span className="text-[12px] text-[var(--accent-text)]">{cost} V</span>
                        <button onClick={() => removeUnit(u.id)} className="text-red-400 hover:text-red-300 ml-2">×</button>
                      </div>
                    );
                  })}
                  {forces.units.length === 0 && <span className="text-[12px] text-[var(--text-faint)] block italic">Chưa có đạo quân nào</span>}
                </div>
              </div>

              {/* Gia Thần / NPC */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-[var(--text-muted)]">Gia Thần / Tướng Lĩnh ({NPC_COST} Vàng/người)</span>
                  <GlassButton size="sm" onClick={addNpc} disabled={spent + NPC_COST > BUDGET_GOLD}>+ Thêm NPC</GlassButton>
                </div>
                <div className="space-y-2">
                  {forces.npcs.map(n => (
                    <div key={n.id} className="glass p-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input type="text" placeholder="Tên NPC" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-1/3" value={n.name} onChange={e => updateNpc(n.id, { name: e.target.value })} />
                        <select className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1" value={n.role} onChange={e => updateNpc(n.id, { role: e.target.value })}>
                          <option value="Tướng Lĩnh" className="bg-[var(--bg-panel)]">Tướng Lĩnh</option>
                          <option value="Học Sĩ" className="bg-[var(--bg-panel)]">Học Sĩ</option>
                          <option value="Hiệp Sĩ" className="bg-[var(--bg-panel)]">Hiệp Sĩ</option>
                          <option value="Cố Vấn" className="bg-[var(--bg-panel)]">Cố Vấn</option>
                        </select>
                        <select className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-20" value={n.gioiTinh || "Nam"} onChange={e => updateNpc(n.id, { gioiTinh: e.target.value })}>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] text-[var(--text-muted)]">Tuổi:</span>
                          <input type="number" min="0" max="100" placeholder="Tuổi" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-12" value={n.tuoi || 30} onChange={e => updateNpc(n.id, { tuoi: parseInt(e.target.value) || 0 })} />
                        </div>
                        <button onClick={() => removeNpc(n.id)} className="text-red-400 hover:text-red-300 ml-auto">×</button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input type="text" placeholder="Loài (VD: Người, Tiên...)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-1/4" value={n.loai || ""} onChange={e => updateNpc(n.id, { loai: e.target.value })} />
                        <input type="text" placeholder="Thân Hình / Ngoại Hình" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1" value={n.thanHinh || ""} onChange={e => updateNpc(n.id, { thanHinh: e.target.value })} />
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Võ:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={n.nangLuc?.voLuc ?? 10} onChange={e => updateNpc(n.id, { nangLuc: { ...(n.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), voLuc: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Thống:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={n.nangLuc?.thongSoai ?? 10} onChange={e => updateNpc(n.id, { nangLuc: { ...(n.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), thongSoai: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Trí:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={n.nangLuc?.triMuu ?? 10} onChange={e => updateNpc(n.id, { nangLuc: { ...(n.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), triMuu: parseInt(e.target.value)||0 } })} /></div>
                        <div className="flex items-center gap-1"><span className="text-[11px] text-[var(--text-muted)]">Ngoại:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-0.5 w-10" value={n.nangLuc?.ngoaiGiao ?? 10} onChange={e => updateNpc(n.id, { nangLuc: { ...(n.nangLuc || {voLuc:10,thongSoai:10,triMuu:10,ngoaiGiao:10}), ngoaiGiao: parseInt(e.target.value)||0 } })} /></div>
                        <input type="text" placeholder="Tính cách" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-0.5 flex-1 min-w-[120px]" value={n.netTinhCach || ""} onChange={e => updateNpc(n.id, { netTinhCach: e.target.value })} />
                      </div>
                      <textarea placeholder="Thông tin NSFW / Sở thích ẩn (Dành cho AI)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-full text-[var(--text-soft)] h-12 resize-none" value={n.nsfw || ""} onChange={e => updateNpc(n.id, { nsfw: e.target.value })} />
                    </div>
                  ))}
                  {forces.npcs.length === 0 && <span className="text-[12px] text-[var(--text-faint)] block italic">Chưa có thủ hạ nào</span>}
                </div>
              </div>
                </>
              )}
            </div>
            {wiz.houseId === "custom" && spent > BUDGET_GOLD && <span className="block mt-3 text-[12px] text-red-400">Vượt quá ngân sách! Vui lòng giảm quân số.</span>}
            <NavButtons onBack={back} onNext={(wiz.houseId !== "custom" || spent <= BUDGET_GOLD) ? next : undefined} blockedReason="Vượt ngân sách" />
          </div>
        );
      }

      case 3: {
        const budget = getCalculatedBudgets(wiz.difficulty, wiz.age).pointBuy + flawRefund(wiz.talentIds);
        const spent = pointBuySpent(wiz.pointBuy, wiz.loreEquipmentIds);
        const setStat = (s: CoreStat, delta: number) => {
          const v = (wiz.pointBuy[s] ?? STAT_BASE) + delta;
          if (v < STAT_MIN_CREATE || v > STAT_MAX_CREATE) return;
          if (delta > 0 && spent + delta > budget) return;
          patch({ pointBuy: { ...wiz.pointBuy, [s]: v } });
        };
        return (
          <div>
            <StepHeader step={stepLabel} title="Phân Bổ Chỉ Số (Point-Buy)"
              hint={`Quỹ: ${budget - spent}/${budget} điểm còn lại · hạ dưới 8 (tối thiểu 6) để lấy thêm điểm · trần 15 lúc tạo · bonus xuất thân cộng SAU`} />
            <div className="space-y-2">
              {CORE_STATS.map((s) => {
                const v = wiz.pointBuy[s] ?? STAT_BASE;
                const bonus = origin?.statBonus[s] ?? 0;
                return (
                  <div key={s} className="glass flex items-center gap-3 px-4 py-2.5">
                    <span className="w-28 text-[13.5px] text-[var(--text-soft)]">{s}</span>
                    <GlassButton size="sm" onClick={() => setStat(s, -1)} disabled={v <= STAT_MIN_CREATE}>−</GlassButton>
                    <span className="w-8 text-center font-mono text-[15px] text-[var(--text-soft)]">{v}</span>
                    <GlassButton size="sm" onClick={() => setStat(s, 1)} disabled={v >= STAT_MAX_CREATE || spent >= budget}>+</GlassButton>
                    {bonus > 0 && <span className="text-[12px] text-[var(--accent-text)]">+{bonus} (xuất thân) = {v + bonus}</span>}
                  </div>
                );
              })}
            </div>
            <NavButtons onBack={back} onNext={spent <= budget ? next : undefined} blockedReason="Vượt quỹ điểm — hạ bớt chỉ số" />
          </div>
        );
      }

      case 4: {
        const pool = availableTalents({ eraId: wiz.eraId, eraHasMagic: era?.hasMagic ?? false, originId: wiz.originId, houseId: wiz.houseId ?? undefined });
        const gifts = new Set(origin?.giftTalentIds ?? []);
        const slots = talentSlots(wiz.difficulty, wiz.talentIds);
        const toggle = (t: TalentDef) => {
          if (wiz.talentIds.includes(t.id)) {
            patch({ talentIds: wiz.talentIds.filter((id) => id !== t.id) });
            return;
          }
          if (t.category !== "Khiếm Khuyết" && slots.used >= slots.max) return;
          patch({ talentIds: [...wiz.talentIds, t.id] });
        };
        const groups = [...new Set(pool.map((t) => t.category))];
        return (
          <div>
            <StepHeader step={stepLabel} title="Chọn Thiên Phú"
              hint={`${slots.used}/${slots.max} thiên phú tích cực · nhận Khiếm Khuyết = +1 slot & hoàn điểm point-buy · ma thuật gate theo Era/Nhà/xuất thân`} />
            {(origin?.giftTalentIds.length ?? 0) > 0 && (
              <span className="block mb-3 text-[12.5px] text-[var(--accent-text)]">
                Quà xuất thân: {origin!.giftTalentIds.map((id) => TALENTS_BY_ID[id]?.name).filter(Boolean).join(", ")}
              </span>
            )}
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g}>
                  <span className="block mb-1.5 text-[12px] tracking-widest text-[var(--text-faint)]">{g.toUpperCase()}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pool.filter((t) => t.category === g && !gifts.has(t.id)).map((t) => (
                      <Card key={t.id} selected={wiz.talentIds.includes(t.id)} onClick={() => toggle(t)}>
                        <span className="text-[13.5px] text-[var(--text-soft)]">
                          {t.name}
                          {t.hidden && <span className="ml-1.5 text-[11px] text-[var(--warn)]">(tiềm ẩn)</span>}
                          {t.category === "Khiếm Khuyết" && <span className="ml-1.5 text-[11px] text-[var(--danger)]">+{-(t.cost ?? 0)} điểm</span>}
                        </span>
                        {t.effect && <span className="block text-[11.5px] font-mono text-[var(--accent-text)]">{t.effect}{t.condition ? ` (${t.condition})` : ""}</span>}
                        <span className="block mt-0.5 text-[11.5px] leading-relaxed text-[var(--text-faint)]">{t.narrative}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );
      }

      case 5: {
        const budget = getCalculatedBudgets(wiz.difficulty, wiz.age).skillPoints;
        const pool = availableSkills({ eraHasMagic: era?.hasMagic ?? false, chosenTalentIds: wiz.talentIds });
        const spent = Object.values(wiz.skillAllocations).reduce((s, v) => s + v, 0);
        const setSkill = (id: string, delta: number) => {
          const v = (wiz.skillAllocations[id] ?? 0) + delta;
          if (v < 0 || v > SKILL_MAX_CREATE) return;
          if (delta > 0 && spent >= budget) return;
          patch({ skillAllocations: { ...wiz.skillAllocations, [id]: v } });
        };
        const groups = [...new Set(pool.map((s) => s.group))];
        return (
          <div>
            <StepHeader step={stepLabel} title="Phân Bổ Kỹ Năng"
              hint={`Quỹ: ${budget - spent}/${budget} điểm · trần 5 lúc tạo · gói xuất thân cộng thêm riêng · kỹ năng Ma Thuật chỉ mở khi có thiên phú tương ứng`} />
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g}>
                  <span className="block mb-1.5 text-[12px] tracking-widest text-[var(--text-faint)]">{g.toUpperCase()}</span>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {pool.filter((s) => s.group === g).map((s: SkillDef) => {
                      const v = wiz.skillAllocations[s.id] ?? 0;
                      return (
                        <div key={s.id} className="glass flex items-center gap-2 px-3 py-2" title={s.desc}>
                          <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--text-soft)]">{s.name}</span>
                          <GlassButton size="sm" onClick={() => setSkill(s.id, -1)} disabled={v <= 0}>−</GlassButton>
                          <span className="w-5 text-center font-mono text-[13px]">{v}</span>
                          <GlassButton size="sm" onClick={() => setSkill(s.id, 1)} disabled={v >= SKILL_MAX_CREATE || spent >= budget}>+</GlassButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );
      }

      case 6: {
        // Bước Rồng — chỉ hiện khi Era có magic
        const canHaveDragon = era?.hasMagic ?? false;
        if (!canHaveDragon) {
          return null; // Được skip qua logic next()/back()
        }
        const freshDragon = (): DragonWizardData => ({
          name: "", color: "Đen", size: "Non",
          stats: Object.fromEntries(DRAGON_STATS.map((s) => [s, DRAGON_STAT_BASE])) as Record<DragonStat, number>,
          skillAllocations: Object.fromEntries(DRAGON_SKILLS.map((s) => [s, 0])) as Record<DragonSkill, number>,
          description: "",
        });
        const dragon = wiz.dragon;
        const drgStatSpent = dragon ? Object.values(dragon.stats).reduce((s, v) => s + (v - DRAGON_STAT_BASE), 0) : 0;
        const drgSkillSpent = dragon ? Object.values(dragon.skillAllocations).reduce((s, v) => s + v, 0) : 0;
        const setDragonStat = (s: DragonStat, delta: number) => {
          if (!dragon) return;
          const v = (dragon.stats[s] ?? DRAGON_STAT_BASE) + delta;
          if (v < DRAGON_STAT_MIN_CREATE || v > DRAGON_STAT_MAX_CREATE) return;
          if (delta > 0 && drgStatSpent + delta > DRAGON_STAT_BUDGET) return;
          patch({ dragon: { ...dragon, stats: { ...dragon.stats, [s]: v } } });
        };
        const setDragonSkill = (s: DragonSkill, delta: number) => {
          if (!dragon) return;
          const v = (dragon.skillAllocations[s] ?? 0) + delta;
          if (v < 0 || v > DRAGON_SKILL_MAX_CREATE) return;
          if (delta > 0 && drgSkillSpent + delta > DRAGON_SKILL_BUDGET) return;
          patch({ dragon: { ...dragon, skillAllocations: { ...dragon.skillAllocations, [s]: v } } });
        };
        const DRAGON_COLORS = ["Đen", "Đỏ", "Vàng", "Xanh Dương", "Xanh Lá", "Trắng", "Bạc", "Vàng Kem"];
        return (
          <div>
            <StepHeader step={stepLabel} title="Rồng Của Ngươi"
              hint="Thời kỳ này có rồng. Ngươi có thể chọn có rồng hay không — sở hữu rồng là lợi thế khổng lồ nhưng cũng mang nhiều rủi ro." />
            <div className="grid gap-2 sm:grid-cols-2 mb-4">
              <Card selected={wiz.dragon === null} onClick={() => patch({ dragon: null })}>
                <span className="text-[13.5px] text-[var(--text-soft)]">Không có rồng</span>
                <span className="block text-[12px] text-[var(--text-faint)]">Phàm nhân với kiếm và mưu lược</span>
              </Card>
              <Card selected={wiz.dragon !== null} onClick={() => { if (!wiz.dragon) patch({ dragon: freshDragon() }); }}>
                <span className="text-[13.5px] text-[var(--accent-text)]">Có rồng</span>
                <span className="block text-[12px] text-[var(--text-faint)]">Sở hữu một con rồng — sức mạnh vượt trội</span>
              </Card>
            </div>
            {dragon && (
              <div className="space-y-4">
                {/* Tên + Màu + Kích cỡ */}
                <div className="flex gap-2">
                  <GlassInput placeholder="Tên rồng *" value={dragon.name}
                    onChange={(e) => patch({ dragon: { ...dragon, name: e.target.value } })} />
                </div>
                <div>
                  <span className="block mb-1.5 text-[12px] text-[var(--text-muted)]">Màu sắc</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DRAGON_COLORS.map((c) => (
                      <Card key={c} selected={dragon.color === c} onClick={() => patch({ dragon: { ...dragon, color: c } })}>
                        <span className="text-[12px]">{c}</span>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block mb-1.5 text-[12px] text-[var(--text-muted)]">Kích cỡ khởi đầu</span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {DRAGON_SIZES.map((sz) => (
                      <Card key={sz} selected={dragon.size === sz}
                        onClick={() => patch({ dragon: { ...dragon, size: sz } })}>
                        <span className="text-[13px] text-[var(--text-soft)]">{sz}</span>
                      </Card>
                    ))}
                  </div>
                </div>
                {/* Chỉ số rồng */}
                <div>
                  <span className="block mb-1.5 text-[12px] text-[var(--text-muted)]">
                    Chỉ số rồng · Quỹ: {DRAGON_STAT_BUDGET - drgStatSpent}/{DRAGON_STAT_BUDGET} điểm còn lại
                  </span>
                  <div className="space-y-1.5">
                    {DRAGON_STATS.map((s) => {
                      const v = dragon.stats[s] ?? DRAGON_STAT_BASE;
                      return (
                        <div key={s} className="glass flex items-center gap-3 px-4 py-2">
                          <span className="w-28 text-[12.5px] text-[var(--text-soft)]">{s}</span>
                          <GlassButton size="sm" onClick={() => setDragonStat(s, -1)} disabled={v <= DRAGON_STAT_MIN_CREATE}>−</GlassButton>
                          <span className="w-6 text-center font-mono text-[14px] text-[var(--text-soft)]">{v}</span>
                          <GlassButton size="sm" onClick={() => setDragonStat(s, 1)}
                            disabled={v >= DRAGON_STAT_MAX_CREATE || drgStatSpent >= DRAGON_STAT_BUDGET}>+</GlassButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Kỹ năng rồng */}
                <div>
                  <span className="block mb-1.5 text-[12px] text-[var(--text-muted)]">
                    Kỹ năng rồng · Quỹ: {DRAGON_SKILL_BUDGET - drgSkillSpent}/{DRAGON_SKILL_BUDGET} điểm còn lại
                  </span>
                  <div className="space-y-1.5">
                    {DRAGON_SKILLS.map((s) => {
                      const v = dragon.skillAllocations[s] ?? 0;
                      return (
                        <div key={s} className="glass flex items-center gap-3 px-4 py-2">
                          <span className="w-40 text-[12.5px] text-[var(--text-soft)]">{s}</span>
                          <GlassButton size="sm" onClick={() => setDragonSkill(s, -1)} disabled={v <= 0}>−</GlassButton>
                          <span className="w-6 text-center font-mono text-[14px] text-[var(--text-soft)]">{v}</span>
                          <GlassButton size="sm" onClick={() => setDragonSkill(s, 1)}
                            disabled={v >= DRAGON_SKILL_MAX_CREATE || drgSkillSpent >= DRAGON_SKILL_BUDGET}>+</GlassButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Mô tả */}
                <GlassTextarea rows={2} placeholder="Mô tả rồng (tuỳ chọn — AI dùng để tường thuật)..."
                  value={dragon.description}
                  onChange={(e) => patch({ dragon: { ...dragon, description: e.target.value } })} />
              </div>
            )}
            <NavButtons onBack={back} onNext={dragon === null || dragon.name.trim() ? next : undefined}
              blockedReason={dragon && !dragon.name.trim() ? "Hãy đặt tên cho rồng" : undefined} />
          </div>
        );
      }

      case 7:
        return (
          <div>
            <StepHeader step={stepLabel} title="Trang Bị Khởi Đầu"
              hint="Gói dựng sẵn theo xuất thân. Phẩm chất tối đa lúc tạo: Tinh Xảo — đồ Thép Valyria/Vô Giá phải kiếm trong game (hoặc đóng vai canon)." />
            <div className="space-y-2">
              {origin?.equipment.map((e) => (
                <div key={e.slot} className="glass px-4 py-2.5">
                  <span className="text-[11px] tracking-widest text-[var(--text-faint)]">{e.slot.toUpperCase()}</span>
                  <span className="block text-[13.5px] text-[var(--text-soft)]">
                    {e.ten} <span className="text-[var(--accent-text)]">({e.phamChat})</span>
                  </span>
                  <span className="block text-[12px] text-[var(--text-muted)]">
                    {Object.entries(e.thuocTinh).map(([k, v]) => `${k} +${v}`).join(", ")}{Object.keys(e.thuocTinh).length > 0 ? " · " : ""}{e.moTa}
                  </span>
                </div>
              ))}
              {origin?.items.map((it) => (
                <div key={it.ten} className="glass px-4 py-2.5">
                  <span className="block text-[13.5px] text-[var(--text-soft)]">{it.ten} ×{it.soLuong}</span>
                  <span className="block text-[12px] text-[var(--text-muted)]">{it.moTa}</span>
                </div>
              ))}
              <div className="glass px-4 py-2.5">
                <span className="block text-[13px] text-[var(--accent-text)]">{origin?.assets.moTa}</span>
                <span className="block text-[12px] text-[var(--text-muted)]">
                  Vàng {origin?.assets.vang.toLocaleString("vi-VN")} · Lương {origin?.assets.luongThuc.toLocaleString("vi-VN")}
                  {(origin?.assets.thuNhapKy ?? 0) > 0 && ` · Thu ${origin!.assets.thuNhapKy.toLocaleString("vi-VN")}/Chi ${origin!.assets.chiPhiKy.toLocaleString("vi-VN")} mỗi kỳ`}
                </span>
              </div>
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );

      case 8:
        return (
          <div>
            <StepHeader step={stepLabel} title="Persona & Chân Dung" hint="AI dùng phần này để giữ giọng nhân vật nhất quán." />
            <div className="space-y-3">
              <div className="flex gap-2">
                <GlassInput placeholder="Họ tên nhân vật *" value={wiz.name} onChange={(e) => patch({ name: e.target.value })} />
                <GlassInput placeholder="Biệt danh (tuỳ chọn)" value={wiz.nickname ?? ""} onChange={(e) => patch({ nickname: e.target.value })} />
              </div>
              <GlassTextarea rows={2} placeholder="Ngoại hình..." value={wiz.persona.ngoaiHinh}
                onChange={(e) => patch({ persona: { ...wiz.persona, ngoaiHinh: e.target.value } })} />
              <GlassTextarea rows={2} placeholder="Tính cách..." value={wiz.persona.tinhCach}
                onChange={(e) => patch({ persona: { ...wiz.persona, tinhCach: e.target.value } })} />
              <GlassTextarea rows={3} placeholder="Tiểu sử..." value={wiz.persona.tieuSu}
                onChange={(e) => patch({ persona: { ...wiz.persona, tieuSu: e.target.value } })} />
              <div className="grid grid-cols-3 gap-2">
                <GlassInput placeholder="Màu mắt" value={wiz.persona.mauMat} onChange={(e) => patch({ persona: { ...wiz.persona, mauMat: e.target.value } })} />
                <GlassInput placeholder="Màu tóc" value={wiz.persona.mauToc} onChange={(e) => patch({ persona: { ...wiz.persona, mauToc: e.target.value } })} />
                <GlassInput placeholder="Chiều cao" value={wiz.persona.chieuCao} onChange={(e) => patch({ persona: { ...wiz.persona, chieuCao: e.target.value } })} />
              </div>
              <div className="pt-2 border-t border-[var(--glass-border)]">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setPortraitFile(e.target.files?.[0] ?? null)} />
                <GlassButton onClick={() => fileRef.current?.click()}>
                  {portraitFile ? `Ảnh chân dung: ${portraitFile.name}` : "Gán ảnh chân dung (tuỳ chọn)"}
                </GlassButton>
              </div>
            </div>
            <NavButtons onBack={back} onNext={wiz.name.trim() ? next : undefined} blockedReason="Hãy đặt tên cho nhân vật" />
          </div>
        );

      case 9: {
        const crises = availableCrises({ originId: wiz.originId, eraId: wiz.eraId, houseId: wiz.houseId ?? undefined });
        return (
          <div>
            <StepHeader step={stepLabel} title="Khủng Hoảng Khởi Đầu"
              hint="Một tình thế nguy cấp gắn ngay lúc mở màn — để game khởi động có xung đột. Danh vọng khởi điểm đặt theo xuất thân." />
            <div className="space-y-2">
              <Card selected={wiz.crisisId === null} onClick={() => patch({ crisisId: null })}>
                <span className="text-[13.5px] text-[var(--text-soft)]">Khởi đầu yên bình</span>
                <span className="block text-[12px] text-[var(--text-faint)]">Không khủng hoảng — ngươi tự tìm rắc rối cho mình</span>
              </Card>
              <Card selected={wiz.crisisId === "ai-random"} onClick={() => patch({ crisisId: "ai-random" })}>
                <span className="text-[13.5px] text-[var(--accent-text)]">Để AI tự gieo</span>
                <span className="block text-[12px] text-[var(--text-faint)]">AI chọn biến cố phù hợp hồ sơ của ngươi</span>
              </Card>
              {crises.map((c) => (
                <Card key={c.id} selected={wiz.crisisId === c.id} onClick={() => patch({ crisisId: c.id })}>
                  <span className="text-[13.5px] text-[var(--text-soft)]">{c.title}</span>
                  <span className="ml-2 text-[11px] text-[var(--text-faint)]">{c.tags.join(" · ")}</span>
                  <span className="block mt-0.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">{c.desc}</span>
                </Card>
              ))}
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );
      }

      case 10:
        return (
          <div>
            <StepHeader step={stepLabel} title="Một Tâm Phúc Khởi Đầu" hint="NPC trung thành đi cùng từ đầu — điểm tựa quan hệ lúc mở màn." />
            <div className="space-y-2">
              <Card selected={wiz.companionId === null} onClick={() => patch({ companionId: null })}>
                <span className="text-[13.5px] text-[var(--text-soft)]">Ta quen đơn thương độc mã</span>
                <span className="block text-[12px] text-[var(--text-faint)]">Bắt đầu một mình — khó hơn, hợp tuyến sát thủ/lưu vong</span>
              </Card>
              {COMPANIONS.map((c) => (
                <Card key={c.id} selected={wiz.companionId === c.id} onClick={() => patch({ companionId: c.id })}>
                  <span className="text-[13.5px] text-[var(--text-soft)]">{c.name}</span>
                  <span className="ml-2 text-[11px] text-[var(--accent-text)]">Hảo cảm {c.haoCam} · Tin cậy {c.tinCay}</span>
                  <span className="block mt-0.5 text-[12.5px] text-[var(--text-muted)]">{c.desc}</span>
                </Card>
              ))}
              {wiz.companionId && (() => {
                const arch = COMPANIONS.find(c => c.id === wiz.companionId);
                if (!arch) return null;
                const overrides = wiz.companionOverrides || {};
                const stats = overrides.nangLuc || arch.nangLuc;
                const setStat = (key: keyof typeof arch.nangLuc, val: number) => {
                  patch({ companionOverrides: { ...overrides, nangLuc: { ...stats, [key]: val } } });
                };
                return (
                  <div className="glass p-3 mt-2 flex flex-col gap-2">
                    <span className="text-[13px] text-[var(--text-muted)] font-medium mb-1">Tuỳ chỉnh tâm phúc (Tuỳ chọn)</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <GlassInput placeholder="Đặt tên mới (bỏ trống để dùng tên gốc)" value={wiz.companionName ?? ""}
                        onChange={(e) => patch({ companionName: e.target.value })} className="flex-1" />
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] text-[var(--text-muted)]">Giới tính:</span>
                        <select className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-1 py-1" value={overrides.gioiTinh || "Nam"} onChange={e => patch({ companionOverrides: { ...overrides, gioiTinh: e.target.value } })}>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] text-[var(--text-muted)]">Tuổi:</span>
                        <input type="number" min="0" max="100" className="bg-[rgba(0,0,0,0.4)] text-[13px] border border-[var(--glass-border)] rounded px-2 py-1 w-12" value={overrides.tuoi ?? arch.tuoi} onChange={e => patch({ companionOverrides: { ...overrides, tuoi: parseInt(e.target.value) || 0 } })} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input type="text" placeholder="Loài (VD: Người, Tiên...)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-1/4" value={overrides.loai || ""} onChange={e => patch({ companionOverrides: { ...overrides, loai: e.target.value } })} />
                      <input type="text" placeholder="Thân Hình / Ngoại Hình" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1" value={overrides.thanHinh || ""} onChange={e => patch({ companionOverrides: { ...overrides, thanHinh: e.target.value } })} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <div className="flex items-center gap-1"><span className="text-[12px] text-[var(--text-muted)]">Võ:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-1 w-10" value={stats.voLuc} onChange={e => setStat("voLuc", parseInt(e.target.value)||0)} /></div>
                      <div className="flex items-center gap-1"><span className="text-[12px] text-[var(--text-muted)]">Thống:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-1 w-10" value={stats.thongSoai} onChange={e => setStat("thongSoai", parseInt(e.target.value)||0)} /></div>
                      <div className="flex items-center gap-1"><span className="text-[12px] text-[var(--text-muted)]">Trí:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-1 w-10" value={stats.triMuu} onChange={e => setStat("triMuu", parseInt(e.target.value)||0)} /></div>
                      <div className="flex items-center gap-1"><span className="text-[12px] text-[var(--text-muted)]">Ngoại:</span><input type="number" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-1 py-1 w-10" value={stats.ngoaiGiao} onChange={e => setStat("ngoaiGiao", parseInt(e.target.value)||0)} /></div>
                      <input type="text" placeholder="Tính cách" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 flex-1 min-w-[120px]" value={overrides.netTinhCach ?? arch.netTinhCach.join(", ")} onChange={e => patch({ companionOverrides: { ...overrides, netTinhCach: e.target.value } })} />
                    </div>
                    <textarea placeholder="Thông tin NSFW / Sở thích ẩn (Dành cho AI)" className="bg-[rgba(0,0,0,0.4)] text-[12px] border border-[var(--glass-border)] rounded px-2 py-1 w-full text-[var(--text-soft)] h-12 resize-none mt-1" value={overrides.nsfw || ""} onChange={e => patch({ companionOverrides: { ...overrides, nsfw: e.target.value } })} />
                  </div>
                );
              })()}
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );

      case 11:
        return (
          <div>
            <StepHeader step={stepLabel} title="Điểm Bắt Đầu" hint="Tình huống mở màn — AI dựng cảnh từ đây." />
            <div className="space-y-2">
              <Card selected={wiz.hookId === "ai-random"} onClick={() => patch({ hookId: "ai-random" })}>
                <span className="text-[13.5px] text-[var(--accent-text)]">Để AI sinh hook hợp hồ sơ</span>
                <span className="block text-[12px] text-[var(--text-faint)]">AI chọn tình huống mở màn khớp xuất thân + khủng hoảng của ngươi</span>
              </Card>
              {era?.startingHooks
                .filter((h) => !h.mode || h.mode === wiz.narrativeMode)
                .map((h) => (
                  <Card key={h.id} selected={wiz.hookId === h.id} onClick={() => patch({ hookId: h.id })}>
                    <span className="text-[13.5px] text-[var(--text-soft)]">{h.title}</span>
                    <span className="ml-2 text-[12px] text-[var(--accent-text)]">{h.year}</span>
                    <span className="block mt-0.5 text-[12.5px] text-[var(--text-muted)]">{h.desc}</span>
                  </Card>
                ))}
            </div>
            <NavButtons onBack={back} onNext={next} />
          </div>
        );

      case 12: {
        const canHaveTerritory = !!origin?.assets.lanhDia || ["lord-heir", "landed-knight", "minor-lord"].includes(wiz.originId);
        if (!canHaveTerritory) {
          // If cannot have territory, skip automatically to the next step
          return (
            <div>
              <StepHeader step={stepLabel} title="Lãnh Địa Bắt Đầu" hint="Xuất thân của ngươi không có đặc quyền cai trị đất đai." />
              <div className="glass px-4 py-3 opacity-70">
                <p className="text-[13px] text-[var(--text-soft)]">Kẻ lang thang không tấc đất cắm dùi.</p>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          );
        }

        return (
          <div>
            <StepHeader step={stepLabel} title="Lãnh Địa Bắt Đầu" hint="Tùy chỉnh thành trì của ngươi, hoặc từ chối để bắt đầu như một Lãnh chúa lưu vong." />
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Card selected={!wiz.hasCustomTerritory} onClick={() => patch({ hasCustomTerritory: false })}>
                  <span className="text-[13.5px] text-[var(--text-soft)]">Ta không muốn nhận đất</span>
                  <span className="block text-[12px] text-[var(--text-faint)]">Bắt đầu game dưới dạng lưu vong, phải tự chiếm hoặc xin phong đất</span>
                </Card>
                <Card selected={wiz.hasCustomTerritory} onClick={() => patch({ hasCustomTerritory: true })}>
                  <span className="text-[13.5px] text-[var(--accent-text)]">Ta sẽ cai quản lãnh địa của mình</span>
                  <span className="block text-[12px] text-[var(--text-faint)]">Thiết lập chi tiết thành trì của ngươi</span>
                </Card>
              </div>

              {wiz.hasCustomTerritory && (
                <div className="glass p-4 space-y-3">
                  <div>
                    <label className="block mb-1.5 text-[12px] text-[var(--text-muted)]">Tên Lãnh Địa</label>
                    <GlassInput 
                      placeholder="Nhập tên vùng đất của ngài..." 
                      value={wiz.customTerritoryName || ""} 
                      onChange={(e) => patch({ customTerritoryName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[12px] text-[var(--text-muted)]">Cấp Độ Lâu Đài (1 - 3)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((lvl) => (
                        <Card key={lvl} selected={wiz.customTerritoryLevel === lvl} onClick={() => patch({ customTerritoryLevel: lvl })}>
                          <span className="text-[13px]">Cấp {lvl}</span>
                        </Card>
                      ))}
                    </div>
                    <span className="block mt-1.5 text-[11px] text-[var(--text-muted)] italic">
                      Cấp càng cao, dân số và tài nguyên khởi điểm càng nhiều, quy mô thành phố càng lớn.
                    </span>
                  </div>
                </div>
              )}
            </div>
            <NavButtons 
              onBack={back} 
              onNext={wiz.hasCustomTerritory && (!wiz.customTerritoryName || wiz.customTerritoryName.trim() === "") ? undefined : next} 
              blockedReason="Hãy đặt tên cho Lãnh Địa" 
            />
          </div>
        );
      }

      case 13:
        return (
          <div>
            <StepHeader step={stepLabel} title="Trang Bị Đặc Biệt" hint="Chọn bảo vật truyền thuyết hoặc đặt rèn món đồ riêng (Tốn Vàng/Điểm)." />
            <WizardEquipment
              wiz={wiz}
              patch={patch}
              gold={origin?.assets.vang ?? 0}
            />
            <div className="mt-4">
              <NavButtons onBack={back} onNext={next} />
            </div>
          </div>
        );

      case 14:
        return (
          <div>
            <StepHeader step={stepLabel} title="Cuộn Giấy Vận Mệnh" hint="Xem lại nhân vật lần cuối." />
            {previewState && <CharacterPreview state={previewState} title={wiz.name || "Nhân vật"} />}
            <div className="mt-4 flex gap-2">
              <GlassButton onClick={back}>
                <IconChevronLeft size={14} /> Lùi
              </GlassButton>
              <GlassButton variant="accent" className="flex-1" onClick={() => void confirmAndStart()}>
                Bước Vào Loạn Thế
              </GlassButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const isWizard = String(stage).startsWith("w");
  const showPreview = (isWizard && Number(String(stage).slice(1)) >= 2 && previewState) || false;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-5xl gap-5">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => useUiStore.getState().setScreen("menu")}
            className="mb-3 flex items-center gap-1 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-soft)]"
          >
            <IconChevronLeft size={13} /> Main Menu
          </button>
          {isWizard && (
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${(Number(String(stage).slice(1)) / WIZARD_STEPS) * 100}%` }}
              />
            </div>
          )}
          {renderStage()}
        </div>
        {showPreview && (
          <aside className="sticky top-4 hidden w-72 shrink-0 self-start lg:block">
            <CharacterPreview state={previewState!} title={wiz.name || "Preview"} />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Nút điều hướng: nút "Tiếp" LUÔN hiện — thiếu điều kiện thì disabled + nêu rõ
 * lý do (ẩn nút khiến người chơi tưởng UI hỏng).
 */
function NavButtons({ onBack, onNext, blockedReason }: { onBack?: () => void; onNext?: () => void; blockedReason?: string }) {
  const blocked = !onNext;
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {onBack ? (
        <GlassButton onClick={onBack}>
          <IconChevronLeft size={14} /> Lùi
        </GlassButton>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2.5">
        {blocked && blockedReason && <span className="text-[12px] text-[var(--warn)]">{blockedReason}</span>}
        <GlassButton variant="accent" onClick={onNext} disabled={blocked} title={blocked ? blockedReason : undefined}>
          Tiếp
        </GlassButton>
      </div>
    </div>
  );
}
