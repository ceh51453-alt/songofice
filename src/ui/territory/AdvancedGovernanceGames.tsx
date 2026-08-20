import { useEffect, useMemo, useState, type ReactNode } from "react";
import { makeDefaultRegionGovernance, type GovernanceProject, type StatData } from "../../mvu/schema";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useUiStore } from "../../state/uiStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { formatDuration } from "../../mvu/calendar";
import { formatCurrencyShort } from "../../economy/currency";
import {
  DEMESNE_FOCUS_DEFINITIONS, REGIONAL_ACTIONS, activeGovernanceProjects, agendaCapacity, availableFeudalActions,
  demesneEffectsForPlan, feudalActionCapacity, feudalActionCategory, feudalSnapshot,
  feudalActionDuration, governanceActionConnections, governancePressures, governanceProjectDaysRemaining, governanceProjectProgress,
  previewFeudalAgenda, scaledFeudalActionCost,
  type DemesneAllocation, type DemesnePlan, type FeudalActionCategory, type FeudalActionDefinition,
  type RegionGovernanceMetric,
} from "../../strategy/feudalManagement";

type Holding = StatData["Lãnh Địa"][string];
type RegionGovernanceData = NonNullable<StatData["Chủ Quyền Lãnh Thổ"][string]["Quản Trị"]>;
type LandKey = keyof DemesneAllocation;

const LAND_META: Record<LandKey, { short: string; tone: string; description: string }> = {
  "Canh Tác": { short: "Ruộng", tone: "#a8b97a", description: "Lương thực, tô hiện vật và dân số" },
  "Đồng Cỏ": { short: "Đồng cỏ", tone: "#86a89a", description: "Gia súc, sức kéo và chiến mã" },
  "Lâm Địa": { short: "Rừng", tone: "#6f9a78", description: "Gỗ, săn bắn và chống xói mòn" },
  "Thôn Ấp": { short: "Thôn ấp", tone: "#b89a72", description: "Chợ, nghề thủ công và thu nhập tiền" },
};

