import { useMemo } from "react";
import type { StatData } from "../../mvu/schema";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { ATTITUDE_HEAT, PLAYER_HEAT_COLOR, houseColor, NEUTRAL_COLOR } from "../../content/westeros/houseColors";
import {
  deJureRealms,
  factionMapSummaries,
  relationshipMapSummary,
  type DeJureRealmSummary,
  type FactionMapSummary,
  type RelationshipMapSummary,
} from "../../territory/mapAggregate";
import { playerHouseId } from "../../territory/territoryEngine";
import { IconCastle, IconPopulation, IconUsers, IconX } from "../icons";

export type MapInfoSelection =
  | { kind: "realm"; id: string }
  | { kind: "faction"; id: string }
  | { kind: "relationship"; id: string };

interface Props {
  stat: StatData;
  eraId: string;
  selection: MapInfoSelection;
  onClose: () => void;
  onOpenRegions: (realm: DeJureRealmSummary) => void;
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

export function MapInfoPanel({ stat, eraId, selection, onClose, onOpenRegions }: Props) {
  const realms = useMemo(() => deJureRealms(stat, eraId), [stat, eraId]);
  const factions = useMemo(() => factionMapSummaries(stat, eraId), [stat, eraId]);
  const realm = selection.kind === "realm"
    ? realms.find((candidate) => candidate.realmId === selection.id)
    : undefined;
  const faction = selection.kind === "faction"
    ? factions.find((candidate) => candidate.factionId === selection.id)
    : undefined;
  const relationship = selection.kind === "relationship"
    ? relationshipMapSummary(stat, selection.id, eraId)
    : null;
  if (!realm && !faction && !relationship) return null;

  return relationship ? (
    <RelationshipInfo relationship={relationship} isPlayer={relationship.houseId === playerHouseId(stat)} onClose={onClose} />
  ) : realm ? (
    <RealmInfo realm={realm} onClose={onClose} onOpenRegions={() => onOpenRegions(realm)} />
  ) : (
    <FactionInfo faction={faction!} onClose={onClose} />
  );
}

function RelationshipInfo({
  relationship,
  isPlayer,
  onClose,
}: {
  relationship: RelationshipMapSummary;
  isPlayer: boolean;
  onClose: () => void;
}) {
  const heat = ATTITUDE_HEAT[relationship.attitude] ?? ATTITUDE_HEAT["Cảnh Giác"];
  const color = isPlayer ? PLAYER_HEAT_COLOR : heat.color;
  return (
    <PanelShell
      title={isPlayer ? `${relationship.name} · Lãnh thổ của ta` : relationship.name}
      subtitle={isPlayer ? "Trung tâm quyền lực của người chơi" : `${relationship.attitude} · ${heat.label}`}
      color={color}
      onClose={onClose}
    >
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<IconPopulation size={14} />} label="Dân số" value={fmt(relationship.population)} />
        <Metric icon={<IconUsers size={14} />} label="Lãnh thổ" value={`${relationship.regionIds.length}`} />
        <Metric icon={<IconCastle size={14} />} label="Hiệp ước" value={`${relationship.treatyNames.length}`} />
      </div>

      {!isPlayer && (
        <InfoBlock title="Quan hệ với người chơi">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-[var(--text-faint)]">Trạng thái pháp lý</span>
            <span style={{ color }}>{relationship.diplomaticStatus}</span>
          </div>
          <RelationBar label="Lòng tin" value={relationship.trust} />
          {relationship.diplomaticStatus === "Chiến Tranh" && <RelationBar label="Thế chiến" value={relationship.warScore} />}
          {relationship.attitudeDescription && (
            <p className="mt-2 border-t border-[var(--glass-border)] pt-2 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
              {relationship.attitudeDescription}
            </p>
          )}
        </InfoBlock>
      )}

      {relationship.treatyNames.length > 0 && (
        <InfoBlock title="Hiệp ước còn hiệu lực">
          <div className="flex flex-wrap gap-1.5">
            {relationship.treatyNames.map((name, index) => (
              <span key={`${name}-${index}`} className="rounded-full border border-[var(--glass-border)] px-2 py-1 text-[10.5px] text-[var(--ok)]">{name}</span>
            ))}
          </div>
        </InfoBlock>
      )}

      {!isPlayer && (relationship.ourClaim > 0 || relationship.theirClaim > 0) && (
        <InfoBlock title="Ân oán và cớ chiến tranh">
          <div className="flex items-center justify-between text-[12px]"><span className="text-[var(--text-faint)]">Ta có cớ với họ</span><span className="text-[var(--accent-text)]">{relationship.ourClaim}</span></div>
          <div className="mt-1 flex items-center justify-between text-[12px]"><span className="text-[var(--text-faint)]">Họ có cớ với ta</span><span className="text-[var(--danger)]">{relationship.theirClaim}</span></div>
        </InfoBlock>
      )}

      <InfoBlock title={relationship.seat ? `Lãnh thổ do ${relationship.seat} chi phối` : "Lãnh thổ đang kiểm soát"}>
        {relationship.regionIds.length > 0 ? (
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1 text-[11.5px] text-[var(--text-muted)]">
            {relationship.regionIds.map((id) => <div key={id}>{REGIONS_BY_ID[id]?.name ?? id}</div>)}
          </div>
        ) : (
          <p className="text-[11.5px] italic text-[var(--text-faint)]">Nhà này hiện không kiểm soát lãnh thổ nào.</p>
        )}
      </InfoBlock>
    </PanelShell>
  );
}

