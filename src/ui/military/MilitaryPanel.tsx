/**
 * MilitaryPanel (11.5 + đại tu M19) — bảng Quân Đội kính mờ, mở từ rail Quân Sự.
 *
 * Năm tab, mỗi tab là một mặt của chế độ quân sự phong kiến:
 * - Lực Lượng: đơn vị gom theo NGẠCH (chính quy / phục dịch / chư hầu / đánh
 *   thuê), đủ chỉ số chiến đấu, hạn nghĩa vụ, hậu cần, kinh nghiệm;
 * - Chư Hầu:   phất cờ hiệu triệu, xem nhà nào đang trên đường, nhà nào từ chối;
 * - Tuyển Mộ:  BA cửa tuyển khác nhau, mỗi cửa một điều kiện — đây là hành động
 *              duy nhất người chơi bấm tay được (mọi thứ khác đi theo lời kể);
 * - Rồng:      đọc CHUNG bảng "Rồng" với thanh trạng thái (dùng chung DragonCard);
 * - Hạm Đội:   hải chiến / đổ bộ / phong toả.
 * Ngoại giao ĐÃ TÁCH RA bảng riêng (ui/diplomacy/DiplomacyPanel) — quân sự lo
 * việc binh, ngoại giao lo việc giấy tờ và lời thề.
 *
 * Engine giữ số; panel chỉ gọi militaryStore. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useMilitaryStore } from "../../state/militaryStore";

import { formatDuration } from "../../mvu/calendar";
import { MACRO_REGIONS, REGIONS_BY_ID } from "../../content/westeros/regions";
import { playerHouseId, strongholdForState, toHouseId } from "../../territory/territoryEngine";
import { formatCurrencyShort } from "../../economy/currency";
import { recruitableTroopsForBranch, troopMeta, troopPower, type TroopTypeAll } from "../../content/westeros/troopTypes";
import { branchMeta } from "../../content/westeros/armyBranches";
import { ARMY_BRANCHES, type ArmyBranch } from "../../mvu/schema";
import {
  canRecruitAt, recruitableHoldings, recruitCapFor, recruitCost, availableCompanies,
} from "../../strategy/army";
import {
  callableVassals, canCallBanners, effectiveBannerLoyalty, musteredStrength,
  runtimeVassalCommitment,
} from "../../strategy/muster";
import { mobilizeAt, homeSupportAt, battleLocation, unitAvailability } from "../../combat/mobilization";
import { playerDragons, dragonSummary, DRAGON_TAMING_THRESHOLD } from "../../strategy/dragons";
import { GlassButton } from "../components/GlassButton";
import { GlassSelect } from "../components/GlassSelect";
import { DragonCard } from "./DragonCard";
import { useT } from "../../i18n";
import { IconX, IconShield, IconCrossedSwords, IconCoins, IconWheat, IconMap, IconUsers, IconDragon, IconCrown } from "../icons";

type Tab = "forces" | "vassals" | "recruit" | "dragons" | "fleet";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

/** Select có options[] + onChange(value) — bọc GlassSelect (native option). */
function OptSelect({ value, onChange, options, className }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <GlassSelect value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </GlassSelect>
  );
}

export function MilitaryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("forces");
  if (!open) return null;

  const drg = dragonSummary(stat);
  const tabs: { key: Tab; label: string }[] = [
    { key: "forces", label: t("mil.tabForces") },
    { key: "vassals", label: "Chư Hầu" },
    { key: "recruit", label: t("mil.tabRecruit") },
    { key: "dragons", label: drg.total > 0 ? `Rồng (${drg.total})` : "Rồng" },
    { key: "fleet", label: t("mil.tabFleet") },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={t("game.navMilitary")}>
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)]" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconShield size={19} color="var(--accent-text)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">{t("game.navMilitary")}</h2>
          </div>
          <button onClick={onClose} aria-label={t("conn.close")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </div>

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
          {tab === "forces" && <ForcesTab stat={stat} />}
          {tab === "vassals" && <VassalsTab stat={stat} />}
          {tab === "recruit" && <RecruitTab stat={stat} />}
          {tab === "dragons" && <DragonsTab stat={stat} />}
          {tab === "fleet" && <FleetTab stat={stat} />}
        </div>
      </aside>
    </div>
  );
}

