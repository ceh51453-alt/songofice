/**
 * IntriguePanel (14.5) — "phòng tối": bảng Mưu Đồ tối hơn phần còn lại (nền thẫm,
 * chữ như thì thầm). 3 tab:
 * - Tình Báo: tuyển điệp viên + danh sách (2 thanh Thâm Nhập/Bị Nghi Ngờ + đổi
 *   nhiệm vụ + rút về) + quân bài Tin Tình Báo → tống tiền NPC (14.1/14.3).
 * - Âm Mưu: thẻ âm mưu (2 thanh đối nghịch Tiến Độ vs Độ Bại Lộ) + Đẩy nhanh /
 *   Kích hoạt + wizard âm mưu mới (14.2).
 * - Con Tin & Tù Binh: đổi cách đối xử + Đòi Tiền Chuộc / Trao Đổi / Hành Quyết (14.4).
 * Engine giữ số; panel chỉ gọi intrigueStore. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useIntrigueStore } from "../../state/intrigueStore";
import { SPY_MISSIONS, PLOT_TYPES, CAPTIVE_TREATMENTS } from "../../mvu/schema";
import { SPY_RECRUIT_COST, hasIntel } from "../../strategy/intrigue";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import type { Npc } from "../../mvu/npcSchema";
import { GlassButton } from "../components/GlassButton";
import { GlassSelect } from "../components/GlassSelect";
import { IconX, IconMask, IconEye, IconCoins, IconTrash, IconAlert, IconTarget, IconScroll } from "../icons";

type Tab = "spies" | "plots" | "captives";
type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

function livingNpcs(stat: Stat): [string, Npc][] {
  return [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ].filter(([, n]) => n["Còn Sống"]);
}

function OptSelect({ value, onChange, options, className }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <GlassSelect value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </GlassSelect>
  );
}

function TwoBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="mb-0.5 flex justify-between text-[10.5px] text-[var(--text-faint)]">
        <span>{label}</span><span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.45)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

const susColor = (v: number) => (v > 80 ? "var(--danger)" : v > 50 ? "var(--warn)" : "var(--ok)");

export function IntriguePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("spies");
  if (!open) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "spies", label: "Tình Báo" },
    { key: "plots", label: "Âm Mưu" },
    { key: "captives", label: "Con Tin" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Mưu Đồ">
      <div className="absolute inset-0 bg-[rgba(3,4,7,0.66)]" onClick={onClose} />
      {/* "phòng tối" — nền thẫm hơn phần còn lại */}
      <aside
        className="anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[rgba(255,255,255,0.06)] backdrop-blur-xl"
        style={{ background: "linear-gradient(180deg, rgba(8,8,13,0.96), rgba(5,5,9,0.98))" }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconMask size={19} color="var(--text-muted)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">Mưu Đồ</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-faint)] hover:bg-[rgba(255,255,255,0.05)]">
            <IconX size={18} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)] px-3 py-2">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === tb.key ? "bg-[rgba(255,255,255,0.07)] text-[var(--text-soft)]" : "text-[var(--text-faint)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "spies" && <SpiesTab stat={stat} />}
          {tab === "plots" && <PlotsTab stat={stat} />}
          {tab === "captives" && <CaptivesTab stat={stat} />}
        </div>
      </aside>
    </div>
  );
}