function PanelShell({
  title,
  subtitle,
  color,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  color: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      className="glass-strong anim-in absolute bottom-24 left-4 top-16 z-20 flex w-[min(380px,calc(100%-2rem))] flex-col overflow-hidden rounded-[var(--radius-lg)]"
      aria-label={title}
    >
      <div className="border-b border-[var(--glass-border)] p-4" style={{ background: `linear-gradient(145deg, ${color}2b, transparent)` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} />
              <h2 className="font-display truncate text-[19px] tracking-wide text-[var(--text-soft)]">{title}</h2>
            </div>
            <p className="text-[11.5px] text-[var(--text-faint)]">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]" aria-label="Đóng hồ sơ bản đồ">
            <IconX size={17} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

function RealmInfo({ realm, onClose, onOpenRegions }: { realm: DeJureRealmSummary; onClose: () => void; onOpenRegions: () => void }) {
  const color = realm.controller ? houseColor(realm.controller).base : NEUTRAL_COLOR.base;
  const controller = (HOUSES_BY_ID[realm.controller]?.name ?? realm.controller) || "Chưa có thế lực trội";
  return (
    <PanelShell title={realm.name} subtitle={`Chính thể de-jure · thế lực trội: ${controller}`} color={color} onClose={onClose}>
      <MetricGrid
        population={realm.population}
        regions={`${realm.totalRegions}`}
        strongholds={`${realm.controlledStrongholds}/${realm.totalStrongholds}`}
      />
      <ControlBar ratio={realm.controlRatio} complete={realm.fullControl} />
      <InfoBlock title="Các lãnh thổ cấu thành">
        <div className="flex flex-wrap gap-1.5">
          {realm.regionIds.map((id) => (
            <span key={id} className="rounded-full border border-[var(--glass-border)] px-2 py-1 text-[10.5px] text-[var(--text-muted)]">
              {REGIONS_BY_ID[id]?.name ?? id}
            </span>
          ))}
        </div>
      </InfoBlock>
      {realm.unsecuredStrongholds.length > 0 && (
        <InfoBlock title={`Thành chưa khuất phục (${realm.unsecuredStrongholds.length})`}>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {realm.unsecuredStrongholds.map((site) => (
              <div key={site.id} className="flex items-center justify-between gap-3 text-[11.5px]">
                <span className="truncate text-[var(--text-muted)]">{site.name}</span>
                <span className="shrink-0 text-[var(--danger)]">{REGIONS_BY_ID[site.provinceId]?.name ?? site.provinceId}</span>
              </div>
            ))}
          </div>
        </InfoBlock>
      )}
      <button onClick={onOpenRegions} className="w-full rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-3 py-2.5 text-[12px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]">
        Mở các lãnh thổ của vương quốc
      </button>
    </PanelShell>
  );
}

function FactionInfo({ faction, onClose }: { faction: FactionMapSummary; onClose: () => void }) {
  const color = faction.colorHouseId ? houseColor(faction.colorHouseId).base : NEUTRAL_COLOR.base;
  return (
    <PanelShell title={faction.name} subtitle="Liên minh và vùng ảnh hưởng trong snapshot hiện tại" color={color} onClose={onClose}>
      <MetricGrid
        population={faction.population}
        regions={`${faction.regionIds.length}`}
        strongholds={`${faction.controlledStrongholds}/${faction.totalStrongholds}`}
      />
      <ControlBar
        ratio={faction.controlRatio}
        complete={faction.regionIds.length > 0 && faction.fullyControlledRegions === faction.regionIds.length}
      />
      <InfoBlock title="Khả năng động viên">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[var(--text-faint)]">Quân dịch ước tính</span>
          <span className="font-mono text-[var(--text-soft)]">{fmt(faction.estimatedLevy)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[12px]">
          <span className="text-[var(--text-faint)]">Lãnh thổ kiểm soát hoàn toàn</span>
          <span className="font-mono text-[var(--text-soft)]">{faction.fullyControlledRegions}/{faction.regionIds.length}</span>
        </div>
      </InfoBlock>
      <InfoBlock title="Các Nhà trong phe">
        <div className="flex flex-wrap gap-1.5">
          {faction.houseIds.map((id) => (
            <span key={id} className="rounded-full border border-[var(--glass-border)] px-2 py-1 text-[10.5px] text-[var(--text-muted)]">
              {HOUSES_BY_ID[id]?.name ?? id}
            </span>
          ))}
        </div>
      </InfoBlock>
      <InfoBlock title="Lãnh thổ đang đứng về phe">
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1 text-[11.5px] text-[var(--text-muted)]">
          {faction.regionIds.map((id) => <div key={id}>{REGIONS_BY_ID[id]?.name ?? id}</div>)}
        </div>
      </InfoBlock>
    </PanelShell>
  );
}

function MetricGrid({ population, regions, strongholds }: { population: number; regions: string; strongholds: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Metric icon={<IconPopulation size={14} />} label="Dân số" value={fmt(population)} />
      <Metric icon={<IconUsers size={14} />} label="Lãnh thổ" value={regions} />
      <Metric icon={<IconCastle size={14} />} label="Thành đã giữ" value={strongholds} />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-[var(--radius-sm)] p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{icon}{label}</div>
      <div className="mt-1 font-mono text-[13px] text-[var(--text-soft)]">{value}</div>
    </div>
  );
}

function ControlBar({ ratio, complete }: { ratio: number; complete: boolean }) {
  const rounded = Math.round(ratio * 100);
  // Không được hiển thị 100% nếu graph còn ít nhất một mục tiêu chưa hoàn tất.
  const percent = complete ? 100 : Math.min(99, rounded);
  return (
    <div className="glass rounded-[var(--radius-sm)] p-3">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="text-[var(--text-faint)]">Kiểm soát thực địa</span>
        <span className={complete ? "text-[var(--ok)]" : "text-[var(--warn)]"}>{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: complete ? "var(--ok)" : "var(--warn)" }} />
      </div>
    </div>
  );
}

function RelationBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(-100, Math.min(100, value));
  const width = Math.abs(safe) / 2;
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[10.5px]">
        <span className="text-[var(--text-faint)]">{label}</span>
        <span className={safe >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}>{safe > 0 ? "+" : ""}{safe}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: safe >= 0 ? "50%" : `${50 - width}%`,
            width: `${width}%`,
            background: safe >= 0 ? "var(--ok)" : "var(--danger)",
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--glass-border-bright)]" />
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[var(--radius-sm)] p-3">
      <h3 className="mb-2 text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">{title}</h3>
      {children}
    </section>
  );
}
