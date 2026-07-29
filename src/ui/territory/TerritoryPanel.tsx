/**
 * TerritoryPanel — BẢNG LÃNH THỔ (Tầng 2), mở khi bấm một vùng trên bản đồ.
 *
 * Chỉ nói chuyện TẦM TRUNG: ai làm chủ vùng, tình trạng chiến sự, thái độ, và
 * danh sách khu dân cư trong vùng (số liệu tổng hợp từ Tầng 1). Muốn xem kho
 * tàng/dân cư chi tiết thì vào bảng quản trị; muốn quy hoạch thì xuống Tầng 1 —
 * panel này KHÔNG lặp lại hai việc đó nữa.
 */
import { useMvuStore } from "../../state/mvuStore";
import { useUiStore } from "../../state/uiStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor, ATTITUDE_HEAT } from "../../content/westeros/houseColors";
import { summarizeRegion, type Settlement } from "../../territory/mapAggregate";
import { formatCurrencyShort } from "../../economy/currency";
import { useT } from "../../i18n";
import { IconX, IconCoins, IconWheat, IconUsers, IconPopulation, IconAlert, IconCastle, IconMap } from "../icons";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

export function TerritoryPanel() {
  const t = useT();
  const stat = useMvuStore((s) => s.stat);
  const selectedRegionId = useTerritoryStore((s) => s.selectedRegionId);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const enterLocal = useTerritoryStore((s) => s.enterLocal);
  const setTerritoryDashboardOpen = useUiStore((s) => s.setTerritoryDashboardOpen);

  if (!selectedRegionId) return null;
  const region = REGIONS_BY_ID[selectedRegionId];
  if (!region) return null;

  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const summary = summarizeRegion(stat, selectedRegionId, eraId);
  const controller = HOUSES_BY_ID[summary.controller];
  const col = houseColor(summary.controller);
  const attitude = controller
    ? stat["Thái Độ Các Nhà"][controller.schemaName]?.["Thái Độ"] ?? "Cảnh Giác"
    : null;

  const close = () => selectRegion(null);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={region.name}>
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)]" onClick={close} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden">
        {/* ---- đầu bảng: chủ quyền ---- */}
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
                {summary.isPlayer ? ` — ${t("terr.yours")}` : ""}
                {summary.status !== "Ổn Định" ? ` · ${summary.status}` : ""}
              </p>
            </div>
            <button onClick={close} aria-label={t("conn.close")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
              <IconX size={18} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Gem icon={<IconPopulation size={15} />} label={t("terr.population")} value={`${(summary.population / 1e6).toFixed(1)}tr`} />
            <Gem icon={<IconCastle size={15} />} label="Khu dân cư" value={`${summary.settlements.length}`} />
            <Gem icon={<IconUsers size={15} />} label="Quân trong vùng" value={fmt(summary.garrison)} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {summary.status === "Bị Vây" && <Banner text={t("terr.warnBesieged")} />}

          {/* ---- tổng hợp từ Tầng 1 ---- */}
          {summary.managedCount > 0 ? (
            <Block title="Tổng hợp từ lãnh địa của ngươi">
              <InfoRow label="Lãnh địa quản trị" value={`${summary.managedCount}`} />
              <InfoRow label="Dân trong lãnh địa" value={fmt(summary.managedPopulation)} />
              <InfoRow label="Công trình" value={`${summary.buildings}${summary.underConstruction > 0 ? ` (+${summary.underConstruction} đang xây)` : ""}`} />
              <InfoRow label="Phòng thủ" value={`${summary.defense}`} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MiniStat icon={<IconCoins size={13} />} label="Vàng/tháng" value={formatCurrencyShort(summary.goldPerMonth)} good={summary.goldPerMonth >= 0} />
                <MiniStat icon={<IconWheat size={13} />} label="Lương/tháng" value={fmt(summary.foodPerMonth)} good={summary.foodPerMonth >= 0} />
              </div>
            </Block>
          ) : (
            <Block title="Tình báo">
              <p className="text-[13px] italic text-[var(--text-muted)]">{t("terr.notYours")}</p>
              <InfoRow label={t("terr.controller")} value={controller ? controller.name : t("terr.unclaimed")} />
              <InfoRow label={t("terr.terrain")} value={region.terrain} />
              <InfoRow label={t("terr.population")} value={fmt(summary.population)} />
              <InfoRow label={t("terr.status")} value={summary.status} />
              {attitude && <InfoRow label={t("terr.attitude")} value={`${attitude} · ${ATTITUDE_HEAT[attitude]?.label ?? ""}`} />}
            </Block>
          )}

          {/* ---- danh sách khu dân cư (gom cụm Tầng 2) ---- */}
          <Block title="Khu dân cư trong vùng">
            <div className="space-y-1.5">
              {summary.settlements.map((s) => (
                <SettlementRow
                  key={s.id}
                  s={s}
                  onOpen={() => { selectRegion(null); enterLocal(s.id); }}
                />
              ))}
            </div>
          </Block>

          {summary.managedCount > 0 && (
            <button
              onClick={() => { selectRegion(null); setTerritoryDashboardOpen(true); }}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-3 py-2.5 text-[12.5px] text-[var(--text-soft)] transition-colors hover:bg-[var(--glass-bg-hover)]"
            >
              Mở bảng quản trị lãnh địa
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function SettlementRow({ s, onOpen }: { s: Settlement; onOpen: () => void }) {
  return (
    <div className="glass flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[12.5px] text-[var(--text-soft)]">{s.name}</div>
        <div className="mt-0.5 truncate text-[11px] text-[var(--text-faint)]">
          {s.kind}
          {s.population > 0 ? ` · ${fmt(s.population)} dân` : ""}
          {s.managed ? ` · ${s.buildings} công trình` : ""}
          {s.lord && !s.ownedByPlayer ? ` · ${s.lord} cai quản` : ""}
        </div>
      </div>
      {s.managed ? (
        <button
          onClick={onOpen}
          title={s.ownedByPlayer ? "Xuống Tầng 1 — bản đồ quy hoạch" : "Xem bản đồ (không có quyền xây)"}
          className={`flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[11.5px] transition-colors ${
            s.ownedByPlayer
              ? "bg-[var(--accent-soft)] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
              : "border border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
          }`}
        >
          <IconMap size={13} /> {s.ownedByPlayer ? "Vào" : "Xem"}
        </button>
      ) : (
        <span className="shrink-0 text-[11px] text-[var(--text-faint)]">ngoài quyền</span>
      )}
    </div>
  );
}

function Gem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-[var(--radius-sm)] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[var(--text-faint)]">
        {icon}
        <span className="text-[10.5px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 font-mono text-[15px] text-[var(--text-soft)]">{value}</div>
    </div>
  );
}

function MiniStat({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string; good: boolean }) {
  return (
    <div className="glass rounded-[var(--radius-sm)] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">{icon} {label}</div>
      <div className={`mt-0.5 font-mono text-[13px] ${good ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>{value}</div>
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