// ── Tình Báo (14.1) ──────────────────────────────────────────────────────────
function SpiesTab({ stat }: { stat: Stat }) {
  const recruitSpy = useIntrigueStore((s) => s.recruitSpy);
  const setSpyMission = useIntrigueStore((s) => s.setSpyMission);
  const recallSpy = useIntrigueStore((s) => s.recallSpy);
  const blackmail = useIntrigueStore((s) => s.blackmail);
  const [alias, setAlias] = useState("");
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [bmNpc, setBmNpc] = useState("");

  const spies = Object.entries(stat["Tình Báo"]["Điệp Viên"]);
  const intel = Object.entries(stat["Tình Báo"]["Tin Tình Báo Đã Biết"]);
  const infiltrated = stat["Tình Báo"]["Bị Cài Điệp Viên"];
  const npcs = livingNpcs(stat);
  const gold = stat["Thông Tin Nhân Vật"]["Vàng"];

  return (
    <div className="space-y-4">
      {spies.length === 0 && intel.length === 0 && (
        <p className="text-[12.5px] italic leading-relaxed text-[var(--text-faint)]">
          Bóng tối là nơi kẻ yếu lật đổ kẻ mạnh. Hãy tuyển một tai mắt cài vào triều đình hay lãnh địa đối phương…
        </p>
      )}

      {/* tuyển điệp viên */}
      <div className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><IconEye size={13} /> Tuyển điệp viên mới</p>
        <div className="space-y-2">
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Bí danh (vd: Con Nhện)"
            className="w-full rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 text-[13px] text-[var(--text-soft)]" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Cài ở (Nhà / lãnh địa / triều đình)"
            className="w-full rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 text-[13px] text-[var(--text-soft)]" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11.5px] text-[var(--text-faint)]"><IconCoins size={12} /> {fmt(SPY_RECRUIT_COST)} · còn {fmt(gold)}</span>
            <GlassButton size="sm" onClick={() => {
              const r = recruitSpy(alias.trim(), target.trim());
              setMsg(r.ok ? null : r.error ?? null);
              if (r.ok) { setAlias(""); setTarget(""); }
            }}>Tuyển</GlassButton>
          </div>
          {msg && <p className="text-[12px] text-[var(--danger)]">{msg}</p>}
        </div>
      </div>

      {/* danh sách điệp viên */}
      {spies.map(([name, spy]) => (
        <div key={name} className={`rounded-[var(--radius-md)] border p-3 ${spy["Bị Nghi Ngờ"] > 80 ? "border-[rgba(176,106,95,0.5)]" : "border-[rgba(255,255,255,0.06)]"} bg-[rgba(255,255,255,0.02)]`}>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-soft)]">{name}</span>
            <span className="text-[11px] text-[var(--text-faint)]">cài ở {spy["Cài Ở"] || "—"}</span>
          </div>
          <div className="mt-2 flex gap-3">
            <TwoBar label="Thâm nhập" value={spy["Độ Sâu Thâm Nhập"]} color="var(--accent-text)" />
            <TwoBar label="Bị nghi ngờ" value={spy["Bị Nghi Ngờ"]} color={susColor(spy["Bị Nghi Ngờ"])} />
          </div>
          {spy["Bị Nghi Ngờ"] > 80 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[var(--danger)]"><IconAlert size={12} /> Sắp bị lộ — rút về hay liều tiếp?</p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <OptSelect value={spy["Nhiệm Vụ"]} onChange={(v) => setSpyMission(name, v)} options={SPY_MISSIONS.map((m) => ({ value: m, label: m }))} className="min-w-0 flex-1" />
            <GlassButton size="sm" variant="ghost" onClick={() => recallSpy(name)}>Rút về</GlassButton>
          </div>
        </div>
      ))}

      {/* Bị Cài Điệp Viên (phản gián) */}
      {infiltrated > 0 && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)] px-3 py-2">
          <TwoBar label="Triều đình ngươi bị địch thâm nhập" value={infiltrated} color={susColor(infiltrated)} />
          <p className="mt-1 text-[11px] italic text-[var(--text-faint)]">Bổ nhiệm Đại Điệp Viên giỏi để hạ mức này mỗi turn (little birds).</p>
        </div>
      )}

      {/* quân bài Tin Tình Báo + tống tiền */}
      {intel.length > 0 && (
        <div>
          <p className="font-display mb-1.5 flex items-center gap-1.5 text-[12px] uppercase tracking-widest text-[var(--text-faint)]"><IconScroll size={13} /> Tin tình báo</p>
          <div className="space-y-1.5">
            {intel.map(([key, val]) => (
              <div key={key} className="rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <p className="text-[12.5px] text-[var(--text-soft)]">{key}</p>
                <p className="text-[11.5px] text-[var(--text-faint)]">{val}</p>
              </div>
            ))}
          </div>
          {/* tống tiền: dùng tin tình báo ép NPC (14.3) */}
          {npcs.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <OptSelect
                value={bmNpc}
                onChange={setBmNpc}
                options={[{ value: "", label: "— tống tiền ai —" }, ...npcs.map(([n]) => ({ value: n, label: n }))]}
                className="min-w-0 flex-1"
              />
              <GlassButton size="sm" variant="danger" disabled={!bmNpc || !hasIntel(stat)}
                onClick={() => { if (bmNpc) { blackmail(bmNpc, intel[0][0]); setBmNpc(""); } }}>
                Tống tiền
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Âm Mưu (14.2) ────────────────────────────────────────────────────────────
function PlotsTab({ stat }: { stat: Stat }) {
  const startPlot = useIntrigueStore((s) => s.startPlot);
  const advancePlot = useIntrigueStore((s) => s.advancePlot);
  const activatePlot = useIntrigueStore((s) => s.activatePlot);
  const [showNew, setShowNew] = useState(false);

  const plots = Object.entries(stat["Âm Mưu"]);

  return (
    <div className="space-y-3">
      {plots.length === 0 && !showNew && (
        <p className="text-[12.5px] italic leading-relaxed text-[var(--text-faint)]">
          Chưa có âm mưu nào đang chạy. Một lời thì thầm đúng chỗ có thể lật đổ cả một triều đại…
        </p>
      )}

      {plots.map(([name, p]) => {
        const disloyal = p["Đồng Mưu"].filter((n) => {
          const npc = stat["Mối Quan Hệ"]["NPC Chính"][n] ?? stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][n];
          return npc && npc["Độ Hảo Cảm"] < 0;
        });
        return (
          <div key={name} className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13.5px] text-[var(--text-soft)]"><IconTarget size={13} color="var(--text-muted)" /> {name}</span>
              <span className="text-[11px] text-[var(--text-faint)]">{p["Loại"]}</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">Nhắm: {p["Mục Tiêu"] || "—"}</p>
            <div className="mt-2 flex gap-3">
              <TwoBar label="Tiến độ" value={p["Tiến Độ"]} color="var(--ok)" />
              <TwoBar label="Độ bại lộ" value={p["Độ Bại Lộ"]} color={susColor(p["Độ Bại Lộ"])} />
            </div>
            {p["Đồng Mưu"].length > 0 && (
              <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
                Đồng mưu: {p["Đồng Mưu"].join(", ")}
                {disloyal.length > 0 && <span className="text-[var(--danger)]"> · [!] {disloyal.join(", ")} có thể phản</span>}
              </p>
            )}
            <div className="mt-2 flex gap-1.5">
              <GlassButton size="sm" onClick={() => advancePlot(name, 0)}>Đẩy nhanh</GlassButton>
              <GlassButton size="sm" variant="danger" disabled={p["Tiến Độ"] < 100} title={p["Tiến Độ"] < 100 ? "Cần Tiến Độ đạt 100" : undefined}
                onClick={() => activatePlot(name)}>Kích hoạt</GlassButton>
            </div>
          </div>
        );
      })}

      {showNew ? (
        <NewPlotForm stat={stat} onCreate={(name, seed) => { startPlot(name, seed); setShowNew(false); }} onCancel={() => setShowNew(false)} />
      ) : (
        <GlassButton size="sm" variant="ghost" onClick={() => setShowNew(true)}>+ Âm mưu mới</GlassButton>
      )}
    </div>
  );
}

function NewPlotForm({ stat, onCreate, onCancel }: {
  stat: Stat; onCreate: (name: string, seed: { "Loại": string; "Mục Tiêu": string; "Đồng Mưu": string[] }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(PLOT_TYPES[0]);
  const [tgt, setTgt] = useState("");
  const [allies, setAllies] = useState<string[]>([]);
  const npcs = livingNpcs(stat);

  const toggle = (n: string) => setAllies((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]));

  return (
    <div className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3">
      <p className="mb-2 text-[12px] text-[var(--text-muted)]">Âm mưu mới</p>
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên âm mưu (vd: Đêm Máu)"
          className="w-full rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 text-[13px] text-[var(--text-soft)]" />
        <OptSelect value={type} onChange={setType} options={PLOT_TYPES.map((p) => ({ value: p, label: p }))} />
        <input value={tgt} onChange={(e) => setTgt(e.target.value)} placeholder="Mục tiêu (NPC / Nhà)"
          className="w-full rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 text-[13px] text-[var(--text-soft)]" />
        {npcs.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] text-[var(--text-faint)]">Chiêu mộ đồng mưu (nhiều = nhanh nhưng dễ lộ):</p>
            <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              {npcs.map(([n]) => (
                <button key={n} onClick={() => toggle(n)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    allies.includes(n) ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]" : "border-[rgba(255,255,255,0.1)] text-[var(--text-faint)]"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-1.5">
          <GlassButton size="sm" variant="accent" disabled={!name.trim()} onClick={() => onCreate(name.trim(), { "Loại": type, "Mục Tiêu": tgt.trim(), "Đồng Mưu": allies })}>Khởi động</GlassButton>
          <GlassButton size="sm" variant="ghost" onClick={onCancel}>Huỷ</GlassButton>
        </div>
      </div>
    </div>
  );
}

// ── Con Tin & Tù Binh (14.4) ─────────────────────────────────────────────────
function CaptivesTab({ stat }: { stat: Stat }) {
  const ransom = useIntrigueStore((s) => s.ransomCaptive);
  const exchange = useIntrigueStore((s) => s.exchangeCaptive);
  const execute = useIntrigueStore((s) => s.executeCaptive);
  const setTreatment = useIntrigueStore((s) => s.setTreatment);
  const [confirmExec, setConfirmExec] = useState<string | null>(null);

  const captives = Object.entries(stat["Tù Binh"]);
  if (captives.length === 0) {
    return <p className="text-[12.5px] italic text-[var(--text-faint)]">Chưa giữ con tin nào. Tướng địch bại trận có thể bị bắt làm con tin để đòi chuộc hay đổi chác.</p>;
  }

  return (
    <div className="space-y-3">
      {captives.map(([name, c]) => {
        const house = HOUSES_BY_ID[c["Nhà"]?.toLowerCase?.() ?? ""];
        return (
          <div key={name} className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] text-[var(--text-soft)]">{c["Họ Tên"] || name}</span>
              <span className="font-mono text-[11.5px] text-[var(--accent-text)]">{fmt(c["Giá Chuộc"])} Vàng</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">{c["Vai Trò"]}{c["Nhà"] ? ` · Nhà ${house?.name ?? c["Nhà"]}` : ""}</p>
            <div className="mt-2">
              <span className="mb-1 block text-[11px] text-[var(--text-faint)]">Cách đối xử (đổi quan hệ Nhà đối phương):</span>
              <OptSelect value={c["Đối Xử"]} onChange={(v) => setTreatment(name, v)} options={CAPTIVE_TREATMENTS.map((t) => ({ value: t, label: t }))} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <GlassButton size="sm" onClick={() => ransom(name)}><IconCoins size={12} /> Đòi tiền chuộc</GlassButton>
              <GlassButton size="sm" variant="ghost" onClick={() => exchange(name)}>Trao đổi</GlassButton>
              {confirmExec === name ? (
                <GlassButton size="sm" variant="danger" onClick={() => { execute(name); setConfirmExec(null); }}><IconTrash size={12} /> Chắc chắn?</GlassButton>
              ) : (
                <GlassButton size="sm" variant="danger" onClick={() => setConfirmExec(name)}>Hành quyết</GlassButton>
              )}
            </div>
            {confirmExec === name && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--danger)]"><IconAlert size={12} /> Hành quyết con tin giá trị cao: tụt danh tiếng + Nhà đối phương thù địch vĩnh viễn.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
