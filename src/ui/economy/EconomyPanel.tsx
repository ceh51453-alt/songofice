/**
 * EconomyPanel (15.5) — bảng tổng quan kinh tế, glassmorphism premium.
 * Mở từ left rail icon. Bao gồm:
 * - Ngân khố: tổng Vàng + sparkline + cảnh báo cạn kho
 * - Tài nguyên theo lãnh địa (grid)
 * - Thuế: TaxSlider
 * - Thương mại: danh sách tuyến + lợi nhuận
 * - Iron Bank: thanh nợ
 * - Khủng hoảng: banner cảnh báo
 */
import { useMemo } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useEconomyStore, economySummary } from "../../state/economyStore";
import { Sparkline } from "./Sparkline";
import { TaxSlider } from "./TaxSlider";
import {
  IconCoin, IconWheat, IconTree, IconStone, IconAnvil,
  IconShip, IconBank, IconFlame, IconTrend,
} from "./EconomyIcons";
import { IconX } from "../icons";
import type { TaxLevel } from "../../mvu/schema";
import { isBlockaded } from "../../economy/economyEngine";
import { hasPrivilege, canManageDomain } from "../../character/roleplay";

// ── Helpers ──────────────────────────────────────────────────────────────────

function ResourceIcon({ name, size = 14 }: { name: string; size?: number }) {
  const icons: Record<string, typeof IconCoin> = {
    "Vàng": IconCoin,
    "Lương Thực": IconWheat,
    "Gỗ": IconTree,
    "Đá": IconStone,
    "Quặng Sắt": IconAnvil,
  };
  const Icon = icons[name] ?? IconCoin;
  return <Icon size={size} />;
}

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

// ── Panel ────────────────────────────────────────────────────────────────────

