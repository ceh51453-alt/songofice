/**
 * KingdomsPanel (M21) — BÀN CỜ QUYỀN LỰC CỦA THẾ GIỚI ĐÃ BIẾT.
 *
 * KHÔNG CÓ NÚT CHẠY ENGINE (theo quy ước M20). Đây là bàn cờ VĨ MÔ để nhìn ba
 * thứ mà Bản Đồ / Quân Sự / Ngoại Giao đều không nói được:
 *
 *   Cán Cân    — ai mạnh hơn ai, ta đứng thứ mấy, Era này bàn cờ chia phe thế nào.
 *   Các Vùng   — ai giữ vùng nào, giữ có chắc không, thành nào đang bị vây và
 *                còn mấy ngày thì đổ, vùng nào vừa đổi chủ, lực lượng địa phương là ai.
 *   Chiến Cuộc — chiến tuyến đang mở, cớ hai bên đang giữ, vùng đang cháy.
 *
 * Chỉ có NÚT ĐIỀU HƯỚNG: nhảy tới vùng trên bản đồ, hoặc mồi một câu vào ô chat
 * để người chơi nói ra ý mình. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useUiStore } from "../../state/uiStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { houseColor } from "../../content/westeros/houseColors";
import { FACTION_COLORS_MAP } from "../../content/world/geography";
import { formatDuration } from "../../mvu/calendar";
import { formatCurrencyShort } from "../../economy/currency";
import { kingdomsBoard, type KingdomsBoard, type PowerCard, type RegionCard } from "../../strategy/kingdoms";
import type { DiploState } from "../../mvu/schema";
import { GlassButton } from "../components/GlassButton";
import {
  IconX, IconCrown, IconCastle, IconUsers, IconShield, IconMap, IconScroll,
  IconAlert, IconSpark, IconCrossedSwords, IconSend, IconChevronDown,
} from "../icons";

type Tab = "balance" | "regions" | "war";

const STATUS_TONE: Record<DiploState, string> = {
  "Hoà Bình": "var(--text-muted)",
  "Chiến Tranh": "var(--danger)",
  "Đình Chiến": "#d97706",
  "Liên Minh": "var(--ok)",
  "Thần Phục Ta": "var(--accent-text)",
  "Ta Thần Phục": "#7b8fa6",
};

/** Tình trạng vùng → màu. Vùng yên thì im lặng, vùng cháy thì phải đập vào mắt. */
const REGION_TONE: Record<string, string> = {
  "Ổn Định": "var(--text-faint)",
  "Mới Chiếm": "var(--accent-text)",
  "Đang Tranh Chấp": "#d97706",
  "Nổi Loạn": "#d97706",
  "Bị Vây": "var(--danger)",
};

