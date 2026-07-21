/**
 * NpcCard — Thẻ NPC chi tiết cho Codex:
 * - Avatar (ảnh chân dung fallback SVG huy hiệu + chữ cái đầu tên)
 * - 4 trục tính cách dạng bar
 * - Ký ức timeline
 * - Lời hứa chưa giữ
 * Glassmorphism, no emoji.
 */
import type { Npc } from "../../mvu/npcSchema";
import { personalityLabel, type PersonalityAxis } from "../../npc/personalityEngine";

function AvatarFallback({ name, house }: { name: string; house?: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Color based on house name hash
  const hue = (house ?? name).split("").reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)]"
      style={{ background: `hsl(${hue}, 25%, 22%)` }}
    >
      <span className="font-display text-lg text-[var(--text-soft)]">{initial}</span>
    </div>
  );
}

function PersonalityBar({ axis, value }: { axis: PersonalityAxis; value: number }) {
  const label = personalityLabel(axis, value);
  // Normalize -100..100 to 0..100 for bar width
  const pct = Math.round((value + 100) / 2);
  const axisShort = axis.replace("Trục ", "");

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-[6.5rem] shrink-0 text-[var(--text-faint)]">{axisShort}</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-[var(--glass-bg)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: value >= 0
              ? `hsl(145, 40%, ${35 + Math.abs(value) / 5}%)`
              : `hsl(0, 40%, ${35 + Math.abs(value) / 5}%)`,
          }}
        />
        {/* Center marker */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--glass-border)]" />
      </div>
      <span className="w-16 shrink-0 text-right text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

interface NpcCardProps {
  name: string;
  npc: Npc;
  expanded?: boolean;
  onToggle?: () => void;
}