export function AdvancedDemesneGame({ territoryId, holding }: { territoryId: string | null; holding?: Holding }) {
  const stat = useMvuStore((s) => s.stat);
  const setPlan = useTerritoryStore((s) => s.setDemesnePlan);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const saved = holding?.["Quản Trị Lãnh Địa"];
  const [draft, setDraft] = useState<DemesnePlan>(() => planFromHolding(holding));

  useEffect(() => setDraft(planFromHolding(holding)), [territoryId, holding]);

  if (!territoryId || !holding || !saved) {
    return <EmptyState title="Chưa có đất trực thuộc" text="Có tước vị không đồng nghĩa tự động có điền địa để lập kế hoạch mùa vụ." />;
  }

  const effects = demesneEffectsForPlan(draft, saved["Độ Màu Mỡ"], saved["Xói Mòn"]);
  const total = Object.values(draft.allocation).reduce((sum, value) => sum + value, 0);
  const changed = JSON.stringify(draft) !== JSON.stringify(planFromHolding(holding));
  const activeProject = activeGovernanceProjects(stat, "Đất Trực Thuộc").find(([, project]) => project["Mục Tiêu"] === territoryId);
  const adjustLand = (key: LandKey, delta: number) => {
    setDraft((current) => {
      const allocation = { ...current.allocation };
      const next = Math.max(5, Math.min(75, allocation[key] + delta));
      const actual = next - allocation[key];
      if (actual === 0) return current;
      const others = (Object.keys(allocation) as LandKey[])
        .filter((candidate) => candidate !== key)
        .sort((left, right) => actual > 0 ? allocation[right] - allocation[left] : allocation[left] - allocation[right]);
      const donor = others.find((candidate) => actual > 0 ? allocation[candidate] - actual >= 5 : allocation[candidate] - actual <= 75);
      if (!donor) return current;
      allocation[key] = next;
      allocation[donor] -= actual;
      return { ...current, allocation };
    });
  };
  const applyPreset = (id: keyof typeof DEMESNE_FOCUS_DEFINITIONS) => {
    const preset = DEMESNE_FOCUS_DEFINITIONS[id];
    setDraft((current) => ({
      allocation: { ...preset.allocation },
      intensity: id === "Lao Dịch" ? 85 : id === "Khuyến Nông" ? 58 : current.intensity,
      seedReserve: id === "Khuyến Nông" ? 65 : id === "Lao Dịch" ? 35 : current.seedReserve,
    }));
    setMessage(null);
  };
  const commit = () => {
    const result = setPlan(territoryId, draft);
    setMessage({ ok: result.ok, text: result.ok ? "Đã khởi động việc chuyển đổi điền địa. Phương án mới chỉ có hiệu lực sau khi dân phu hoàn tất chia lại đất và thủy lợi." : result.error ?? "Không thể ban kế hoạch." });
  };

  return (
    <div className="space-y-5">
      <GameHeader eyebrow="Kế hoạch mùa vụ" title="Điền địa trực thuộc" description="Chia đúng 100% quỹ đất. Việc đổi ruộng, đồng cỏ, rừng và thôn ấp cần nhiều ngày công; sản lượng chỉ đổi khi dự án hoàn tất." />

      <GovernanceProjectsPanel scope="Đất Trực Thuộc" target={territoryId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="rounded-xl border border-[#2b3340] bg-[#111721] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-[16px] text-[#e6dcc6]">Bản đồ sử dụng đất</h3>
              <p className="mt-1 text-[12px] text-[#87909d]">Mỗi lần ±5% tự chuyển đất từ/qua loại còn lại, tổng luôn giữ ở 100%.</p>
            </div>
            <div className={`rounded-full border px-3 py-1 text-[11px] ${total === 100 ? "border-[#54745c] text-[#9fc2a5]" : "border-[#7a4d49] text-[#d48c84]"}`}>{total}% đã phân</div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#090d13]">
            {(Object.entries(draft.allocation) as [LandKey, number][]).map(([key, value]) => (
              <div key={key} className="inline-block h-full" style={{ width: `${value}%`, backgroundColor: LAND_META[key].tone }} title={`${key}: ${value}%`} />
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.entries(draft.allocation) as [LandKey, number][]).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-[#29313d] bg-[#0d131b] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAND_META[key].tone }} />
                    <span className="text-[13px] font-medium text-[#d5d9df]">{LAND_META[key].short}</span>
                  </div>
                  <span className="font-display text-[20px] text-[#d8c08a]">{value}%</span>
                </div>
                <p className="mt-1 text-[11px] text-[#737e8c]">{LAND_META[key].description}</p>
                <div className="mt-3 flex gap-2">
                  <StepButton onClick={() => adjustLand(key, -5)}>−5</StepButton>
                  <StepButton onClick={() => adjustLand(key, 5)}>+5</StepButton>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 border-t border-[#29313d] pt-4 md:grid-cols-2">
            <RangeControl label="Cường độ khai thác" value={draft.intensity} onChange={(intensity) => setDraft((current) => ({ ...current, intensity }))} low="Nhàn" high="Vắt kiệt" />
            <RangeControl label="Hạt giống để lại" value={draft.seedReserve} onChange={(seedReserve) => setDraft((current) => ({ ...current, seedReserve }))} low="Đưa vào kho" high="Giữ cho vụ sau" />
          </div>
        </section>

        <aside className="space-y-3">
          <section className="rounded-xl border border-[#313845] bg-[#121923] p-4">
            <h3 className="text-[11px] uppercase tracking-[.16em] text-[#778290]">Sức đất dài hạn</h3>
            <div className="mt-3 space-y-3">
              <Meter label="Độ màu mỡ" value={saved["Độ Màu Mỡ"]} good />
              <Meter label="Xói mòn" value={saved["Xói Mòn"]} inverse />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#737e8c]">Cường độ cao cho nhiều sản lượng ngay, nhưng đất suy thì mọi vụ sau cùng chịu phạt.</p>
          </section>
          <section className="rounded-xl border border-[#4b412d] bg-[#17170f] p-4">
            <h3 className="text-[11px] uppercase tracking-[.16em] text-[#a79060]">Dự báo kỳ tới</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Forecast label="Lương" value={pct(effects.foodMult)} />
              <Forecast label="Gỗ" value={pct(effects.woodMult)} />
              <Forecast label="Thu nhập" value={pct(effects.goldMult)} />
              <Forecast label="Tốc xây" value={`+${Math.round(effects.buildSpeed * 100)}%`} />
              <Forecast label="Lòng dân" value={`${signed(effects.loyaltyPerMonth)}/tháng`} />
              <Forecast label="Ngựa" value={effects.horsesPerThousand > 0 ? `+${effects.horsesPerThousand.toFixed(2)}/1k dân` : "—"} />
            </div>
          </section>
          <button disabled={!changed || total !== 100 || !!activeProject} onClick={commit} className="w-full rounded-lg bg-[#b79a61] px-4 py-3 text-[12px] font-semibold uppercase tracking-[.12em] text-[#111318] transition hover:bg-[#c8aa6b] disabled:cursor-not-allowed disabled:opacity-35">{activeProject ? "Đang chuyển đổi điền địa" : "Khởi động kế hoạch vụ mới"}</button>
          {message && <Notice ok={message.ok}>{message.text}</Notice>}
        </aside>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[11px] uppercase tracking-[.16em] text-[#778290]">Mẫu kế hoạch của quản gia</h3>
          <span className="text-[10px] text-[#626d7a]">Dùng làm điểm xuất phát, sau đó vẫn chỉnh tay được</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Object.values(DEMESNE_FOCUS_DEFINITIONS).map((preset) => (
            <button key={preset.id} onClick={() => applyPreset(preset.id)} className="rounded-lg border border-[#29313d] bg-[#0f151e] p-3 text-left transition hover:border-[#65583c] hover:bg-[#141a22]">
              <div className="text-[13px] font-medium text-[#d5d9df]">{preset.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-[#778290]">{preset.summary}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function planFromHolding(holding?: Holding): DemesnePlan {
  const management = holding?.["Quản Trị Lãnh Địa"];
  return {
    allocation: { ...(management?.["Phân Bổ Đất"] ?? DEMESNE_FOCUS_DEFINITIONS["Cân Bằng"].allocation) },
    intensity: management?.["Cường Độ Khai Thác"] ?? 50,
    seedReserve: management?.["Dự Trữ Hạt Giống"] ?? 50,
  };
}

const REGION_METRICS: { key: RegionGovernanceMetric; label: string; inverse?: boolean }[] = [
  { key: "Trật Tự", label: "Trật tự" }, { key: "Hội Nhập", label: "Hội nhập" },
  { key: "Hạ Tầng", label: "Hạ tầng" }, { key: "An Ninh Lương Thực", label: "Lương thực" },
  { key: "Phủ Sóng Phòng Thủ", label: "Phòng thủ" }, { key: "Chấp Nhận Văn Hoá", label: "Chấp nhận" },
  { key: "Bất Ổn", label: "Bất ổn", inverse: true },
];

export function AdvancedTerritoryGame() {
  const stat = useMvuStore((s) => s.stat);
  const takeDecision = useTerritoryStore((s) => s.takeRegionalDecision);
  const selectRegionOnMap = useTerritoryStore((s) => s.selectRegion);
  const setGameView = useUiStore((s) => s.setGameView);
  const setDashboard = useUiStore((s) => s.setTerritoryDashboardOpen);
  const owned = Object.entries(stat["Chủ Quyền Lãnh Thổ"]).filter(([, sovereignty]) => sovereignty["Là Của Người Chơi"]);
  const [selectedId, setSelectedId] = useState(owned[0]?.[0] ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!owned.some(([id]) => id === selectedId)) setSelectedId(owned[0]?.[0] ?? "");
  }, [selectedId, owned]);

  if (owned.length === 0) return <EmptyState title="Chưa có lãnh thổ" text="Chiếm hoặc được phong một vùng trước khi mở chiến dịch cai trị cấp lãnh thổ." />;
  const sovereignty = stat["Chủ Quyền Lãnh Thổ"][selectedId];
  const governance = sovereignty["Quản Trị"] ?? makeDefaultRegionGovernance();
  const region = REGIONS_BY_ID[selectedId];
  const act = (actionId: string) => {
    const action = REGIONAL_ACTIONS.find((candidate) => candidate.id === actionId);
    const result = takeDecision(selectedId, actionId);
    setMessage({ ok: result.ok, text: result.ok ? `Đã khởi động “${action?.label}” tại ${region?.name ?? selectedId}. Kinh phí và tải bộ máy phát sinh theo ngày; chỉ số mục tiêu chỉ được chốt khi nghiệm thu.` : result.error ?? "Không thể mở chiến dịch." });
  };
  const openMap = () => {
    setDashboard(false); setGameView("map"); selectRegionOnMap(selectedId);
  };

  return (
    <div className="space-y-5">
      <GameHeader eyebrow="Cai trị theo vùng" title="Bàn điều hành lãnh thổ" description="Mỗi lãnh thổ có vấn đề riêng. Một chiến dịch tốt cần xử lý đúng nút thắt thay vì rải tiền đều trên bản đồ." />
      <GovernanceProjectsPanel scope="Lãnh Thổ" target={selectedId} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {owned.map(([id, item]) => {
          const data = item["Quản Trị"] ?? makeDefaultRegionGovernance();
          const active = id === selectedId;
          return (
            <button key={id} onClick={() => { setSelectedId(id); setMessage(null); }} className={`min-w-52 rounded-lg border p-3 text-left ${active ? "border-[#8f7648] bg-[#1a1a16]" : "border-[#29313d] bg-[#0f151e] hover:bg-[#141a22]"}`}>
              <div className="flex items-center justify-between gap-2"><span className="font-display text-[14px] text-[#ddd4c1]">{REGIONS_BY_ID[id]?.name ?? id}</span><StatusBadge text={item["Tình Trạng"]} /></div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-[#778290]"><span>Bất ổn {Math.round(data["Bất Ổn"])}</span><span>·</span><span>Hội nhập {Math.round(data["Hội Nhập"])}</span></div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-xl border border-[#2b3340] bg-[#111721] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="text-[10px] uppercase tracking-[.18em] text-[#778290]">Lãnh thổ đang chọn</div><h3 className="font-display mt-1 text-[20px] text-[#d8c08a]">{region?.name ?? selectedId}</h3><p className="mt-1 text-[12px] text-[#7d8794]">Trọng tâm: {governance["Trọng Tâm"]} · Nhà kiểm soát: {sovereignty["Nhà Kiểm Soát"] || "Vô chủ"}</p></div>
            <button onClick={openMap} className="rounded-lg border border-[#3a4452] px-3 py-2 text-[11px] uppercase tracking-[.1em] text-[#a9b2bd] hover:bg-[#1a222d]">Mở bản đồ vùng</button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {REGION_METRICS.map((metric) => <Meter key={metric.key} label={metric.label} value={governance[metric.key]} inverse={metric.inverse} />)}
          </div>
        </section>

        <aside className="rounded-xl border border-[#4a3e2c] bg-[#171711] p-4">
          <div className="text-[10px] uppercase tracking-[.18em] text-[#a48c5b]">Chẩn đoán của hội đồng</div>
          <h3 className="font-display mt-2 text-[17px] text-[#e2d5ba]">{regionDiagnosis(governance)}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-[#8d8e87]">{regionAdvice(governance)}</p>
          <div className="mt-4 border-t border-[#3b3528] pt-3 text-[11px] text-[#77786f]">Chiến dịch sẽ đặt trọng tâm tháng của vùng và thay đổi cả chỉ số tước địa liên quan.</div>
        </aside>
      </div>

      {message && <Notice ok={message.ok}>{message.text}</Notice>}
      <section>
        <div className="mb-3"><h3 className="font-display text-[16px] text-[#ddd4c1]">Mở chiến dịch tại {region?.name ?? selectedId}</h3><p className="mt-1 text-[11px] text-[#778290]">Mỗi vùng chỉ triển khai một chiến dịch lớn cùng lúc; hạ tầng, lương thực và bất ổn quyết định tốc độ.</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {REGIONAL_ACTIONS.map((action) => (
            <button key={action.id} onClick={() => act(action.id)} className="group rounded-xl border border-[#29313d] bg-[#0f151e] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#65583c] hover:bg-[#141a22]">
              <div className="flex items-center justify-between gap-3"><span className="rounded bg-[#202833] px-2 py-1 text-[9px] uppercase tracking-[.12em] text-[#8f9aa8]">{action.category}</span><span className="text-[11px] text-[#bda46e]">{formatDuration(action.durationDays)} · {action.costGold} Rồng</span></div>
              <h4 className="font-display mt-3 text-[16px] text-[#e0d7c6]">{action.label}</h4>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#818b98]">{action.description}</p>
              <div className="mt-3 border-t border-[#29313d] pt-2 text-[10px] text-[#677381]">{formatChanges(action.changes)}</div>
              {action.realmChanges && <div className="mt-1 text-[9.5px] text-[#8d7959]">Lan lên tước địa: {formatChanges(action.realmChanges)}</div>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const GOVERNANCE_METRICS = ["Chính Danh", "Uy Quyền", "Gắn Kết Chư Hầu", "An Ninh Biên Giới", "Gánh Nặng Hành Chính", "Kiệt Quệ Chiến Tranh"] as const;
const CATEGORY_ORDER: FeudalActionCategory[] = ["Dân Sinh", "Hành Chính", "Chư Hầu", "Biên Phòng", "Kinh Tế", "Đại Chính Sách"];

export function AdvancedFeudalDomainGame({ realmOnly }: { realmOnly: boolean }) {
  const stat = useMvuStore((s) => s.stat);
  const executeAgenda = useTerritoryStore((s) => s.takeFeudalAgenda);
  const snapshot = useMemo(() => feudalSnapshot(stat), [stat]);
  const actions = availableFeudalActions(stat, realmOnly);
  const [selected, setSelected] = useState<string[]>([]);
  const [category, setCategory] = useState<FeudalActionCategory | "Tất Cả">("Tất Cả");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const preview = previewFeudalAgenda(stat, selected);
  const pressures = governancePressures(stat);
  const governance = stat["Quản Trị Tước Địa"];

  useEffect(() => { setSelected([]); setCategory("Tất Cả"); setMessage(null); }, [realmOnly]);

  if (realmOnly && !snapshot.title.sovereign) return <EmptyState title="Chưa phải chính thể có chủ quyền" text={`Một ${snapshot.title.title} cai quản ${snapshot.title.jurisdiction}; đại chính sách toàn cõi chỉ dành cho Thân Vương trị vì, Quốc Vương và Hoàng Đế.`} />;
  if (!realmOnly && snapshot.title.rank < 2) return <EmptyState title="Chưa có tước địa" text="Hiệp sĩ không được phong đất chỉ có địa vị cá nhân; chưa có bộ máy, chư hầu hay pháp quyền để lập nghị trình." />;

  const toggle = (action: FeudalActionDefinition) => {
    setSelected((current) => current.includes(action.id) ? current.filter((id) => id !== action.id) : [...current, action.id]);
    setMessage(null);
  };
  const enact = () => {
    const result = executeAgenda(selected);
    setMessage({ ok: result.ok, text: result.ok ? `Đã phê chuẩn ${selected.length} quyết sách thành một dự án nhiều giai đoạn. Chỉ số chỉ đổi khi bộ máy thi hành xong.` : result.error ?? "Không thể chốt nghị trình." });
    if (result.ok) setSelected([]);
  };
  const visible = actions.filter((action) => category === "Tất Cả" || feudalActionCategory(action) === category);

  return (
    <div className="space-y-5">
      <GameHeader eyebrow={realmOnly ? "Đại chính sách" : "Triều chính phong kiến"} title={snapshot.title.jurisdiction} description={realmOnly ? "Điều phối toàn cõi qua luật, tín dụng, cứu tế và các đại chư hầu — không vi mô hóa thành công trường." : "Lập một chương trình nghị sự vừa sức bộ máy. Nhiều quyết sách hơn tạo kết hợp mạnh, nhưng cũng sinh xung đột ưu tiên."} />

      <GovernanceProjectsPanel scope={realmOnly ? "Vương Quốc" : "Tước Địa"} />

      <SystemConnections scope={realmOnly ? "Vương Quốc" : "Tước Địa"} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,.6fr)]">
        <section className="rounded-xl border border-[#2b3340] bg-[#111721] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="text-[10px] uppercase tracking-[.18em] text-[#778290]">Quy mô quyền lực</div><h3 className="font-display mt-1 text-[19px] text-[#d8c08a]">{snapshot.title.title} · {snapshot.title.jurisdiction}</h3></div>
            <div className="text-right text-[11px] leading-relaxed text-[#7d8794]">{snapshot.directHoldingIds.length} thành trực thuộc · {snapshot.controlledRegionIds.length} lãnh thổ<br />{snapshot.vassalCount} chư hầu · năng lực nghị trình {agendaCapacity(stat)}</div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNANCE_METRICS.map((name) => <Meter key={name} label={name} value={governance[name]} inverse={name === "Gánh Nặng Hành Chính" || name === "Kiệt Quệ Chiến Tranh"} />)}
          </div>
          <div className="mt-4 border-t border-[#29313d] pt-3 text-[11px] text-[#7b8693]">Ưu tiên: <span className="text-[#c2a96f]">{governance["Ưu Tiên"]}</span> · tô thuế ×{snapshot.modifiers.vassalTaxMult.toFixed(2)} · quân dịch {signed(snapshot.modifiers.musterLoyaltyBonus)} thiện chí · rủi ro bất ổn {Math.round(snapshot.modifiers.unrestRisk)}/100</div>
        </section>

        <aside className="rounded-xl border border-[#3d3427] bg-[#17160f] p-4">
          <div className="text-[10px] uppercase tracking-[.18em] text-[#9f895d]">Trung tâm quyền lực</div>
          <div className="mt-3 space-y-3">
            {Object.entries(governance["Trung Tâm Quyền Lực"]).map(([name, value]) => <Meter key={name} label={name} value={value} />)}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-[#79786f]">Đẩy một đẳng cấp quá cao sẽ tạo sức ép ngược lên vương quyền và bộ máy.</p>
        </aside>
      </div>

      {pressures.length > 0 && (
        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[.18em] text-[#8c7560]">Áp lực phải xử lý</div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {pressures.slice(0, 3).map((pressure) => (
              <div key={pressure.id} className="rounded-lg border border-[#493630] bg-[#191313] p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-[12px] font-medium text-[#d7b0a5]">{pressure.title}</span><span className="text-[11px] text-[#c47f70]">{Math.round(pressure.severity)}/100</span></div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-[#8d7773]">{pressure.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[#2b3340] bg-[#0d131b] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="font-display text-[17px] text-[#ddd4c1]">Soạn chương trình nghị sự</h3><p className="mt-1 text-[11px] text-[#778290]">Chọn nhiều quyết sách, nhưng tổng tải không được vượt sức chứa triều chính.</p></div>
          <div className="flex flex-wrap gap-1.5">
            {(["Tất Cả", ...CATEGORY_ORDER.filter((item) => actions.some((action) => feudalActionCategory(action) === item))] as const).map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[.08em] ${category === item ? "border-[#8f7648] bg-[#2a2417] text-[#d4bb82]" : "border-[#303845] text-[#778290] hover:bg-[#171e27]"}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((action) => {
            const active = selected.includes(action.id);
            const slot = active ? selected.indexOf(action.id) + 1 : null;
            return (
              <button key={action.id} onClick={() => toggle(action)} className={`relative rounded-xl border p-4 text-left transition ${active ? "border-[#a48953] bg-[#201c13] shadow-[0_0_0_1px_rgba(180,145,78,.12)]" : "border-[#29313d] bg-[#111821] hover:-translate-y-0.5 hover:border-[#4a5564]"}`}>
                {slot && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#b79a61] text-[11px] font-bold text-[#121419]">{slot}</span>}
                <div className="flex items-center gap-2 pr-8"><span className="rounded bg-[#202833] px-2 py-1 text-[9px] uppercase tracking-[.1em] text-[#8f9aa8]">{feudalActionCategory(action)}</span><span className="text-[9.5px] text-[#697583]">{feudalActionCapacity(action)} tải · {formatDuration(feudalActionDuration(action))}</span></div>
                <h4 className="font-display mt-3 text-[16px] text-[#e1d8c7]">{action.label}</h4>
                <p className="mt-1.5 min-h-14 text-[11.5px] leading-relaxed text-[#818b98]">{action.description}</p>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#29313d] pt-2"><span className="text-[9.5px] leading-relaxed text-[#66717e]">{formatChanges(action.changes)}</span><span className="shrink-0 text-[11px] text-[#bda46e]">{scaledFeudalActionCost(stat, action).toLocaleString("vi-VN")} Rồng</span></div>
                {governanceActionConnections(action.id).length > 0 && <div className="mt-2 text-[9.5px] leading-relaxed text-[#8d7959]">Lan sang: {governanceActionConnections(action.id).join(" · ")}</div>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 rounded-xl border border-[#4c4433] bg-[rgba(17,20,25,.97)] p-3 shadow-[0_-12px_30px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 text-[12px]"><span className={preview.capacityUsed > preview.capacityLimit ? "text-[#d48779]" : "text-[#c7b17c]"}>Tải nghị trình {preview.capacityUsed}/{preview.capacityLimit}</span><span className="text-[#778290]">·</span><span className="text-[#c7b17c]">{preview.totalCostGold.toLocaleString("vi-VN")} Rồng Vàng</span><span className="text-[#778290]">·</span><span className="text-[#9aa5b2]">{selected.length === 0 ? "chưa ước tính thời gian" : `dự kiến ${formatDuration(preview.durationDays)}`}</span></div>
            <div className="mt-1 text-[10.5px] text-[#6f7a87]">{selected.length === 0 ? "Chưa chọn quyết sách" : formatChanges(preview.combinedChanges)}{preview.conflicts.length ? ` · ${preview.conflicts[0]}` : ""}</div>
          </div>
          <div className="flex gap-2"><button onClick={() => setSelected([])} disabled={selected.length === 0} className="rounded-lg border border-[#35404d] px-3 py-2 text-[10px] uppercase tracking-[.1em] text-[#8d98a5] disabled:opacity-30">Xóa nghị trình</button><button onClick={enact} disabled={selected.length === 0 || preview.capacityUsed > preview.capacityLimit} className="rounded-lg bg-[#b79a61] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#111318] hover:bg-[#c8aa6b] disabled:opacity-35">Khởi công nghị trình</button></div>
        </div>
      </div>
      {message && <Notice ok={message.ok}>{message.text}</Notice>}
    </div>
  );
}

function SystemConnections({ scope }: { scope: "Tước Địa" | "Vương Quốc" }) {
  const links = scope === "Vương Quốc"
    ? [
      ["Vùng", "trật tự · lương thực · hạ tầng"],
      ["Kinh tế", "nền thuế · lưu thông · chi phí dự án"],
      ["Quân sự", "thời gian quân dịch · phòng thủ biên cương"],
      ["Chư hầu", "thiện chí tòng quân · trì hoãn nghĩa vụ"],
      ["Dân chúng", "lòng dân · bất ổn · chấp nhận văn hóa"],
    ]
    : [
      ["Chư hầu", "tô thuế · trung thành · quân cam kết"],
      ["Lãnh thổ", "hội nhập · trật tự · hạ tầng"],
      ["Bộ máy", "sức chứa nghị trình · tốc độ thi hành"],
      ["Quyền lực", "vương quyền · quý tộc · giáo quyền · đô thị"],
    ];
  return (
    <section className="rounded-xl border border-[#343b35] bg-[#101512] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[9.5px] uppercase tracking-[.16em] text-[#879675]">Mạng ảnh hưởng</span>
        {links.map(([name, detail]) => <div key={name} className="text-[10.5px] text-[#747f79]"><span className="text-[#b6ad91]">{name}</span> → {detail}</div>)}
      </div>
    </section>
  );
}

function GovernanceProjectsPanel({ scope, target }: { scope: GovernanceProject["Phạm Vi"]; target?: string }) {
  const stat = useMvuStore((s) => s.stat);
  const cancelProject = useTerritoryStore((s) => s.cancelGovernanceProject);
  const projects = activeGovernanceProjects(stat, scope).filter(([, project]) => !target || project["Mục Tiêu"] === target);
  if (projects.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#4b412d] bg-[#151610] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div><div className="text-[10px] uppercase tracking-[.18em] text-[#a68c59]">Dự án đang thi hành</div><p className="mt-1 text-[11px] text-[#777d78]">Tiến độ chạy theo ngày truyện; ngân khố, bộ máy và tình hình từng vùng có thể làm nhanh, chậm hoặc đình trệ.</p></div>
        <span className="rounded-full border border-[#524932] px-2.5 py-1 text-[10px] text-[#bda46e]">{projects.length} dự án</span>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {projects.map(([id, project]) => {
          const progress = governanceProjectProgress(project);
          const stalled = project["Trạng Thái"] === "Đình Trệ";
          return (
            <article key={id} className={`rounded-lg border p-3.5 ${stalled ? "border-[#69413b] bg-[#1a1111]" : "border-[#34382f] bg-[#10140f]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div><div className={`text-[9px] uppercase tracking-[.12em] ${stalled ? "text-[#cf8075]" : "text-[#8e9f7d]"}`}>{project["Trạng Thái"]} · hiệu suất {Math.round(project["Hiệu Suất Gần Nhất"])}%</div><h3 className="font-display mt-1 text-[15px] text-[#ddd4c1]">{project["Tên"]}</h3></div>
                <span className="font-display text-[17px] text-[#d0b77e]">{Math.round(progress)}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#090c09]"><div className={`h-full rounded-full ${stalled ? "bg-[#a75f55]" : "bg-[#8c9f72]"}`} style={{ width: `${progress}%` }} /></div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#788077]">
                <span>còn khoảng {formatDuration(governanceProjectDaysRemaining(project))}</span>
                <span>tải {project["Tải Hành Chính"]}</span>
                <span>đã chi {formatCurrencyShort(project["Đã Chi (Đồng Đỏ)"])} / {formatCurrencyShort(project["Kinh Phí (Đồng Đỏ)"])}</span>
              </div>
              <div className="mt-2 text-[10px] leading-relaxed text-[#90866f]">Trong thi hành: chi ngân sách theo tiến độ · chiếm {project["Tải Hành Chính"]} tải bộ máy · giảm hiệu suất thu tô và phản hồi quân dịch · tăng áp lực bất ổn nếu triều chính quá tải.</div>
              {project["Trở Ngại"].length > 0 && <div className="mt-2 text-[10.5px] text-[#c18476]">Nút thắt: {project["Trở Ngại"].join(" · ")}</div>}
              {project["Kết Quả Dự Kiến"].length > 0 && <div className="mt-2 border-t border-[#30352c] pt-2 text-[10px] text-[#70786f]">Khi hoàn tất: {project["Kết Quả Dự Kiến"].join(" · ")}</div>}
              <button
                onClick={() => { if (window.confirm("Hủy dự án? Toàn bộ kinh phí đã chi sẽ mất.")) cancelProject(id); }}
                className="mt-3 text-[9.5px] uppercase tracking-[.1em] text-[#8f6862] hover:text-[#c78379]"
              >Hủy dự án · không hoàn chi phí</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GameHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="border-b border-[#2c3440] pb-4"><div className="text-[10px] uppercase tracking-[.22em] text-[#8e7952]">{eyebrow}</div><h2 className="font-display mt-1 text-[22px] text-[#e3d7bf]">{title}</h2><p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-[#858f9c]">{description}</p></header>;
}

function StepButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex-1 rounded border border-[#35404d] bg-[#151d27] py-1.5 text-[11px] text-[#aeb6c0] hover:border-[#596574] hover:bg-[#1b2531]">{children}</button>;
}

function RangeControl({ label, value, onChange, low, high }: { label: string; value: number; onChange: (value: number) => void; low: string; high: string }) {
  return <label className="block"><div className="flex items-center justify-between text-[12px]"><span className="text-[#aeb6c0]">{label}</span><span className="font-display text-[17px] text-[#d8c08a]">{value}</span></div><input className="mt-2 w-full accent-[#b79a61]" type="range" min={0} max={100} step={5} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="mt-1 flex justify-between text-[9.5px] text-[#606b78]"><span>{low}</span><span>{high}</span></div></label>;
}

function Meter({ label, value, inverse = false, good = false }: { label: string; value: number; inverse?: boolean; good?: boolean }) {
  const healthy = good || (inverse ? value < 40 : value >= 55);
  return <div><div className="flex items-center justify-between gap-2 text-[10.5px]"><span className="text-[#838e9b]">{label}</span><span className={healthy ? "text-[#9fbea4]" : "text-[#c5897e]"}>{Math.round(value)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#090d12]"><div className={`h-full rounded-full ${healthy ? "bg-[#819f86]" : "bg-[#a9675d]"}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}

function Forecast({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[#363426] bg-[#11130f] p-2.5"><div className="text-[9px] uppercase tracking-[.1em] text-[#777768]">{label}</div><div className="mt-1 text-[13px] text-[#d2bd89]">{value}</div></div>;
}

function StatusBadge({ text }: { text: string }) {
  const danger = text === "Nổi Loạn" || text === "Đang Tranh Chấp" || text === "Bị Vây";
  return <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[.08em] ${danger ? "border-[#70443f] text-[#ce8277]" : "border-[#405946] text-[#8eb296]"}`}>{text}</span>;
}

function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <div className={`rounded-lg border px-3 py-2.5 text-[11.5px] ${ok ? "border-[#46604c] bg-[#111a15] text-[#9fc2a5]" : "border-[#6d423e] bg-[#1b1212] text-[#d28b81]"}`}>{children}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#35404d] bg-[#0e141c] px-8 text-center"><h2 className="font-display text-[20px] text-[#d8cdb8]">{title}</h2><p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[#7d8794]">{text}</p></div>;
}

function pct(multiplier: number): string { const value = Math.round((multiplier - 1) * 100); return `${value >= 0 ? "+" : ""}${value}%`; }
function signed(value: number): string { return `${value >= 0 ? "+" : ""}${Math.round(value)}`; }
function formatChanges(changes: Record<string, number | undefined>): string { return Object.entries(changes).map(([key, value]) => `${key} ${signed(value ?? 0)}`).join(" · ") || "Không đổi chỉ số trực tiếp"; }

function regionDiagnosis(governance: RegionGovernanceData): string {
  const candidates: [string, number][] = [
    ["Bất ổn có nguy cơ lan rộng", governance["Bất Ổn"]], ["Dân chưa chấp nhận quyền cai trị", 100 - governance["Chấp Nhận Văn Hoá"]],
    ["Đường sá và trạm dịch yếu", 100 - governance["Hạ Tầng"]], ["Kho lương vùng mong manh", 100 - governance["An Ninh Lương Thực"]],
    ["Phản ứng quân sự quá chậm", 100 - governance["Phủ Sóng Phòng Thủ"]], ["Bộ máy chưa bén rễ", 100 - governance["Hội Nhập"]],
  ];
  return candidates.sort((left, right) => right[1] - left[1])[0][0];
}

function regionAdvice(governance: RegionGovernanceData): string {
  if (governance["Bất Ổn"] >= 60) return "Ưu tiên quan tòa, lệ tục địa phương hoặc bình định có mục tiêu. Đầu tư lớn lúc này dễ bị phá hoại.";
  if (governance["Hội Nhập"] < 45) return "Địa bạ và hộ tịch giúp bộ máy nhìn thấy vùng, nhưng nên đi kèm nhượng bộ văn hóa để tránh phản ứng.";
  if (governance["An Ninh Lương Thực"] < 45) return "Mạng kho vùng giảm rủi ro đói và cho phép quân đội đi qua mà không làm dân nổi loạn.";
  if (governance["Hạ Tầng"] < 50) return "Quan lộ và cầu tạo lợi ích chậm nhưng làm mọi chiến dịch sau rẻ và hiệu quả hơn.";
  return "Vùng tương đối ổn; đây là lúc nâng hội nhập hoặc phòng thủ để biến quyền chiếm giữ thành quyền cai trị bền vững.";
}
