/**
 * DiplomacyPanel (M20) — bảng NGOẠI GIAO riêng, tách hẳn khỏi bảng Quân Sự.
 *
 * KHÔNG CÓ NÚT BẤM. Đây là bàn cờ để NHÌN: ai đang chiến với ta, giấy tờ nào còn
 * hiệu lực, đình chiến còn mấy ngày, ai đang giữ cớ để đánh ta, sứ giả đang ở
 * đâu, và lời đề nghị nào đang chờ ta trả lời. Người chơi ra quyết định bằng
 * LỜI trong cuộc chơi; AI kể diễn biến và cỗ máy chốt số.
 *
 * 4 tab: Quan Hệ · Hiệp Ước · Ân Oán · Sứ Giả & Đề Nghị. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { formatDuration } from "../../mvu/calendar";
import { absoluteDay } from "../../mvu/calendar";
import { formatCurrencyShort } from "../../economy/currency";
import { diplomacySummary, type DiploSummary } from "../../strategy/diplomacy";
import type { DiploState } from "../../mvu/schema";
import { IconX, IconScroll, IconCrown, IconCoins, IconSend, IconAlert, IconCrossedSwords } from "../icons";

type Tab = "relations" | "treaties" | "grievances" | "envoys";
type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

const STATUS_TONE: Record<DiploState, string> = {
  "Hoà Bình": "var(--text-muted)",
  "Chiến Tranh": "var(--danger)",
  "Đình Chiến": "#d97706",
  "Liên Minh": "var(--ok)",
  "Thần Phục Ta": "var(--accent-text)",
  "Ta Thần Phục": "#7b8fa6",
};

function Chip({ text, tone }: { text: string; tone?: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10.5px]"
      style={{ color: tone ?? "var(--text-muted)", borderColor: tone ? `${tone}55` : "var(--glass-border)" }}
    >
      {text}
    </span>
  );
}

/** Thanh hai chiều cho lòng tin (-100..100). */
function TrustBar({ value }: { value: number }) {
  const pct = Math.abs(value) / 2;
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10.5px] text-[var(--text-faint)]">
        <span>Lòng tin</span>
        <span className="font-mono">{value > 0 ? "+" : ""}{value}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: value >= 0 ? "50%" : `${50 - pct}%`,
            width: `${pct}%`,
            background: value >= 0 ? "var(--ok)" : "var(--danger)",
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--glass-border-bright)]" />
      </div>
    </div>
  );
}

export function DiplomacyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("relations");
  if (!open) return null;

  const rows = diplomacySummary(stat);
  const offers = Object.entries(stat["Ngoại Giao"]["Lời Đề Nghị"] ?? {});
  const tabs: { key: Tab; label: string }[] = [
    { key: "relations", label: "Quan Hệ" },
    { key: "treaties", label: "Hiệp Ước" },
    { key: "grievances", label: "Ân Oán" },
    { key: "envoys", label: offers.length > 0 ? `Sứ Giả (${offers.length})` : "Sứ Giả" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Ngoại Giao">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)]" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconScroll size={19} color="var(--accent-text)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">Ngoại Giao</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </div>

        <CredibilityBar stat={stat} />

        <div className="flex gap-1 overflow-x-auto border-b border-[var(--glass-border)] px-3 py-2">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === tb.key ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "relations" && <RelationsTab rows={rows} />}
          {tab === "treaties" && <TreatiesTab stat={stat} rows={rows} />}
          {tab === "grievances" && <GrievancesTab stat={stat} />}
          {tab === "envoys" && <EnvoysTab stat={stat} />}
        </div>

        <p className="border-t border-[var(--glass-border)] px-4 py-2.5 text-[11px] italic leading-relaxed text-[var(--text-faint)]">
          Ngoại giao diễn ra bằng LỜI: hãy nói ra ý ngươi trong cuộc chơi — gửi quạ cầu hoà, cử sứ đòi cống nạp,
          xé một tờ hiệp ước. Cỗ máy giữ giấy tờ, kỳ hạn và lòng tin; bảng này chỉ để ngươi nhìn cho rõ.
        </p>
      </aside>
    </div>
  );
}

