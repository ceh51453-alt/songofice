/**
 * TabStatus — DÂN & KHO của một lãnh địa.
 * Ngoài dân số và kho vật tư, bảng này còn cho thấy NHÂN LỰC công trường: bao
 * nhiêu người đang bị giữ trên giàn giáo và còn bao nhiêu để khởi công cái mới.
 */
import React from "react";
import { useMvuStore } from "../../state/mvuStore";
import { RESOURCE_LIST, LABOUR_LIST, type ResourceKey, type LabourKey } from "../../content/westeros/buildings";
import { availableLabour, labourInUse } from "../../territory/construction";
import { combineDecrees, decreeLabourBonus } from "../../content/westeros/decrees";
import { formatCurrencyShort } from "../../economy/currency";
import { IconUsers, IconCoins, IconWheat, IconTree, IconMountain, IconCastle } from "../icons";

type Holding = ReturnType<typeof useMvuStore.getState>["stat"]["Lãnh Địa"][string];

const RES_ICON: Partial<Record<ResourceKey, React.FC<{ size?: number }>>> = {
  "Lương Thực": IconWheat,
  "Gỗ": IconTree,
  "Đá": IconMountain,
  "Quặng Sắt": IconMountain,
  "Than Đá": IconMountain,
  "Thép": IconMountain,
};

const RES_TINT: Record<ResourceKey, string> = {
  "Ngân Khố": "#d4b25a",
  "Lương Thực": "#c9b45c",
  "Gỗ": "#6f8f5c",
  "Đá": "#9a9a94",
  "Quặng Sắt": "#a8815c",
  "Than Đá": "#6e6a66",
  "Thép": "#93a2ac",
  "Vải Vóc": "#a98fa8",
  "Ngựa": "#a58455",
  "Muối": "#c9c9c2",
};

export function TabStatus({ holding }: { territoryId: string; holding: Holding; isOwner?: boolean }) {
  const jobs = (holding["Dân Số Chi Tiết"] ?? {}) as Record<string, number>;
  const res = holding["Tài Nguyên"];
  const pop = holding["Dân Số"] || 0;
  const loyalty = holding["Lòng Dân"] ?? holding["Trung Thành"] ?? 60;

  const free = availableLabour(holding);
  const busy = labourInUse(holding);
  // người bị pháp lệnh lao dịch trưng dụng nằm NGOÀI đầu người của nghề đó
  const levy = decreeLabourBonus(jobs, combineDecrees(holding["Pháp Lệnh"]));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── DÂN CƯ ── */}
        <section className="glass rounded-[var(--radius-md)] p-4">
          <h2 className="font-display mb-3 flex items-center gap-2 border-b border-[var(--glass-border)] pb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">
            <IconUsers size={15} /> Dân Cư
          </h2>
          <div className="flex items-end justify-between">
            <span className="font-mono text-[26px] text-[var(--text-soft)]">{pop.toLocaleString("vi-VN")}</span>
            <span className="text-[12px] text-[var(--text-muted)]">tổng nhân khẩu</span>
          </div>

          <div className="mt-3 space-y-1">
            <Row label="Nông Dân" value={jobs["Nông Dân"] ?? 0} />
            <Row label="Thợ Thủ Công" value={jobs["Thợ Thủ Công"] ?? 0} />
            <Row label="Thợ Mỏ" value={jobs["Thợ Mỏ"] ?? 0} />
            <Row label="Tiều Phu" value={jobs["Tiều Phu"] ?? 0} />
            <Row label="Thương Nhân" value={jobs["Thương Nhân"] ?? 0} />
            <Row label="Nghề Khác" value={jobs["Nghề Khác"] ?? 0} />
            <Row label="Thất Nghiệp" value={jobs["Thất Nghiệp"] ?? 0} warning={(jobs["Thất Nghiệp"] ?? 0) > pop * 0.1} />
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11.5px] text-[var(--text-muted)]">
              <span>Lòng Dân</span>
              <span className={loyalty < 30 ? "text-[var(--danger)]" : "text-[var(--ok)]"}>{loyalty}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.4)]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${loyalty}%`,
                  background: loyalty < 30 ? "var(--danger)" : loyalty < 60 ? "var(--warn)" : "var(--ok)",
                }}
              />
            </div>
          </div>
        </section>

        {/* ── NHÂN LỰC CÔNG TRƯỜNG ── */}
        <section className="glass rounded-[var(--radius-md)] p-4">
          <h2 className="font-display mb-3 flex items-center gap-2 border-b border-[var(--glass-border)] pb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">
            <IconCastle size={15} /> Nhân Lực Công Trường
          </h2>
          <p className="mb-3 text-[11.5px] italic text-[var(--text-faint)]">
            Công trường giữ người suốt thời gian thi công. Hết thợ là hết khởi công, dù kho vàng còn đầy.
          </p>
          <div className="space-y-2">
            {LABOUR_LIST.map((k: LabourKey) => {
              const base = jobs[k] ?? 0;
              const levied = levy[k] ?? 0;
              const total = base + levied;
              const inUse = busy[k];
              const ready = free[k];
              const pct = total > 0 ? Math.min(100, (inUse / total) * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="text-[var(--text-muted)]">{k}</span>
                    <span className="font-mono text-[var(--text-soft)]">
                      {ready.toLocaleString("vi-VN")}
                      <span className="text-[var(--text-faint)]"> rảnh / {total.toLocaleString("vi-VN")}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.4)]">
                    <div className="h-full bg-[var(--warn)]" style={{ width: `${pct}%` }} />
                  </div>
                  {(inUse > 0 || levied > 0) && (
                    <div className="mt-0.5 text-[10.5px] text-[var(--text-faint)]">
                      {inUse > 0 ? `${inUse.toLocaleString("vi-VN")} đang trên giàn giáo` : ""}
                      {inUse > 0 && levied > 0 ? " · " : ""}
                      {levied > 0 ? `${levied.toLocaleString("vi-VN")} do lao dịch trưng dụng` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── KHO VẬT TƯ ── */}
      <section className="glass rounded-[var(--radius-md)] p-4">
        <h2 className="font-display mb-3 flex items-center gap-2 border-b border-[var(--glass-border)] pb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">
          <IconCoins size={15} /> Kho Vật Tư
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {RESOURCE_LIST.filter((k) => k !== "Ngân Khố").map((k) => {
            const Icon = RES_ICON[k];
            return (
              <div key={k} className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                  {Icon ? <Icon size={13} /> : <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RES_TINT[k] }} />}
                  {k}
                </div>
                <div className="mt-1 font-mono text-[15px]" style={{ color: RES_TINT[k] }}>
                  {(res[k] ?? 0).toLocaleString("vi-VN")}
                </div>
              </div>
            );
          })}
          <div className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]"><IconCoins size={13} /> Ngân Khố</div>
            <div className="mt-1 font-mono text-[13px] text-[var(--accent-text)]">{formatCurrencyShort(res["Ngân Khố"] ?? 0)}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-1 text-[12.5px] last:border-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`font-mono ${warning ? "text-[var(--danger)]" : "text-[var(--text-soft)]"}`}>
        {value.toLocaleString("vi-VN")}
      </span>
    </div>
  );
}
