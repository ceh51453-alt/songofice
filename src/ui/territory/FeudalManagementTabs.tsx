import { useMemo, useState } from "react";
import type { DemesneFocus, StatData } from "../../mvu/schema";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useUiStore } from "../../state/uiStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { FEUDAL_GLOSSARY, TITLE_DEFINITIONS, titleDefinition } from "../../strategy/feudalHierarchy";
import {
  DEMESNE_FOCUS_DEFINITIONS, availableFeudalActions, feudalSnapshot,
  type FeudalActionDefinition,
} from "../../strategy/feudalManagement";

type Holding = StatData["Lãnh Địa"][string];

export function FeudalConceptsTab() {
  const stat = useMvuStore((s) => s.stat);
  const current = titleDefinition(stat["Thông Tin Nhân Vật"]["Tước Vị"]);

  return (
    <div className="space-y-5">
      <section className="glass rounded-lg border border-[var(--accent-soft)] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Địa vị hiện tại</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-[19px] text-[var(--accent-text)]">{current.title}</h2>
          <span className="text-[12px] text-[var(--text-muted)]">Tước địa: {current.jurisdiction}</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-soft)]">{current.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px]">
          <Capability active={current.canHoldStronghold}>Giữ thành</Capability>
          <Capability active={current.canManageDemesne}>Quản đất trực thuộc</Capability>
          <Capability active={current.canGovernTerritory}>Cai quản lãnh thổ</Capability>
          <Capability active={current.canReceiveVassals}>Nhận chư hầu</Capability>
          <Capability active={current.sovereign}>Chủ quyền độc lập</Capability>
        </div>
      </section>

      <section>
        <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Các khái niệm không thể dùng lẫn</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {FEUDAL_GLOSSARY.map((item) => (
            <article key={item.term} className="glass rounded-lg p-3.5">
              <h4 className="font-display text-[14px] text-[var(--text-soft)]">{item.term}</h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">{item.definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Thang tước vị và tước địa</h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--glass-border)]">
          <table className="w-full min-w-[650px] text-left text-[12px]">
            <thead className="bg-[rgba(255,255,255,0.035)] text-[var(--text-faint)]">
              <tr><th className="px-3 py-2">Tước vị</th><th className="px-3 py-2">Tước địa tương ứng</th><th className="px-3 py-2">Chức năng chính</th></tr>
            </thead>
            <tbody>
              {TITLE_DEFINITIONS.filter((entry) => entry.rank >= 1).map((entry) => (
                <tr key={entry.id} className={`border-t border-[var(--glass-border)] ${entry.id === current.id ? "bg-[var(--accent-soft)]" : ""}`}>
                  <td className="px-3 py-2 text-[var(--text-soft)]">{entry.title}</td>
                  <td className="px-3 py-2 text-[var(--accent-text)]">{entry.jurisdiction}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Capability({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`rounded-full border px-2 py-1 ${active ? "border-[rgba(99,170,115,0.4)] text-[var(--ok)]" : "border-[var(--glass-border)] text-[var(--text-faint)] line-through"}`}>{children}</span>;
}

export function DemesneGameTab({ territoryId, holding }: { territoryId: string | null; holding?: Holding }) {
  const setFocus = useTerritoryStore((s) => s.setDemesneFocus);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  if (!territoryId || !holding) return <EmptyLand text="Ngươi chưa có đất trực thuộc. Có tước vị không đồng nghĩa tự động có một lãnh địa." />;

  const current = holding["Quản Trị Lãnh Địa"]["Trọng Tâm"];
  const allocate = holding["Quản Trị Lãnh Địa"]["Phân Bổ Đất"];
  const choose = (focus: DemesneFocus) => {
    const result = setFocus(territoryId, focus);
    setMessage({ ok: result.ok, text: result.ok ? `Đã chuyển trọng tâm sang ${focus}. Sản lượng sẽ chốt theo lựa chọn này từ kỳ tới.` : result.error ?? "Không thể đổi trọng tâm." });
  };

  return (
    <div className="space-y-5">
      <section className="glass rounded-lg p-4">
        <h3 className="font-display text-[15px] text-[var(--text-soft)]">Phân bổ đất trực thuộc</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
          Đây là ruộng, đồng cỏ, rừng và thôn ấp trực tiếp nuôi thành trì — không phải toàn bộ lãnh thổ của vùng.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(allocate).map(([name, value]) => (
            <div key={name} className="rounded-md border border-[var(--glass-border)] p-2.5">
              <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">{name}</div>
              <div className="mt-0.5 text-[18px] text-[var(--accent-text)]">{value}%</div>
            </div>
          ))}
        </div>
      </section>

      {message && <Notice ok={message.ok}>{message.text}</Notice>}

      <section className="grid gap-2 lg:grid-cols-2">
        {Object.values(DEMESNE_FOCUS_DEFINITIONS).map((definition) => {
          const active = current === definition.id;
          return (
            <button
              key={definition.id}
              onClick={() => choose(definition.id)}
              disabled={active}
              className={`rounded-lg border p-3.5 text-left transition-colors ${active ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--glass-border)] bg-[rgba(255,255,255,0.018)] hover:bg-[var(--glass-bg-hover)]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[14px] text-[var(--text-soft)]">{definition.label}</span>
                {active && <span className="text-[10px] uppercase tracking-wider text-[var(--ok)]">Đang áp dụng</span>}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{definition.description}</p>
              <p className="mt-2 text-[11.5px] text-[var(--accent-text)]">{definition.summary}</p>
            </button>
          );
        })}
      </section>
    </div>
  );
}

export function TerritoryGameTab() {
  const stat = useMvuStore((s) => s.stat);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const setGameView = useUiStore((s) => s.setGameView);
  const setDashboard = useUiStore((s) => s.setTerritoryDashboardOpen);
  const owned = Object.entries(stat["Chủ Quyền Lãnh Thổ"]).filter(([, sovereignty]) => sovereignty["Là Của Người Chơi"]);

  const inspect = (regionId: string) => {
    setDashboard(false);
    setGameView("map");
    selectRegion(regionId);
  };

  return (
    <div className="space-y-4">
      <section className="glass rounded-lg p-4">
        <h3 className="font-display text-[15px] text-[var(--text-soft)]">Lãnh thổ là chủ quyền địa lý</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
          Ở tầng này ngươi theo dõi người kiểm soát, tranh chấp, nổi loạn và phòng thủ vùng. Chiếm một vùng không biến mọi thành trì của chư hầu thành tài sản trực thuộc.
        </p>
      </section>
      {owned.length === 0 ? <EmptyLand text="Chưa có lãnh thổ nào được ghi nhận dưới chủ quyền của ngươi." /> : (
        <div className="grid gap-2 md:grid-cols-2">
          {owned.map(([id, sovereignty]) => {
            const region = REGIONS_BY_ID[id];
            return (
              <button key={id} onClick={() => inspect(id)} className="glass rounded-lg p-3.5 text-left hover:bg-[var(--glass-bg-hover)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-[14px] text-[var(--text-soft)]">{region?.name ?? id}</span>
                  <span className="text-[11px] text-[var(--accent-text)]">{sovereignty["Tình Trạng"]}</span>
                </div>
                <div className="mt-1 text-[11.5px] text-[var(--text-muted)]">Nhà kiểm soát: {sovereignty["Nhà Kiểm Soát"] || "Vô chủ"}</div>
                <div className="mt-2 text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">Mở bản đồ lãnh thổ →</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const METRICS = ["Chính Danh", "Uy Quyền", "Gắn Kết Chư Hầu", "An Ninh Biên Giới", "Gánh Nặng Hành Chính", "Kiệt Quệ Chiến Tranh"] as const;

export function FeudalDomainGameTab({ realmOnly }: { realmOnly: boolean }) {
  const stat = useMvuStore((s) => s.stat);
  const takeDecision = useTerritoryStore((s) => s.takeFeudalDecision);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const snapshot = useMemo(() => feudalSnapshot(stat), [stat]);
  const actions = availableFeudalActions(stat, realmOnly);
  const governance = stat["Quản Trị Tước Địa"];

  if (realmOnly && !snapshot.title.sovereign) {
    return <EmptyLand text={`Một ${snapshot.title.title} cai quản ${snapshot.title.jurisdiction}, chưa phải nguyên thủ chính thể có chủ quyền. Tab này mở cho Thân Vương trị vì, Quốc Vương và Hoàng Đế.`} />;
  }
  if (!realmOnly && snapshot.title.rank < 2) {
    return <EmptyLand text="Đây là quyền của người có phong địa. Hiệp sĩ không được phong đất chỉ có địa vị cá nhân, chưa có tước địa để cai quản." />;
  }

  const act = (action: FeudalActionDefinition) => {
    const result = takeDecision(action.id);
    setMessage({ ok: result.ok, text: result.ok ? `Đã thi hành: ${action.label}. Những chỉ số liên quan và ngân khố đã được cập nhật.` : result.error ?? "Không thể thi hành." });
  };

  return (
    <div className="space-y-5">
      <section className="glass rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">{realmOnly ? "Chính thể có chủ quyền" : "Tước địa"}</div>
            <h3 className="font-display mt-0.5 text-[17px] text-[var(--accent-text)]">{snapshot.title.jurisdiction}</h3>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed text-[var(--text-muted)]">
            {snapshot.directHoldingIds.length} thành trì trực thuộc · {snapshot.controlledRegionIds.length} lãnh thổ<br />
            {snapshot.vassalCount} chư hầu · tải hành chính dự tính {snapshot.calculatedBurden}/100
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {METRICS.map((name) => {
            const bad = name === "Gánh Nặng Hành Chính" || name === "Kiệt Quệ Chiến Tranh";
            const value = governance[name];
            return <Metric key={name} name={name} value={value} bad={bad} />;
          })}
        </div>
        <div className="mt-3 text-[11.5px] text-[var(--text-muted)]">
          Ưu tiên hiện tại: <span className="text-[var(--accent-text)]">{governance["Ưu Tiên"]}</span> · thu chư hầu ×{snapshot.modifiers.vassalTaxMult.toFixed(2)} · quân dịch {snapshot.modifiers.musterLoyaltyBonus >= 0 ? "+" : ""}{snapshot.modifiers.musterLoyaltyBonus.toFixed(0)} thiện chí
        </div>
      </section>

      {message && <Notice ok={message.ok}>{message.text}</Notice>}

      {actions.length === 0 ? <EmptyLand text="Chưa có quyết sách phù hợp với cấp tước vị này." /> : (
        <section className="grid gap-2 lg:grid-cols-2">
          {actions.map((action) => (
            <button key={action.id} onClick={() => act(action)} className="rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.018)] p-3.5 text-left hover:bg-[var(--glass-bg-hover)]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[14px] text-[var(--text-soft)]">{action.label}</span>
                <span className="shrink-0 text-[11px] text-[var(--accent-text)]">{action.costGold} Rồng Vàng</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{action.description}</p>
              <p className="mt-2 text-[10.5px] text-[var(--text-faint)]">{Object.entries(action.changes).map(([key, value]) => `${key} ${value! > 0 ? "+" : ""}${value}`).join(" · ")}</p>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ name, value, bad }: { name: string; value: number; bad: boolean }) {
  const healthy = bad ? value < 45 : value >= 55;
  return (
    <div className="rounded-md border border-[var(--glass-border)] p-2.5">
      <div className="flex items-center justify-between gap-2 text-[10.5px] text-[var(--text-faint)]"><span>{name}</span><span>{value}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]"><div className={`h-full ${healthy ? "bg-[var(--ok)]" : "bg-[var(--danger)]"}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <div className={`rounded-md border px-3 py-2 text-[12px] ${ok ? "border-[rgba(99,170,115,0.35)] text-[var(--ok)]" : "border-[rgba(176,106,95,0.4)] text-[var(--danger)]"}`}>{children}</div>;
}

function EmptyLand({ text }: { text: string }) {
  return <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-[var(--glass-border)] px-6 text-center text-[13px] italic leading-relaxed text-[var(--text-muted)]">{text}</div>;
}
