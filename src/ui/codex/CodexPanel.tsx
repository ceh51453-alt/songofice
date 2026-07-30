/**
 * CodexPanel (16bis.4) — So Tay Tri Nho: 5 tab tra cuu doc thang tu state.
 * Glassmorphism, premium. Cap nhat realtime (Zustand selectors).
 * Tabs: Nhan Vat | Bien Nien Su | The Luc | Viec Do Dang | Bi Mat
 */
import { useState, useMemo } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useChapterSummaryStore } from "../../memory/chapterSummaryStore";
import { IconCodex, IconScroll, IconShield, IconMask, IconKey } from "./CodexIcons";
import { NpcCard } from "./NpcCard";
import { TimelineView } from "./TimelineView";
import { IconX } from "../icons";
import type { Npc } from "../../mvu/npcSchema";
import { computeRenown } from "../../npc/reputationEngine";
import { getRelationshipEdges, getRelationshipPeople, type PersonGroup } from "../relationship/relationshipData";

type Tab = "nhanvat" | "biensu" | "theluc" | "viec" | "bimat";

const TABS: { id: Tab; label: string; Icon: typeof IconCodex }[] = [
  { id: "nhanvat", label: "Nhân Vật", Icon: IconCodex },
  { id: "biensu", label: "Biên Niên Sử", Icon: IconScroll },
  { id: "theluc", label: "Thế Lực", Icon: IconShield },
  { id: "viec", label: "Việc Dở Dang", Icon: IconMask },
  { id: "bimat", label: "Bí Mật", Icon: IconKey },
];

interface CodexPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CodexPanel({ open, onClose }: CodexPanelProps) {
  const [tab, setTab] = useState<Tab>("nhanvat");
  const [filter, setFilter] = useState("");
  const [expandedNpc, setExpandedNpc] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-strong relative mt-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--glass-border)] shadow-2xl sm:mt-16"
        style={{ maxHeight: "calc(100dvh - 5rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <IconCodex size={20} color="var(--accent-text)" />
            <h2 className="font-display text-lg tracking-wide text-[var(--accent-text)]">
              So Tay
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 border-b border-[var(--glass-border)] px-3">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] transition-colors ${
                tab === id
                  ? "border-b-2 border-[var(--accent-text)] text-[var(--accent-text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-soft)]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(100dvh - 12rem)" }}>
          {tab === "nhanvat" && <NhanVatTab filter={filter} setFilter={setFilter} expandedNpc={expandedNpc} setExpandedNpc={setExpandedNpc} />}
          {tab === "biensu" && <BienSuTab />}
          {tab === "theluc" && <TheLucTab />}
          {tab === "viec" && <ViecDoDangTab />}
          {tab === "bimat" && <BiMatTab />}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Nhan Vat ────────────────────────────────────────────────────────────