/** Dân số đọc bằng mắt: 4.000.000 → "4 triệu". */
function compactPeople(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${(m >= 10 ? Math.round(m) : Number(m.toFixed(1))).toLocaleString("vi-VN")} triệu`;
  }
  if (n >= 1_000) return `${Math.round(n / 1000).toLocaleString("vi-VN")} nghìn`;
  return n.toLocaleString("vi-VN");
}

const num = (n: number) => n.toLocaleString("vi-VN");

function Chip({ text, tone }: { text: string; tone?: string }) {
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-0.5 text-[10.5px]"
      style={{ color: tone ?? "var(--text-muted)", borderColor: tone ? `${tone}55` : "var(--glass-border)" }}
    >
      {text}
    </span>
  );
}

/** Thanh tỉ trọng một chiều (0..1). */
function ShareBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}

/** Thanh hai chiều (-100..100) — War Score / lòng tin. */
function TwoWayBar({ label, value }: { label: string; value: number }) {
  const pct = Math.abs(value) / 2;
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10.5px] text-[var(--text-faint)]">
        <span>{label}</span>
        <span className="font-mono">{value > 0 ? "+" : ""}{value}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: value >= 0 ? "50%" : `${50 - pct}%`,
            width: `${pct}%`,
            background: value >= 0 ? "var(--ok)" : "var(--danger)",
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--glass-border-bright)]" />
      </div>
    </div>
  );
}

/** Một ô số liệu nhỏ có icon. */
function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-faint)]">
      <span className="shrink-0" style={{ color: tone ?? "var(--text-faint)" }}>{icon}</span>
      <span className="min-w-0 truncate">
        <strong className="font-normal text-[var(--text-soft)]">{value}</strong> {label}
      </span>
    </div>
  );
}

export function KingdomsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("balance");
  const setGameView = useUiStore((s) => s.setGameView);
  const setComposerText = useUiStore((s) => s.setComposerText);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const setTier = useTerritoryStore((s) => s.setTier);

  if (!open) return null;

  const board = kingdomsBoard(stat);

  /** Nhảy tới vùng trên Tầng Lãnh Thổ của bản đồ. */
  const showOnMap = (regionId: string) => {
    setTier("region");
    selectRegion(regionId);
    setGameView("map");
    onClose();
  };

  /** Mồi một câu vào ô chat — quyết định vẫn diễn ra bằng LỜI trong cuộc chơi. */
  const speak = (text: string) => {
    setComposerText(text);
    setGameView("chat");
    onClose();
    setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
  };

  const hot = board.sieges.length + board.wars.length;
  const tabs: { key: Tab; label: string }[] = [
    { key: "balance", label: "Cán Cân" },
    { key: "regions", label: `${board.scopeRegionCount} Vùng` },
    { key: "war", label: hot > 0 ? `Chiến Cuộc (${hot})` : "Chiến Cuộc" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Bàn Cờ Thế Giới">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)] backdrop-blur-sm" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-[var(--glass-border)]">
        <header className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconCrown size={19} color="var(--accent-text)" />
            <div>
              <h2 className="font-display text-[18px] leading-tight tracking-wide text-[var(--text-soft)]">Bàn Cờ Thế Giới</h2>
              <p className="text-[11px] text-[var(--text-faint)]">{board.scopeLabel} · {board.scopeRegionCount}/{board.worldRegionCount} vùng — năm {board.year} AC</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </header>

        <StandingBar board={board} />

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

        <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
          {tab === "balance" && <BalanceTab board={board} onMap={showOnMap} onSpeak={speak} />}
          {tab === "regions" && <RegionsTab board={board} onMap={showOnMap} />}
          {tab === "war" && <WarTab board={board} onMap={showOnMap} onSpeak={speak} />}
        </div>

        <p className="border-t border-[var(--glass-border)] px-4 py-2.5 text-[11px] italic leading-relaxed text-[var(--text-faint)]">
          Quân huy động là ƯỚC LƯỢNG theo dân số và chính thể địa phương — không phải quân đang có ngoài đồng.
          Bàn cờ này chỉ để nhìn cho rõ; muốn đổi nó thì phải nói ra trong cuộc chơi.
        </p>
      </aside>
    </div>
  );
}

/** Ta đang đứng ở đâu trên bàn cờ — dòng quan trọng nhất của cả bảng. */
function StandingBar({ board }: { board: KingdomsBoard }) {
  const me = board.powers.find((p) => p.isPlayer);

  if (!me) {
    return (
      <div className="border-b border-[var(--glass-border)] px-4 py-2.5">
        <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
          Ngươi chưa nắm tấc đất nào trong {board.scopeLabel.toLowerCase()} — bàn cờ này đang là của người khác.
          {board.playerArmy > 0 ? ` Ngươi có ${num(board.playerArmy)} quân trong tay, không có đất để nuôi.` : ""}
        </p>
      </div>
    );
  }

  const col = houseColor(me.houseId);
  return (
    <div className="border-b border-[var(--glass-border)] px-4 py-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-[12.5px] text-[var(--text-soft)]">
          {me.name} — hạng <span className="font-mono" style={{ color: col.light }}>{board.playerRank}</span>
          <span className="text-[var(--text-faint)]">/{board.powers.length} thế lực</span>
        </span>
        <span className="shrink-0 font-mono text-[11.5px] text-[var(--text-faint)]">
          {(me.populationShare * 100).toFixed(1)}% {board.scopeContinentName}
        </span>
      </div>
      <ShareBar value={me.populationShare} color={col.base} />
      <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
        {me.regionIds.length} vùng · huy động được ~{num(me.levy)} quân · đang có {num(board.playerArmy)} quân trong biên chế
      </p>
    </div>
  );
}

// ── Cán Cân ──────────────────────────────────────────────────────────────────
function BalanceTab({ board, onMap, onSpeak }: {
  board: KingdomsBoard; onMap: (id: string) => void; onSpeak: (t: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (board.powers.length === 0) {
    return (
      <p className="text-[13px] italic leading-relaxed text-[var(--text-muted)]">
        Chưa thế lực nào được ghi là chủ của vùng nào trong phạm vi này — bàn cờ chủ quyền chưa được gieo.
      </p>
    );
  }

  const strongest = board.powers[0].levy || 1;

  return (
    <div className="space-y-4">
      {board.factions.length > 0 && <FactionSplit board={board} />}

      <div>
        <h3 className="font-display mb-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
          Thế lực nắm đất
        </h3>
        <p className="mb-2 text-[11px] italic text-[var(--text-faint)]">
          Xếp theo lực lượng có thể huy động trong mô hình chính trị địa phương, không áp một tỷ lệ phong kiến cho cả thế giới.
        </p>
        <div className="space-y-1.5">
          {board.powers.map((p, i) => (
            <PowerRow
              key={p.houseId}
              power={p}
              rank={i + 1}
              relative={p.levy / strongest}
              expanded={openId === p.houseId}
              onToggle={() => setOpenId(openId === p.houseId ? null : p.houseId)}
              onMap={onMap}
              onSpeak={onSpeak}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Era chia phe (Vũ Điệu Rồng, Ngũ Vương...) — hai cột quân trước khi tính từng Nhà. */
function FactionSplit({ board }: { board: KingdomsBoard }) {
  const max = Math.max(1, ...board.factions.map((f) => f.levy));
  return (
    <div className="glass rounded-[var(--radius-md)] p-3">
      <p className="font-display mb-2 text-[11px] uppercase tracking-widest text-[var(--accent-text)]">
        Bàn cờ đang chia phe
      </p>
      <div className="space-y-2.5">
        {board.factions.map((f) => {
          const col = houseColor(FACTION_COLORS_MAP[f.name] ?? f.colorHouseId);
          return (
            <div key={f.name}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[12.5px]" style={{ color: col.light }}>
                  {f.name}
                  {f.ours && <Chip text="phe ta" tone="var(--accent-text)" />}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[var(--text-faint)]">{num(f.levy)}</span>
              </div>
              <ShareBar value={f.levy / max} color={col.base} />
              <p className="mt-1 text-[11px] text-[var(--text-faint)]">
                {f.regions > 0 ? `${f.regions} vùng · ${compactPeople(f.population)} dân` : "chưa nắm vùng nào trên bàn cờ"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PowerRow({ power, rank, relative, expanded, onToggle, onMap, onSpeak }: {
  power: PowerCard; rank: number; relative: number; expanded: boolean;
  onToggle: () => void; onMap: (id: string) => void; onSpeak: (t: string) => void;
}) {
  const col = houseColor(power.houseId);
  const rel = power.relation;

  return (
    <div
      className={`glass relative overflow-hidden rounded-[var(--radius-md)] transition-colors ${
        power.isPlayer ? "border-[var(--accent-border)]" : ""
      }`}
    >
      <div className="absolute left-0 top-0 h-full w-1.5 opacity-80" style={{ background: col.base }} />
      <button onClick={onToggle} className="w-full px-3 py-2.5 pl-4 text-left">
        <div className="flex items-baseline gap-2">
          <span className="w-4 shrink-0 font-mono text-[12px] text-[var(--text-faint)]">{rank}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--text-soft)]">
            {power.name}
            {power.isPlayer && <span className="ml-1.5 text-[11px] text-[var(--accent-text)]">— ngươi</span>}
          </span>
          {rel && rel.status !== "Hoà Bình" && <Chip text={rel.status} tone={STATUS_TONE[rel.status]} />}
          <IconChevronDown size={13} className={`shrink-0 text-[var(--text-faint)] ${expanded ? "rotate-180" : ""}`} />
        </div>
        <div className="mt-1.5 pl-6">
          <ShareBar value={relative} color={col.base} />
          <p className="mt-1 text-[11px] text-[var(--text-faint)]">
            {power.regionIds.length} vùng · {compactPeople(power.population)} dân · huy động ~{num(power.levy)} quân
            {power.attitude && !power.isPlayer ? ` · thái độ ${power.attitude}` : ""}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="anim-in space-y-2.5 border-t border-[var(--glass-border)] px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {power.regionNames.map((name, i) => (
              <button
                key={power.regionIds[i]}
                onClick={() => onMap(power.regionIds[i])}
                className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10.5px] text-[var(--text-muted)] hover:border-[var(--accent-border)] hover:text-[var(--accent-text)]"
              >
                {name}
              </button>
            ))}
          </div>

          <p className="text-[11.5px] text-[var(--text-faint)]">
            Lực lượng địa phương đã biết cam kết {num(power.knownLevy)} quân
            {power.faction ? ` · đứng phe ${power.faction}` : ""}
          </p>

          {rel ? (
            <>
              {rel.status === "Chiến Tranh" && <TwoWayBar label="War Score" value={rel.warScore} />}
              <TwoWayBar label="Lòng tin" value={rel.trust} />
              <div className="flex flex-wrap gap-1">
                {rel.truceLeft > 0 && <Chip text={`Đình chiến còn ${formatDuration(rel.truceLeft)}`} tone="#d97706" />}
                {rel.activeTreaties.map((t, i) => <Chip key={i} text={t["Loại"]} tone="var(--ok)" />)}
                {rel.tribute > 0 && <Chip text={`Họ cống ${formatCurrencyShort(rel.tribute)}/tháng`} tone="var(--ok)" />}
                {rel.tribute < 0 && <Chip text={`Ta cống ${formatCurrencyShort(-rel.tribute)}/tháng`} tone="var(--danger)" />}
                {rel.ourClaim > 0 && <Chip text={`Ta có cớ (${rel.ourClaim})`} tone="var(--accent-text)" />}
                {rel.theirClaim > 0 && <Chip text={`Họ có cớ (${rel.theirClaim})`} tone="var(--danger)" />}
              </div>
            </>
          ) : (
            !power.isPlayer && (
              <p className="text-[11.5px] italic text-[var(--text-faint)]">
                Chưa có bản ghi ngoại giao nào với thế lực này — chưa sứ giả nào qua lại, chưa giọt máu nào đổ.
              </p>
            )
          )}

          {!power.isPlayer && (
            <div className="flex flex-wrap gap-1.5">
              {power.regionIds[0] && (
                <GlassButton size="sm" onClick={() => onMap(power.regionIds[0])}>
                  <IconMap size={13} /> Xem trên bản đồ
                </GlassButton>
              )}
              <GlassButton
                size="sm"
                variant="ghost"
                onClick={() => onSpeak(`Ta cho gọi học sĩ, thảo một lá thư gửi tới ${power.name}. `)}
              >
                <IconSend size={13} /> Gửi quạ
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Các Vùng ────────────────────────────────────────────────────────────────
function RegionsTab({ board, onMap }: { board: KingdomsBoard; onMap: (id: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <p className="mb-1 text-[11px] italic text-[var(--text-faint)]">
        Các vùng thuộc {board.scopeLabel.toLowerCase()}. Bấm một vùng để xem chủ quyền, quân lực và lực lượng địa phương đã biết.
      </p>
      {board.regions.map((r) => (
        <RegionRow
          key={r.id}
          region={r}
          expanded={openId === r.id}
          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
          onMap={onMap}
        />
      ))}
    </div>
  );
}

function RegionRow({ region: r, expanded, onToggle, onMap }: {
  region: RegionCard; expanded: boolean; onToggle: () => void; onMap: (id: string) => void;
}) {
  const col = houseColor(r.holderId);
  const tone = REGION_TONE[r.status] ?? "var(--text-faint)";
  const alarmed = r.status === "Bị Vây" || r.status === "Nổi Loạn" || r.status === "Đang Tranh Chấp";

  return (
    <div
      className="glass relative overflow-hidden rounded-[var(--radius-md)]"
      style={alarmed ? { borderColor: `${tone}66` } : undefined}
    >
      <div className="absolute left-0 top-0 h-full w-1.5 opacity-80" style={{ background: col.base }} />
      <button onClick={onToggle} className="w-full px-3 py-2.5 pl-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display flex items-center gap-1.5 text-[14px] tracking-wide text-[var(--text-soft)]">
              {r.name}
              {r.isPlayer && <IconSpark size={12} className="text-[var(--accent-text)]" />}
            </h3>
            <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-faint)]">
              {r.seat} · <span style={{ color: col.light }}>{r.holderName}</span>
              {r.lord ? ` · ${r.lord}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {r.status !== "Ổn Định" && <Chip text={r.status} tone={tone} />}
            <IconChevronDown size={13} className={`text-[var(--text-faint)] ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Stat icon={<IconUsers size={13} />} value={compactPeople(r.population)} label="dân" />
          <Stat icon={<IconShield size={13} />} value={`~${num(r.levy)}`} label="quân huy động" />
          <Stat icon={<IconCastle size={13} />} value={String(r.bannermen.length)} label="lực lượng đã biết" />
          {r.ourTroops > 0 ? (
            <Stat icon={<IconCrossedSwords size={13} />} value={num(r.ourTroops)} label="quân ta đóng" tone="var(--accent-text)" />
          ) : (
            <Stat icon={<IconMap size={13} />} value={r.terrain} label={r.coastal ? "· giáp biển" : ""} />
          )}
        </div>

        {r.siege && (
          <div className="mt-2 rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.35)] bg-[rgba(176,106,95,0.08)] px-2.5 py-2">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--danger)]">
                <IconAlert size={12} />
                {r.siege.ours ? "Quân ta đang vây" : `${r.siege.besiegerName} đang vây`}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-[var(--text-faint)]">
                vây {formatDuration(r.siege.daysIn)}
              </span>
            </div>
            <ShareBar value={r.siege.progress} color="var(--danger)" />
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">
              {r.siege.outcome === "Thất Thủ"
                ? `Hết lương sau ${formatDuration(r.siege.daysToFall)} → thành thất thủ`
                : `Quân vây hết hạn sau ${formatDuration(r.siege.daysToRaise)} → rã vây`}
              {" · "}viện binh tới là phá được vây
            </p>
          </div>
        )}

        {r.changedDaysAgo !== null && r.changedDaysAgo < 360 && (
          <p className="mt-1.5 text-[11px] italic text-[var(--accent-text)]">
            Đổi chủ {r.changedDaysAgo === 0 ? "hôm nay" : `${formatDuration(r.changedDaysAgo)} trước`} — dân chưa quy phục.
          </p>
        )}
      </button>

      {expanded && (
        <div className="anim-in space-y-2 border-t border-[var(--glass-border)] px-4 py-3">
          {r.relation && (
            <p className="text-[11.5px] text-[var(--text-faint)]">
              Ta với {r.holderName}: <span style={{ color: STATUS_TONE[r.relation.status] }}>{r.relation.status}</span>
              {r.relation.attitude ? ` · thái độ ${r.relation.attitude}` : ""}
            </p>
          )}

          {r.bannermen.length === 0 ? (
            <p className="text-[11.5px] italic text-[var(--text-muted)]">Chưa có dữ liệu lực lượng địa phương cho vùng này.</p>
          ) : (
            <>
              <p className="font-display text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
                Lực lượng địa phương · cam kết {num(r.knownLevy)} quân
              </p>
              <div className="space-y-1">
                {r.bannermen.map((b) => (
                  <div key={b.id} className="rounded-[var(--radius-sm)] bg-[rgba(0,0,0,0.18)] px-2.5 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-[12.5px] text-[var(--text-soft)]">{b.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--text-faint)]">{num(b.levy)} {b.troop}</span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-[var(--text-faint)]">
                      {b.seat} · hành quân {formatDuration(b.marchDays)} tới trọng trấn
                    </p>
                    <p className="mt-0.5 text-[11px] italic leading-relaxed text-[var(--text-muted)]">{b.note}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <GlassButton size="sm" onClick={() => onMap(r.id)}>
            <IconMap size={13} /> Xem trên bản đồ
          </GlassButton>
        </div>
      )}
    </div>
  );
}

// ── Chiến Cuộc ───────────────────────────────────────────────────────────────
function WarTab({ board, onMap, onSpeak }: {
  board: KingdomsBoard; onMap: (id: string) => void; onSpeak: (t: string) => void;
}) {
  const quiet = board.wars.length === 0 && board.sieges.length === 0 && board.unrest.length === 0;

  if (quiet) {
    return (
      <p className="text-[13px] italic leading-relaxed text-[var(--text-muted)]">
        Không có chiến tuyến nào đang mở, không thành nào bị vây; {board.scopeRegionCount} vùng của {board.scopeContinentName} đều yên.
        Đây là khoảng lặng giữa hai cuộc chiến — hãy dùng nó để tích lương và kiểm lại lực lượng.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {board.wars.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--danger)]">
            <IconCrossedSwords size={13} /> Chiến tuyến của ta
          </h3>
          <div className="space-y-2">
            {board.wars.map((w) => (
              <div key={w.houseId} className="glass rounded-[var(--radius-md)] border-[rgba(176,106,95,0.4)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate text-[13.5px] text-[var(--text-soft)]">{w.label}</span>
                  <Chip
                    text={w.warScore > 15 ? "ta đang thắng thế" : w.warScore < -15 ? "ta đang thua thế" : "giằng co"}
                    tone={w.warScore > 15 ? "var(--ok)" : w.warScore < -15 ? "var(--danger)" : "#d97706"}
                  />
                </div>
                <div className="mt-2"><TwoWayBar label="War Score" value={w.warScore} /></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.ourClaim > 0 && <Chip text={`Cớ của ta (${w.ourClaim})`} tone="var(--accent-text)" />}
                  {w.theirClaim > 0 && <Chip text={`Cớ của họ (${w.theirClaim})`} tone="var(--danger)" />}
                  {w.attitude && <Chip text={`thái độ ${w.attitude}`} />}
                </div>
                <div className="mt-2">
                  <GlassButton
                    size="sm"
                    variant="ghost"
                    onClick={() => onSpeak(`Ta cho người mang cờ trắng tới ${w.label}, dò xem họ có muốn nói chuyện hoà không. `)}
                  >
                    <IconScroll size={13} /> Dò ý cầu hoà
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {board.sieges.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--danger)]">
            <IconAlert size={13} /> Thành đang bị vây
          </h3>
          <div className="space-y-2">
            {board.sieges.map((r) => (
              <button
                key={r.id}
                onClick={() => onMap(r.id)}
                className="glass block w-full rounded-[var(--radius-md)] px-3 py-2.5 text-left hover:border-[var(--accent-border)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[13px] text-[var(--text-soft)]">{r.seat} · {r.name}</span>
                  <span className="shrink-0 font-mono text-[10.5px] text-[var(--text-faint)]">
                    {formatDuration(r.siege!.daysIn)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                  {r.siege!.ours ? "quân ta vây" : `${r.siege!.besiegerName} vây`} · {r.holderName} giữ thành ·{" "}
                  {r.siege!.outcome === "Thất Thủ"
                    ? `còn ${formatDuration(r.siege!.daysToFall)} lương`
                    : `quân vây rã sau ${formatDuration(r.siege!.daysToRaise)}`}
                </p>
                <div className="mt-1.5"><ShareBar value={r.siege!.progress} color="var(--danger)" /></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {board.unrest.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 text-[11px] uppercase tracking-widest" style={{ color: "#d97706" }}>
            Vùng không yên
          </h3>
          <div className="space-y-1">
            {board.unrest.map((r) => (
              <button
                key={r.id}
                onClick={() => onMap(r.id)}
                className="glass flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left hover:border-[var(--accent-border)]"
              >
                <span className="min-w-0 truncate text-[12.5px] text-[var(--text-soft)]">
                  {r.name} <span className="text-[11px] text-[var(--text-faint)]">· {r.holderName}</span>
                </span>
                <Chip text={r.status} tone={REGION_TONE[r.status]} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
