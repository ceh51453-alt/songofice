/**
 * MilitaryPanel (11.5) — bảng Quân Đội kính mờ, mở từ rail Quân Sự. 3 tab:
 * - Lực Lượng: danh sách đơn vị + tình trạng + điều quân (chọn đích / vây thành),
 * - Tuyển Mộ: tuyển tại lãnh địa có Doanh Trại, gate binh chủng theo Era (11.2b/11.3),
 * - Ngoại Giao: tuyên chiến / cầu hoà + War Score với các Nhà (12.1).
 * Engine giữ số; panel chỉ gọi militaryStore. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useMilitaryStore } from "../../state/militaryStore";

import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { formatDuration } from "../../mvu/calendar";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { playerHouseId } from "../../territory/territoryEngine";
import { lendMoney } from "../../economy/ironBank";
import { EXCHANGE_RATES } from "../../economy/currency";
import { canControlHolding } from "../../character/roleplay";
import { recruitableTroopsForEra, troopMeta, type TroopTypeAll } from "../../content/westeros/troopTypes";
import { hasBarracks, maxRecruitPerMonth } from "../../strategy/army";
import { GlassButton } from "../components/GlassButton";
import { GlassSelect } from "../components/GlassSelect";
import { useT } from "../../i18n";
import { IconX, IconShield, IconCrossedSwords, IconCoins, IconWheat, IconMap, IconUsers } from "../icons";

type Tab = "forces" | "dragons" | "recruit" | "fleet" | "diplomacy";

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "forces", label: t("mil.tabForces") },
    { key: "dragons", label: "Rồng" },
    { key: "recruit", label: t("mil.tabRecruit") },
    { key: "fleet", label: t("mil.tabFleet") },
    { key: "diplomacy", label: t("mil.tabDiplomacy") },
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
          {tab === "dragons" && <DragonsTab stat={stat} />}
          {tab === "recruit" && <RecruitTab stat={stat} />}
          {tab === "fleet" && <FleetTab stat={stat} />}
          {tab === "diplomacy" && <DiplomacyTab stat={stat} />}
        </div>
      </aside>
    </div>
  );
}

type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

// ── Lực Lượng ────────────────────────────────────────────────────────────────
function ForcesTab({ stat }: { stat: Stat }) {
  const t = useT();
  const pHouse = playerHouseId(stat);
  const units = Object.entries(stat["Biên Chế Quân Sự"]).filter(([, u]) => u["Số Lượng"] > 0 && String(u["Nhà"]).toLowerCase() === String(pHouse).toLowerCase() && u["Loại Quân"] !== "Rồng");

  if (units.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">{t("mil.noUnits")}</p>;
  }

  return (
    <div className="space-y-3">
      {units.map(([name, u]) => {
        const loc = REGIONS_BY_ID[u["Lãnh Địa Đồn Trú"]]?.name ?? u["Lãnh Địa Đồn Trú"] ?? "—";
        const movingTo = u["Đang Di Chuyển Đến"] ? REGIONS_BY_ID[u["Đang Di Chuyển Đến"]]?.name : null;
        const training = u["Ngày Huấn Luyện"] > 0;
        return (
          <div key={name} className="glass rounded-[var(--radius-md)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <IconCrossedSwords size={14} color="var(--accent-text)" />
                  <span className="truncate text-[14px] text-[var(--text-soft)]">{name}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                  {u["Loại Quân"]} · {fmt(u["Số Lượng"])} quân
                </p>
              </div>
              <span className="shrink-0 font-mono text-[13px] text-[var(--text-muted)]">{fmt(u["Số Lượng"])}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge text={u["Sĩ Khí"]} />
              <Badge text={u["Huấn Luyện"]} />
              <Badge text={u["Hậu Cần"]} />
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
              {training
                ? t("mil.training", { n: formatDuration(u["Ngày Huấn Luyện"]) })
                : movingTo
                  ? t("mil.movingTo", { region: movingTo, n: formatDuration(u["Ngày Hành Quân Còn Lại"]) })
                  : t("mil.stationed", { region: loc })}
            </p>

            {!training && (
              <p className="mt-2 text-[11.5px] italic text-[var(--text-faint)]">
                Hoạt động điều quân và vây thành diễn ra tự động dựa theo diễn biến sự kiện.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10.5px] text-[var(--text-muted)]">{text}</span>;
}

// ── Tuyển Mộ ─────────────────────────────────────────────────────────────────
function RecruitTab({ stat }: { stat: Stat }) {
  const t = useT();
  const recruit = useMilitaryStore((s) => s.recruit);
  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const holdings = Object.keys(stat["Lãnh Địa"]).filter((id) => hasBarracks(stat, id) && canControlHolding(stat, id));
  const troops = recruitableTroopsForEra(eraId);
  const [terr, setTerr] = useState(holdings[0] ?? "");
  const [type, setType] = useState<TroopTypeAll>(troops[0] ?? "Bộ Binh");
  const [count, setCount] = useState(500);
  const [msg, setMsg] = useState<string | null>(null);

  if (holdings.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">{t("mil.needBarracks")}</p>;
  }

  const meta = troopMeta(type);
  const goldCost = Math.round((meta.costPer100["Ngân Khố"] * count) / 100);
  const foodCost = Math.round((meta.costPer100["Lương Thực"] * count) / 100);
  const cap = terr ? maxRecruitPerMonth(stat, terr) : 0;

  return (
    <div className="space-y-3">
      <Field label={t("mil.atHolding")}>
        <OptSelect value={terr} onChange={setTerr} options={holdings.map((id) => ({ value: id, label: REGIONS_BY_ID[id]?.name ?? id }))} />
      </Field>
      <Field label={t("mil.troopType")}>
        <OptSelect value={type} onChange={(v) => setType(v as TroopTypeAll)} options={troops.map((tt) => ({ value: tt, label: tt }))} />
      </Field>
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

      <div className="glass flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px]">
        <span className="text-[var(--text-faint)]">{t("mil.cost")}</span>
        <span className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconCoins size={13} /> {fmt(goldCost)}</span>
          <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconWheat size={13} /> {fmt(foodCost)}</span>
          <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconUsers size={13} /> {fmt(count)}</span>
          <span className="text-[var(--text-faint)]">· {meta.trainMonths} tháng</span>
        </span>
      </div>
      {msg && <p className="text-[12px] text-[var(--danger)]">{msg}</p>}
      <GlassButton
        variant="accent"
        className="w-full"
        onClick={() => {
          const r = recruit(terr, type, count);
          setMsg(r.ok ? t("mil.recruited") : r.error ?? null);
        }}
      >
        <IconShield size={14} /> {t("mil.recruit")}
      </GlassButton>
      <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("mil.recruitNote")}</p>
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

// ── Ngoại Giao + Tù Binh ─────────────────────────────────────────────────────
function DiplomacyTab({ stat }: { stat: Stat }) {
  const t = useT();
  const applyAiOps = useMvuStore((s) => s.applyAiOps);
  const pHouse = playerHouseId(stat);
  const captives = Object.entries(stat["Tù Binh"]);

  // các Nhà đang kiểm soát vùng (trừ Nhà người chơi)
  const houseSet = new Set(
    Object.values(stat["Chủ Quyền Lãnh Thổ"]).map((s) => s["Nhà Kiểm Soát"]).filter((h) => h && h !== pHouse),
  );
  const houses = [...houseSet];

  if (houses.length === 0) return <p className="text-[13px] italic text-[var(--text-muted)]">{t("mil.noHouses")}</p>;

  return (
    <div className="space-y-2.5">
      {houses.map((hid) => {
        const house = HOUSES_BY_ID[hid];
        const dip = stat["Quan Hệ Ngoại Giao"][hid];
        const status = dip?.["Trạng Thái"] ?? "Hoà Bình";
        const score = dip?.["War Score"] ?? 0;
        const atWar = status === "Chiến Tranh";
        return (
          <div key={hid} className="glass rounded-[var(--radius-md)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[var(--text-soft)]">{house?.name ?? hid}</span>
              <div className="flex items-center gap-2">
                {!atWar && (
                  <GlassButton
                    className="px-2 py-0.5 text-[11px]"
                    onClick={() => {
                      const amountStr = window.prompt(`Nhập số Rồng Vàng muốn cho nhà ${hid} vay:`, "10");
                      if (!amountStr) return;
                      const amount = parseInt(amountStr, 10);
                      if (isNaN(amount) || amount <= 0) return;
                      const copperAmount = amount * EXCHANGE_RATES.GOLD_TO_COPPER;
                      const res = lendMoney(stat as any, hid, copperAmount);
                      if (res.ok) {
                        applyAiOps(res.ops);
                        alert(`Đã cho nhà ${hid} vay ${amount} Rồng Vàng.`);
                      } else {
                        alert(`Không thể cho vay: ${res.error}`);
                      }
                    }}
                  >
                    Cho Vay
                  </GlassButton>
                )}
                <span className={`text-[12px] ${atWar ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>{status}</span>
              </div>
            </div>
            {atWar && (
              <div className="mt-1.5">
                <div className="mb-0.5 flex justify-between text-[11px] text-[var(--text-faint)]">
                  <span>{t("mil.warScore")}</span>
                  <span className="font-mono">{score > 0 ? "+" : ""}{score}</span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: score >= 0 ? "50%" : `${50 + score / 2}%`,
                      width: `${Math.abs(score) / 2}%`,
                      background: score >= 0 ? "var(--ok)" : "var(--danger)",
                    }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--glass-border-bright)]" />
                </div>
              </div>
            )}
              <p className="mt-2 text-[11.5px] italic text-[var(--text-faint)]">
                {atWar ? "Cuộc chiến sẽ kết thúc thông qua sự kiện cốt truyện hoặc khi một bên đầu hàng." : "Quan hệ ngoại giao tự động diễn biến theo thái độ và sự kiện cốt truyện."}
              </p>
          </div>
        );
      })}

      {captives.length > 0 && (
        <div className="mt-2">
          <h3 className="font-display mb-1.5 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">{t("mil.captives")}</h3>
          {captives.map(([name, c]) => (
            <div key={name} className="glass mb-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-soft)]">{c["Họ Tên"] || name}</span>
                <span className="font-mono text-[11.5px] text-[var(--accent-text)]">{t("mil.ransom")}: {fmt(c["Giá Chuộc"])}</span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">{c["Vai Trò"]}{c["Nhà"] ? ` · Nhà ${c["Nhà"]}` : ""}</p>
            </div>
          ))}
          <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("mil.captiveNote")}</p>
        </div>
      )}

      <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("mil.diploNote")}</p>
    </div>
  );
}

// ── Rồng ─────────────────────────────────────────────────────────────────────
function DragonsTab({ stat }: { stat: Stat }) {
  const t = useT();
  const pHouse = playerHouseId(stat);
  const dragons = Object.entries(stat["Biên Chế Quân Sự"]).filter(
    ([, u]) => u["Số Lượng"] > 0 && String(u["Nhà"]).toLowerCase() === String(pHouse).toLowerCase() && u["Loại Quân"] === "Rồng"
  );

  if (dragons.length === 0) {
    return <p className="text-[13px] italic text-[var(--text-muted)]">Nhà bạn hiện không có rồng nào.</p>;
  }

  return (
    <div className="space-y-3">
      {dragons.map(([name, u]) => {
        const loc = REGIONS_BY_ID[u["Lãnh Địa Đồn Trú"]]?.name ?? u["Lãnh Địa Đồn Trú"] ?? "—";
        const movingTo = u["Đang Di Chuyển Đến"] ? REGIONS_BY_ID[u["Đang Di Chuyển Đến"]]?.name : null;
        
        return (
          <div key={name} className="glass rounded-[var(--radius-md)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-[var(--accent-text)]">[R] {name}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                  {u["Loại Quân"]} · {fmt(u["Số Lượng"])}
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge text={u["Sĩ Khí"]} />
              <Badge text={u["Huấn Luyện"]} />
              <Badge text={u["Hậu Cần"]} />
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
              {movingTo
                ? t("mil.movingTo", { region: movingTo, n: formatDuration(u["Ngày Hành Quân Còn Lại"]) })
                : t("mil.stationed", { region: loc })}
            </p>
            <p className="mt-2 text-[11.5px] italic text-[var(--text-faint)]">
              Rồng được điều khiển bởi kỵ sĩ của chúng và hành động thông qua các sự kiện cốt truyện.
            </p>
          </div>
        );
      })}
    </div>
  );
}