function NhanVatTab({
  filter, setFilter, expandedNpc, setExpandedNpc,
}: {
  filter: string;
  setFilter: (v: string) => void;
  expandedNpc: string | null;
  setExpandedNpc: (v: string | null) => void;
}) {
  const stat = useMvuStore((s) => s.stat);
  const [group, setGroup] = useState<"all" | PersonGroup>("all");
  const people = useMemo(() => getRelationshipPeople(stat), [stat]);
  const relationships = useMemo(
    () => getRelationshipEdges(people, stat["Thông Tin Nhân Vật"]["Họ Tên"] || "Người chơi"),
    [people, stat],
  );

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return people.filter((person) =>
      (group === "all" || person.group === group)
      && (!q
        || person.name.toLowerCase().includes(q)
        || (person.npc["Nhà"] ?? "").toLowerCase().includes(q)
        || person.npc["Giai Đoạn Quan Hệ"].toLowerCase().includes(q)
        || person.npc["Loại Quan Hệ"].some((relation) => relation.toLowerCase().includes(q)))
    );
  }, [people, filter, group]);

  const counts = useMemo(() => ({
    all: people.length,
    family: people.filter((person) => person.group === "family").length,
    npc: people.filter((person) => person.group === "npc").length,
  }), [people]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Tìm NPC (tên, Nhà, quan hệ)..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[12px] text-[var(--text-soft)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent-text)]/50"
      />

      <div className="flex flex-wrap gap-1.5">
        {([
          ["all", `Tất cả (${counts.all})`],
          ["family", `Gia tộc (${counts.family})`],
          ["npc", `Nhân vật khác (${counts.npc})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setGroup(id)}
            className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
              group === id
                ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* NPC count */}
      <p className="text-[11px] text-[var(--text-faint)]">
        {filtered.length} nhan vat{filter ? ` (loc: "${filter}")` : ""}
      </p>

      {/* NPC grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-2">
          {filtered.map((person) => (
            <NpcCard
              key={person.id}
              name={person.name}
              npc={person.npc}
              group={person.group}
              relationships={relationships.filter((edge) => edge.sourceId === person.id || edge.targetId === person.id)}
              personId={person.id}
              expanded={expandedNpc === person.id}
              onToggle={() => setExpandedNpc(expandedNpc === person.id ? null : person.id)}
              onOpenPerson={(personId) => setExpandedNpc(personId)}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-[12px] text-[var(--text-faint)]">
          Khong tim thay NPC nao
        </div>
      )}
    </div>
  );
}

// ── Tab: Bien Nien Su ────────────────────────────────────────────────────────

function BienSuTab() {
  const summaries = useChapterSummaryStore((s) => s.summaries);
  return <TimelineView summaries={summaries} />;
}

// ── Tab: The Luc ─────────────────────────────────────────────────────────────

function TheLucTab() {
  const stat = useMvuStore((s) => s.stat);
  const houses = Object.entries(stat["Thái Độ Các Nhà"]);
  const diplomacy = Object.entries(stat["Quan Hệ Ngoại Giao"]);
  const renown = computeRenown(stat);

  return (
    <div className="space-y-4">
      {/* Player reputation */}
      <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-4">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Danh Vong cua nguoi</p>
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          {(["Vinh Dự", "Nhân Từ", "Uy Dũng", "Xảo Quyệt"] as const).map((axis) => (
            <div key={axis} className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">{axis}</span>
              <span className="font-mono text-[var(--text-soft)]">{stat["Danh Vọng"][axis]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--glass-border)] pt-2 text-center">
          <span className="font-display text-sm text-[var(--accent-text)]">{renown.label}</span>
          <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{renown.description}</p>
        </div>
      </div>

      {/* Houses */}
      {houses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Cac Nha</p>
          {houses.map(([name, h]) => {
            const attitude = h["Thái Độ"];
            const color = attitude === "Tín Nhiệm" || attitude === "Ủng Hộ" ? "var(--ok)"
              : attitude === "Thù Địch" || attitude === "Địch Ý" ? "var(--danger)"
              : attitude === "Dao Động" ? "var(--text-muted)"
              : "var(--warning)";
            return (
              <div key={name} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
                <span className="text-[var(--text-soft)]">Nha {name}</span>
                <span style={{ color }} className="font-medium">{attitude}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-[12px] text-[var(--text-faint)]">
          Chua co thong tin ve cac Nha
        </div>
      )}

      {diplomacy.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Sổ Quan Hệ Ngoại Giao</p>
          {diplomacy.map(([houseId, relation]) => {
            const treaties = relation["Hiệp Ước"].filter((treaty) => treaty["Còn Hiệu Lực"]);
            const claims = relation["Ân Oán"];
            return (
              <div key={houseId} className="rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.14)] px-3 py-2.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text-soft)]">Nhà {houseId}</span>
                  <span className={relation["Trạng Thái"] === "Chiến Tranh" ? "text-red-300" : relation["Trạng Thái"] === "Liên Minh" ? "text-emerald-300" : "text-[var(--accent-text)]"}>
                    {relation["Trạng Thái"]}
                  </span>
                </div>
                <p className="mt-1 text-[var(--text-faint)]">
                  Tin cậy {relation["Tin Cậy"] >= 0 ? "+" : ""}{relation["Tin Cậy"]} · Thế chiến {relation["War Score"] >= 0 ? "+" : ""}{relation["War Score"]}
                </p>
                {treaties.length > 0 && <p className="mt-1 text-[var(--text-muted)]">Hiệp ước: {treaties.map((treaty) => treaty["Loại"]).join(" · ")}</p>}
                {claims.length > 0 && <p className="mt-1 text-amber-200">Ân oán: {claims.map((claim) => `${claim["Việc"]} (${claim["Mức"]})`).join(" · ")}</p>}
                {relation["Ghi Chú"] && <p className="mt-1 italic text-[var(--text-faint)]">{relation["Ghi Chú"]}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Viec Do Dang ────────────────────────────────────────────────────────

function ViecDoDangTab() {
  const stat = useMvuStore((s) => s.stat);

  // Điệp viên
  const spies = Object.entries(stat["Tình Báo"]["Điệp Viên"]);
  // Âm mưu
  const plots = Object.entries(stat["Âm Mưu"]);
  // Con tin
  const captives = Object.entries(stat["Tù Binh"]);
  // Lời hứa chưa giữ (aggregate from all NPCs)
  const allNpcs: [string, Npc][] = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];
  const promises = allNpcs
    .filter(([, npc]) => npc["Lời Hứa Chưa Giữ"].length > 0)
    .map(([name, npc]) => ({ name, promises: npc["Lời Hứa Chưa Giữ"] }));

  const hasAnything = spies.length > 0 || plots.length > 0 || captives.length > 0 || promises.length > 0;

  if (!hasAnything) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconMask size={28} color="var(--text-faint)" />
        <p className="mt-3 text-sm text-[var(--text-muted)]">Khong co viec do dang</p>
        <p className="mt-1 text-[11px] text-[var(--text-faint)]">
          Diep vien, am muu, con tin, va loi hua se xuat hien o day
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spies.length > 0 && (
        <Section title="Điệp Viên">
          {spies.map(([n, s]) => (
            <div key={n} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
              <span className="text-[var(--text-soft)]">{n}</span>
              <span className="text-[var(--text-muted)]">Cài ở {s["Cài Ở"] || "?"} — {s["Nhiệm Vụ"]}</span>
            </div>
          ))}
        </Section>
      )}

      {plots.length > 0 && (
        <Section title="Âm Mưu Đang Chạy">
          {plots.map(([n, p]) => (
            <div key={n} className="rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-soft)]">{n}</span>
                <span className="text-[var(--text-faint)]">{p["Loại"]}</span>
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                Nhắm: {p["Mục Tiêu"]} — Tiến độ: {p["Tiến Độ"]} / Bại lộ: {p["Độ Bại Lộ"]}
              </div>
            </div>
          ))}
        </Section>
      )}

      {captives.length > 0 && (
        <Section title="Con Tin Đang Giữ">
          {captives.map(([n, c]) => (
            <div key={n} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
              <span className="text-[var(--text-soft)]">{c["Họ Tên"] || n}</span>
              <span className="text-[var(--text-muted)]">Nhà {c["Nhà"] || "?"} — Đối xử: {c["Đối Xử"]}</span>
            </div>
          ))}
        </Section>
      )}

      {promises.length > 0 && (
        <Section title="Lời Hứa Chưa Giữ">
          {promises.map(({ name, promises: pList }) => (
            <div key={name} className="rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
              <span className="font-medium text-[var(--text-soft)]">{name}</span>
              <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--warning)]">
                {pList.map((p, i) => <li key={i}>"{p}"</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Tab: Bi Mat ──────────────────────────────────────────────────────────────

function BiMatTab() {
  const stat = useMvuStore((s) => s.stat);
  const intelKnown = Object.entries(stat["Tình Báo"]["Tin Tình Báo Đã Biết"]);

  if (intelKnown.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconKey size={28} color="var(--text-faint)" />
        <p className="mt-3 text-sm text-[var(--text-muted)]">Chua co bi mat nao</p>
        <p className="mt-1 text-[11px] text-[var(--text-faint)]">
          Thong tin tinh bao thu thap duoc se xuat hien o day
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Tin Tinh Bao Da Biet</p>
      {intelKnown.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-[var(--glass-border)] px-3 py-2 text-[12px]">
          <span className="font-medium text-[var(--accent-text)]">{key}</span>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
