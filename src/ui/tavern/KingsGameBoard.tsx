/**
 * KingsGameBoard V3 — Board game bài "Cuộc Chiến Vương Giả".
 * 9 lá tay, 6 lượt, creature/trap/spell, nghĩa địa, ảnh nhân vật.
 */
import { useState } from "react";
import { useTavernStore } from "../../state/tavernStore";
import {
  RARITY_COLORS, GROUP_COLORS,
  TRAP_CONDITION_LABELS, SPELL_EFFECT_LABELS,
  type GameCard, type CardType,
} from "../../minigame/cardData";
import type { KingsRound, SetTrap, ActiveBuff } from "../../minigame/kingsGame";
import { useT } from "../../i18n";

// ═══════════════════════════════════════════════════════════════
//  LABEL MAPS
// ═══════════════════════════════════════════════════════════════

const SPECIAL_LABELS: Record<string, string> = {
  pierce: "Xuyên Giáp",
  fortress: "Bất Khả Xâm",
  counter: "Phản Đòn",
  inspire: "Cổ Vũ",
  drain: "Hút Máu",
  ambush: "Phục Kích",
  shield: "Khiên Thiêng",
  burn: "Thiêu Đốt",
  resurrect: "Hồi Sinh",
  execute: "Hành Quyết",
};

const TYPE_LABELS: Record<CardType, string> = {
  creature: "Sinh Vật",
  trap: "Bẫy",
  spell: "Ma Pháp",
};

// ═══════════════════════════════════════════════════════════════
//  SVG ICONS
// ═══════════════════════════════════════════════════════════════

function SwordIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="14" x2="11" y2="5" /><line x1="11" y1="5" x2="14" y2="2" strokeWidth="2" />
      <line x1="6" y1="10" x2="4" y2="8" /><line x1="8" y1="12" x2="6" y2="10" />
    </svg>
  );
}

function TrapIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12 L8 4 L13 12 Z" /><circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function SpellIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2 L9 6 L13 6 L10 9 L11 13 L8 10 L5 13 L6 9 L3 6 L7 6 Z" />
    </svg>
  );
}

function SkullIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="8" cy="7" r="5" /><circle cx="6" cy="6" r="1.2" fill="currentColor" />
      <circle cx="10" cy="6" r="1.2" fill="currentColor" /><path d="M6 10 L7 12 L8 10 L9 12 L10 10" />
    </svg>
  );
}



const TYPE_ICON: Record<CardType, React.ReactNode> = {
  creature: <SwordIcon size={9} />,
  trap: <TrapIcon size={9} />,
  spell: <SpellIcon size={9} />,
};

// ═══════════════════════════════════════════════════════════════
//  CARD DISPLAY (V3 — ảnh nhân vật, loại bài icon)
// ═══════════════════════════════════════════════════════════════