export function EconomyPanel() {
  const open = useEconomyStore((s) => s.panelOpen);
  const close = useEconomyStore((s) => s.closePanel);
  const goldHistory = useEconomyStore((s) => s.goldHistory);
  const sparkData = useMemo(() => goldHistory.map((h) => h.gold), [goldHistory]);
  const stat = useMvuStore((s) => s.stat);
  const summary = economySummary(stat);
  const holdings = Object.entries(stat["Lãnh Địa"]);
  const routes = Object.entries(stat["Tuyến Thương Mại"]);
  const bank = stat["Nợ Iron Bank"];

  // Collect crises across all territories
  const crises: { region: string; crisis: string; severity: string }[] = [];
  for (const [id, t] of holdings) {
    for (const c of t["Khủng Hoảng"] ?? []) {
      crises.push({ region: id, crisis: c["Loại"], severity: c["Mức Độ"] });
    }
  }

  const canChangeTax = hasPrivilege(stat, "Thu Thuế Toàn Cõi") || hasPrivilege(stat, "Thu Thuế Chư Hầu (Vùng)") || canManageDomain(stat);

  const handleTaxChange = (level: TaxLevel) => {
    if (canChangeTax) {
      useMvuStore.getState().setByPath("stat_data.Chính Sách Thuế.Mức Thuế", level);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div
        className="glass-strong relative mt-12 w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--glass-border)] p-5 shadow-2xl sm:mt-20"
        style={{ maxHeight: "calc(100dvh - 6rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconCoin size={22} color="var(--accent-text)" />
            <h2 className="font-display text-lg tracking-wide text-[var(--accent-text)]">
              Kinh Tế
            </h2>
          </div>
          <button onClick={close} className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </div>

        {/* ── Treasury Overview ── */}
        <section className="glass-panel mb-4 rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Ngân Khố</p>
              <p className="font-display text-2xl tracking-tight text-[var(--text-soft)]">
                {fmt(summary.gold)} <span className="text-[13px] text-[var(--text-faint)]">Vàng</span>
              </p>
            </div>
            {sparkData.length >= 2 && (
              <Sparkline data={sparkData} width={100} height={28} />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--text-faint)]">Thu thuế</span>
              <span className="font-mono text-[var(--ok)]">+{fmt(summary.taxIncome)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--text-faint)]">Thương mại</span>
              <span className="font-mono text-[var(--ok)]">+{fmt(summary.tradeIncome)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--text-faint)]">Iron Bank</span>
              <span className={`font-mono ${summary.ironBankExpense > 0 ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>
                {summary.ironBankExpense > 0 ? `-${fmt(summary.ironBankExpense)}` : "0"}
              </span>
            </div>
          </div>

          {/* Net income bar */}
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--glass-border)] pt-3">
            <IconTrend size={14} color={summary.net >= 0 ? "var(--ok)" : "var(--danger)"} />
            <span className={`text-[13px] font-medium ${summary.net >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
              Ròng: {summary.net >= 0 ? "+" : ""}{fmt(summary.net)}/turn
            </span>
            {summary.turnsLeft >= 0 && summary.turnsLeft < 30 && (
              <span className="ml-auto text-[11px] text-[var(--danger)]">
                Cạn kho sau ~{summary.turnsLeft} turn
              </span>
            )}
          </div>
        </section>

        {/* ── Crisis Alerts ── */}
        {crises.length > 0 && (
          <section className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[rgba(248,113,113,0.06)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <IconFlame size={16} color="var(--danger)" />
              <span className="text-[13px] font-medium text-[var(--danger)]">Khủng Hoảng</span>
            </div>
            <div className="space-y-1">
              {crises.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    c.severity === "Thảm Hoạ" ? "bg-[var(--danger)] text-white"
                    : c.severity === "Nghiêm Trọng" ? "bg-[var(--warning)] text-[var(--bg-deep)]"
                    : "bg-[var(--glass-bg-hover)] text-[var(--text-soft)]"
                  }`}>
                    {c.severity}
                  </span>
                  <span>{c.crisis}</span>
                  <span className="text-[var(--text-faint)]">({c.region})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tax Policy ── */}
        <section className="mb-4">
          <TaxSlider 
            currentLevel={summary.taxLevel} 
            onChangeLevel={handleTaxChange}
            disabled={!canChangeTax}
          />
          {!canChangeTax && (
            <p className="mt-2 text-[11px] italic text-[var(--text-faint)] text-center">
              Bạn không có tước vị đủ cao để thay đổi chính sách thuế.
            </p>
          )}
        </section>

        {/* ── Territory Resources Grid ── */}
        {holdings.length > 0 && (
          <section className="glass-panel mb-4 overflow-x-auto rounded-xl p-4">
            <p className="mb-3 text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Tài Nguyên Lãnh Địa</p>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-left text-[var(--text-faint)]">
                  <th className="pb-2 font-normal">Vùng</th>
                  <th className="pb-2 font-normal text-center"><ResourceIcon name="Vàng" /></th>
                  <th className="pb-2 font-normal text-center"><ResourceIcon name="Lương Thực" /></th>
                  <th className="pb-2 font-normal text-center"><ResourceIcon name="Gỗ" /></th>
                  <th className="pb-2 font-normal text-center"><ResourceIcon name="Đá" /></th>
                  <th className="pb-2 font-normal text-center"><ResourceIcon name="Quặng Sắt" /></th>
                  <th className="pb-2 font-normal text-center">Dân</th>
                  <th className="pb-2 font-normal text-center">Trung</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(([id, t]) => {
                  const res = t["Tài Nguyên"];
                  const hasCrisis = (t["Khủng Hoảng"]?.length ?? 0) > 0;
                  return (
                    <tr key={id} className={`border-b border-[var(--glass-border)]/50 ${hasCrisis ? "text-[var(--danger)]" : "text-[var(--text-soft)]"}`}>
                      <td className="py-1.5 pr-2">{id}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(res["Vàng"])}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(res["Lương Thực"])}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(res["Gỗ"])}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(res["Đá"])}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(res["Quặng Sắt"])}</td>
                      <td className="py-1.5 text-center font-mono">{fmt(t["Dân Số"])}</td>
                      <td className={`py-1.5 text-center font-mono ${t["Trung Thành"] < 30 ? "text-[var(--danger)]" : ""}`}>
                        {t["Trung Thành"]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Trade Routes ── */}
        <section className="glass-panel mb-4 rounded-xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <IconShip size={16} color="var(--accent-text)" />
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Tuyến Thương Mại</p>
            <span className="ml-auto text-[12px] text-[var(--text-muted)]">{routes.length} tuyến</span>
          </div>

          {routes.length === 0 ? (
            <p className="text-[12px] text-[var(--text-faint)]">Chưa có tuyến thương mại nào.</p>
          ) : (
            <div className="space-y-2">
              {routes.map(([name, route]) => {
                const blocked = route["Đường"] === "Biển" && isBlockaded(stat, route["Đến"]);
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] transition-colors ${
                      blocked
                        ? "bg-[rgba(248,113,113,0.06)] line-through text-[var(--text-faint)]"
                        : "bg-[var(--glass-bg)] text-[var(--text-soft)]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                      route["Đường"] === "Biển" ? "bg-blue-500/10 text-blue-400" :
                      route["Đường"] === "Sông" ? "bg-cyan-500/10 text-cyan-400" :
                      "bg-[var(--glass-bg-hover)] text-[var(--text-muted)]"
                    }`}>
                      {route["Đường"]}
                    </span>
                    <span className="font-mono text-[var(--ok)]">+{route["Lợi Nhuận/Turn"]}</span>
                    {/* Safety bar */}
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-[var(--glass-bg-hover)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${route["An Toàn"]}%`,
                          backgroundColor: route["An Toàn"] > 60 ? "var(--ok)" : route["An Toàn"] > 30 ? "var(--warning)" : "var(--danger)",
                        }}
                      />
                    </div>
                    {blocked && (
                      <span className="text-[10px] text-[var(--danger)]">Phong toả</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Iron Bank ── */}
        {(bank["Nợ Gốc"] > 0 || bank["Đang Quỵt"]) && (
          <section className="glass-panel mb-4 rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <IconBank size={16} color={bank["Đang Quỵt"] ? "var(--danger)" : "var(--accent-text)"} />
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Iron Bank of Braavos</p>
            </div>
            {bank["Đang Quỵt"] ? (
              <p className="text-[13px] font-medium text-[var(--danger)]">
                Đã quỵt nợ. Iron Bank sẽ tìm cách trả thù.
              </p>
            ) : (
              <div className="space-y-1 text-[12px] text-[var(--text-soft)]">
                <div className="flex justify-between">
                  <span>Nợ gốc</span>
                  <span className="font-mono">{fmt(bank["Nợ Gốc"])}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lãi/turn</span>
                  <span className="font-mono text-[var(--danger)]">-{fmt(bank["Lãi/Turn"])}</span>
                </div>
                <div className="flex justify-between">
                  <span>Turn còn lại</span>
                  <span className="font-mono">{bank["Turn Còn Lại"]}</span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
