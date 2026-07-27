/**
 * CourtPanel (13.5) — bảng Triều Đình kính mờ, mở từ rail Triều Đình. 3 tab:
 * - Tiểu Hội Đồng: sơ đồ bàn hội đồng 7 ghế + badge Năng Lực; bấm ghế → chi tiết
 *   + Bổ nhiệm/Miễn nhiệm (nếu có thẩm quyền 13.2) hoặc Vận động (lobby).
 * - Phe Cánh: ai phò/chống/trung lập theo Thái Độ Các Nhà (13.5).
 * - Gia Tộc & Kế Vị: cây gia phả + thứ tự kế vị + hôn ước đang thương lượng (13.4).
 * Engine giữ số; panel chỉ gọi courtStore. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useCourtStore } from "../../state/courtStore";
import { useUiStore } from "../../state/uiStore";
import { COURT_POSITIONS, SUCCESSION_LAWS, type CourtPosition } from "../../mvu/schema";
import {
  canAppoint, abilityForPosition, isSeatFilled, findNpc,
  COURT_EFFECT_HINT, COURT_FIELD_STAT, treasuryMultiplier,
} from "../../strategy/court";
import { livingFamily, successionOrder, successionCrisisInfo, type SuccessionLaw } from "../../strategy/succession";
import { HOUSE_ID_BY_SCHEMA } from "../../territory/territoryEngine";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { REGIONS } from "../../content/westeros/regions";
import { houseColor } from "../../content/westeros/houseColors";
import type { Npc } from "../../mvu/npcSchema";
import { GlassButton } from "../components/GlassButton";
import { GlassSelect } from "../components/GlassSelect";
import {
  IconX, IconCrown, IconCoins, IconScroll, IconEye, IconShield, IconUsers, IconBook, IconCrossedSwords, IconAlert, IconSpark,
} from "../icons";

type Tab = "council" | "power" | "dynasty" | "kingdoms";

const POSITION_ICON: Record<CourtPosition, React.ReactNode> = {
  "Bàn Tay Nhà Vua": <IconCrown size={15} />,
  "Đại Chưởng Ngân Khố": <IconCoins size={15} />,
  "Đại Chưởng Ấn": <IconScroll size={15} />,
  "Đô Đốc Hạm Đội": <IconShield size={15} />,
  "Đại Điệp Viên": <IconEye size={15} />,
  "Học Sĩ Trưởng": <IconBook size={15} />,
  "Tổng Chỉ Huy Ngự Lâm Quân": <IconCrossedSwords size={15} />,
};

type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

/** Màu bản sắc Nhà từ tên schema NPC ("Lannister" → houseId). */
function npcColor(house?: string) {
  const id = house ? HOUSE_ID_BY_SCHEMA[house] ?? house.toLowerCase() : "";
  return houseColor(id);
}

