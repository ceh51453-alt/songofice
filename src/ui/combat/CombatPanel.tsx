/**
 * UI chiến đấu (M22) — panel kính mờ nổi giữa màn khi _Đang Chiến Đấu.
 *
 * Ba minigame, ba mặt bảng khác nhau:
 *   • Đấu Tay Đôi   — HP + Thăng Bằng + Thế Chủ Động hai phe, dải cự ly ba bậc,
 *                     chọn VÙNG NHẮM, và sổ chiêu thức chia theo trường phái có
 *                     giới thiệu đầy đủ cho từng chiêu.
 *   • Đại Chiến     — giai đoạn trận đánh, ba cánh quân mỗi bên, hậu bị, Điểm
 *                     Chỉ Huy, chọn mũi nhọn dồn vào cánh nào.
 *   • Vây Thành     — từng đoạn tường, máy công thành, kho lương, khẩu phần,
 *                     tiến độ đào hầm và dịch bệnh.
 */
import { useState } from "react";
import { useCombatStore } from "../../state/combatStore";
import { useChatStore } from "../../state/chatStore";
import type { SkirmishDirective } from "../../combat/skirmish";
import {
  ARMY_TACTICS, SIEGE_ATTACKER_TACTICS, SIEGE_DEFENDER_TACTICS,
  BATTLE_PHASES, SECTOR_IDS, SECTOR_INTRO,
  type BattleTactic, type SectorId,
} from "../../combat/battleEngine";
import { maxPoiseOf, usableArts, type Duelist } from "../../combat/duel";
import {
  usableMoves, enemiesOf, unitAlive, unitControlled,
  AIR_LEVEL_INTRO, type AerialUnit, type AerialAction, type AerialDuelState,
} from "../../combat/aerialDuel";
import { ALTITUDE_INTRO, type DragonAltitude } from "../../combat/battleEngine";
import { STATUS_DEFS } from "../../combat/statusEffects";
import {
  AIM_ZONES, ART_SCHOOLS, artBands, describeArt,
  type AimZone, type CombatArt,
} from "../../content/westeros/combatArts";
import { GlassButton } from "../components/GlassButton";
import { IconChevronDown, IconCrossedSwords, IconShield, IconTarget, IconCastle, IconUsers } from "../icons";

const AIM_ORDER: AimZone[] = ["Ngẫu Nhiên", "Đầu", "Thân", "Tay", "Chân"];

