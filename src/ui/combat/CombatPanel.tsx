/**
 * UI chiến đấu (7.3/11.6 tối thiểu M6): panel kính mờ nổi giữa màn khi
 * _Đang Chiến Đấu. ≥ Giao Tranh: chọn "Tự Chỉ Huy / Giao Cho Tướng" (7.12).
 * Đấu Tay Đôi: HP 2 phe song song + 4 Thế Đứng mỗi vòng + combat log expand.
 * Xong trận: card kết quả + nút để AI tường thuật (luồng 2 lượt 6.2).
 */
import { useState } from "react";
import { useCombatStore } from "../../state/combatStore";
import { useChatStore } from "../../state/chatStore";
import type { SkirmishDirective } from "../../combat/skirmish";
import { ARMY_TACTICS, SIEGE_ATTACKER_TACTICS, SIEGE_DEFENDER_TACTICS } from "../../combat/battleEngine";
import { GlassButton } from "../components/GlassButton";
import { IconChevronDown, IconCrossedSwords, IconShield } from "../icons";

function HpBar({ name, hp, maxHp, color, wounds = [], buffs = {} }: { name: string; hp: number; maxHp: number; color: string; wounds?: string[]; buffs?: Record<string, number> }) {
  const pct = maxHp > 0 ? Math.max(0, Math.round((hp / maxHp) * 100)) : 0;
  return (
    <div className="flex-1">
      <div className="mb-0.5 flex justify-between text-[12px]">
        <span className="truncate text-[var(--text-soft)]">{name}</span>
        <span className="font-mono text-[var(--text-muted)]">{hp}/{maxHp}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct > 50 ? color : pct > 20 ? "var(--warn)" : "var(--danger)" }} />
      </div>
      {wounds.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {wounds.map(w => (
            <span key={w} className="rounded bg-[rgba(200,50,50,0.2)] px-1 py-0.5 text-[9px] uppercase tracking-wider text-[var(--danger)]">
              {w}
            </span>
          ))}
        </div>
      )}
      {Object.entries(buffs).filter(([, v]) => v > 0).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(buffs).filter(([, v]) => v > 0).map(([k, v]) => (
            <span key={k} className="rounded bg-[rgba(50,200,100,0.2)] px-1 py-0.5 text-[9px] uppercase tracking-wider text-[var(--ok)]">
              {k} ({v})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ArmyBar({ name, currentTroops, totalTroops, currentMorale, maxMorale = 100, color }: { name: string; currentTroops: number; totalTroops: number; currentMorale: number; maxMorale?: number; color: string }) {
  const troopPct = totalTroops > 0 ? Math.max(0, Math.round((currentTroops / totalTroops) * 100)) : 0;
  const moralePct = Math.max(0, Math.round((currentMorale / maxMorale) * 100));
  
  return (
    <div className="flex-1 space-y-2">
      <div>
        <div className="mb-0.5 flex justify-between text-[12px]">
          <span className="truncate text-[var(--text-soft)]">{name} (Quân)</span>
          <span className="font-mono text-[var(--text-muted)]">{Math.round(currentTroops)}/{totalTroops}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${troopPct}%`, background: color }} />
        </div>
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[11px]">
          <span className="truncate text-[var(--text-faint)]">Sĩ Khí</span>
          <span className="font-mono text-[var(--text-muted)]">{Math.round(currentMorale)}/{maxMorale}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${moralePct}%`, background: moralePct > 50 ? "var(--ok)" : moralePct > 20 ? "var(--warn)" : "var(--danger)" }} />
        </div>
      </div>
    </div>
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
    </div>
  );
}



export function CombatPanel() {
  const combat = useCombatStore();
  const send = useChatStore((s) => s.send);
  const chatBusy = useChatStore((s) => s.status !== "idle");
  const [logOpen, setLogOpen] = useState(false);
  const [directive, setDirective] = useState<SkirmishDirective>("Đánh Thẳng");

  if (combat.phase === "idle") return null;

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

              {/* ---- panel so sánh lực lượng (11.5-11.6) ---- */}
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

          {/* ---- duel tương tác (7.14) ---- */}
          {combat.phase === "duel" && combat.duelState && (
            <div className="space-y-3">
              <div className="text-center font-display tracking-widest text-[13px] text-[var(--accent-text)] bg-[rgba(200,150,50,0.1)] py-1.5 rounded">
                KHOẢNG CÁCH: {combat.duelState.distance.toUpperCase()}
              </div>
              <div className="flex gap-4">
                <HpBar name={combat.duelState.a.name} hp={combat.duelState.a.hp} maxHp={combat.duelState.a.maxHp} color="var(--ok)" wounds={combat.duelState.a.wounds} buffs={combat.duelState.a.buffs} />
                <HpBar name={combat.duelState.b.name} hp={combat.duelState.b.hp} maxHp={combat.duelState.b.maxHp} color="var(--danger)" wounds={combat.duelState.b.wounds} buffs={combat.duelState.b.buffs} />
              </div>
              <p className="text-[12px] text-[var(--text-faint)]">
                Vòng {combat.duelState.round + 1} · Thể lực {combat.duelState.a.stamina}/{combat.duelState.a.maxStamina} · chọn Thế Đứng:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {combat.duelState.a.skills.map((s) => (
                  <GlassButton 
                    key={s.id} 
                    size="sm" 
                    onClick={() => combat.duelRound({ type: "skill", skillId: s.id })} 
                    title={s.description}
                    disabled={(combat.duelState?.a.stamina ?? 0) < s.staminaCost || (s.range === "melee" && combat.duelState?.distance === "Tầm Xa") || (s.range === "ranged" && combat.duelState?.distance === "Cận Chiến")}
                  >
                    <div className="flex justify-between w-full">
                      <span>{s.name} <span className="text-[9px] text-[var(--text-faint)]">[{s.range === "melee" ? "Gần" : s.range === "ranged" ? "Xa" : "All"}]</span></span>
                      <span className="text-[9px] text-[var(--text-faint)]">{s.staminaCost} STM</span>
                    </div>
                  </GlassButton>
                ))}
              </div>
              {combat.duelState.a.inventory.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-[var(--text-faint)] mb-1">Túi đồ:</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {combat.duelState.a.inventory.map((item, idx) => (
                      <GlassButton 
                        key={idx} 
                        size="sm" 
                        variant="accent"
                        onClick={() => combat.duelRound({ type: "item", itemId: item })}
                      >
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

          {/* ---- đại chiến tương tác ---- */}
          {combat.phase === "army_battle" && combat.armyBattleState && (
            <div className="space-y-3">
              <div className="text-center font-display tracking-widest text-[13px] text-[var(--accent-text)] bg-[rgba(100,150,250,0.1)] py-1.5 rounded">
                THỜI TIẾT: {combat.armyBattleState.weather.toUpperCase()} · VÒNG {combat.armyBattleState.round}
              </div>
              
              {combat.armyBattleState.isSiege && combat.armyBattleState.wallHp !== undefined && (
                <div className="bg-[rgba(255,255,255,0.03)] p-2 rounded border border-[rgba(255,255,255,0.05)]">
                  <div className="mb-1 flex justify-between text-[11px] font-bold text-[var(--text-soft)] uppercase tracking-wider">
                    <span>{combat.armyBattleState.wallBreached ? "[!!] TƯỜNG THÀNH ĐÃ VỠ!" : "TƯỜNG THÀNH"}</span>
                    <span className="font-mono">{Math.round(combat.armyBattleState.wallHp)}/{combat.armyBattleState.wallMaxHp}</span>
                  </div>
                  {!combat.armyBattleState.wallBreached && (
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)]">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (combat.armyBattleState.wallHp / (combat.armyBattleState.wallMaxHp || 1)) * 100))}%`, 
                          background: combat.armyBattleState.wallHp > 1000 ? "var(--ok)" : "var(--warn)" 
                        }} 
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <ArmyBar 
                  name={combat.armyBattleState.player.name} 
                  currentTroops={combat.armyBattleState.player.currentTroops} 
                  totalTroops={combat.armyBattleState.player.totalTroops} 
                  currentMorale={combat.armyBattleState.player.currentMorale} 
                  color="var(--ok)" 
                />
                <ArmyBar 
                  name={combat.armyBattleState.enemy.name} 
                  currentTroops={combat.armyBattleState.enemy.currentTroops} 
                  totalTroops={combat.armyBattleState.enemy.totalTroops} 
                  currentMorale={combat.armyBattleState.enemy.currentMorale} 
                  color="var(--danger)" 
                />
              </div>
              <p className="text-[12px] text-[var(--text-faint)] mt-2">
                Chọn chiến thuật chỉ huy:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  let pool = Object.values(ARMY_TACTICS);
                  if (combat.armyBattleState!.isSiege) {
                    if (combat.armyBattleState!.player.siegeRole === "attacker") {
                      pool = Object.values(SIEGE_ATTACKER_TACTICS);
                    } else {
                      pool = Object.values(SIEGE_DEFENDER_TACTICS);
                    }
                  }
                  
                  return pool.map((t) => {
                    const isAvailable = !t.condition || t.condition(combat.armyBattleState!.player, combat.armyBattleState!.weather);
                    return (
                      <GlassButton 
                        key={t.id} 
                        size="sm" 
                        onClick={() => combat.armyBattleRound(t.id)} 
                        title={t.description}
                        disabled={!isAvailable}
                      >
                        <div className="flex justify-between w-full text-left">
                          <span className={!isAvailable ? "opacity-50" : ""}>{t.name}</span>
                          {(t.id === "dracarys" || t.id === "siege_dracarys") && <span className="text-[9px] text-[var(--danger)] uppercase font-bold ml-1">RỒNG</span>}
                        </div>
                      </GlassButton>
                    );
                  });
                })()}
              </div>
              {combat.armyBattleState.finished && (
                <div className="mt-3">
                  <GlassButton variant="accent" className="w-full" onClick={() => combat.endArmyBattle()}>
                    Kết Thúc Trận Đánh
                  </GlassButton>
                </div>
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
          {(combat.duelState?.log.length || combat.armyBattleState?.log.length || combat.resultLog.length) ? (
            <div>
              <button
                type="button"
                onClick={() => setLogOpen((v) => !v)}
                className="flex items-center gap-1 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-soft)]"
              >
                <IconChevronDown size={13} className={logOpen ? "rotate-180" : ""} /> Combat log ({(combat.resultLog.length || combat.duelState?.log.length || combat.armyBattleState?.log.length) ?? 0} dòng)
              </button>
              {logOpen && (
                <pre className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-md bg-[rgba(0,0,0,0.3)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {(combat.resultLog.length ? combat.resultLog : (combat.armyBattleState?.log.length ? combat.armyBattleState.log : combat.duelState?.log ?? [])).join("\n")}
                </pre>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