/** Avatar tròn sinh tự động: màu Nhà + chữ cái đầu (5.1c fallback — không emoji). */
function Avatar({ name, house, size = 30 }: { name: string; house?: string; size?: number }) {
  const col = npcColor(house);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display"
      style={{ width: size, height: size, background: `${col.base}33`, border: `1px solid ${col.base}`, color: col.light, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

/** NPC "Phản Trắc"? (Trục Trung Thành-Phản Trắc thấp / hảo cảm âm) — cảnh báo bổ nhiệm (13.5). */
function betrayalRisk(npc: Npc): boolean {
  return npc["Tính Cách"]["Trục Trung Thành-Phản Trắc"] <= -20 || npc["Độ Hảo Cảm"] < -10
    || npc["Nét Tính Cách"].some((t) => /phản|xảo|bội/i.test(t));
}

export function CourtPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("council");
  if (!open) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "council", label: "Tiểu Hội Đồng" },
    { key: "kingdoms", label: "7 Vương Quốc" },
    { key: "power", label: "Phe Cánh" },
    { key: "dynasty", label: "Gia Tộc & Kế Vị" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Triều Đình">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)]" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconCrown size={19} color="var(--accent-text)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">Triều Đình</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
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
          {tab === "council" && <CouncilTab stat={stat} onClose={onClose} />}
          {tab === "kingdoms" && <KingdomsTab stat={stat} />}
          {tab === "power" && <PowerTab stat={stat} />}
          {tab === "dynasty" && <DynastyTab stat={stat} onClose={onClose} />}
        </div>
      </aside>
    </div>
  );
}

// ── Tiểu Hội Đồng ────────────────────────────────────────────────────────────
function CouncilTab({ stat, onClose }: { stat: Stat; onClose: () => void }) {
  const seats = stat["Triều Đình"]["Tiểu Hội Đồng"];
  const selectedSeat = useCourtStore((s) => s.selectedSeat);
  const selectSeat = useCourtStore((s) => s.selectSeat);
  const appointFor = useCourtStore((s) => s.appointFor);
  const openAppoint = useCourtStore((s) => s.openAppoint);
  const authority = canAppoint(stat);
  const coinMult = treasuryMultiplier(stat);

  return (
    <div className="space-y-3">
      {/* bàn hội đồng */}
      <div className="glass rounded-[var(--radius-md)] bg-[linear-gradient(160deg,rgba(176,141,87,0.08),transparent)] px-3 py-2 text-center">
        <p className="font-display text-[12px] tracking-widest text-[var(--accent-text)]">BÀN HỘI ĐỒNG</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
          {stat["Triều Đình"]["Triều Đình Của"] || (authority ? "Triều đình của ngươi" : "Ngươi tham dự triều chính")}
          {coinMult !== 1 ? ` · thu Vàng ×${coinMult.toFixed(2)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {COURT_POSITIONS.map((pos) => {
          const seat = seats[pos];
          const filled = isSeatFilled(seat);
          const npc = filled ? findNpc(stat, seat["Người Giữ Chức"]) : undefined;
          return (
            <button
              key={pos}
              onClick={() => selectSeat(selectedSeat === pos ? null : pos)}
              className={`glass flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-all hover:border-[var(--accent-border)] ${
                selectedSeat === pos ? "border-[var(--accent-border)] bg-[var(--glass-bg-hover)]" : ""
              } ${!filled && authority ? "anim-pulse" : ""}`}
            >
              {filled ? (
                <Avatar name={seat["Người Giữ Chức"]} house={npc?.["Nhà"]} />
              ) : (
                <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--glass-border-bright)] text-[var(--text-faint)]">
                  <IconUsers size={14} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                  {POSITION_ICON[pos]} {pos}
                </span>
                <span className={`block truncate text-[13.5px] ${filled ? "text-[var(--text-soft)]" : "italic text-[var(--text-faint)]"}`}>
                  {filled ? seat["Người Giữ Chức"] : "Khuyết"}
                </span>
              </span>
              {filled && <AbilityBadge value={seat["Năng Lực"]} />}
            </button>
          );
        })}
      </div>

      {selectedSeat && (
        <SeatDetail stat={stat} position={selectedSeat} authority={authority} onAppoint={() => openAppoint(selectedSeat)} onClose={onClose} />
      )}

      {!authority && (
        <p className="text-[11.5px] italic text-[var(--text-faint)]">
          Ngươi chưa có thẩm quyền bổ nhiệm trực tiếp — chỉ có thể vận động qua hội thoại (13.2).
        </p>
      )}

      {appointFor && <AppointModal stat={stat} position={appointFor} />}
    </div>
  );
}

function AbilityBadge({ value }: { value: number }) {
  const col = value >= 65 ? "var(--ok)" : value >= 40 ? "var(--warn)" : "var(--danger)";
  return (
    <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: `${col}66`, color: col }}>
      {value}
    </span>
  );
}

function SeatDetail({ stat, position, authority, onAppoint, onClose }: {
  stat: Stat; position: CourtPosition; authority: boolean; onAppoint: () => void; onClose: () => void;
}) {
  const dismiss = useCourtStore((s) => s.dismiss);
  const setComposerText = useUiStore((s) => s.setComposerText);
  const setGameView = useUiStore((s) => s.setGameView);
  const seat = stat["Triều Đình"]["Tiểu Hội Đồng"][position];
  const filled = isSeatFilled(seat);
  const npc = filled ? findNpc(stat, seat["Người Giữ Chức"]) : undefined;

  const lobby = () => {
    setComposerText(`Ta tìm cách vận động để tác động tới chức ${position} trong Tiểu Hội Đồng.`);
    setGameView("chat");
    onClose();
    setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
  };

  return (
    <div className="glass anim-in rounded-[var(--radius-md)] border-[var(--accent-border)] p-3">
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--accent-text)]">{POSITION_ICON[position]} {position}</p>
      <p className="mt-1 text-[12px] text-[var(--text-muted)]">{COURT_EFFECT_HINT[position]}</p>
      {filled && npc && (
        <p className="mt-1.5 text-[11.5px] text-[var(--text-faint)]">
          Trung thành với ngươi: Hảo cảm {npc["Độ Hảo Cảm"]}, Tin cậy {npc["Tin Cậy"]}
          {betrayalRisk(npc) ? " · [!] có mầm phản trắc" : ""}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {authority ? (
          <>
            <GlassButton size="sm" variant="accent" onClick={onAppoint}>Bổ nhiệm</GlassButton>
            {filled && <GlassButton size="sm" variant="danger" onClick={() => dismiss(position)}>Miễn nhiệm</GlassButton>}
          </>
        ) : (
          <GlassButton size="sm" onClick={lobby}>Vận động</GlassButton>
        )}
      </div>
    </div>
  );
}

function AppointModal({ stat, position }: { stat: Stat; position: CourtPosition }) {
  const appoint = useCourtStore((s) => s.appoint);
  const openAppoint = useCourtStore((s) => s.openAppoint);
  const field = COURT_FIELD_STAT[position];
  const candidates: [string, Npc][] = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ].filter(([, n]) => n["Còn Sống"]).sort((a, b) => abilityForPosition(b[1], position) - abilityForPosition(a[1], position));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Bổ nhiệm">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.65)]" onClick={() => openAppoint(null)} />
      <div className="glass-strong anim-in relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-[var(--radius-md)]">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
          <span className="font-display text-[14px] tracking-wide text-[var(--text-soft)]">Bổ nhiệm {position}</span>
          <button onClick={() => openAppoint(null)} aria-label="Đóng" className="p-1 text-[var(--text-muted)]"><IconX size={16} /></button>
        </div>
        <p className="px-4 pt-2 text-[11px] text-[var(--text-faint)]">Năng lực dự kiến tính theo {field} của ứng viên.</p>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {candidates.length === 0 ? (
            <p className="text-[13px] italic text-[var(--text-muted)]">Chưa có ứng viên nào trong danh sách quan hệ.</p>
          ) : (
            <div className="space-y-1.5">
              {candidates.map(([name, npc]) => {
                const ability = abilityForPosition(npc, position);
                const risk = betrayalRisk(npc);
                return (
                  <button
                    key={name}
                    onClick={() => appoint(position, name)}
                    className="glass flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-all hover:border-[var(--accent-border)]"
                  >
                    <Avatar name={name} house={npc["Nhà"]} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-[var(--text-soft)]">{name}</span>
                      <span className="text-[11px] text-[var(--text-faint)]">
                        Hảo cảm {npc["Độ Hảo Cảm"]}{npc["Nhà"] ? ` · Nhà ${npc["Nhà"]}` : ""}
                        {risk ? " · [!] phản trắc" : ""}
                      </span>
                    </span>
                    <AbilityBadge value={ability} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Phe Cánh (13.5) ──────────────────────────────────────────────────────────
const SUPPORT = ["Tín Nhiệm", "Ủng Hộ"];
const NEUTRAL = ["Cảnh Giác", "Dao Động"];

function PowerTab({ stat }: { stat: Stat }) {
  const houses = Object.entries(stat["Thái Độ Các Nhà"]);
  if (houses.length === 0) return <p className="text-[13px] italic text-[var(--text-muted)]">Chưa rõ thái độ Nhà nào — bàn cờ chính trị chưa hé lộ.</p>;

  const groups: { title: string; color: string; test: (a: string) => boolean }[] = [
    { title: "Phò ngươi", color: "var(--ok)", test: (a) => SUPPORT.includes(a) },
    { title: "Trung lập", color: "var(--text-muted)", test: (a) => NEUTRAL.includes(a) },
    { title: "Chống ngươi", color: "var(--danger)", test: (a) => !SUPPORT.includes(a) && !NEUTRAL.includes(a) },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] italic text-[var(--text-faint)]">Đọc bàn cờ trước khi bổ nhiệm hay mưu đồ — ai phò, ai chống, ai còn lưỡng lự.</p>
      {groups.map((g) => {
        const list = houses.filter(([, h]) => g.test(h["Thái Độ"]));
        if (list.length === 0) return null;
        return (
          <div key={g.title}>
            <h3 className="font-display mb-1.5 text-[12px] uppercase tracking-widest" style={{ color: g.color }}>{g.title}</h3>
            <div className="space-y-1">
              {list.map(([name, h]) => (
                <div key={name} className="glass flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-1.5">
                  <span className="flex items-center gap-2 text-[13px] text-[var(--text-soft)]"><Avatar name={name} house={name} size={24} /> {name}</span>
                  <span className="text-[11.5px]" style={{ color: g.color }}>{h["Thái Độ"]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Gia Tộc & Kế Vị (13.4) ───────────────────────────────────────────────────
function DynastyTab({ stat, onClose }: { stat: Stat; onClose: () => void }) {
  const setLaw = useCourtStore((s) => s.setSuccessionLaw);
  const designateHeir = useCourtStore((s) => s.designateHeir);
  const acceptBetrothal = useCourtStore((s) => s.acceptBetrothal);
  const rejectBetrothal = useCourtStore((s) => s.rejectBetrothal);
  const setComposerText = useUiStore((s) => s.setComposerText);
  const setGameView = useUiStore((s) => s.setGameView);

  const gia = stat["Gia Tộc Học"];
  const order = successionOrder(stat);
  const family = livingFamily(stat);
  const crisis = successionCrisisInfo(stat);
  const player = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const uyTin = stat["Chỉ Số Cốt Lõi"]["Uy Tín"];
  const nganKho = stat["Thông Tin Nhân Vật"]["Ngân Khố"];
  const [pendingLaw, setPendingLaw] = useState<SuccessionLaw | null>(null);
  
  const spouse = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ].find(([, n]) => n["Loại Quan Hệ"]?.includes("Vợ/Chồng") && n["Còn Sống"]);
  const betrothals = Object.entries(gia["Hôn Ước Đang Thương Lượng"]);

  const arrange = () => {
    setComposerText("Ta muốn dạm hỏi một mối hôn nhân chính trị có lợi. ");
    setGameView("chat");
    onClose();
    setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
  };

  return (
    <div className="space-y-3">
      {(crisis.inCrisis || gia["_Khủng Hoảng Kế Vị"]) && (
        <div className="glass anim-in rounded-[var(--radius-md)] border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.08)] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--danger)]"><IconAlert size={14} /> KHỦNG HOẢNG KẾ VỊ</p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">{crisis.reason || "Tranh chấp thừa kế đang âm ỉ trong dòng họ."}</p>
        </div>
      )}

      {/* luật kế vị */}
      <div className="glass rounded-[var(--radius-md)] p-3">
        <span className="mb-2 block text-[12px] font-medium text-[var(--text-muted)]">Luật kế vị hiện tại</span>
        
        {pendingLaw ? (
          <div className="space-y-2">
            <p className="text-[12px] text-[var(--text-soft)]">
              Đổi sang <span className="font-bold text-[var(--accent-text)]">{pendingLaw}</span>?
            </p>
            <div className="text-[11px] space-y-1">
              <p className={nganKho >= 5880000 ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                • Chi phí: 500 Rồng Vàng (5,880,000 Đồng Đỏ) {nganKho >= 5880000 ? "✔" : "✘"}
              </p>
              <p className={uyTin >= 14 ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                • Yêu cầu: Uy Tín 14+ (Hiện có: {uyTin}) {uyTin >= 14 ? "✔" : "✘"}
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <GlassButton 
                size="sm" 
                variant="accent" 
                disabled={nganKho < 5880000 || uyTin < 14}
                onClick={() => {
                  setLaw(pendingLaw);
                  setPendingLaw(null);
                }}
              >
                Xác nhận
              </GlassButton>
              <GlassButton 
                size="sm" 
                variant="ghost" 
                onClick={() => setPendingLaw(null)}
              >
                Hủy
              </GlassButton>
            </div>
          </div>
        ) : (
          <GlassSelect 
            value={gia["Luật Kế Vị"]} 
            onChange={(e) => {
              const newLaw = e.target.value as SuccessionLaw;
              if (newLaw !== gia["Luật Kế Vị"]) {
                setPendingLaw(newLaw);
              }
            }}
          >
            {SUCCESSION_LAWS.map((l) => <option key={l} value={l}>{l}</option>)}
          </GlassSelect>
        )}
      </div>

      {/* cây gia phả gọn */}
      <div className="glass rounded-[var(--radius-md)] p-3">
        <p className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Gia phả</p>
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center">
            <Avatar name={player} house={stat["Thông Tin Nhân Vật"]["Nhà"]} size={38} />
            <span className="mt-1 text-[11.5px] text-[var(--text-soft)]">{player}</span>
            <span className="text-[10px] text-[var(--text-faint)]">ngươi</span>
          </div>
          {spouse && (
            <>
              <span className="text-[var(--text-faint)]">—</span>
              <div className="flex flex-col items-center">
                <Avatar name={spouse[0]} house={spouse[1]["Nhà"]} size={38} />
                <span className="mt-1 text-[11.5px] text-[var(--text-soft)]">{spouse[0]}</span>
                <span className="text-[10px] text-[var(--text-faint)]">phối ngẫu</span>
              </div>
            </>
          )}
        </div>
        {family.length === 0 && <p className="mt-2 text-center text-[11.5px] italic text-[var(--text-faint)]">Chưa có thành viên gia tộc nào trong danh sách.</p>}
      </div>

      {/* thứ tự kế vị */}
      {order.length > 0 && (
        <div>
          <p className="font-display mb-1.5 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Thứ tự kế vị</p>
          <div className="space-y-1">
            {order.map((name, i) => {
              const npc = stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][name];
              const isHeir = name === gia["Người Thừa Kế Hiện Tại"];
              return (
                <div key={name} className={`glass flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-1.5 ${isHeir ? "border-[var(--accent-border)]" : ""}`}>
                  <span className="w-4 shrink-0 text-center font-mono text-[12px] text-[var(--text-faint)]">{i + 1}</span>
                  <Avatar name={name} house={npc?.["Nhà"]} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-soft)]">
                    {name}
                    {npc ? <span className="text-[11px] text-[var(--text-faint)]"> · {npc["Tuổi"]} tuổi · {npc["Giới Tính"]}</span> : null}
                  </span>
                  {isHeir ? (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--accent-text)]"><IconSpark size={12} /> thừa kế</span>
                  ) : (
                    <button onClick={() => designateHeir(name)} className="shrink-0 text-[11px] text-[var(--text-faint)] hover:text-[var(--accent-text)]">chỉ định</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* hôn ước đang thương lượng */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="font-display text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Hôn ước thương lượng</p>
          <button onClick={arrange} className="text-[11px] text-[var(--text-faint)] hover:text-[var(--accent-text)]">+ dạm hỏi</button>
        </div>
        {betrothals.length === 0 ? (
          <p className="text-[11.5px] italic text-[var(--text-faint)]">Chưa có lời cầu hôn nào. Khi hợp thời, các Nhà sẽ gửi quạ đến ngỏ ý.</p>
        ) : (
          <div className="space-y-2">
            {betrothals.map(([id, b]) => {
              const house = HOUSES_BY_ID[b["Nhà Đối Tác"]];
              return (
                <div key={id} className="glass rounded-[var(--radius-md)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13.5px] text-[var(--text-soft)]"><Avatar name={b["Đối Tượng"]} house={house?.schemaName} size={26} /> {b["Đối Tượng"]}</span>
                    <span className="text-[11px] text-[var(--text-faint)]">{house?.name ?? b["Nhà Đối Tác"] ?? "?"}</span>
                  </div>
                  {b["Lợi Ích Chính Trị"] && <p className="mt-1 text-[11.5px] italic text-[var(--text-muted)]">{b["Lợi Ích Chính Trị"]}</p>}
                  <p className="mt-1 text-[11.5px] text-[var(--text-faint)]">
                    Của hồi môn: {b["Của Hồi Môn"].toLocaleString("vi-VN")} Vàng ({b["Chi Trả"]})
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <GlassButton size="sm" variant="accent" onClick={() => acceptBetrothal(id)}>Chấp nhận</GlassButton>
                    <GlassButton size="sm" variant="ghost" onClick={() => rejectBetrothal(id)}>Từ chối</GlassButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[11.5px] italic text-[var(--text-faint)]">Hôn nhân chính trị nâng thái độ Nhà đối tác (mở đường xin viện binh); của hồi môn là Vàng chuyển giao (13.4).</p>
    </div>
  );
}

// ── Bảy Vương Quốc ────────────────────────────────────────────────────────────
function KingdomsTab({ stat }: { stat: Stat }) {
  const territories = stat["Chủ Quyền Lãnh Thổ"];

  return (
    <div className="space-y-3">
      <div className="glass rounded-[var(--radius-md)] bg-[linear-gradient(160deg,rgba(176,141,87,0.08),transparent)] px-3 py-2 text-center">
        <p className="font-display text-[12px] uppercase tracking-widest text-[var(--accent-text)]">Bảy Vương Quốc</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">Tình hình các vương quốc tại Westeros</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {REGIONS.map((region) => {
          const territory = territories[region.id];
          const houseId = territory?.["Nhà Kiểm Soát"];
          const house = houseId ? HOUSES_BY_ID[houseId] : undefined;
          const status = territory?.["Tình Trạng"] ?? "Trống";
          
          return (
            <div key={region.id} className="glass flex flex-col gap-1.5 rounded-[var(--radius-sm)] px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={house?.name || "?"} house={house?.schemaName} size={24} />
                  <span className="font-display text-[13.5px] tracking-wide text-[var(--text-soft)]">{region.name}</span>
                </div>
                <span className="text-[12px] font-medium text-[var(--text-muted)]">
                  {house?.name ? `Nhà ${house.name}` : (houseId || "Vô Chủ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-[var(--text-faint)] mt-1">
                <span>Thủ phủ: <span className="text-[var(--text-muted)]">{region.seat}</span></span>
                <span>Dân số: <span className="text-[var(--text-muted)]">{region.population.toLocaleString("vi-VN")}</span></span>
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-[var(--text-faint)]">
                <span>Trạng thái: <span className={status === "Bị Vây" ? "text-[var(--danger)]" : status === "Nổi Loạn" ? "text-[var(--warn)]" : "text-[var(--ok)]"}>{status}</span></span>
                {territory?.["Là Của Người Chơi"] && <span className="text-[var(--accent-text)] flex items-center gap-1"><IconSpark size={12} /> Lãnh địa của ta</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
