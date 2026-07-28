/**
 * Status Panel (mục 6) — realtime từ MVU store, mỗi sub-panel 1 component.
 * Nguyên tắc: panel chỉ hiện khi có dữ liệu liên quan; số đổi có hiệu ứng (6.4).
 */
import { useMvuStore } from "../../../state/mvuStore";
import { affinityStage } from "../../../mvu/npcSchema";
import {
  IconBackpack, IconCalendar, IconCoins, IconCrossedSwords, IconDragon, IconPin, IconSpark, IconUsers, IconAlert
} from "../../icons";
import { DISEASE_CATALOG } from "../../../content/westeros/diseases";
import { AnimatedNumber } from "./AnimatedNumber";
import { canClaimIronThrone, claimIronThrone } from "../../../character/roleplay";
import { useState } from "react";
import { applyPatch } from "../../../mvu/patchEngine";
import { BodyVisualizer } from "./BodyVisualizer";
import { EquipmentModal } from "./EquipmentModal";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass px-3.5 py-3">
      <h3 className="font-display mb-2 flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5 text-[13px] tracking-widest text-[var(--accent-text)]">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

function Bar({ label, value, max, color, reverseColor }: { label: string; value: number; max: number; color: string; reverseColor?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = reverseColor 
    ? (pct < 50 ? color : pct < 80 ? "var(--warn)" : "var(--danger)")
    : (pct > 50 ? color : pct > 20 ? "var(--warn)" : "var(--danger)");
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-0.5 flex items-center justify-between text-[12px]">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[var(--text-soft)]">
          <AnimatedNumber value={value} />/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

export function StatusPanel() {
  const [isEquipModalOpen, setEquipModalOpen] = useState(false);
  const stat = useMvuStore((s) => s.stat);
  const info = stat["Thông Tin Nhân Vật"];
  const persona = stat["Persona"];
  const vitals = stat["Chỉ Số Sinh Tồn"];
  const derived = stat["Chỉ Số Phái Sinh"];
  const core = stat["Chỉ Số Cốt Lõi"];
  const world = stat["Thế Giới"];
  const npcs = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ].sort((a, b) => Math.abs(b[1]["Độ Hảo Cảm"]) - Math.abs(a[1]["Độ Hảo Cảm"]));
  const items = Object.entries(stat["Túi Đồ"]);
  const skills = Object.entries(stat["Kỹ Năng"]).filter(([, s]) => s["Cấp"] > 0);
  const talents = Object.entries(stat["Thiên Phú"]).filter(([, t]) => !t["Ẩn"]);
  const houses = Object.entries(stat["Thái Độ Các Nhà"]);
  const dragons = Object.entries(stat["Rồng"]);

  const canClaimThrone = canClaimIronThrone(stat);

  return (
    <div className="space-y-3">
      {/* ---- Overview ---- */}
      <Section title="NHÂN VẬT" icon={<IconCrossedSwords size={14} />}>
        <div className="flex items-start gap-3">
          {info["Ảnh Gia Huy"] && (
            <div className="w-12 h-12 shrink-0 rounded border border-[var(--accent)] overflow-hidden bg-black/40">
              <img src={`/api/portrait/${info["Ảnh Gia Huy"]}`} alt="Sigil" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[15px] text-[var(--text-soft)] truncate">{info["Họ Tên"]}</p>
            <p className="text-[12px] text-[var(--text-muted)] truncate flex items-center gap-2">
              <span>{info["Tước Vị"] && info["Tước Vị"] !== "Thường Dân" ? `${info["Tước Vị"]} · ` : ""}Nhà {info["Tên Gia Tộc Tùy Chỉnh"] || info["Nhà"]} · Cấp {info["Cấp Độ"]}</span>
              {canClaimThrone && (
                <button
                  onClick={() => {
                    const st = applyPatch(useMvuStore.getState().stat, []).state;
                    claimIronThrone(st);
                    useMvuStore.setState({ stat: st });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] uppercase font-bold"
                >
                  Đăng Quang
                </button>
              )}
            </p>
            {info["Khẩu Hiệu"] && (
              <p className="text-[11px] text-[var(--text-faint)] italic mt-0.5 truncate">
                "{info["Khẩu Hiệu"]}"
              </p>
            )}
            <p className="text-[11.5px] text-[var(--text-faint)] mt-0.5 truncate">
              {info["Lục Địa"]} · {info["Văn Hoá"]} · {info["Tôn Giáo"]}
            </p>
          </div>
        </div>
        
        {persona["Đặc Điểm"]?.["Màu Mắt"] && (
          <p className="text-[11px] text-[var(--text-faint)] mt-1.5">
            {persona["Đặc Điểm"]["Màu Mắt"]} · {persona["Đặc Điểm"]["Màu Tóc"]} · {persona["Đặc Điểm"]["Chiều Cao"]}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--text-soft)]">
          <IconCoins size={14} color="var(--accent-text)" />
          <AnimatedNumber value={info["Ngân Khố"]} /> vàng
        </div>
        <div className="mt-2">
          <Bar label="HP" value={vitals["HP"]} max={derived["_HP Tối Đa"]} color="var(--ok)" />
          <Bar label="Thể Lực" value={vitals["Thể Lực"]} max={derived["_Thể Lực Tối Đa"]} color="var(--accent)" />
          {vitals["Pháp Lực"] > 0 && <Bar label="Pháp Lực" value={vitals["Pháp Lực"]} max={100} color="#7d8fb5" />}
          
          <div className="mt-3 border-t border-[var(--glass-border)] pt-2">
            <Bar label="Độ No" value={vitals["Đói"]} max={100} color="#d97706" />
            <Bar label="Độ Ẩm" value={vitals["Khát"]} max={100} color="#2563eb" />
            <Bar label="Lo Âu" value={vitals["Lo Âu"]} max={100} color="var(--ok)" reverseColor />
          </div>
          
          {info["Các Loại Bệnh"] && info["Các Loại Bệnh"].length > 0 && (
            <div className="mt-3 border-t border-[var(--glass-border)] pt-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--danger)]">
                <IconAlert size={14} /> TÌNH TRẠNG BỆNH LÝ
              </div>
              {info["Các Loại Bệnh"].map((d, i) => {
                const conf = DISEASE_CATALOG[d["Tên"]];
                return (
                  <div key={i} className="rounded border border-[var(--danger-border)] bg-[var(--danger-soft)] p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[12px] text-[var(--danger-text)]">{d["Tên"]}</span>
                      <span className="text-[11px] text-[var(--danger-text)] opacity-80">{d["Ngày Còn Lại"]} ngày</span>
                    </div>
                    {conf && (
                      <p className="mt-0.5 text-[11px] text-[var(--danger-text)] opacity-90 leading-tight">
                        {conf.desc} (Mất {conf.hpPerTurn} HP/ngày)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* ---- Tình Trạng Cơ Thể ---- */}
      <Section title="TRANG BỊ" icon={<IconSpark size={14} />}>
        <div className="hover:bg-white/5 rounded-lg transition-colors" title="Nhấn để xem trang bị">
          <BodyVisualizer 
            body={stat["Cơ Thể"] || {}} 
            onClick={() => setEquipModalOpen(true)}
          />
        </div>
      </Section>

      {/* ---- Chỉ số cốt lõi ---- */}
      <Section title="CHỈ SỐ" icon={<IconSpark size={14} />}>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-[12px]">
          {(Object.entries(core) as [string, number][]).map(([name, v]) => (
            <div key={name} className="flex items-baseline justify-between gap-1">
              <span className="truncate text-[var(--text-faint)]">{name}</span>
              <span className="font-mono text-[13px] text-[var(--text-soft)]">
                <AnimatedNumber value={v} />
              </span>
            </div>
          ))}
        </div>
        {talents.length > 0 && (
          <p className="mt-2 border-t border-[var(--glass-border)] pt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
            {talents.map(([name]) => name).join(" · ")}
          </p>
        )}
      </Section>

      {/* ---- Vị trí & lịch ---- */}
      <Section title="THẾ GIỚI" icon={<IconCalendar size={14} />}>
        <div className="space-y-1 text-[13px] text-[var(--text-soft)]">
          <p className="flex items-center gap-1.5">
            <IconPin size={13} color="var(--text-faint)" /> {world["Vị Trí"]}
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            Ngày {world["Ngày"]} tháng {world["Tháng"]} · Năm {world["Năm"]} AC · Mùa {world["Mùa"]}
          </p>
          <p className="text-[12px] text-[var(--text-faint)]">{world["Thời Tiết"]}</p>
        </div>
      </Section>

      {/* ---- Kỹ năng ---- */}
      {skills.length > 0 && (
        <Section title="KỸ NĂNG" icon={<IconSpark size={14} />}>
          <div className="space-y-1 text-[12px]">
            {skills.map(([name, s]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">{name}</span>
                <span className="rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] px-1.5 text-[11px] text-[var(--accent-text)]">
                  {s["Cấp"]}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Rồng ---- */}
      {dragons.length > 0 && (
        <Section title="RỒNG" icon={<IconDragon size={14} />}>
          {dragons.map(([key, drg]) => {
            const drgStats = drg["Chỉ Số"];
            const drgSkills = Object.entries(drg["Kỹ Năng"]).filter(([, lv]) => lv > 0);
            return (
              <div key={key} className="space-y-2">
                <div>
                  <p className="font-display text-[15px] text-[var(--accent-text)]">{drg["Tên"]}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">
                    {drg["Kích Cỡ"]} · Màu {drg["Màu Sắc"]} · {drg["Tuổi"]} tuổi · {drg["Tình Trạng"]}
                  </p>
                </div>
                <Bar label="HP Rồng" value={drg["_HP"]} max={drg["_HP Tối Đa"]} color="#c06030" />
                {drgStats && (
                  <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[12px]">
                    {(Object.entries(drgStats) as [string, number][]).map(([name, v]) => (
                      <div key={name} className="flex items-baseline justify-between gap-1">
                        <span className="truncate text-[var(--text-faint)]">{name}</span>
                        <span className="font-mono text-[13px] text-[var(--text-soft)]">
                          <AnimatedNumber value={v} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {drgSkills.length > 0 && (
                  <div className="space-y-1 border-t border-[var(--glass-border)] pt-1.5">
                    {drgSkills.map(([name, lv]) => (
                      <div key={name} className="flex items-center justify-between text-[12px]">
                        <span className="text-[var(--text-muted)]">{name}</span>
                        <span className="rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] px-1.5 text-[11px] text-[var(--accent-text)]">
                          {lv}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {drg["Mô Tả"] && (
                  <p className="text-[11px] leading-relaxed text-[var(--text-faint)] italic">{drg["Mô Tả"]}</p>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* ---- Quan hệ NPC ---- */}
      {npcs.length > 0 && (
        <Section title="QUAN HỆ" icon={<IconUsers size={14} />}>
          <div className="space-y-2">
            {npcs.slice(0, 8).map(([name, npc]) => {
              const v = npc["Độ Hảo Cảm"];
              const pct = ((v + 100) / 200) * 100;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-[var(--text-soft)]">{name}</span>
                    <span className={`text-[11px] ${v < -14 ? "text-[var(--danger)]" : v > 14 ? "text-[var(--ok)]" : "text-[var(--text-faint)]"}`}>
                      {affinityStage(v)} ({v})
                    </span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: v < 0 ? "var(--danger)" : "var(--ok)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ---- Túi đồ ---- */}
      {items.length > 0 && (
        <Section title="TÚI ĐỒ" icon={<IconBackpack size={14} />}>
          <div className="space-y-1 text-[12px]">
            {items.slice(0, 12).map(([name, it]) => (
              <div key={name} className="flex items-center justify-between" title={it["Mô Tả"]}>
                <span className="truncate text-[var(--text-muted)]">{name}</span>
                <span className="font-mono text-[var(--text-faint)]">×{it["Số Lượng"]}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Thái độ các Nhà ---- */}
      {houses.length > 0 && (
        <Section title="CÁC NHÀ" icon={<IconCrossedSwords size={14} />}>
          <div className="space-y-1 text-[12px]">
            {houses.map(([name, h]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">{name}</span>
                <span
                  className={
                    ["Thù Địch", "Địch Ý"].includes(h["Thái Độ"])
                      ? "text-[var(--danger)]"
                      : ["Tín Nhiệm", "Ủng Hộ"].includes(h["Thái Độ"])
                        ? "text-[var(--ok)]"
                        : "text-[var(--text-faint)]"
                  }
                >
                  {h["Thái Độ"]}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <EquipmentModal open={isEquipModalOpen} onClose={() => setEquipModalOpen(false)} />
    </div>
  );
}