/** Uy tín cam kết — tài sản đắt nhất của một lãnh chúa. */
function CredibilityBar({ stat }: { stat: Stat }) {
  const v = stat["Ngoại Giao"]["Uy Tín Cam Kết"];
  const label = v >= 70 ? "Lời ngươi đáng giá" : v >= 40 ? "Người ta còn dè dặt" : "Không ai tin lời ngươi";
  const color = v >= 70 ? "var(--ok)" : v >= 40 ? "#d97706" : "var(--danger)";
  return (
    <div className="border-b border-[var(--glass-border)] px-4 py-2.5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] text-[var(--text-muted)]">Uy tín cam kết</span>
        <span className="font-mono text-[13px]" style={{ color }}>{v}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: color }} />
      </div>
      <p className="mt-1 text-[11px] italic text-[var(--text-faint)]">{label} — xé một tờ giấy là mọi Nhà đều bớt tin.</p>
    </div>
  );
}

// ── Quan Hệ ─────────────────────────────────────────────────────────────────
function RelationsTab({ rows }: { rows: DiploSummary[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px] italic leading-relaxed text-[var(--text-muted)]">
        Ngươi chưa có quan hệ ngoại giao chính thức với Nhà nào. Quan hệ nảy sinh khi có sứ giả qua lại,
        có giấy tờ ký kết, hoặc có máu đã đổ.
      </p>
    );
  }
  const sorted = [...rows].sort((a, b) => {
    const order: DiploState[] = ["Chiến Tranh", "Đình Chiến", "Liên Minh", "Thần Phục Ta", "Ta Thần Phục", "Hoà Bình"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <div className="space-y-3">
      {sorted.map((r) => (
        <div key={r.houseId} className="glass rounded-[var(--radius-md)] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[14px] text-[var(--text-soft)]">{HOUSES_BY_ID[r.houseId]?.name ?? r.label}</span>
              <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                {HOUSES_BY_ID[r.houseId]?.seat ? `${HOUSES_BY_ID[r.houseId].seat} · ` : ""}thái độ {r.attitude}
              </p>
            </div>
            <Chip text={r.status} tone={STATUS_TONE[r.status]} />
          </div>

          {r.status === "Chiến Tranh" && (
            <div className="mt-2">
              <div className="mb-0.5 flex justify-between text-[10.5px] text-[var(--text-faint)]">
                <span>War Score</span>
                <span className="font-mono">{r.warScore > 0 ? "+" : ""}{r.warScore}</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: r.warScore >= 0 ? "50%" : `${50 + r.warScore / 2}%`,
                    width: `${Math.abs(r.warScore) / 2}%`,
                    background: r.warScore >= 0 ? "var(--ok)" : "var(--danger)",
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--glass-border-bright)]" />
              </div>
            </div>
          )}

          <div className="mt-2"><TrustBar value={r.trust} /></div>

          <div className="mt-2 flex flex-wrap gap-1">
            {r.truceLeft > 0 && <Chip text={`Đình chiến còn ${formatDuration(r.truceLeft)}`} tone="#d97706" />}
            {r.activeTreaties.map((t, i) => <Chip key={i} text={t["Loại"]} tone="var(--ok)" />)}
            {r.tribute > 0 && <Chip text={`Họ cống ${formatCurrencyShort(r.tribute)}/tháng`} tone="var(--ok)" />}
            {r.tribute < 0 && <Chip text={`Ta cống ${formatCurrencyShort(-r.tribute)}/tháng`} tone="var(--danger)" />}
            {r.ourClaim > 0 && <Chip text={`Ta có cớ (${r.ourClaim})`} tone="var(--accent-text)" />}
            {r.theirClaim > 0 && <Chip text={`Họ có cớ (${r.theirClaim})`} tone="var(--danger)" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hiệp Ước ────────────────────────────────────────────────────────────────
function TreatiesTab({ stat, rows }: { stat: Stat; rows: DiploSummary[] }) {
  const today = absoluteDay(stat["Thế Giới"]);
  const all = rows.flatMap((r) =>
    (stat["Quan Hệ Ngoại Giao"][r.houseId]?.["Hiệp Ước"] ?? []).map((t) => ({ houseId: r.houseId, label: r.label, t })),
  );
  if (all.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">Chưa có hiệp ước nào. Giấy tờ chỉ có giá khi có kẻ chịu ký và kẻ chịu giữ lời.</p>;
  }
  const active = all.filter((x) => x.t["Còn Hiệu Lực"]);
  const dead = all.filter((x) => !x.t["Còn Hiệu Lực"]);

  const Card = ({ x, faded }: { x: (typeof all)[number]; faded?: boolean }) => {
    const left = x.t["Ngày Hết Hạn"] > 0 ? x.t["Ngày Hết Hạn"] - today : 0;
    return (
      <div className={`glass rounded-[var(--radius-md)] p-3 ${faded ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13.5px] text-[var(--text-soft)]">
              <IconScroll size={13} color="var(--accent-text)" /> {x.t["Loại"]}
            </span>
            <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">với {HOUSES_BY_ID[x.houseId]?.name ?? x.label}</p>
          </div>
          {x.t["Còn Hiệu Lực"]
            ? <Chip text={x.t["Ngày Hết Hạn"] > 0 ? `còn ${formatDuration(Math.max(0, left))}` : "vĩnh viễn"} tone="var(--ok)" />
            : <Chip text={x.t["Bên Phá"] ? `bị ${x.t["Bên Phá"]} xé` : "hết hạn"} tone="var(--danger)" />}
        </div>
        {x.t["Điều Khoản"] && <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">{x.t["Điều Khoản"]}</p>}
        {x.t["Cống Nạp Tháng"] !== 0 && (
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[var(--text-faint)]">
            <IconCoins size={12} />
            {x.t["Cống Nạp Tháng"] > 0
              ? `họ trả ta ${formatCurrencyShort(x.t["Cống Nạp Tháng"])}/tháng`
              : `ta trả họ ${formatCurrencyShort(-x.t["Cống Nạp Tháng"])}/tháng`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {active.map((x, i) => <Card key={`a${i}`} x={x} />)}
      {dead.length > 0 && (
        <>
          <h3 className="font-display mt-2 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">Giấy tờ đã chết</h3>
          {dead.map((x, i) => <Card key={`d${i}`} x={x} faded />)}
        </>
      )}
    </div>
  );
}

// ── Ân Oán ──────────────────────────────────────────────────────────────────
function GrievancesTab({ stat }: { stat: Stat }) {
  const entries = Object.entries(stat["Quan Hệ Ngoại Giao"] ?? {}).flatMap(([houseId, r]) =>
    r["Ân Oán"].map((g) => ({ houseId, g })),
  );
  if (entries.length === 0) {
    return (
      <p className="text-[13px] italic leading-relaxed text-[var(--text-muted)]">
        Sổ ân oán còn trắng. Một lãnh chúa Westeros không ra quân vì ghét — hắn cần một CỚ nói được
        ra trước mặt người khác.
      </p>
    );
  }
  const ours = entries.filter((x) => x.g["Bên Nợ"] === "Họ Nợ Ta");
  const theirs = entries.filter((x) => x.g["Bên Nợ"] === "Ta Nợ Họ");

  const List = ({ items, tone, title, hint }: { items: typeof entries; tone: string; title: string; hint: string }) => (
    <div>
      <h3 className="font-display mb-1.5 text-[11px] uppercase tracking-widest" style={{ color: tone }}>{title}</h3>
      <p className="mb-2 text-[11px] italic text-[var(--text-faint)]">{hint}</p>
      <div className="space-y-2">
        {items.map((x, i) => (
          <div key={i} className="glass rounded-[var(--radius-sm)] px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12.5px] text-[var(--text-soft)]">{x.g["Việc"]}</span>
              <span className="shrink-0 font-mono text-[11.5px]" style={{ color: tone }}>{x.g["Mức"]}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">{HOUSES_BY_ID[x.houseId]?.name ?? x.houseId}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {ours.length > 0 && (
        <List items={ours} tone="var(--accent-text)" title="Cớ của ta"
          hint="Ta ra quân với những cớ này thì các Nhà khác im lặng." />
      )}
      {theirs.length > 0 && (
        <List items={theirs} tone="var(--danger)" title="Cớ của họ"
          hint="Đây là những món nợ người ta ghi để một ngày đòi lại." />
      )}
    </div>
  );
}

// ── Sứ Giả & Đề Nghị ────────────────────────────────────────────────────────
function EnvoysTab({ stat }: { stat: Stat }) {
  const today = absoluteDay(stat["Thế Giới"]);
  const envoys = Object.entries(stat["Ngoại Giao"]["Sứ Giả"] ?? {});
  const offers = Object.entries(stat["Ngoại Giao"]["Lời Đề Nghị"] ?? {});

  if (envoys.length === 0 && offers.length === 0) {
    return (
      <p className="text-[13px] italic leading-relaxed text-[var(--text-muted)]">
        Không có sứ giả nào trên đường và không lời đề nghị nào đang chờ. Muốn cử sứ thì nói ra trong
        cuộc chơi — quạ bay mất nhiều ngày, người đi mất nhiều tuần.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {offers.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--accent-text)]">
            <IconCrown size={13} /> Đang chờ ngươi trả lời
          </h3>
          <div className="space-y-2">
            {offers.map(([key, o]) => {
              const left = o["Ngày Hết Hạn Trả Lời"] - today;
              return (
                <div key={key} className="glass rounded-[var(--radius-md)] border border-[var(--accent-border)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13.5px] text-[var(--text-soft)]">{o["Loại"]}</span>
                    <Chip text={left > 0 ? `còn ${formatDuration(left)}` : "sắp hết hạn"} tone={left > 7 ? "var(--text-muted)" : "var(--danger)"} />
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                    từ {HOUSES_BY_ID[o["Từ Nhà"]]?.name ?? o["Từ Nhà"]}
                    {o["Ai Mang Tới"] ? ` · do ${o["Ai Mang Tới"]} mang tới` : ""}
                  </p>
                  {o["Điều Khoản"] && <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">{o["Điều Khoản"]}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {o["Cống Nạp Tháng"] !== 0 && (
                      <Chip text={o["Cống Nạp Tháng"] > 0 ? `họ cống ${formatCurrencyShort(o["Cống Nạp Tháng"])}/tháng` : `ta cống ${formatCurrencyShort(-o["Cống Nạp Tháng"])}/tháng`} />
                    )}
                    {o["Số Năm"] > 0 && <Chip text={`${o["Số Năm"]} năm`} />}
                  </div>
                  <p className="mt-2 flex items-start gap-1 text-[11px] italic text-[var(--text-faint)]">
                    <IconAlert size={12} /> Trả lời bằng lời trong cuộc chơi — nhận, mặc cả, hay bác bỏ trước mặt sứ giả.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {envoys.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            <IconSend size={13} /> Sứ giả
          </h3>
          <div className="space-y-2">
            {envoys.map(([name, e]) => (
              <div key={name} className="glass rounded-[var(--radius-sm)] px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] text-[var(--text-soft)]">{name}</span>
                  <Chip text={e["Trạng Thái"]} tone={e["Trạng Thái"] === "Mất Tích" ? "var(--danger)" : undefined} />
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                  {e["Nhiệm Vụ"]} → {HOUSES_BY_ID[e["Tới Nhà"]]?.name ?? e["Tới Nhà"]}
                  {e["Ngày Còn Lại"] > 0 ? ` · còn ${formatDuration(e["Ngày Còn Lại"])}` : ""}
                </p>
                {e["Kết Quả"] && (
                  <p className="mt-1 flex items-start gap-1 text-[11.5px] text-[var(--text-muted)]">
                    <IconCrossedSwords size={12} /> {e["Kết Quả"]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
