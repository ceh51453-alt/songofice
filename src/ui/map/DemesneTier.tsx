/**
 * Tầng Lãnh Địa: lớp chiến lược của phần đất nuôi một thành trì. Đây không phải
 * bản sao của lưới xây dựng; nó cho thấy địa hình, ruộng/rừng/thôn ấp, dân số,
 * tài nguyên và sức nuôi quân trước khi đi sâu vào Thành Trì.
 */
import { useMemo } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { TERRAIN_TRAITS } from "../../content/westeros/terrain";
import { LOCAL_GRID_CELLS } from "../../content/westeros/mapScale";
import { terrainOf } from "../../territory/localMap";
import { holdingTerrainDistribution } from "../../territory/terrainProjection";
import { summarizeHolding } from "../../territory/mapAggregate";

interface Props {
  holdingId: string;
  onExit: () => void;
  onEnterCastle: () => void;
}

function number(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-soft)] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">{label}</div>
      <div className="mt-1 font-display text-[19px] text-[var(--text-soft)]">{value}</div>
      {note && <div className="mt-0.5 text-[10.5px] text-[var(--text-faint)]">{note}</div>}
    </div>
  );
}

function ShareBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="tabular-nums text-[var(--text-soft)]">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export function DemesneTier({ holdingId, onExit, onEnterCastle }: Props) {
  const stat = useMvuStore((state) => state.stat);
  const holding = stat["Lãnh Địa"][holdingId];
  const terrain = useMemo(() => terrainOf(holdingId, holding), [holdingId, holding]);
  const terrainShares = useMemo(() => holdingTerrainDistribution(holdingId, holding), [holdingId, holding]);
  const summary = useMemo(() => summarizeHolding(stat, holdingId), [stat, holdingId]);

  if (!holding) {
    return (
      <div className="flex h-full items-center justify-center bg-[#111414] text-[var(--text-muted)]">
        <button onClick={onExit} className="glass-strong rounded-lg px-4 py-2">Lãnh địa này không còn tồn tại · Trở lại</button>
      </div>
    );
  }

  const region = REGIONS_BY_ID[holding["Thuộc Vùng"]];
  const management = holding["Quản Trị Lãnh Địa"];
  const allocation = management["Phân Bổ Đất"];
  const nodes = holding["Điểm Tài Nguyên"].filter((node) => node["Đã Khám Phá"]);
  const people = holding["Dân Số Chi Tiết"];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#101414] text-[var(--text-soft)]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--glass-border)] bg-[rgba(16,20,20,0.94)] px-5 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent-text)]">
            {region?.name ?? "Lãnh thổ"} · Lãnh địa trực thuộc
          </div>
          <h2 className="mt-0.5 truncate font-display text-[25px]">{summary.name}</h2>
          <div className="mt-0.5 text-[11px] text-[var(--text-faint)]">
            {terrain.dominant} · 7,5 km mỗi cạnh · trọng tâm {management["Trọng Tâm"]}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onExit} className="rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            ← Lãnh Thổ
          </button>
          <button onClick={onEnterCastle} className="rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--accent-text)] hover:brightness-110">
            Vào Thành Trì →
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(520px,1.45fr)_minmax(350px,0.8fr)]">
        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[#17201f] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
            <div>
              <div className="font-display text-[17px]">Bản đồ đất trực thuộc</div>
              <div className="text-[10.5px] text-[var(--text-faint)]">625 khu địa hình chiến lược · cùng nguồn với xây dựng và hành quân</div>
            </div>
            <div className="rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[10.5px] text-[var(--text-muted)]">
              {nodes.length} điểm tài nguyên đã biết
            </div>
          </div>

          <div className="relative m-4 flex-1 overflow-hidden rounded-xl border border-[#62706e]/50 bg-[#1a2523] shadow-inner">
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${terrain.blocks}, minmax(0, 1fr))` }}
            >
              {terrain.grid.map((kind, index) => {
                const trait = TERRAIN_TRAITS[kind];
                return (
                  <div
                    key={index}
                    title={trait.label}
                    style={{
                      background: trait.fill,
                      boxShadow: `inset 0 0 0 0.5px ${trait.edge}55`,
                      opacity: 0.94,
                    }}
                  />
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(5,10,10,0.06)_50%,rgba(5,10,10,0.44)_100%)]" />

            {nodes.map((node) => (
              <div
                key={node["Mã"]}
                className="absolute z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e5d09a] bg-[#b99750] shadow-[0_0_0_3px_rgba(20,24,23,0.45)]"
                style={{
                  left: `${(node["Tọa Độ X"] / LOCAL_GRID_CELLS) * 100}%`,
                  top: `${(node["Tọa Độ Y"] / LOCAL_GRID_CELLS) * 100}%`,
                }}
                title={`${node["Tài Nguyên"]} · còn ${number(node["Còn Lại"])}`}
              />
            ))}

            <button
              onClick={onEnterCastle}
              className="absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#d8c187] bg-[rgba(25,24,20,0.9)] px-3 py-2 text-center shadow-xl transition-transform hover:scale-105"
              title="Mở bản đồ Thành Trì"
            >
              <span className="block text-[18px]">♜</span>
              <span className="block whitespace-nowrap font-display text-[12px] text-[#d8c187]">{summary.name}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--glass-border)] px-4 py-3">
            {terrainShares.slice(0, 6).map((entry) => (
              <div key={entry.terrain} className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TERRAIN_TRAITS[entry.terrain].fill }} />
                {TERRAIN_TRAITS[entry.terrain].label} {Math.round(entry.share * 100)}%
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[17px]">Dân và sức nuôi thành</h3>
              <span className="text-[10.5px] text-[var(--text-faint)]">cập nhật theo tháng</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Dân số" value={number(summary.population)} note={`${number(people["Nông Dân"])} nông dân`} />
              <Metric label="Chỗ ở" value={number(holding["Sức Chứa Dân Cư"])} note={holding["Vô Gia Cư"] > 0 ? `${number(holding["Vô Gia Cư"])} người vô gia cư` : "đủ chỗ ở"} />
              <Metric label="Lương thực/tháng" value={number(summary.foodPerMonth)} note={`an ninh kho: ${number(holding["Dự Trữ Lương Thực"])}`} />
              <Metric label="Thu ròng/tháng" value={number(summary.goldPerMonth)} note={`${summary.buildings} công trình vận hành`} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[17px]">Phân bổ đất</h3>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--accent-text)]">{management["Trọng Tâm"]}</span>
            </div>
            <div className="space-y-3">
              <ShareBar label="Canh tác" value={allocation["Canh Tác"]} color="#82946b" />
              <ShareBar label="Đồng cỏ" value={allocation["Đồng Cỏ"]} color="#a39768" />
              <ShareBar label="Lâm địa" value={allocation["Lâm Địa"]} color="#526f5b" />
              <ShareBar label="Thôn ấp" value={allocation["Thôn Ấp"]} color="#9a7860" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--glass-border)] pt-3 text-center">
              <div><div className="text-[10px] text-[var(--text-faint)]">Màu mỡ</div><div className="mt-1 tabular-nums">{management["Độ Màu Mỡ"]}/100</div></div>
              <div><div className="text-[10px] text-[var(--text-faint)]">Khai thác</div><div className="mt-1 tabular-nums">{management["Cường Độ Khai Thác"]}/100</div></div>
              <div><div className="text-[10px] text-[var(--text-faint)]">Xói mòn</div><div className="mt-1 tabular-nums text-[var(--warn)]">{management["Xói Mòn"]}/100</div></div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-4">
            <h3 className="font-display text-[17px]">Liên kết quân sự</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Quân đồn trú" value={number(summary.garrison)} />
              <Metric label="Phòng thủ" value={number(summary.defense)} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
              Dân số, lương thực, đường sá và địa hình ở đây quyết định quân có thể tuyển, thời gian tập kết và sức tiếp tế của Thành Trì.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