function CardDisplay({
  card,
  onClick,
  disabled,
  isGraveyard,
  faceDown,
}: {
  card: GameCard;
  onClick?: () => void;
  disabled?: boolean;
  isGraveyard?: boolean;
  faceDown?: boolean;
}) {
    const t = useT();
  const rarityColor = RARITY_COLORS[card.rarity];
  const groupColor = GROUP_COLORS[card.group];
  const isLegendary = card.rarity === "legendary";
  const isTrap = card.type === "trap";
  const isSpell = card.type === "spell";

  // Mặt sau (bẫy đặt úp)
  if (faceDown) {
    return (
      <div className="w-[105px] shrink-0 rounded-lg border-2 border-[#e07c3e55] bg-[repeating-linear-gradient(45deg,rgba(224,124,62,0.08),rgba(224,124,62,0.08)_4px,transparent_4px,transparent_8px)] p-2 text-center">
        <div className="flex items-center justify-center gap-1 text-[9px] text-[#e07c3e]">
          <TrapIcon size={10} />
          <span>{t("ui.bay_up")}</span>
        </div>
        <div className="mt-1 text-[7px] text-[var(--text-faint)]">{t("ui.cho_kich_hoat")}</div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-[105px] shrink-0 overflow-hidden rounded-lg border-2 bg-[linear-gradient(160deg,rgba(15,12,10,0.88),rgba(25,20,15,0.92))] text-left transition-all hover:shadow-[0_0_14px_rgba(194,164,104,0.18)] disabled:opacity-50 active:scale-[0.95] ${
        isLegendary ? "animate-[legendary-glow_3s_ease-in-out_infinite]" : ""
      } ${isGraveyard ? "opacity-50 grayscale" : ""} ${
        isTrap ? "border-dashed" : isSpell ? "border-dotted" : ""
      }`}
      style={{ borderColor: isTrap ? "#e07c3e" : isSpell ? "#6c5ce7" : rarityColor }}
    >
      {/* Portrait background (creature only) */}
      {card.portrait && card.type === "creature" && (
        <div className="absolute inset-0 opacity-[0.15]">
          <img
            src={`/portraits/${card.portrait}`}
            alt=""
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        </div>
      )}

      {/* Graveyard skull overlay */}
      {isGraveyard && (
        <div className="absolute right-1 top-1 text-[var(--danger)]">
          <SkullIcon size={14} />
        </div>
      )}

      <div className="relative z-10 p-2">
        {/* Header: Type icon + ATK / DEF */}
        <div className="mb-0.5 flex items-center justify-between">
          {card.type === "creature" ? (
            <>
              <span className="text-[11px] font-bold text-[var(--danger)]">{card.atk}</span>
              <span className="text-[8px]" style={{ color: groupColor }}>{TYPE_ICON[card.type]}</span>
              <span className="text-[11px] font-bold text-[var(--ok)]">{card.def}</span>
            </>
          ) : (
            <>
              <span className="text-[9px]" style={{ color: groupColor }}>
                {TYPE_ICON[card.type]}
              </span>
              <span className="text-[8px] font-medium uppercase" style={{ color: groupColor }}>
                {TYPE_LABELS[card.type]}
              </span>
            </>
          )}
        </div>

        {/* House badge */}
        <div className="mb-0.5 text-center">
          <span className="text-[7px] text-[var(--text-faint)]">{card.house}</span>
        </div>

        {/* Tên */}
        <div className="mb-0.5 border-b border-[rgba(255,255,255,0.06)] pb-0.5">
          <span className="block text-center font-display text-[10px] leading-tight text-[var(--text-soft)]">
            {card.name}
          </span>
        </div>

        {/* Rarity + Cost */}
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[8px] font-medium uppercase" style={{ color: rarityColor }}>
            {card.rarity === "common" ? "C" : card.rarity === "rare" ? "R" : card.rarity === "epic" ? "E" : "L"}
          </span>
          <span className="text-[8px] text-[var(--text-faint)]">
            {card.cost}
          </span>
        </div>

        {/* Desc */}
        <p className="text-[8px] leading-tight text-[var(--text-faint)]">{card.desc}</p>

        {/* Special (creature) */}
        {card.special && card.type === "creature" && (
          <div className="mt-1">
            <span
              className="rounded-sm px-1 py-0.5 text-[7px] font-medium"
              style={{ color: rarityColor, background: `${rarityColor}18` }}
            >
              {SPECIAL_LABELS[card.special] ?? card.special}
            </span>
          </div>
        )}

        {/* Trap condition */}
        {card.trapCondition && (
          <div className="mt-1">
            <span className="rounded-sm bg-[rgba(224,124,62,0.1)] px-1 py-0.5 text-[7px] font-medium text-[#e07c3e]">
              {TRAP_CONDITION_LABELS[card.trapCondition]}
            </span>
          </div>
        )}

        {/* Spell effect */}
        {card.spellEffect && (
          <div className="mt-1">
            <span className="rounded-sm bg-[rgba(108,92,231,0.1)] px-1 py-0.5 text-[7px] font-medium text-[#6c5ce7]">
              {SPELL_EFFECT_LABELS[card.spellEffect]}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROUND RESULT
// ═══════════════════════════════════════════════════════════════

function RoundResult({ round, index }: { round: KingsRound; index: number }) {
    const t = useT();
  const won = round.winner === "player";
  const lost = round.winner === "ai";
  return (
    <div className={`glass rounded-md border px-3 py-2 ${
      won ? "border-[rgba(125,165,131,0.4)]" : lost ? "border-[rgba(176,106,95,0.4)]" : "border-[var(--glass-border)]"
    }`}>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-faint)]">{t("ui.luot")} {index + 1}</span>
        <div className="flex items-center gap-2">
          {round.playerCombo && (
            <span className="text-[9px] text-[var(--accent-text)]">{round.playerCombo}</span>
          )}
          {round.triggeredTraps.length > 0 && (
            <span className="text-[9px] text-[#e07c3e]">
              <TrapIcon size={8} /> {round.triggeredTraps.length}
            </span>
          )}
          <span className={won ? "text-[var(--ok)]" : lost ? "text-[var(--danger)]" : "text-[var(--warn)]"}>
            {won ? "Thắng" : lost ? "Thua" : "Hoà"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-faint)]">
        <span className="text-[var(--text-soft)]">{round.playerCard.name}</span>
        <span>(ATK:{round.playerEffAtk} DEF:{round.playerEffDef})</span>
        <span>vs</span>
        <span>{round.aiCard.name}</span>
        <span>(ATK:{round.aiEffAtk} DEF:{round.aiEffDef})</span>
      </div>
      <p className="mt-1 text-[9px] italic text-[var(--text-faint)]">{round.narration}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GRAVEYARD PANEL
// ═══════════════════════════════════════════════════════════════

function GraveyardPanel({
  graveyard,
  label,
  isOpen,
  onToggle,
}: {
  graveyard: GameCard[];
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (graveyard.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 rounded-md border border-[var(--glass-border)] bg-[rgba(15,12,10,0.5)] px-3 py-1.5 text-[11px] text-[var(--text-faint)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
      >
        <SkullIcon size={12} />
        <span>{label} ({graveyard.length})</span>
        <span className="text-[8px]">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-md border border-[rgba(176,106,95,0.2)] bg-[rgba(10,8,6,0.6)] p-2">
          {graveyard.map((card, i) => (
            <CardDisplay key={`${card.id}-${i}`} card={card} disabled isGraveyard />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TRAP ZONE
// ═══════════════════════════════════════════════════════════════

function TrapZone({ traps, label }: { traps: SetTrap[]; label: string }) {
  if (traps.length === 0) return null;

  return (
    <div className="rounded-md border border-[rgba(224,124,62,0.2)] bg-[rgba(224,124,62,0.04)] p-2">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-[#e07c3e]">
        {label} ({traps.length}/2)
      </span>
      <div className="flex gap-1.5">
        {traps.map((t, i) => (
          <CardDisplay key={`trap-${i}`} card={t.card} faceDown={!t.triggered} disabled />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BUFFS DISPLAY
// ═══════════════════════════════════════════════════════════════

function BuffsDisplay({ buffs, label }: { buffs: ActiveBuff[]; label: string }) {
    const t = useT();
  if (buffs.length === 0) return null;

  const buffLabels: Record<ActiveBuff["type"], string> = {
    "atk-bonus": "+ATK",
    "atk-penalty": "-ATK",
    "def-penalty": "-DEF",
    ward: "Hộ Mệnh",
    "fire-boost": "Lửa R'hllor",
    "swap-stats": "Đổi Vận",
    "copied-special": "Sao Chép",
  };

  return (
    <div className="flex flex-wrap gap-1">
      {buffs.map((b, i) => {
        const isPositive = b.type === "atk-bonus" || b.type === "ward" || b.type === "fire-boost" || b.type === "swap-stats";
        return (
          <span
            key={`${label}-${i}`}
            className={`rounded-sm px-1.5 py-0.5 text-[8px] font-medium ${
              isPositive ? "bg-[rgba(125,165,131,0.15)] text-[var(--ok)]" : "bg-[rgba(176,106,95,0.15)] text-[var(--danger)]"
            }`}
          >
            {buffLabels[b.type]} {b.value > 0 ? `(${b.value})` : ""} — {b.turnsLeft}  {t("ui.luot_1")}
                          </span>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  REVEALED CARDS (Phép Nhìn Ba Mắt)
// ═══════════════════════════════════════════════════════════════

function RevealedCardsPanel({ cards, turnsLeft }: { cards: GameCard[]; turnsLeft: number }) {
    const t = useT();
  return (
    <div className="rounded-md border border-[rgba(108,92,231,0.3)] bg-[rgba(108,92,231,0.06)] p-2">
      <span className="mb-1 block text-[10px] font-medium text-[#6c5ce7]">
        
                      {t("ui.nhin_thau_tay_doi_thu")}{turnsLeft}  {t("ui.luot_con")}
                    </span>
      <div className="flex gap-1">
        {cards.map((c) => (
          <span key={c.id} className="rounded-sm bg-[rgba(108,92,231,0.1)] px-1.5 py-0.5 text-[8px] text-[var(--text-soft)]">
            {c.name} ({c.atk}/{c.def})
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EVENT LOG
// ═══════════════════════════════════════════════════════════════

function EventLog({ events }: { events: string[] }) {
    const t = useT();
  if (events.length === 0) return null;

  const recent = events.slice(-5);

  return (
    <div className="rounded-md border border-[var(--glass-border)] bg-[rgba(10,8,6,0.4)] p-2">
      <span className="mb-1 block text-[9px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
        
                      {t("ui.nhat_ky_su_kien")}
                    </span>
      {recent.map((e, i) => (
        <p key={i} className="text-[8px] leading-relaxed text-[var(--text-faint)]">
          {e}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN BOARD
// ═══════════════════════════════════════════════════════════════

export function KingsGameBoard() {
    const t = useT();
  const kingsState = useTavernStore((s) => s.kingsState);
  const playCard = useTavernStore((s) => s.playCard);

  const [showPlayerGrave, setShowPlayerGrave] = useState(false);
  const [showAiGrave, setShowAiGrave] = useState(false);

  if (!kingsState) return null;

  const {
    playerHand, rounds, currentRound, totalRounds, phase,
    playerAtkBonus, playerAtkPenalty,
    playerGraveyard, aiGraveyard,
    playerTraps, aiTraps,
    playerBuffs, aiBuffs,
    revealedAiCards,
    eventLog,
  } = kingsState;
  const isPicking = phase === "picking";

  // Score
  const playerWins = rounds.filter((r) => r.winner === "player").length + kingsState.playerBonusPoints;
  const aiWins = rounds.filter((r) => r.winner === "ai").length + kingsState.aiBonusPoints;

  // Phân loại tay bài
  const creatures = playerHand.filter((c) => c.type === "creature");
  const traps = playerHand.filter((c) => c.type === "trap");
  const spells = playerHand.filter((c) => c.type === "spell");

  return (
    <div className="flex flex-col gap-3">
      {/* Score */}
      <div className="flex items-center justify-center gap-6 text-center">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.nguoi_1")}</span>
          <span className="block font-display text-2xl text-[var(--ok)]">{playerWins}</span>
        </div>
        <span className="text-[16px] font-bold text-[var(--text-faint)]">VS</span>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.doi_thu_1")}</span>
          <span className="block font-display text-2xl text-[var(--danger)]">{aiWins}</span>
        </div>
      </div>

      {/* Buffs */}
      <div className="space-y-1">
        {(playerAtkBonus > 0 || playerAtkPenalty > 0) && (
          <div className="flex justify-center gap-3 text-[11px]">
            {playerAtkBonus > 0 && <span className="text-[var(--ok)]">+{playerAtkBonus}  {t("ui.atk_co_vu")}</span>}
            {playerAtkPenalty > 0 && <span className="text-[var(--danger)]">-{playerAtkPenalty}  {t("ui.atk_thieu_dot")}</span>}
          </div>
        )}
        <BuffsDisplay buffs={playerBuffs} label="player" />
        {aiBuffs.length > 0 && (
          <div className="text-center text-[9px] text-[var(--text-faint)]">
            
                                  {t("ui.doi_thu_co")} {aiBuffs.length}  {t("ui.hieu_ung_dang_hoat_dong")}
                                </div>
        )}
      </div>

      {/* Revealed cards */}
      {revealedAiCards && <RevealedCardsPanel cards={revealedAiCards.cards} turnsLeft={revealedAiCards.turnsLeft} />}

      {/* Trap zones */}
      <div className="flex gap-2">
        <TrapZone traps={playerTraps} label={t("ui.bay_nguoi")} />
        <TrapZone traps={aiTraps} label={t("ui.bay_doi_thu")} />
      </div>

      {/* Event log */}
      <EventLog events={eventLog} />

      {/* Lịch sử lượt */}
      {rounds.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.lich_su_1")}{rounds.length}/{totalRounds})
          </span>
          {rounds.map((r, i) => (
            <RoundResult key={i} round={r} index={i} />
          ))}
        </div>
      )}

      {/* Trạng thái */}
      <div className="text-center">
        {isPicking ? (
          <p className="text-[13px] text-[var(--accent-text)]">
            
                                  {t("ui.luot")} {currentRound + 1}/{totalRounds}  {t("ui.chon_la_bai")}
                                </p>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            
                                      {t("ui.van_dau_ket_thuc")}
                                    </p>
        )}
      </div>

      {/* Tay bài — phân nhóm */}
      {isPicking && (
        <div className="space-y-3">
          {/* Creature cards */}
          {creatures.length > 0 && (
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
                <SwordIcon size={10} />  {t("ui.sinh_vat")}{creatures.length})
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {creatures.map((card) => (
                  <CardDisplay key={card.id} card={card} onClick={() => playCard(card.id)} disabled={!isPicking} />
                ))}
              </div>
            </div>
          )}

          {/* Trap cards */}
          {traps.length > 0 && (
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-[#e07c3e]">
                <TrapIcon size={10} />  {t("ui.bay")}{traps.length}) {playerTraps.length >= 2 ? "— Đã đầy!" : ""}
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {traps.map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    onClick={() => playCard(card.id)}
                    disabled={!isPicking || playerTraps.length >= 2}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Spell cards */}
          {spells.length > 0 && (
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-[#6c5ce7]">
                <SpellIcon size={10} />  {t("ui.ma_phap")}{spells.length})
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {spells.map((card) => (
                  <CardDisplay key={card.id} card={card} onClick={() => playCard(card.id)} disabled={!isPicking} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nghĩa Địa */}
      <div className="flex flex-wrap gap-2">
        <GraveyardPanel
          graveyard={playerGraveyard}
          label={t("ui.nghia_dia_nguoi")}
          isOpen={showPlayerGrave}
          onToggle={() => setShowPlayerGrave(!showPlayerGrave)}
        />
        <GraveyardPanel
          graveyard={aiGraveyard}
          label={t("ui.nghia_dia_doi_thu")}
          isOpen={showAiGrave}
          onToggle={() => setShowAiGrave(!showAiGrave)}
        />
      </div>

      <style>{`
        @keyframes legendary-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(197, 160, 63, 0.15); }
          50% { box-shadow: 0 0 16px rgba(197, 160, 63, 0.3); }
        }
      `}</style>
    </div>
  );
}