export function NpcCard({ name, npc, expanded, onToggle }: NpcCardProps) {
  const stageColor = {
    "Tử Thù": "var(--danger)",
    "Thù Địch": "hsl(0, 50%, 55%)",
    "Ác Cảm": "hsl(20, 45%, 55%)",
    "Xa Lạ": "var(--text-muted)",
    "Quen Biết": "hsl(45, 50%, 55%)",
    "Thân Thiết": "hsl(145, 40%, 50%)",
    "Tri Kỷ": "hsl(200, 50%, 55%)",
    "Sống Chết Có Nhau": "var(--accent-text)",
  }[npc["Giai Đoạn Quan Hệ"]] ?? "var(--text-muted)";

  const memories = [...npc["Ký Ức"]].sort((a, b) => b["Trọng Số"] - a["Trọng Số"]);
  const promises = npc["Lời Hứa Chưa Giữ"];

  return (
    <div
      className="glass-panel cursor-pointer rounded-xl border border-[var(--glass-border)] p-3 transition-all hover:border-[var(--accent-text)]/30"
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <AvatarFallback name={name} house={npc["Nhà"]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-sm text-[var(--text-soft)]">{name}</span>
            {npc["Biệt Danh"] && (
              <span className="shrink-0 text-[10px] italic text-[var(--text-faint)]">"{npc["Biệt Danh"]}"</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {npc["Nhà"] && <span className="text-[var(--text-faint)]">Nha {npc["Nhà"]}</span>}
            {npc["Chức Vụ"] && <span className="text-[var(--text-muted)]">{npc["Chức Vụ"]}</span>}
            <span className="text-[var(--text-faint)]">{npc["Tuổi"]} tuoi</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
            <span style={{ color: stageColor }} className="font-medium">
              {npc["Giai Đoạn Quan Hệ"]} ({npc["Độ Hảo Cảm"]})
            </span>
            <span className="text-[var(--text-faint)]">Tin Cay: {npc["Tin Cậy"]}</span>
            {npc["Tình Trạng"] !== "Bình Thường" && (
              <span className="rounded bg-[var(--danger)]/20 px-1.5 py-0.5 text-[10px] text-[var(--danger)]">
                {npc["Tình Trạng"]}
              </span>
            )}
            {!npc["Còn Sống"] && (
              <span className="rounded bg-[var(--text-faint)]/20 px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">
                DA MAT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[var(--glass-border)] pt-3">
          {/* Personality bars */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Tinh Cach</p>
            {(Object.entries(npc["Tính Cách"]) as [PersonalityAxis, number][]).map(([axis, val]) => (
              <PersonalityBar key={axis} axis={axis} value={val} />
            ))}
            {npc["Nét Tính Cách"].length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {npc["Nét Tính Cách"].map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Memories */}
          {memories.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Ky Uc</p>
              <div className="space-y-1">
                {memories.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="shrink-0 font-mono text-[var(--text-faint)]">T{m["Turn"]}</span>
                    <span className="text-[var(--text-muted)]">{m["Sự Việc"]}</span>
                    <span className="ml-auto shrink-0 text-[var(--text-faint)]">{m["Cảm Xúc"]} ({m["Trọng Số"]})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promises */}
          {promises.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Loi Hua Chua Giu</p>
              <ul className="space-y-0.5 text-[11px] text-[var(--warning)]">
                {promises.map((p, i) => (
                  <li key={i}>"{p}"</li>
                ))}
              </ul>
            </div>
          )}

          {/* Intimate Relationship */}
          {npc["Quan Hệ Thân Mật"] && (() => {
            const intimacy = npc["Quan Hệ Thân Mật"]!;
            const roleColor: Record<string, string> = {
              "Người Tình": "hsl(340, 45%, 55%)",
              "Người Yêu": "hsl(330, 50%, 50%)",
              "Hôn Thê": "hsl(25, 50%, 55%)",
              "Vợ": "hsl(340, 55%, 45%)",
              "Thiếp": "hsl(280, 35%, 50%)",
              "Tình Nhân Bí Mật": "hsl(0, 40%, 50%)",
            };
            const color = roleColor[intimacy["Vai Trò"]] ?? "hsl(340, 45%, 55%)";
            const pregnancyPct = intimacy["Đang Mang Thai"]
              ? Math.round((intimacy["Tháng Thai Kỳ"] / 9) * 100)
              : 0;

            return (
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
                  Quan He Than Mat
                </p>
                {/* Role badge */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      color,
                      borderColor: color,
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                    }}
                  >
                    {intimacy["Vai Trò"]}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-1 text-[11px]">
                  {intimacy["Số Lần Ân Ái"] > 0 && (
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <span>An ai: {intimacy["Số Lần Ân Ái"]} lan</span>
                      {intimacy["Số Lần Xuất Trong"] > 0 && (
                        <span className="text-[var(--text-faint)]">
                          ({intimacy["Số Lần Xuất Trong"]} lan xuat trong)
                        </span>
                      )}
                    </div>
                  )}

                  {intimacy["Lần Cuối Ân Ái"] && (
                    <div className="text-[var(--text-faint)]">
                      Lan cuoi: {intimacy["Lần Cuối Ân Ái"]}
                    </div>
                  )}

                  {/* Pregnancy */}
                  {intimacy["Đang Mang Thai"] && (
                    <div className="mt-1.5">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            color: "hsl(340, 55%, 45%)",
                            background: "hsl(340, 55%, 45%, 0.12)",
                          }}
                        >
                          MANG THAI
                        </span>
                        <span className="text-[10px] text-[var(--text-faint)]">
                          Thang {intimacy["Tháng Thai Kỳ"]}/9
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-[var(--glass-bg)]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{
                            width: `${pregnancyPct}%`,
                            background: `linear-gradient(90deg, hsl(340, 50%, 45%), hsl(15, 50%, 55%))`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Children */}
                  {intimacy["Số Con Đã Sinh"] > 0 && (
                    <div className="mt-1 text-[var(--text-muted)]">
                      Da sinh: {intimacy["Số Con Đã Sinh"]} con
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