type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

// ── Lực Lượng ────────────────────────────────────────────────────────────────

const BRANCH_TONE: Record<ArmyBranch, string> = {
  "Chính Quy": "var(--ok)",
  "Phục Dịch": "#d97706",
  "Chư Hầu": "var(--accent-text)",
  "Đánh Thuê": "#b06a5f",
};

function ForcesTab({ stat }: { stat: Stat }) {
  const t = useT();
  const disband = useMilitaryStore((s) => s.disband);
  const extendLevy = useMilitaryStore((s) => s.extendLevy);
  const [msg, setMsg] = useState<string | null>(null);
  const pHouse = playerHouseId(stat);
  const units = Object.entries(stat["Biên Chế Quân Sự"]).filter(
    ([, u]) => u["Số Lượng"] > 0 && (!u["Nhà"] || !pHouse || String(u["Nhà"]).toLowerCase() === String(pHouse).toLowerCase()),
  );

  if (units.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">{t("mil.noUnits")}</p>;
  }

  const total = units.reduce((s, [, u]) => s + u["Số Lượng"], 0);
  const ready = units.filter(([, u]) => u["Ngày Tập Hợp Còn Lại"] <= 0 && u["Ngày Huấn Luyện"] <= 0).reduce((s, [, u]) => s + u["Số Lượng"], 0);
  const byBranch = new Map<ArmyBranch, number>();
  for (const [, u] of units) byBranch.set(u["Ngạch"], (byBranch.get(u["Ngạch"]) ?? 0) + u["Số Lượng"]);

  return (
    <div className="space-y-3">
      {/* tổng quan lực lượng */}
      <div className="glass rounded-[var(--radius-md)] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-[var(--text-soft)]">Tổng binh lực</span>
          <span className="font-mono text-[16px] text-[var(--accent-text)]">{fmt(total)}</span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
          {fmt(ready)} sẵn sàng chiến đấu · {fmt(total - ready)} đang tập hợp/huấn luyện
        </p>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
          {[...byBranch].map(([b, n]) => (
            <div key={b} title={`${b}: ${fmt(n)}`} style={{ width: `${(n / total) * 100}%`, background: BRANCH_TONE[b] }} />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
          {[...byBranch].map(([b, n]) => (
            <span key={b} className="flex items-center gap-1 text-[var(--text-muted)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: BRANCH_TONE[b] }} />
              {b} {fmt(n)}
            </span>
          ))}
        </div>
      </div>

      {msg && <p className="text-[12px] text-[var(--accent-text)]">{msg}</p>}

      {/* M23 — bảng huy động: ai ra trận được NGAY tại nơi lãnh chúa đang đứng */}
      {(() => {
        const here = battleLocation(stat);
        const report = mobilizeAt(stat, here);
        const support = homeSupportAt(stat, here);
        if (report.fielded.length === 0 && report.absent.length === 0) return null;
        return (
          <div className="glass rounded-[var(--radius-md)] p-3">
            <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
              Sẵn sàng giao chiến tại {here || "vị trí hiện tại"}
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-soft)]">
              <b className="text-[var(--ok)]">{fmt(report.fieldedTroops)}</b> quân có mặt
              {report.absentTroops > 0 && (
                <> · <b className="text-[var(--warn)]">{fmt(report.absentTroops)}</b> chưa tới kịp</>
              )}
            </p>
            {report.absent.slice(0, 3).map((a) => (
              <p key={a.name} className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                • {a.name} ({fmt(a.troops)}) — {a.detail}
              </p>
            ))}
            {support.lines.length > 0 && (
              <>
                <p className="mt-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
                  Công trình hậu thuẫn
                </p>
                {support.lines.slice(0, 4).map((l, i) => (
                  <p key={i} className="text-[11px] text-[var(--ok)]">• {l}</p>
                ))}
              </>
            )}
          </div>
        );
      })()}

      {units.map(([name, u]) => {
        const loc = REGIONS_BY_ID[u["Lãnh Địa Đồn Trú"]]?.name ?? u["Lãnh Địa Đồn Trú"] ?? "—";
        const availability = unitAvailability(name, u, battleLocation(stat));
        const movingTo = u["Đang Di Chuyển Đến"] ? REGIONS_BY_ID[u["Đang Di Chuyển Đến"]]?.name : null;
        const siegeTarget = u["Lệnh Vây Khi Đến"]
          ? strongholdForState(stat, u["Lệnh Vây Khi Đến"])?.name
            ?? REGIONS_BY_ID[u["Lệnh Vây Khi Đến"]]?.name
            ?? u["Lệnh Vây Khi Đến"]
          : null;
        const mustering = u["Ngày Tập Hợp Còn Lại"] > 0;
        const training = u["Ngày Huấn Luyện"] > 0;
        const meta = troopMeta(u["Loại Quân"]);
        const br = branchMeta(u["Ngạch"]);
        const levyEnding = u["Hạn Phục Dịch Còn Lại"] > 0 && u["Hạn Phục Dịch Còn Lại"] <= 15;
        return (
          <div key={name} className="glass rounded-[var(--radius-md)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <IconCrossedSwords size={14} color="var(--accent-text)" />
                  <span className="truncate text-[14px] text-[var(--text-soft)]">{name}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                  {u["Loại Quân"]} · {u["Tướng Chỉ Huy"]}
                </p>
                <p
                  className={`mt-0.5 text-[11px] ${availability.ok ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}
                  title={availability.ok ? "Đơn vị này ra trận được ngay" : availability.absent.detail}
                >
                  {availability.ok ? "✓ Ra trận được ngay" : `✕ ${availability.absent.reason} — ${availability.absent.detail}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="block font-mono text-[14px] text-[var(--text-soft)]">{fmt(u["Số Lượng"])}</span>
                <span
                  className="block rounded-full px-1.5 text-[10px]"
                  style={{ color: BRANCH_TONE[u["Ngạch"]], border: `1px solid ${BRANCH_TONE[u["Ngạch"]]}44` }}
                >
                  {u["Ngạch"]}
                </span>
              </div>
            </div>

            {/* chỉ số chiến đấu của binh chủng */}
            <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-1 text-[10.5px]">
              {(Object.entries(meta.stats) as [string, number][])
                .filter(([, v]) => v > 0)
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-[var(--text-faint)]">{k}</span>
                    <span className="font-mono text-[var(--text-muted)]">{v}</span>
                  </div>
                ))}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge text={u["Sĩ Khí"]} />
              <Badge text={`${u["Huấn Luyện"]} · KN ${u["Kinh Nghiệm"]}`} />
              <Badge text={u["Trang Bị"]} />
              <Badge text={`Hậu cần: ${u["Hậu Cần"]}`} />
              {u["Thương Binh"] > 0 && <Badge text={`${fmt(u["Thương Binh"])} thương binh`} />}
              {u["Số Trận Đã Đánh"] > 0 && <Badge text={`${u["Số Trận Đã Đánh"]} trận`} />}
            </div>

            <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
              {mustering
                ? `Đang tập hợp — còn ${formatDuration(u["Ngày Tập Hợp Còn Lại"])} mới tụ đủ quân`
                : training
                  ? t("mil.training", { n: formatDuration(u["Ngày Huấn Luyện"]) })
                  : movingTo
                    ? siegeTarget
                      ? `Đang hành quân tới ${movingTo} để vây ${siegeTarget} — còn ${formatDuration(u["Ngày Hành Quân Còn Lại"])}`
                      : t("mil.movingTo", { region: movingTo, n: formatDuration(u["Ngày Hành Quân Còn Lại"]) })
                    : siegeTarget
                      ? `Đang dựng trại vây ${siegeTarget} — còn ${formatDuration(u["Ngày Dựng Trại Vây Còn Lại"])}`
                      : t("mil.stationed", { region: loc })}
            </p>

            {u["Hạn Phục Dịch Còn Lại"] > 0 && (
              <p className={`mt-1 text-[11.5px] ${levyEnding ? "text-[var(--danger)]" : "text-[var(--text-faint)]"}`}>
                Hạn nghĩa vụ còn {formatDuration(u["Hạn Phục Dịch Còn Lại"])}
                {levyEnding ? " — lính đã nghĩ tới đồng ruộng, hết hạn là rã ngũ" : ""}
              </p>
            )}
            {u["Ghi Chú"] && <p className="mt-1 text-[11px] italic text-[var(--text-faint)]">{u["Ghi Chú"]}</p>}

            <div className="mt-2 flex gap-2">
              {u["Hạn Phục Dịch Còn Lại"] > 0 && (
                <button
                  onClick={() => {
                    const r = extendLevy(name, 60);
                    setMsg(r.ok ? `Đã gia hạn nghĩa vụ cho ${name} — lòng dân sụt một ít.` : r.error ?? null);
                  }}
                  className="flex-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1 text-[11.5px] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                >
                  Gia hạn 2 tháng
                </button>
              )}
              {br.dismissible && (
                <button
                  onClick={() => {
                    const r = disband(name);
                    setMsg(r.ok ? `${name} đã giải ngũ, người về ruộng.` : r.error ?? null);
                  }}
                  className="flex-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1 text-[11.5px] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                >
                  Giải ngũ
                </button>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-[11.5px] italic text-[var(--text-faint)]">
        Điều quân, vây thành và giao chiến diễn ra theo diễn biến lời kể — hãy nói ra ý định của ngươi trong cuộc chơi.
      </p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10.5px] text-[var(--text-muted)]">{text}</span>;
}

// ── Chư Hầu (M19) ────────────────────────────────────────────────────────────
function VassalsTab({ stat }: { stat: Stat }) {
  const call = useMilitaryStore((s) => s.callBanners);
  const dismiss = useMilitaryStore((s) => s.dismissBanner);
  const [msg, setMsg] = useState<string | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const vassals = callableVassals(stat);
  const liegeHouse = playerHouseId(stat);
  const allowed = canCallBanners(stat);
  const strength = musteredStrength(stat);

  if (vassals.length === 0) {
    return (
      <p className="text-[13px] italic text-[var(--text-muted)]">
        Tước vị hiện tại chưa tạo nghĩa vụ chư hầu nào. Quyền hiệu triệu đến từ tước vị và phạm vi pháp lý; chiếm đất chỉ quyết định họ đã thực sự thần phục hay chưa.
      </p>
    );
  }

  const regions = [...new Set(vassals.map(([, v]) => v["Vùng"]))];
  const realmName = (id: string) => MACRO_REGIONS.find((realm) => realm.legacyRegionId === id || realm.id === id)?.name
    ?? REGIONS_BY_ID[id]?.name
    ?? id;

  return (
    <div className="space-y-3">
      <div className="glass rounded-[var(--radius-md)] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-[var(--text-soft)]">Quân chư hầu</span>
          <span className="font-mono text-[15px] text-[var(--accent-text)]">{fmt(strength.present)}</span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
          đang dưới cờ · {fmt(strength.marching)} trên đường · tổng cam kết ~{fmt(strength.pledged)}
        </p>
        {!allowed && (
          <p className="mt-1.5 text-[11.5px] text-[var(--danger)]">
            Tước vị của ngươi chưa có quyền hiệu triệu chư hầu.
          </p>
        )}
      </div>

      {allowed && (
        <div className="flex flex-wrap gap-2">
          <GlassButton
            variant="accent"
            className="flex-1"
            onClick={() => {
              const r = call();
              setMsg(r.ok ? null : r.error ?? null);
              setReplies(r.responses?.map((x) => x.reply) ?? []);
            }}
          >
            <IconCrown size={14} /> Phất cờ toàn cõi
          </GlassButton>
          {regions.map((rid) => (
            <GlassButton
              key={rid}
              className="px-2 py-1 text-[11.5px]"
              onClick={() => {
                const r = call(rid);
                setMsg(r.ok ? null : r.error ?? null);
                setReplies(r.responses?.map((x) => x.reply) ?? []);
              }}
            >
              Gọi {realmName(rid)}
            </GlassButton>
          ))}
        </div>
      )}

      {msg && <p className="text-[12px] text-[var(--danger)]">{msg}</p>}
      {replies.length > 0 && (
        <div className="glass rounded-[var(--radius-sm)] p-3">
          <h4 className="mb-1 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">Hồi đáp</h4>
          {replies.map((r, i) => (
            <p key={i} className="text-[12px] leading-relaxed text-[var(--text-muted)]">{r}</p>
          ))}
        </div>
      )}

      {vassals.map(([id, v]) => {
        const submitted = !!liegeHouse && toHouseId(v["Chủ Của"]) === liegeHouse;
        const commitment = runtimeVassalCommitment(stat, id, v);
        const effectiveLoyalty = Math.max(0, Math.min(100, Math.round(effectiveBannerLoyalty(stat, id, v))));
        return <div key={id} className="glass rounded-[var(--radius-md)] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[14px] text-[var(--text-soft)]">{v["Tên Nhà"]}</span>
              <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                {v["Thành Trì"]} · {realmName(v["Vùng"])} · {v["Binh Chủng Chính"]}
              </p>
              <p className={`mt-1 text-[10.5px] ${submitted ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
                {submitted ? "Đã thừa nhận quyền bá chủ" : "Nghĩa vụ pháp lý · chưa thần phục trên thực địa"}
              </p>
            </div>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-[13px] text-[var(--text-soft)]">{fmt(commitment)}</span>
              <span className="block text-[10px] text-[var(--text-faint)]">khả năng cam kết</span>
            </span>
          </div>

          <div className="mt-1.5">
            <div className="mb-0.5 flex justify-between text-[11px] text-[var(--text-faint)]">
              <span>Thiện chí hiệu triệu</span>
              <span className="font-mono">{effectiveLoyalty}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${effectiveLoyalty}%`,
                  background: effectiveLoyalty >= 70 ? "var(--ok)" : effectiveLoyalty >= 40 ? "#d97706" : "var(--danger)",
                }}
              />
            </div>
          </div>

          <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
            {v["Trạng Thái"] === "Đang Hành Quân"
              ? `Đang hành quân: ${fmt(v["Quân Đã Gửi"])} quân, còn ${formatDuration(v["Ngày Tới Nơi"])}`
              : v["Trạng Thái"] === "Đã Tới"
                ? `Đã có mặt: ${fmt(v["Quân Đã Gửi"])} quân · tòng quân ${formatDuration(v["Ngày Tòng Quân"])}`
              : v["Trạng Thái"] === "Từ Chối"
                  ? "Đã từ chối lời hiệu triệu — quyền bá chủ vẫn chưa được công nhận"
                  : submitted ? "Đang ở nhà" : "Có thể nhận lời, trì hoãn hoặc công khai từ chối"}
          </p>
          {v["Ghi Chú"] && <p className="mt-1 text-[11px] italic text-[var(--text-faint)]">{v["Ghi Chú"]}</p>}

          {(v["Trạng Thái"] === "Đã Tới" || v["Trạng Thái"] === "Đang Hành Quân") && (
            <button
              onClick={() => dismiss(id)}
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1 text-[11.5px] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
            >
              Cho về nhà
            </button>
          )}
        </div>;
      })}
    </div>
  );
}

// ── Tuyển Mộ (M19: 3 cửa tuyển) ──────────────────────────────────────────────
function RecruitTab({ stat }: { stat: Stat }) {
  const t = useT();
  const [branch, setBranch] = useState<ArmyBranch>("Chính Quy");
  const branches = ARMY_BRANCHES.filter((b) => b !== "Chư Hầu");

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {branches.map((b) => (
          <button
            key={b}
            onClick={() => setBranch(b)}
            className={`flex-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] transition-colors ${
              branch === b ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
      <p className="text-[11.5px] italic leading-relaxed text-[var(--text-faint)]">{branchMeta(branch).desc}</p>

      {branch === "Đánh Thuê" ? <HireBox stat={stat} /> : <RaiseBox stat={stat} branch={branch} />}

      <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("mil.recruitNote")}</p>
    </div>
  );
}

/** Gọi quân từ đất của mình (Chính Quy / Phục Dịch). */
function RaiseBox({ stat, branch }: { stat: Stat; branch: ArmyBranch }) {
  const t = useT();
  const recruit = useMilitaryStore((s) => s.recruit);
  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const holdings = recruitableHoldings(stat, branch);
  const [terr, setTerr] = useState(holdings[0] ?? "");
  const [type, setType] = useState<TroopTypeAll>("Bộ Binh");
  const [count, setCount] = useState(200);
  const [msg, setMsg] = useState<string | null>(null);

  // lãnh địa/binh chủng có thể đổi khi ngạch đổi — bám lại lựa chọn hợp lệ
  const territory = holdings.includes(terr) ? terr : holdings[0] ?? "";
  const troops = recruitableTroopsForBranch(eraId, branch, {
    regionId: territory,
    cultureId: stat["Thông Tin Nhân Vật"]["Văn Hoá"],
  });
  const troopType = troops.includes(type) ? type : troops[0] ?? "Bộ Binh";

  if (holdings.length === 0) {
    const anyHolding = Object.keys(stat["Lãnh Địa"])[0];
    const why = anyHolding ? canRecruitAt(stat, anyHolding, branch).reason : "Ngươi chưa cai quản thành trì trực thuộc nào";
    return (
      <div className="glass rounded-[var(--radius-md)] p-3">
        <p className="text-[13px] text-[var(--text-muted)]">Không có nơi nào tuyển được ngạch {branch}.</p>
        <p className="mt-1 text-[11.5px] italic text-[var(--text-faint)]">Lý do: {why ?? "chưa đủ điều kiện"}.</p>
      </div>
    );
  }
  if (troops.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">Thời kỳ này không có binh chủng nào thuộc ngạch {branch}.</p>;
  }

  const meta = troopMeta(troopType);
  const cap = territory ? recruitCapFor(stat, territory, branch) : 0;
  const cost = recruitCost(troopType, branch, count);

  return (
    <div className="space-y-3">
      <Field label={t("mil.atHolding")}>
        <OptSelect value={territory} onChange={setTerr} options={holdings.map((id) => ({ value: id, label: REGIONS_BY_ID[id]?.name ?? id }))} />
      </Field>
      <Field label={t("mil.troopType")}>
        <OptSelect
          value={troopType}
          onChange={(v) => setType(v as TroopTypeAll)}
          options={troops.map((tt) => ({ value: tt, label: `${tt} — sức ${troopPower(tt)}` }))}
        />
      </Field>
      <p className="text-[11.5px] italic leading-relaxed text-[var(--text-faint)]">{meta.desc}</p>

      <Field label={t("mil.count", { max: cap })}>
        <input
          type="number"
          min={1}
          max={cap}
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-[13px] text-[var(--text-soft)]"
        />
      </Field>

      <div className="glass space-y-1 rounded-[var(--radius-sm)] px-3 py-2 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-faint)]">{t("mil.cost")}</span>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconCoins size={13} /> {formatCurrencyShort(cost.gold)}</span>
            <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconWheat size={13} /> {fmt(cost.food)}</span>
            <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconUsers size={13} /> {fmt(cost.population)}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11.5px] text-[var(--text-faint)]">
          <span>Thời gian</span>
          <span>
            tập hợp {formatDuration(cost.musterDays)}
            {cost.trainDays > 0 ? ` · huấn luyện ${formatDuration(cost.trainDays)}` : ""}
          </span>
        </div>
        {cost.serviceDays > 0 && (
          <div className="flex items-center justify-between text-[11.5px] text-[var(--text-faint)]">
            <span>Hạn nghĩa vụ</span>
            <span>{formatDuration(cost.serviceDays)} — hết hạn là lính về ruộng</span>
          </div>
        )}
      </div>

      {msg && <p className="text-[12px] text-[var(--danger)]">{msg}</p>}
      <GlassButton
        variant="accent"
        className="w-full"
        onClick={() => {
          const r = recruit(territory, troopType, count, { branch });
          setMsg(r.ok ? `Đã gọi ${fmt(count)} ${troopType} — quân đang tập hợp.` : r.error ?? null);
        }}
      >
        <IconShield size={14} /> {branch === "Phục Dịch" ? "Gọi dân đi lính" : t("mil.recruit")}
      </GlassButton>
    </div>
  );
}

/** Ký khế ước với đoàn đánh thuê đang chào giá. */
function HireBox({ stat }: { stat: Stat }) {
  const hire = useMilitaryStore((s) => s.hire);
  const companies = availableCompanies(stat);
  const [msg, setMsg] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  if (companies.length === 0) {
    return (
      <div className="glass rounded-[var(--radius-md)] p-3">
        <p className="text-[13px] text-[var(--text-muted)]">Quanh đây không có đoàn lính đánh thuê nào đang chào giá.</p>
        <p className="mt-1 text-[11.5px] italic text-[var(--text-faint)]">
          Chợ lính nằm ở bến cảng lớn và các Thành Phố Tự Do — Braavos, Pentos, Myr, Volantis, King's Landing, Oldtown…
          Hãy tới nơi có chợ lính, hoặc để lời kể dẫn một đoàn tới trại của ngươi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {msg && <p className="text-[12px] text-[var(--accent-text)]">{msg}</p>}
      {companies.map(([key, co]) => {
        const want = counts[key] ?? Math.min(co["Quân Số"], 500);
        const upfront = Math.round((co["Tiền Ký Khế Ước"] * want) / Math.max(1, co["Quân Số"]));
        const monthly = Math.round((co["Lương Tháng Mỗi 100"] * want) / 100);
        return (
          <div key={key} className="glass rounded-[var(--radius-md)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[14px] text-[var(--text-soft)]">{co["Tên Đoàn"]}</span>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                  {co["Đang Ở"]} · {co["Binh Chủng"]} · {co["Huấn Luyện"]}
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[13px] text-[var(--text-soft)]">{fmt(co["Quân Số"])}</span>
                <span className="block text-[10px] text-[var(--text-faint)]">tay giáo</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge text={`Chữ tín ${co["Chữ Tín"]}/100`} />
              <Badge text={`Còn nán ${formatDuration(co["Ngày Còn Ở Lại"])}`} />
            </div>
            {co["Mô Tả"] && <p className="mt-1.5 text-[11px] italic leading-relaxed text-[var(--text-faint)]">{co["Mô Tả"]}</p>}

            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={co["Quân Số"]}
                value={want}
                onChange={(e) => setCounts({ ...counts, [key]: Math.max(1, Math.min(co["Quân Số"], Number(e.target.value) || 1)) })}
                className="w-24 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1 text-[12.5px] text-[var(--text-soft)]"
              />
              <span className="flex-1 text-[11px] text-[var(--text-faint)]">
                cọc {formatCurrencyShort(upfront)} · lương {formatCurrencyShort(monthly)}/tháng
              </span>
            </div>
            <GlassButton
              variant="accent"
              className="mt-2 w-full"
              onClick={() => {
                const r = hire(key, want);
                setMsg(r.ok ? `${co["Tên Đoàn"]} đã ký khế ước — ${fmt(want)} tay giáo về dưới cờ.` : r.error ?? null);
              }}
            >
              <IconCoins size={14} /> Ký khế ước
            </GlassButton>
          </div>
        );
      })}
      <p className="text-[11.5px] italic text-[var(--text-faint)]">
        Lính đánh thuê trung thành đúng bằng lần trả lương gần nhất. Ngân khố cạn một tháng là chúng xé khế ước.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[12px] text-[var(--text-muted)]">{label}</span>
      {children}
    </div>
  );
}

// ── Hạm Đội (7.8) ────────────────────────────────────────────────────────────
function FleetTab({ stat }: { stat: Stat }) {
  const t = useT();
  const pHouse = playerHouseId(stat);
  const fleets = Object.entries(stat["Hạm Đội"]).filter(([, f]) => f["Số Chiến Thuyền"] > 0 && String(f["Nhà"]).toLowerCase() === String(pHouse).toLowerCase());

  if (fleets.length === 0) return <p className="text-[13px] italic text-[var(--text-muted)]">{t("mil.noFleet")}</p>;

  return (
    <div className="space-y-3">
      {fleets.map(([name, f]) => (
        <div key={name} className="glass rounded-[var(--radius-md)] p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[14px] text-[var(--text-soft)]"><IconMap size={14} color="var(--accent-text)" /> {name}</span>
            <span className="font-mono text-[13px] text-[var(--text-muted)]">{fmt(f["Số Chiến Thuyền"])} thuyền</span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
            {f["Loại Hạm"]} · {f["Tình Trạng"]}
            {f["Bộ Binh Trên Thuyền"] > 0 ? ` · chở ${fmt(f["Bộ Binh Trên Thuyền"])} quân` : ""}
            {f["Đang Phong Toả"] ? ` · phong toả ${REGIONS_BY_ID[f["Đang Phong Toả"]]?.name ?? f["Đang Phong Toả"]}` : ""}
          </p>
          <p className="mt-2 text-[11.5px] italic text-[var(--text-faint)]">
            Hoạt động đổ bộ và phong toả diễn ra tự động dựa theo diễn biến sự kiện.
          </p>
        </div>
      ))}
      <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("mil.fleetNote")}</p>
    </div>
  );
}

// ── Rồng (M19: đọc CHUNG bảng "Rồng" với thanh trạng thái) ───────────────────
function DragonsTab({ stat }: { stat: Stat }) {
  const dragons = playerDragons(stat);
  const summary = dragonSummary(stat);

  if (dragons.length === 0) {
    return (
      <div className="glass rounded-[var(--radius-md)] p-3">
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
          <IconDragon size={14} /> Nhà ngươi hiện không có con rồng nào.
        </p>
        <p className="mt-1 text-[11.5px] italic text-[var(--text-faint)]">
          Rồng đến qua huyết thống, trứng nở, hoặc thu phục một con hoang — không phải thứ tuyển ở doanh trại. Thuần phục cần các diễn biến riêng, cách nhau 14 ngày và xác suất do engine quyết định, tới ${DRAGON_TAMING_THRESHOLD}/100; mỗi người chỉ có một rồng, trừ Người Xuyên Không.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-[var(--radius-md)] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-[var(--text-soft)]">Bầy rồng</span>
          <span className="font-mono text-[15px] text-[var(--accent-text)]">{summary.total}</span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
          {summary.ready} sẵn sàng ra trận · {summary.wounded} đang mang thương tích
        </p>
      </div>

      {dragons.map(([key, d]) => (
        <DragonCard key={key} dragonKey={key} dragon={d} variant="full" />
      ))}
      <p className="text-[11.5px] italic leading-relaxed text-[var(--text-faint)]">
        Rồng bay đi đâu, ăn gì, đốt ai — tất cả diễn ra qua lời kể: hãy nói ra ý định của ngươi trong cuộc chơi
        và cỗ máy sẽ tính đường bay, cơn đói và thương tích. Thuần phục là quá trình dài, không thể thành công tức thì; con đang bị xích hoặc đang dưỡng thương không ra trận được.
      </p>
    </div>
  );
}
