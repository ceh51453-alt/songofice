/**
 * TabDecree — BAN HÀNH PHÁP LỆNH (10.4).
 *
 * Khác bản cũ ở chỗ pháp lệnh giờ CÓ HIỆU LỰC THẬT: mỗi chiếu chỉ mang một bộ
 * hệ số mà engine áp vào lúc chốt sổ hằng tháng (thuế, lòng dân, sản lượng,
 * nhân lực lao dịch, quân lương). Bảng dưới hiển thị đúng cái giá phải trả.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { formatCurrencyShort } from "../../economy/currency";
import { getTitleLevel } from "../../character/roleplay";
import { DECREE_CATALOG, DECREE_BY_ID, combineDecrees, type DecreeDef } from "../../content/westeros/decrees";
import type { ResourceKey } from "../../content/westeros/buildings";
import { IconBook, IconAlert } from "../icons";

type Holding = ReturnType<typeof useMvuStore.getState>["stat"]["Lãnh Địa"][string];

function costLine(cost: Partial<Record<ResourceKey, number>> | undefined): string {
  if (!cost) return "";
  return Object.entries(cost)
    .map(([k, v]) => (k === "Ngân Khố" ? formatCurrencyShort(v ?? 0) : `${k} ${v}`))
    .join(" · ");
}

export function TabDecree({ territoryId, holding, isOwner }: { territoryId: string; holding: Holding; isOwner?: boolean }) {
  const stat = useMvuStore((s) => s.stat);
  const issue = useTerritoryStore((s) => s.issueDecree);
  const revoke = useTerritoryStore((s) => s.revokeDecree);
  const pLevel = getTitleLevel(stat["Thông Tin Nhân Vật"]["Tước Vị"] || "Thường Dân");
  const [showList, setShowList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decrees = holding["Pháp Lệnh"] ?? {};
  const stock = holding["Tài Nguyên"];
  const active = Object.entries(decrees).filter(([, d]) => d["Trạng Thái"] === "Đang hiệu lực");
  const eff = combineDecrees(decrees);

  const affordable = (def: DecreeDef): boolean =>
    (def.cost?.["Ngân Khố"] ?? 0) <= stat["Thông Tin Nhân Vật"]["Ngân Khố"] &&
    Object.entries(def.cost ?? {}).every(([k, v]) => k === "Ngân Khố" || (stock[k as ResourceKey] ?? 0) >= (v ?? 0));

  return (
    <div className="relative flex h-full flex-col gap-4">
      <div className="glass flex items-start justify-between gap-3 rounded-[var(--radius-md)] p-4">
        <div className="min-w-0">
          <h2 className="font-display flex items-center gap-2 text-[13px] uppercase tracking-widest text-[var(--text-soft)]">
            <IconBook size={16} /> Pháp Lệnh
          </h2>
          <p className="mt-1 text-[12px] text-[var(--text-faint)]">
            Chiếu chỉ có hiệu lực thật — engine áp hệ số vào sổ sách mỗi tháng.
          </p>
          {/* tổng hợp tác động đang chịu, để lãnh chúa thấy mình đã ký những gì */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]">
            <Chip label="Thuế" value={`×${eff.taxMult.toFixed(2)}`} good={eff.taxMult >= 1} />
            <Chip label="Thương mại" value={`×${eff.tradeMult.toFixed(2)}`} good={eff.tradeMult >= 1} />
            <Chip label="Lương thực" value={`×${eff.foodMult.toFixed(2)}`} good={eff.foodMult >= 1} />
            <Chip label="Khai thác" value={`×${eff.miningMult.toFixed(2)}`} good={eff.miningMult >= 1} />
            <Chip label="Lòng dân" value={`${eff.loyaltyPerMonth >= 0 ? "+" : ""}${eff.loyaltyPerMonth}/tháng`} good={eff.loyaltyPerMonth >= 0} />
            {eff.rationing > 0 && <Chip label="Quân lương" value={`−${Math.round(eff.rationing * 100)}%`} good />}
            {eff.buildSpeed > 0 && <Chip label="Thi công" value={`−${Math.round(eff.buildSpeed * 100)}% ngày`} good />}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => { setShowList((v) => !v); setError(null); }}
            className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-3 py-2 text-[12px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
          >
            {showList ? "Đóng" : "Ban hành mới"}
          </button>
        )}
      </div>

      {error && (
        <div className="glass flex items-center gap-2 border-[rgba(176,106,95,0.45)] bg-[rgba(176,106,95,0.08)] px-3 py-2 text-[12.5px] text-[var(--text-soft)]">
          <IconAlert size={15} color="var(--danger)" /> {error}
        </div>
      )}

      {showList && isOwner && (
        <div className="glass-strong anim-in absolute right-0 top-24 z-20 max-h-[70vh] w-[340px] overflow-y-auto rounded-[var(--radius-md)] p-3">
          <h3 className="font-display mb-2 border-b border-[var(--glass-border)] pb-2 text-[12px] uppercase tracking-widest text-[var(--accent-text)]">
            Danh mục chiếu chỉ
          </h3>
          <div className="space-y-2">
            {DECREE_CATALOG.map((def) => {
              const isActive = decrees[def.id]?.["Trạng Thái"] === "Đang hiệu lực";
              if (isActive) return null;
              const canAfford = affordable(def);
              const hasRank = pLevel >= def.reqLevel;
              const usable = canAfford && hasRank;
              return (
                <button
                  key={def.id}
                  disabled={!usable}
                  onClick={() => {
                    const r = issue(territoryId, def.id);
                    if (r.ok) { setShowList(false); setError(null); } else setError(r.error ?? null);
                  }}
                  className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors ${
                    usable
                      ? "border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] hover:border-[var(--accent-text)]"
                      : "cursor-not-allowed border-[rgba(176,106,95,0.3)] bg-[rgba(176,106,95,0.06)] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] text-[var(--text-soft)]">{def.name}</span>
                    <span className="shrink-0 rounded-sm bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-[var(--text-muted)]">
                      {def.kind}
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-[var(--text-muted)]">{def.summary}</div>
                  {(def.cost || def.upkeep) && (
                    <div className="mt-1 text-[11px] text-[var(--text-faint)]">
                      {def.cost && `Phí: ${costLine(def.cost)}`}
                      {def.cost && def.upkeep ? " · " : ""}
                      {def.upkeep && `Duy trì: ${costLine(def.upkeep)}/tháng`}
                    </div>
                  )}
                  {!hasRank && <div className="mt-1 text-[11px] text-[var(--danger)]">Vượt quyền — cần tước vị cao hơn</div>}
                  {hasRank && !canAfford && <div className="mt-1 text-[11px] text-[var(--danger)]">Không đủ chi phí ban hành</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
        {Object.entries(decrees).length === 0 ? (
          <div className="glass col-span-full rounded-[var(--radius-md)] px-4 py-10 text-center text-[13px] italic text-[var(--text-muted)]">
            Chưa có pháp lệnh địa phương nào được ban trên đất trực thuộc này.
          </div>
        ) : (
          Object.entries(decrees).map(([id, decree]) => (
            <DecreeCard
              key={id}
              id={id}
              decree={decree}
              isOwner={isOwner}
              onRevoke={() => revoke(territoryId, id)}
            />
          ))
        )}
      </div>

      {active.length > 0 && (
        <p className="text-[11.5px] italic text-[var(--text-faint)]">
          {active.length} chiếu chỉ đang hiệu lực — hệ số cộng dồn và được chốt vào sổ mỗi tháng.
        </p>
      )}
    </div>
  );
}

function Chip({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <span className="text-[var(--text-faint)]">
      {label} <span className={good ? "text-[var(--ok)]" : "text-[var(--danger)]"}>{value}</span>
    </span>
  );
}

function DecreeCard({
  id, decree, isOwner, onRevoke,
}: {
  id: string;
  decree: Holding["Pháp Lệnh"][string];
  isOwner?: boolean;
  onRevoke: () => void;
}) {
  const isActive = decree["Trạng Thái"] === "Đang hiệu lực";
  const def = DECREE_BY_ID[decree["Mã"] || id];

  return (
    <div className={`glass relative flex flex-col gap-2 overflow-hidden rounded-[var(--radius-md)] p-4 ${isActive ? "border-[var(--accent-soft)]" : "opacity-70"}`}>
      {isActive && <div className="absolute left-0 top-0 h-full w-[3px] bg-[var(--accent-text)]" />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="mb-1 inline-block rounded-sm bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-[var(--text-muted)]">
            {decree["Loại"]}
          </span>
          <h3 className="font-display truncate text-[15px] text-[var(--text-soft)]">{decree["Tên"] || id}</h3>
        </div>
        <span className={`shrink-0 rounded px-2 py-1 text-[11px] ${isActive ? "bg-[rgba(122,158,126,0.18)] text-[var(--ok)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]"}`}>
          {decree["Trạng Thái"]}
        </span>
      </div>

      <p className="border-l-2 border-[var(--glass-border)] pl-3 text-[12.5px] text-[var(--text-muted)]">
        {decree["Hiệu Ứng"] || def?.summary}
      </p>
      {def && <p className="text-[11.5px] italic text-[var(--text-faint)]">{def.flavour}</p>}
      {!def && (
        <p className="text-[11px] italic text-[var(--text-faint)]">
          Chiếu chỉ ngoài danh mục — chỉ có giá trị tường thuật, engine không áp hệ số.
        </p>
      )}

      {isActive && isOwner && (
        <button
          onClick={onRevoke}
          className="mt-1 self-start rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.45)] px-3 py-1.5 text-[11.5px] text-[var(--danger)] hover:bg-[rgba(176,106,95,0.12)]"
        >
          Bãi bỏ
        </button>
      )}
    </div>
  );
}
