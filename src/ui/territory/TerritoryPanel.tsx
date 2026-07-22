/**
 * TerritoryPanel (10.4) — bảng lãnh địa kính mờ, mở khi chọn 1 vùng trên bản đồ.
 * Vùng NGƯƠI quản lý → 4 tab (Tổng Quan / Xây Dựng / Đồn Trú / Dân Tình).
 * Vùng của Nhà khác → thẻ tình báo read-only (chủ quyền + Thái Độ). Học cách tổ
 * chức thông tin của card "Đại Lãnh Chúa" nhưng thay toàn bộ phần nhìn (SVG,
 * glassmorphism, màu ít bão hoà, không emoji — 4 ràng buộc đầu prompt).
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useMilitaryStore } from "../../state/militaryStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor, ATTITUDE_HEAT } from "../../content/westeros/houseColors";
import { BUILDING_LIST, buildingCost, buildingTurns, type BuildingType, type ResourceKey } from "../../content/westeros/buildings";
import { recruitableTroopsForEra } from "../../content/westeros/troopTypes";
import { estimateTerritoryYield } from "../../territory/construction";
import { canManageDomain } from "../../character/roleplay";
import { GlassButton } from "../components/GlassButton";
import { useT } from "../../i18n";
import {
  IconX, IconCastle, IconCoins, IconWheat, IconTree, IconMountain, IconHammer, IconShield, IconUsers,
  IconPopulation, IconBook, IconAlert, IconTrash, IconMap,
} from "../icons";

type Tab = "overview" | "build" | "garrison" | "people";

const BUILDING_ICON: Record<BuildingType, React.FC<{ size?: number; color?: string }>> = {
  "Lâu Đài": IconCastle, "Nông Trại": IconWheat, "Chợ": IconCoins, "Doanh Trại": IconShield,
  "Tường Thành": IconCastle, "Bến Cảng": IconMap, "Sept/Rừng Thần": IconBook, "Học Viện Nhỏ": IconBook,
};

const RES_ICON: Record<ResourceKey, React.FC<{ size?: number; color?: string }>> = {
  "Vàng": IconCoins, "Lương Thực": IconWheat, "Gỗ": IconTree, "Đá": IconMountain, "Quặng Sắt": IconMountain,
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}
function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${fmt(n)}`;
}

export function TerritoryPanel() {
  const t = useT();
  const stat = useMvuStore((s) => s.stat);
  const selectedRegionId = useTerritoryStore((s) => s.selectedRegionId);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);

  if (!selectedRegionId) return null;
  const region = REGIONS_BY_ID[selectedRegionId];
  if (!region) return null;

  const sov = stat["Chủ Quyền Lãnh Thổ"][selectedRegionId];
  const controllerId = sov?.["Nhà Kiểm Soát"] ?? "";
  const controller = HOUSES_BY_ID[controllerId];
  const col = houseColor(controllerId);
  const isPlayer = !!sov?.["Là Của Người Chơi"];

  const allHoldings = Object.entries(stat["Lãnh Địa"]).filter(([, h]) => h["Thuộc Vùng"] === selectedRegionId);
  
  const activeHoldingId = selectedHoldingId ?? (allHoldings.length > 0 ? allHoldings[0][0] : null);
  const holding = activeHoldingId ? stat["Lãnh Địa"][activeHoldingId] : undefined;

  const close = () => selectRegion(null);

  const hasDomainPrivilege = canManageDomain(stat);

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "overview", label: t("terr.tabOverview") },
    { key: "build", label: t("terr.tabBuild"), disabled: !hasDomainPrivilege },
    { key: "garrison", label: t("terr.tabGarrison"), disabled: !hasDomainPrivilege },
    { key: "people", label: t("terr.tabPeople"), disabled: !hasDomainPrivilege },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={region.name}>
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)]" onClick={close} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden">
        {/* ---- header ---- */}
        <div className="border-b border-[var(--glass-border)] px-5 py-4" style={{ background: `linear-gradient(160deg, ${col.base}22, transparent)` }}>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: col.base }} />
                <h2 className="font-display truncate text-[19px] tracking-wide text-[var(--text-soft)]">{region.name}</h2>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--text-faint)]">
                {t("terr.seat")}: {region.seat} · {region.terrain}
                {region.coastal ? ` · ${t("terr.coastal")}` : ""}
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: col.light }}>
                {controller ? controller.name : t("terr.unclaimed")}
                {isPlayer ? ` — ${t("terr.yours")}` : ""}
                {sov?.["Tình Trạng"] && sov["Tình Trạng"] !== "Ổn Định" ? ` · ${sov["Tình Trạng"]}` : ""}
              </p>
            </div>
            <button onClick={close} aria-label={t("conn.close")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
              <IconX size={18} />
            </button>
          </div>

          {holding && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Gem icon={<IconPopulation size={15} />} label={t("terr.population")} value={fmt(holding["Dân Số"])} />
              <Gem icon={<IconUsers size={15} />} label={t("terr.loyalty")} value={`${holding["Trung Thành"]}%`} bar={holding["Trung Thành"]} />
              <Gem icon={<IconCoins size={15} />} label={t("terr.treasury")} value={fmt(stat["Thông Tin Nhân Vật"]["Vàng"])} />
            </div>
          )}

          {allHoldings.length > 1 && (
            <div className="mt-3">
              <select 
                value={activeHoldingId || ""} 
                onChange={e => setSelectedHoldingId(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)] [&>option]:bg-[#141821]"
              >
                {allHoldings.map(([id, h]) => (
                  <option key={id} value={id}>{h["Mô Tả"] || id}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ---- vùng của Nhà khác: read-only tình báo ---- */}
        {!holding ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            <p className="text-[13px] italic text-[var(--text-muted)]">{t("terr.notYours")}</p>
            <InfoRow label={t("terr.controller")} value={controller ? controller.name : t("terr.unclaimed")} />
            <InfoRow label={t("terr.terrain")} value={region.terrain} />
            <InfoRow label={t("terr.population")} value={region.population ? `${fmt(region.population)}` : "—"} />
            <InfoRow label={t("terr.status")} value={sov?.["Tình Trạng"] ?? "—"} />
            <InfoRow
              label={t("terr.attitude")}
              value={
                controller
                  ? (() => {
                      const att = stat["Thái Độ Các Nhà"][controller.schemaName]?.["Thái Độ"] ?? "Cảnh Giác";
                      return `${att} · ${ATTITUDE_HEAT[att]?.label ?? ""}`;
                    })()
                  : "—"
              }
            />
          </div>
        ) : (
          <>
            {/* ---- tab bar ---- */}
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--glass-border)] px-3 py-2">
              {tabs.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => { if (!tb.disabled) setTab(tb.key); }}
                  disabled={tb.disabled}
                  title={tb.disabled ? "Bạn không có tước vị đủ cao để thực hiện quyền hạn này." : ""}
                  className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] transition-colors ${
                    tab === tb.key
                      ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                      : tb.disabled
                      ? "text-[var(--text-faint)] opacity-50 cursor-not-allowed"
                      : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {tab === "overview" && <OverviewTab holding={holding} regionName={region.name} besieged={sov?.["Tình Trạng"] === "Bị Vây"} />}
              {tab === "build" && activeHoldingId && <BuildTab territoryId={activeHoldingId} holding={holding} />}
              {tab === "garrison" && activeHoldingId && <GarrisonTab territoryId={activeHoldingId} holding={holding} />}
              {tab === "people" && activeHoldingId && <PeopleTab territoryId={activeHoldingId} holding={holding} />}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

// ── Gem / InfoRow ───────────────────────────────────────────────────────────
function Gem({ icon, label, value, bar }: { icon: React.ReactNode; label: string; value: string; bar?: number }) {
  return (
    <div className="glass rounded-[var(--radius-sm)] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[var(--text-faint)]">
        {icon}
        <span className="text-[10.5px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 font-mono text-[15px] text-[var(--text-soft)]">{value}</div>
      {bar !== undefined && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
          <div className="h-full rounded-full" style={{ width: `${bar}%`, background: bar > 50 ? "var(--ok)" : bar > 25 ? "var(--warn)" : "var(--danger)" }} />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--glass-border)] py-1.5 text-[13px]">
      <span className="text-[var(--text-faint)]">{label}</span>
      <span className="text-[var(--text-soft)]">{value}</span>
    </div>
  );
}

// ── Tab Tổng Quan ───────────────────────────────────────────────────────────
type Holding = ReturnType<typeof useMvuStore.getState>["stat"]["Lãnh Địa"][string];

function OverviewTab({ holding, regionName, besieged }: { holding: Holding; regionName: string; besieged?: boolean }) {
  const t = useT();
  const yld = estimateTerritoryYield(holding);
  const stock = holding["Tài Nguyên"];
  const foodTurns = yld["Lương Thực"] < 0 ? Math.floor(stock["Lương Thực"] / -yld["Lương Thực"]) : Infinity;
  const resKeys: ResourceKey[] = ["Lương Thực", "Gỗ", "Đá", "Quặng Sắt"];

  return (
    <div className="space-y-4">
      {/* cảnh báo */}
      {besieged && <Banner text={t("terr.warnBesieged")} />}
      {holding["Trung Thành"] < 30 && (
        <Banner text={t("terr.warnLoyalty")} />
      )}
      {foodTurns !== Infinity && foodTurns < 5 && (
        <Banner text={t("terr.warnFamine", { n: foodTurns })} />
      )}

      <Block title={t("terr.blockLand")}>
        <InfoRow label={t("terr.terrain")} value={holding["Địa Hình"] ?? "—"} />
        <InfoRow label={t("terr.coastal")} value={holding["Ven Biển"] ? t("common.yes") : t("common.no")} />
      </Block>

      <Block title={t("terr.blockEconomy")}>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]"><IconCoins size={14} /> {t("terr.goldIncome")}</span>
          <span className={`font-mono text-[13px] ${yld["Vàng"] >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>{signed(yld["Vàng"])}/turn</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {resKeys.map((k) => {
            const Icon = RES_ICON[k];
            return (
              <div key={k} className="glass rounded-[var(--radius-sm)] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]"><Icon size={13} /> {k}</div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="font-mono text-[13px] text-[var(--text-soft)]">{fmt(stock[k])}</span>
                  <span className={`font-mono text-[11px] ${yld[k] >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>{signed(yld[k])}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      <Block title={t("terr.blockPeople")}>
        <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
          {holding["Trung Thành"] >= 60
            ? t("terr.moodHigh", { region: regionName })
            : holding["Trung Thành"] >= 30
              ? t("terr.moodMid", { region: regionName })
              : t("terr.moodLow", { region: regionName })}
        </p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[var(--radius-md)] p-3">
      <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">{title}</h3>
      {children}
    </div>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <div className="glass flex items-center gap-2 border-[rgba(176,106,95,0.45)] bg-[rgba(176,106,95,0.08)] px-3 py-2 text-[12.5px] text-[var(--text-soft)]">
      <IconAlert size={15} color="var(--danger)" /> {text}
    </div>
  );
}

// ── Tab Xây Dựng ────────────────────────────────────────────────────────────
function BuildTab({ territoryId, holding }: { territoryId: string; holding: Holding }) {
  const t = useT();
  const startBuild = useTerritoryStore((s) => s.startBuild);
  const cancelBuild = useTerritoryStore((s) => s.cancelBuild);
  const playerGold = useMvuStore((s) => s.stat["Thông Tin Nhân Vật"]["Vàng"]);
  const [error, setError] = useState<string | null>(null);

  const queue = Object.entries(holding["Công Trình"]).filter(([, b]) => b["Đang Xây"]);
  const stock = holding["Tài Nguyên"];

  return (
    <div className="space-y-4">
      {/* hàng đợi */}
      {queue.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">{t("terr.queue")}</h3>
          <div className="space-y-2">
            {queue.map(([name, b]) => {
              const total = buildingTurns(b["Loại"], b["Cấp Độ"]);
              const pct = Math.max(0, Math.min(100, Math.round((1 - b["Turn Còn Lại"] / Math.max(1, total)) * 100)));
              return (
                <div key={name} className="glass rounded-[var(--radius-sm)] px-3 py-2">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[var(--text-soft)]">{name} · c{b["Cấp Độ"]}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--text-faint)]">{t("terr.turnsLeft", { n: b["Turn Còn Lại"] })}</span>
                      <button onClick={() => cancelBuild(territoryId, name)} title={t("terr.cancel")} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
                    <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-[12px] text-[var(--danger)]">{error}</p>}

      {/* danh mục công trình */}
      <div className="grid grid-cols-1 gap-2">
        {BUILDING_LIST.map((def) => {
          const existing = holding["Công Trình"][def.type];
          const nextLevel = existing ? existing["Cấp Độ"] + 1 : 1;
          const cost = buildingCost(def.type, nextLevel);
          const locked = def.requiresCoastal && !holding["Ven Biển"];
          const building = existing?.["Đang Xây"];
          const Icon = BUILDING_ICON[def.type];
          const affordable =
            (cost["Vàng"] ?? 0) <= playerGold &&
            (["Lương Thực", "Gỗ", "Đá", "Quặng Sắt"] as ResourceKey[]).every((k) => (cost[k] ?? 0) <= (stock[k] ?? 0));

          return (
            <div key={def.type} className={`glass rounded-[var(--radius-sm)] px-3 py-2.5 ${locked ? "opacity-45" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon size={15} color="var(--accent-text)" />
                    <span className="text-[13.5px] text-[var(--text-soft)]">{def.type}{existing ? ` · c${existing["Cấp Độ"]}` : ""}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">{def.effectSummary}</p>
                  <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px]">
                    {(Object.entries(cost) as [ResourceKey, number][]).map(([k, v]) => {
                      const have = k === "Vàng" ? playerGold : stock[k] ?? 0;
                      const short = v > have;
                      const Ico = RES_ICON[k];
                      return (
                        <span key={k} className={`flex items-center gap-0.5 ${short ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>
                          <Ico size={11} /> {fmt(v)}
                        </span>
                      );
                    })}
                    <span className="text-[var(--text-faint)]">· {buildingTurns(def.type, nextLevel)} turn</span>
                  </div>
                </div>
                <GlassButton
                  size="sm"
                  variant={existing ? "ghost" : "accent"}
                  disabled={!!locked || !!building || !affordable}
                  onClick={() => {
                    const r = startBuild(territoryId, def.type);
                    setError(r.ok ? null : r.error ?? null);
                  }}
                >
                  <IconHammer size={13} /> {existing ? t("terr.upgrade") : t("terr.build")}
                </GlassButton>
              </div>
              {locked && <p className="mt-1 text-[11px] italic text-[var(--text-faint)]">{t("terr.needCoastal")}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab Đồn Trú ─────────────────────────────────────────────────────────────
function GarrisonTab({ territoryId, holding }: { territoryId: string; holding: Holding }) {
  const t = useT();
  const units = useMvuStore((s) => s.stat["Biên Chế Quân Sự"]);
  const eraId = useMvuStore((s) => s.stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "");
  const recruit = useMilitaryStore((s) => s.recruit);
  const barracks = Object.values(holding["Công Trình"]).some((b) => b["Loại"] === "Doanh Trại" && !b["Đang Xây"]);
  // chỉ quân đóng tại lãnh địa này
  const list = Object.entries(units).filter(([, u]) => u["Số Lượng"] > 0 && u["Lãnh Địa Đồn Trú"] === territoryId);
  const troops = recruitableTroopsForEra(eraId);
  const [type, setType] = useState<string>(troops[0] ?? "Bộ Binh");
  const [count, setCount] = useState(300);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <p className="text-[13px] italic text-[var(--text-muted)]">{t("terr.noGarrison")}</p>
      ) : (
        list.map(([name, u]) => (
          <div key={name} className="glass rounded-[var(--radius-sm)] px-3 py-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--text-soft)]">{name}</span>
              <span className="font-mono text-[var(--text-muted)]">{fmt(u["Số Lượng"])}</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
              {u["Loại Quân"]} · {u["Sĩ Khí"]} · {u["Huấn Luyện"]}
              {u["Turn Huấn Luyện"] > 0 ? ` · ${t("mil.training", { n: u["Turn Huấn Luyện"] })}` : ""}
            </p>
          </div>
        ))
      )}

      {barracks ? (
        <div className="glass rounded-[var(--radius-md)] p-3">
          <span className="mb-2 block text-[12px] uppercase tracking-widest text-[var(--text-faint)]">{t("terr.recruit")}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)] [&>option]:bg-[#141821]"
            >
              {troops.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
            </select>
            <input
              type="number" min={1} value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)]"
            />
            <GlassButton
              size="sm" variant="accent"
              onClick={() => {
                const r = recruit(territoryId, type as never, count);
                setMsg(r.ok ? t("mil.recruited") : r.error ?? null);
              }}
            >
              <IconShield size={13} /> {t("terr.recruit")}
            </GlassButton>
          </div>
          {msg && <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">{msg}</p>}
        </div>
      ) : (
        <p className="text-[12px] italic text-[var(--text-faint)]">{t("terr.needBarracks")}</p>
      )}
      <p className="text-[11.5px] italic text-[var(--text-faint)]">{t("terr.garrisonNote")}</p>
    </div>
  );
}

// ── Tab Dân Tình ────────────────────────────────────────────────────────────
function PeopleTab({ territoryId, holding }: { territoryId: string; holding: Holding }) {
  const t = useT();
  const resolvePetition = useTerritoryStore((s) => s.resolvePetition);
  const [resolved, setResolved] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
        {holding["Trung Thành"] >= 50 ? t("terr.peopleCalm") : t("terr.peopleRestless")}
      </p>
      {!resolved ? (
        <div className="glass rounded-[var(--radius-md)] p-3">
          <p className="mb-2.5 text-[13px] text-[var(--text-soft)]">{t("terr.petition")}</p>
          <div className="flex flex-col gap-2">
            <GlassButton size="sm" onClick={() => { resolvePetition(territoryId, 6, -400); setResolved(true); }}>
              {t("terr.petitionGrant")}
            </GlassButton>
            <GlassButton size="sm" variant="ghost" onClick={() => { resolvePetition(territoryId, -5, 200); setResolved(true); }}>
              {t("terr.petitionDeny")}
            </GlassButton>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] italic text-[var(--text-faint)]">{t("terr.petitionDone")}</p>
      )}
    </div>
  );
}