function Bar({ pct, color, height = "h-2" }: { pct: number; color: string; height?: string }) {
  return (
    <div className={`${height} overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

function StatusChips({ d }: { d: Duelist }) {
  const active = Object.entries(d.buffs ?? {})
    .filter(([id, v]) => v > 0 && STATUS_DEFS[id])
    .map(([id, v]) => ({ id, rounds: v, stacks: d.stacks?.[id] ?? 1, def: STATUS_DEFS[id] }));
  const wounds = (d.wounds ?? []).filter((w) => !STATUS_DEFS[w]);
  if (active.length === 0 && wounds.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {active.map((s) => {
        const good = s.def.kind === "Tăng Cường" || s.def.kind === "Thế Trận";
        return (
          <span
            key={s.id}
            title={`${s.def.name} — ${s.def.desc}\n${s.def.flavor}`}
            className={`cursor-help rounded px-1 py-0.5 text-[9px] uppercase tracking-wider ${
              good ? "bg-[rgba(50,200,100,0.18)] text-[var(--ok)]" : "bg-[rgba(200,50,50,0.2)] text-[var(--danger)]"
            }`}
          >
            {s.def.name}{s.stacks > 1 ? ` ×${s.stacks}` : ""} ({s.rounds})
          </span>
        );
      })}
      {wounds.map((w) => (
        <span key={w} className="rounded bg-[rgba(200,50,50,0.2)] px-1 py-0.5 text-[9px] uppercase tracking-wider text-[var(--danger)]">
          {w}
        </span>
      ))}
    </div>
  );
}

/** Bảng chỉ số một đấu sĩ: máu, thể lực, thăng bằng, thế chủ động. */
function DuelistCard({ d, color }: { d: Duelist; color: string }) {
  const hpPct = d.maxHp > 0 ? (d.hp / d.maxHp) * 100 : 0;
  const stPct = d.maxStamina > 0 ? (d.stamina / d.maxStamina) * 100 : 0;
  const maxPoise = maxPoiseOf(d);
  const poise = d.poise ?? maxPoise;
  const poisePct = (poise / maxPoise) * 100;
  const momentum = d.momentum ?? 0;

  return (
    <div className="flex-1 space-y-1">
      <div className="flex justify-between text-[12px]">
        <span className="truncate text-[var(--text-soft)]">{d.name}</span>
        <span className="font-mono text-[var(--text-muted)]">{d.hp}/{d.maxHp}</span>
      </div>
      <Bar pct={hpPct} color={hpPct > 50 ? color : hpPct > 20 ? "var(--warn)" : "var(--danger)"} />

      <div className="flex justify-between text-[10px] text-[var(--text-faint)]">
        <span title="Thể Lực — hết là bị ép về đòn cơ bản và dính Kiệt Sức">Thể Lực</span>
        <span className="font-mono">{d.stamina}/{d.maxStamina}</span>
      </div>
      <Bar pct={stPct} color="var(--accent-text)" height="h-1" />

      <div className="flex justify-between text-[10px] text-[var(--text-faint)]">
        <span title="Thăng Bằng — vỡ thanh này là loạng choạng, đòn kế tiếp ăn trọn">Thăng Bằng</span>
        <span className="font-mono">{Math.round(poise)}/{maxPoise}</span>
      </div>
      <Bar pct={poisePct} color={poisePct > 40 ? "#7aa7c7" : "var(--warn)"} height="h-1" />

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--text-faint)]" title="Thế Chủ Động — trúng liên tiếp thì dồn được thế, trượt thì mất">Thế Chủ Động</span>
        <span className={`font-mono ${momentum > 0 ? "text-[var(--ok)]" : momentum < 0 ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>
          {momentum > 0 ? "+" : ""}{momentum}
        </span>
      </div>
      <StatusChips d={d} />
    </div>
  );
}

/** Một cánh quân: quân số, sĩ khí, gắn kết, mệt mỏi. */
function SectorRow({
  sector, focused, onFocus, mine,
}: {
  sector: { id: SectorId; troops: number; startTroops: number; morale: number; cohesion: number; fatigue: number; routed: boolean; troopType: string };
  focused?: boolean;
  onFocus?: () => void;
  mine: boolean;
}) {
  const pct = sector.startTroops > 0 ? (sector.troops / sector.startTroops) * 100 : 0;
  return (
    <button
      type="button"
      onClick={onFocus}
      disabled={!onFocus}
      title={`${SECTOR_INTRO[sector.id]}\n\nBinh chủng: ${sector.troopType}\nGắn kết ${Math.round(sector.cohesion)} · Mệt mỏi ${Math.round(sector.fatigue)}`}
      className={`w-full rounded border px-2 py-1 text-left transition-colors ${
        focused ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-transparent hover:bg-[var(--glass-bg-hover)]"
      } ${onFocus ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex justify-between text-[10.5px]">
        <span className={sector.routed ? "text-[var(--danger)] line-through" : "text-[var(--text-soft)]"}>
          {sector.id}{sector.routed ? " · VỠ" : ""}
        </span>
        <span className="font-mono text-[var(--text-muted)]">{Math.round(sector.troops)}</span>
      </div>
      <Bar pct={pct} color={mine ? "var(--ok)" : "var(--danger)"} height="h-1" />
      <div className="mt-0.5 flex gap-2 text-[9px] text-[var(--text-faint)]">
        <span>SK {Math.round(sector.morale)}</span>
        <span>GK {Math.round(sector.cohesion)}</span>
        <span>Mệt {Math.round(sector.fatigue)}</span>
      </div>
    </button>
  );
}

/** So sánh lực lượng 2 phe trước khi giải (11.5-11.6) — Effective Power ước tính. */
function ForceComparison() {
  const preview = useCombatStore((s) => s.forcePreview());
  if (!preview) return null;
  const total = preview.playerStrength + preview.enemyStrength;
  const playerPct = total > 0 ? Math.round((preview.playerStrength / total) * 100) : 50;
  const edge = preview.playerStrength >= preview.enemyStrength;
  return (
    <div className="glass rounded-[var(--radius-md)] px-3.5 py-3">
      <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
        <span>So Sánh Lực Lượng</span>
        <span>{preview.terrain ? `Địa hình: ${preview.terrain}` : preview.condition ? `Biển: ${preview.condition}` : ""}</span>
      </div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--ok)]">{preview.playerLabel}</span>
        <span className="text-[var(--danger)]">{preview.enemyLabel}</span>
      </div>
      <div className="my-1 flex justify-between font-mono text-[11px] text-[var(--text-muted)]">
        <span>{preview.playerTroops.toLocaleString("vi-VN")}</span>
        <span>{preview.enemyTroops.toLocaleString("vi-VN")}</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]">
        <div className="h-full bg-[var(--ok)] transition-all" style={{ width: `${playerPct}%` }} />
        <div className="h-full bg-[var(--danger)] transition-all" style={{ width: `${100 - playerPct}%` }} />
      </div>
      <p className="mt-1.5 text-[11.5px] text-[var(--text-faint)]">
        Chiến lực ước tính {preview.playerStrength} / {preview.enemyStrength}
        {preview.matchup !== 1 ? ` · ưu khuyết binh chủng ×${preview.matchup.toFixed(2)}` : ""} ·{" "}
        <span className={edge ? "text-[var(--ok)]" : "text-[var(--danger)]"}>{edge ? "ta chiếm ưu thế" : "địch chiếm ưu thế"}</span>
        {" "}(chưa tính may rủi 2D6)
      </p>

      {/* M23 — ai CÓ MẶT và ai vắng, nói thẳng lý do */}
      {preview.mobilization && preview.mobilization.absent.length > 0 && (
        <div className="mt-2 border-t border-[var(--glass-border)] pt-2">
          <p className="text-[11px] text-[var(--warn)]">
            Chỉ {preview.mobilization.fieldedTroops.toLocaleString("vi-VN")} quân có mặt tại{" "}
            {preview.mobilization.location || "chiến trường"} — vắng{" "}
            {preview.mobilization.absentTroops.toLocaleString("vi-VN")}:
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {preview.mobilization.absent.slice(0, 4).map((a) => (
              <li key={a.name} className="text-[10.5px] text-[var(--text-faint)]">
                • <b className="text-[var(--text-muted)]">{a.name}</b> ({a.troops.toLocaleString("vi-VN")}) — {a.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* M23 — công trình và lãnh địa đóng góp gì */}
      {preview.support && preview.support.lines.length > 0 && (
        <div className="mt-2 border-t border-[var(--glass-border)] pt-2">
          <p className="text-[11px] text-[var(--ok)]">
            Hậu thuẫn từ {preview.support.territory}
            {preview.support.scorpions > 0 ? ` · ${preview.support.scorpions} ụ nỏ bắn rồng` : ""}:
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {preview.support.lines.slice(0, 5).map((l, i) => (
              <li key={i} className="text-[10.5px] text-[var(--text-faint)]">• {l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Nút một chiêu thức, kèm toàn bộ giới thiệu trong tooltip. */
function ArtButton({
  art, disabled, reason, onClick,
}: { art: CombatArt; disabled: boolean; reason: string; onClick: () => void }) {
  const school = ART_SCHOOLS[art.school];
  const tip = [
    describeArt(art),
    "",
    art.flavor,
    "",
    `Trường phái ${school.name} · ${art.kind} · bậc ${art.tier}`,
    art.onHit?.length ? `Gieo: ${art.onHit.map((s) => s.id).join(", ")}` : "",
    art.onSelf?.length ? `Tự khoác: ${art.onSelf.map((s) => s.id).join(", ")}` : "",
    art.poiseDamage ? `Đánh Thăng Bằng: ${art.poiseDamage}` : "",
    art.backfire ? `Rủi ro: ${Math.round(art.backfire.chance * 100)}% ${art.backfire.desc}` : "",
    reason ? `\n⛔ ${reason}` : "",
  ].filter(Boolean).join("\n");

  return (
    <GlassButton size="sm" onClick={onClick} title={tip} disabled={disabled} className="!items-start !justify-start text-left">
      <div className="w-full">
        <div className="flex w-full justify-between gap-1">
          <span className="truncate">{art.name}</span>
          <span className="shrink-0 text-[9px] text-[var(--text-faint)]">{art.staminaCost} TL</span>
        </div>
        <div className="flex w-full justify-between gap-1 text-[9px] text-[var(--text-faint)]">
          <span className="truncate">{school.name} · {art.kind}</span>
          <span className="shrink-0">{artBands(art).map((b) => (b === "Áp Sát" ? "Ôm" : b === "Cận Chiến" ? "Gần" : "Xa")).join("/")}</span>
        </div>
      </div>
    </GlassButton>
  );
}

/** Nút một chiến thuật quân sự, kèm mô tả + chất kể. */
function TacticButton({
  tactic, disabled, onClick, note,
}: { tactic: BattleTactic; disabled: boolean; onClick: () => void; note?: string }) {
  const tip = [
    tactic.description,
    tactic.flavor ? `\n"${tactic.flavor}"` : "",
    tactic.commandCost ? `\nTốn ${tactic.commandCost} Điểm Chỉ Huy` : "",
    tactic.bestPhase ? `Phát huy nhất ở giai đoạn ${tactic.bestPhase}` : "",
    tactic.advantageAgainst?.length ? `Khắc chế: ${tactic.advantageAgainst.join(", ")}` : "",
    note ? `\n⛔ ${note}` : "",
  ].filter(Boolean).join("\n");
  return (
    <GlassButton size="sm" onClick={onClick} title={tip} disabled={disabled} className="!justify-start text-left">
      <div className="flex w-full items-center justify-between gap-1">
        <span className={`truncate ${disabled ? "opacity-50" : ""}`}>{tactic.name}</span>
        <span className="flex shrink-0 items-center gap-1">
          {tactic.commandCost ? <span className="text-[9px] text-[var(--accent-text)]">{tactic.commandCost}⚑</span> : null}
          {(tactic.id === "dracarys" || tactic.id === "siege_dracarys") && (
            <span className="text-[9px] font-bold uppercase text-[var(--danger)]">RỒNG</span>
          )}
        </span>
      </div>
    </GlassButton>
  );
}

/** Thẻ một con rồng trong không chiến: máu rồng, máu kỵ sĩ, sức bền, tầng bay. */
function AerialCard({ u, mine, selected, onSelect }: { u: AerialUnit; mine: boolean; selected?: boolean; onSelect?: () => void }) {
  const hpPct = (u.dragonHp / u.dragonMaxHp) * 100;
  const stPct = (u.stamina / Math.max(1, u.maxStamina)) * 100;
  const dead = !unitAlive(u);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      title={AIR_LEVEL_INTRO[u.level]}
      className={`w-full rounded border px-2 py-1.5 text-left transition-colors ${
        selected ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[rgba(255,255,255,0.06)]"
      } ${onSelect ? "cursor-pointer hover:bg-[var(--glass-bg-hover)]" : "cursor-default"} ${dead ? "opacity-45" : ""}`}
    >
      <div className="flex justify-between text-[11.5px]">
        <span className={dead ? "text-[var(--danger)] line-through" : mine ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
          {u.dragonName}{u.fled ? " (bỏ đi)" : u.downed ? " (ĐÃ RƠI)" : ""}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{u.level}</span>
      </div>
      <Bar pct={hpPct} color={hpPct > 50 ? (mine ? "var(--ok)" : "var(--danger)") : "var(--warn)"} height="h-1.5" />
      <div className="mt-0.5 flex justify-between text-[9px] text-[var(--text-faint)]">
        <span>{Math.round(u.dragonHp)}/{u.dragonMaxHp}</span>
        <span>Sức bền {Math.round(stPct)}%</span>
        <span>{u.breathCooldown > 0 ? `nạp lửa ${u.breathCooldown}` : "lửa sẵn"}</span>
      </div>
      <Bar pct={stPct} color="#7aa7c7" height="h-1" />
      <div className="mt-0.5 text-[9px] text-[var(--text-faint)]">
        {u.riderName
          ? `${u.riderName} — ${u.unhorsed ? "MẤT YÊN" : `${Math.round(u.riderHp)} HP`} · gắn bó ${Math.round(u.bond)}`
          : "rồng hoang, không ai cưỡi"}
      </div>
    </button>
  );
}

/** Bảng không chiến nhiều phe. */
function AerialBoard({ state, onAct, onAuto, onEnd }: {
  state: AerialDuelState;
  onAct: (actions: AerialAction[]) => void;
  onAuto: () => void;
  onEnd: () => void;
}) {
  const mine = state.units.filter((u) => u.side === "ta");
  const [activeId, setActiveId] = useState<string>(mine[0]?.id ?? "");
  const [targetId, setTargetId] = useState<string>("");

  const actor = state.units.find((u) => u.id === activeId) ?? mine.find(unitAlive);
  const foes = actor ? enemiesOf(state, actor) : [];
  const target = state.units.find((u) => u.id === targetId) ?? foes[0];
  const moves = actor ? usableMoves(actor, target) : [];

  return (
    <div className="space-y-3">
      <div className="rounded bg-[rgba(120,90,200,0.12)] py-1.5 text-center">
        <p className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">
          KHÔNG CHIẾN · VÒNG {state.round} · {state.sides.length} PHE
        </p>
        <p className="mt-0.5 px-3 text-[10px] leading-relaxed text-[var(--text-faint)]">
          {actor ? AIR_LEVEL_INTRO[actor.level] : ""}
        </p>
      </div>

      <div className={`grid gap-2 ${state.sides.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {state.sides.map((side) => (
          <div key={side.id} className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{side.name}</p>
            {state.units.filter((u) => u.side === side.id).map((u) => (
              <AerialCard
                key={u.id}
                u={u}
                mine={side.id === "ta"}
                selected={side.id === "ta" ? u.id === activeId : u.id === target?.id}
                onSelect={
                  side.id === "ta"
                    ? (unitAlive(u) ? () => setActiveId(u.id) : undefined)
                    : (unitAlive(u) ? () => setTargetId(u.id) : undefined)
                }
              />
            ))}
          </div>
        ))}
      </div>

      {!state.finished && actor && unitAlive(actor) && (
        <>
          <p className="text-[11px] text-[var(--text-faint)]">
            {actor.dragonName} → {target ? target.dragonName : "chưa chọn mục tiêu"}
            {!unitControlled(actor) && " · rồng đã mất kỵ sĩ, chỉ còn bản năng"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {moves.map((m) => (
              <GlassButton
                key={m.id}
                size="sm"
                title={`${m.desc}\n\n"${m.flavor}"\n\n${m.actor} · ${m.kind} · ${m.stamina} sức bền${m.bond ? ` · cần gắn bó ${m.bond}` : ""}${m.cooldown ? ` · chờ ${m.cooldown} vòng` : ""}`}
                onClick={() => onAct([{ unitId: actor.id, moveId: m.id, targetId: target?.id }])}
                className="!items-start !justify-start text-left"
              >
                <div className="w-full">
                  <div className="flex w-full justify-between gap-1">
                    <span className="truncate">{m.name}</span>
                    <span className="shrink-0 text-[9px] text-[var(--text-faint)]">{m.stamina}</span>
                  </div>
                  <div className="text-[9px] text-[var(--text-faint)]">{m.actor} · {m.kind}</div>
                </div>
              </GlassButton>
            ))}
          </div>
          <GlassButton variant="ghost" size="sm" onClick={onAuto}>
            Đánh nhanh (tự phân giải)
          </GlassButton>
        </>
      )}

      {state.finished && (
        <GlassButton variant="accent" className="w-full" onClick={onEnd}>
          Kết Thúc Không Chiến
        </GlassButton>
      )}
    </div>
  );
}

export function CombatPanel() {
  const combat = useCombatStore();
  const send = useChatStore((s) => s.send);
  const chatBusy = useChatStore((s) => s.status !== "idle");
  const [logOpen, setLogOpen] = useState(false);
  const [directive, setDirective] = useState<SkirmishDirective>("Đánh Thẳng");
  const [zone, setZone] = useState<AimZone>("Ngẫu Nhiên");
  const [focus, setFocus] = useState<SectorId>("Trung Quân");
  const [siegeTarget, setSiegeTarget] = useState<string | undefined>(undefined);
  const [altitude, setAltitude] = useState<DragonAltitude>("Thấp");

  if (combat.phase === "idle") return null;

  const duel = combat.duelState;
  const battle = combat.armyBattleState;
  const siege = battle?.siege;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.6)] backdrop-blur-[3px]" />
      <div className="glass-strong anim-in relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden">
        {/* ---- header ---- */}
        <div className="flex items-center gap-2.5 border-b border-[var(--glass-border)] px-5 py-3">
          <IconCrossedSwords size={20} color="var(--warn)" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[16px] tracking-widest text-[var(--warn)]">GIAO CHIẾN — {combat.scale.toUpperCase()}</h2>
            {combat.terrain && <p className="text-[11px] text-[var(--text-faint)]">Địa hình: {combat.terrain}</p>}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {combat.description && (
            <p className="text-[13.5px] italic leading-relaxed text-[var(--text-muted)]">{combat.description}</p>
          )}

          {/* ---- chọn cách đánh (≥ Giao Tranh — 7.12) ---- */}
          {combat.phase === "awaiting-choice" && (
            <div className="space-y-3">
              <p className="text-[13px] text-[var(--text-soft)]">
                {combat.attrs.enemy ?? "Quân địch"}
                {combat.attrs.enemy_size ? ` — ước chừng ${Number(combat.attrs.enemy_size).toLocaleString("vi-VN")} quân` : ""}
                {combat.attrs.enemy_general ? ` · tướng ${combat.attrs.enemy_general}` : ""}
              </p>

              <ForceComparison />

              <div className="space-y-1.5">
                <p className="text-[12px] text-[var(--text-faint)]">Chỉ đạo (khi tự chỉ huy):</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["Đánh Thẳng", "Bảo Vệ Nhân Vật Then Chốt", "Hạ Chỉ Huy Địch", "Mở Đường Tháo Chạy"] as SkirmishDirective[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirective(d)}
                      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                        directive === d
                          ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                          : "border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton variant="accent" className="flex-1" onClick={() => combat.resolveArmy("self", directive)}>
                  <IconCrossedSwords size={15} /> Tự Chỉ Huy
                </GlassButton>
                <GlassButton className="flex-1" onClick={() => combat.resolveArmy("delegate")}>
                  <IconShield size={15} /> Giao Cho Tướng
                </GlassButton>
              </div>
            </div>
          )}

          {/* ---- ĐẤU TAY ĐÔI ---- */}
          {combat.phase === "duel" && duel && (
            <div className="space-y-3">
              <div className="rounded bg-[rgba(200,150,50,0.1)] py-1.5 text-center">
                <p className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">
                  CỰ LY: {duel.distance.toUpperCase()}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">
                  {duel.ground} · {duel.light} · vòng {duel.round + 1}
                </p>
              </div>

              <div className="flex gap-4">
                <DuelistCard d={duel.a} color="var(--ok)" />
                <DuelistCard d={duel.b} color="var(--danger)" />
              </div>

              {/* vùng nhắm */}
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
                  <IconTarget size={12} /> Nhắm vào:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AIM_ORDER.map((z) => {
                    const def = AIM_ZONES[z];
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZone(z)}
                        title={`${def.desc}\n\nChỉ số đánh trúng ${def.hitMod >= 0 ? "+" : ""}${def.hitMod}`}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                          zone === z
                            ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                            : "border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                        }`}
                      >
                        {def.name}
                        <span className="ml-1 text-[9px] opacity-70">{def.hitMod >= 0 ? "+" : ""}{def.hitMod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* chiêu thức theo trường phái */}
              {(() => {
                const usable = new Set(usableArts(duel.a, duel.distance).map((a) => a.id));
                const bySchool = new Map<string, CombatArt[]>();
                for (const art of duel.a.skills) {
                  const list = bySchool.get(art.school) ?? [];
                  list.push(art);
                  bySchool.set(art.school, list);
                }
                return [...bySchool.entries()].map(([schoolId, arts]) => {
                  const school = ART_SCHOOLS[schoolId as keyof typeof ART_SCHOOLS];
                  return (
                    <div key={schoolId}>
                      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]" title={school.intro}>
                        {school.name}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {arts.map((art) => {
                          const ok = usable.has(art.id);
                          const reason = ok ? "" :
                            duel.a.stamina < art.staminaCost ? "Không đủ Thể Lực"
                            : (duel.a.cooldowns?.[art.id] ?? 0) > 0 ? `Còn chờ ${duel.a.cooldowns![art.id]} vòng`
                            : `Chỉ dùng được ở cự ly ${artBands(art).join("/")}`;
                          return (
                            <ArtButton
                              key={art.id}
                              art={art}
                              disabled={!ok}
                              reason={reason}
                              onClick={() => combat.duelRound({ type: "skill", skillId: art.id, zone })}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}

              {duel.a.inventory.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Túi đồ</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {duel.a.inventory.map((item, idx) => (
                      <GlassButton key={idx} size="sm" variant="accent" onClick={() => combat.duelRound({ type: "item", itemId: item })}>
                        {item}
                      </GlassButton>
                    ))}
                  </div>
                </div>
              )}
              <GlassButton variant="ghost" size="sm" onClick={() => combat.autoResolveDuel()}>
                Đánh nhanh (tự phân giải)
              </GlassButton>
            </div>
          )}

          {/* ---- KHÔNG CHIẾN ---- */}
          {combat.phase === "aerial" && combat.aerialState && (
            <AerialBoard
              state={combat.aerialState}
              onAct={(a) => combat.aerialRound(a)}
              onAuto={() => combat.autoResolveAerial()}
              onEnd={() => combat.endAerialDuel()}
            />
          )}

          {/* ---- ĐẠI CHIẾN / VÂY THÀNH ---- */}
          {combat.phase === "army_battle" && battle && (
            <div className="space-y-3">
              <div className="rounded bg-[rgba(100,150,250,0.1)] py-1.5 text-center">
                <p className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">
                  {siege ? `${siege.phase.toUpperCase()} · NGÀY ${Math.round(siege.days)}` : `${battle.phase.toUpperCase()} · VÒNG ${battle.round}`}
                </p>
                <p className="mt-0.5 px-3 text-[10px] leading-relaxed text-[var(--text-faint)]">
                  {siege ? `Thời tiết ${battle.weather}` : BATTLE_PHASES[battle.phase].intro}
                </p>
              </div>

              {/* ---- bảng vây thành ---- */}
              {siege && (
                <div className="space-y-2 rounded border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-2">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
                    <IconCastle size={12} /> Tường Thành — bấm để chọn mục tiêu
                  </p>
                  {siege.sections.map((sec) => {
                    const pct = sec.maxHp > 0 ? (sec.hp / sec.maxHp) * 100 : 0;
                    const selectable = battle.player.siegeRole === "attacker" && !sec.breached;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        disabled={!selectable}
                        onClick={() => setSiegeTarget(sec.id)}
                        title={`${sec.name} — độ dày ${sec.thickness}. Đá bắn phải mạnh hơn ${sec.thickness * 4} mới để lại vết.`}
                        className={`w-full rounded border px-2 py-1 text-left transition-colors ${
                          siegeTarget === sec.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-transparent"
                        } ${selectable ? "cursor-pointer hover:bg-[var(--glass-bg-hover)]" : "cursor-default"}`}
                      >
                        <div className="flex justify-between text-[10.5px]">
                          <span className={sec.breached ? "text-[var(--danger)]" : "text-[var(--text-soft)]"}>
                            {sec.name}{sec.breached ? " · ĐÃ VỠ" : ""}
                          </span>
                          <span className="font-mono text-[var(--text-muted)]">{Math.round(sec.hp)}/{sec.maxHp}</span>
                        </div>
                        <Bar pct={pct} color={sec.breached ? "var(--danger)" : pct > 40 ? "var(--ok)" : "var(--warn)"} height="h-1.5" />
                      </button>
                    );
                  })}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1 text-[10px] text-[var(--text-faint)]">
                    <span title="Hết lương là thành mở cổng — phần lớn thành trì thất thủ vì đói chứ không vì tường vỡ">
                      Lương thủ: <b className="text-[var(--text-muted)]">{Math.round(siege.supplyDays)} ngày</b>
                    </span>
                    <span>Khẩu phần: <b className="text-[var(--text-muted)]">{siege.rations}</b></span>
                    <span title="Máy bắn đá phải dựng tại chỗ, mất hàng tuần">
                      Máy công thành: <b className="text-[var(--text-muted)]">
                        {Object.entries(siege.engines).filter(([, n]) => n > 0).map(([k, n]) => `${k}×${n}`).join(", ") || "chưa có"}
                      </b>
                    </span>
                    <span>Hầm: <b className="text-[var(--text-muted)]">{Math.round(siege.sap)}/100</b> (phản {Math.round(siege.counterSap)})</span>
                    <span>Dịch trong thành: <b className="text-[var(--text-muted)]">{Math.round(siege.diseaseInside)}</b></span>
                    <span>Dịch trại vây: <b className="text-[var(--text-muted)]">{Math.round(siege.diseaseOutside)}</b></span>
                  </div>
                </div>
              )}

              {/* ---- ba cánh quân (dã chiến) ---- */}
              {!siege && (
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ok)]">{battle.player.name}</span>
                      <span className="font-mono text-[var(--text-muted)]">{Math.round(battle.player.currentTroops)}</span>
                    </div>
                    {SECTOR_IDS.map((id) => (
                      <SectorRow key={id} mine sector={battle.player.sectors[id]} focused={focus === id} onFocus={() => setFocus(id)} />
                    ))}
                    <p className="flex items-center gap-1 pt-0.5 text-[9.5px] text-[var(--text-faint)]">
                      <IconUsers size={10} /> Hậu bị {battle.player.reserve} · Chỉ huy {battle.player.commandPoints}⚑
                    </p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--danger)]">{battle.enemy.name}</span>
                      <span className="font-mono text-[var(--text-muted)]">{Math.round(battle.enemy.currentTroops)}</span>
                    </div>
                    {SECTOR_IDS.map((id) => (
                      <SectorRow key={id} mine={false} sector={battle.enemy.sectors[id]} />
                    ))}
                    <p className="pt-0.5 text-[9.5px] text-[var(--text-faint)]">
                      Hậu bị {battle.enemy.reserve} · sĩ khí {battle.enemy.currentMorale}
                    </p>
                  </div>
                </div>
              )}

              {siege && (
                <div className="flex gap-4 text-[11px]">
                  <div className="flex-1">
                    <div className="flex justify-between"><span className="text-[var(--ok)]">Phe ta</span><span className="font-mono">{Math.round(battle.player.currentTroops)}</span></div>
                    <Bar pct={battle.player.currentMorale} color="var(--ok)" height="h-1" />
                    <span className="text-[9.5px] text-[var(--text-faint)]">sĩ khí {battle.player.currentMorale} · {battle.player.siegeRole === "attacker" ? "công thành" : "thủ thành"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between"><span className="text-[var(--danger)]">Địch</span><span className="font-mono">{Math.round(battle.enemy.currentTroops)}</span></div>
                    <Bar pct={battle.enemy.currentMorale} color="var(--danger)" height="h-1" />
                    <span className="text-[9.5px] text-[var(--text-faint)]">sĩ khí {battle.enemy.currentMorale}</span>
                  </div>
                </div>
              )}

              {/* ---- chiến thuật ---- */}
              {!battle.finished && (
                <>
                  {battle.air.player.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] text-[var(--text-faint)]">Đàn rồng bay ở độ cao:</p>
                      <div className="flex gap-1.5">
                        {(["Thấp", "Cao"] as DragonAltitude[]).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAltitude(a)}
                            title={ALTITUDE_INTRO[a]}
                            className={`rounded-full border px-3 py-0.5 text-[11px] transition-colors ${
                              altitude === a
                                ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                                : "border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                            }`}
                          >
                            Bay {a}
                          </button>
                        ))}
                        <span className="self-center text-[9.5px] text-[var(--text-faint)]">
                          {battle.air.player.map((d) => `${d.name} ${Math.round(d.hp)}/${d.maxHp}`).join(" · ")}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--text-faint)]">
                    {siege
                      ? `Mệnh lệnh ${battle.player.siegeRole === "attacker" ? "công thành" : "giữ thành"}:`
                      : `Chiến thuật — mũi nhọn đang dồn vào ${focus}:`}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      let pool = Object.values(ARMY_TACTICS);
                      if (battle.isSiege) {
                        pool = Object.values(
                          battle.player.siegeRole === "attacker" ? SIEGE_ATTACKER_TACTICS : SIEGE_DEFENDER_TACTICS,
                        );
                      }
                      return pool.map((t) => {
                        const condOk = !t.condition || t.condition(battle.player, battle.weather);
                        const cpOk = !t.commandCost || battle.player.commandPoints >= t.commandCost;
                        const note = !condOk ? "Không đủ điều kiện binh chủng / tướng lĩnh"
                          : !cpOk ? "Không còn Điểm Chỉ Huy" : "";
                        return (
                          <TacticButton
                            key={t.id}
                            tactic={t}
                            disabled={!condOk || !cpOk}
                            note={note}
                            onClick={() => combat.armyBattleRound(t.id, { focus, siegeTarget, altitude })}
                          />
                        );
                      });
                    })()}
                  </div>
                </>
              )}

              {battle.finished && (
                <GlassButton variant="accent" className="w-full" onClick={() => combat.endArmyBattle()}>
                  Kết Thúc Trận Đánh
                </GlassButton>
              )}
            </div>
          )}

          {/* ---- kết quả ---- */}
          {combat.phase === "done" && (
            <div className="space-y-3">
              <div
                className={`glass px-4 py-3 text-center ${
                  combat.resultOutcome?.includes("Thắng")
                    ? "border-[rgba(125,165,131,0.45)]"
                    : combat.resultOutcome?.includes("Bại")
                      ? "border-[rgba(176,106,95,0.45)]"
                      : ""
                }`}
              >
                <p className="font-display text-xl tracking-widest text-[var(--text-soft)]">{combat.resultOutcome}</p>
                <p className="mt-1 text-[12px] text-[var(--text-faint)]">Kết quả đã chốt bằng seed — reroll lời kể không đổi số</p>
              </div>
              <GlassButton
                variant="accent"
                className="w-full"
                disabled={chatBusy}
                onClick={() => {
                  combat.closePanel();
                  void send("(Trận đánh đã được phân giải — hãy tường thuật diễn biến theo kết quả đã chốt.)", { hidden: true });
                }}
              >
                Nghe tường thuật trận đánh
              </GlassButton>
            </div>
          )}

          {/* ---- combat log expand (7.3) ---- */}
          {(duel?.log.length || battle?.log.length || combat.aerialState?.log.length || combat.resultLog.length) ? (
            <div>
              <button
                type="button"
                onClick={() => setLogOpen((v) => !v)}
                className="flex items-center gap-1 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-soft)]"
              >
                <IconChevronDown size={13} className={logOpen ? "rotate-180" : ""} /> Combat log ({(combat.resultLog.length || duel?.log.length || battle?.log.length) ?? 0} dòng)
              </button>
              {logOpen && (
                <pre className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-md bg-[rgba(0,0,0,0.3)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {(combat.resultLog.length ? combat.resultLog : (battle?.log.length ? battle.log : duel?.log ?? [])).join("\n")}
                </pre>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
