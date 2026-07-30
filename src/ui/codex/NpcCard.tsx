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
import { TALENTS_BY_ID } from "../../content/westeros/talents";
import { IconSpark } from "../icons";
import { relationshipCounterparty, type PersonGroup, type RelationshipEdge } from "../relationship/relationshipData";

function Avatar({ name, house, portrait }: { name: string; house?: string; portrait?: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Color based on house name hash
  const hue = (house ?? name).split("").reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  const portraitSrc = portrait?.startsWith("http") || portrait?.startsWith("data:")
    ? portrait
    : portrait ? `/api/portrait/${portrait}` : undefined;
  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--glass-border)]"
      style={{ background: `hsl(${hue}, 25%, 22%)` }}
    >
      <span className="font-display text-lg text-[var(--text-soft)]">{initial}</span>
      {portraitSrc && (
        <img
          src={portraitSrc}
          alt={`Chân dung ${name}`}
          onError={(event) => { event.currentTarget.style.display = "none"; }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
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
  personId?: string;
  group?: PersonGroup;
  relationships?: RelationshipEdge[];
  expanded?: boolean;
  onToggle?: () => void;
  onOpenPerson?: (personId: string) => void;
}

const RELATIONSHIP_TONE_CLASS: Record<RelationshipEdge["tone"], string> = {
  family: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  intimate: "border-pink-400/30 bg-pink-400/10 text-pink-200",
  alliance: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  enemy: "border-red-400/30 bg-red-400/10 text-red-200",
  duty: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  neutral: "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)]",
};

export function NpcCard({ name, npc, personId = `npc_${name}`, group, relationships = [], expanded, onToggle, onOpenPerson }: NpcCardProps) {
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
        <Avatar name={npc["Họ Tên"] || name} house={npc["Nhà"]} portrait={npc["Ảnh Chân Dung"]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-sm text-[var(--text-soft)]">{npc["Họ Tên"] || name}</span>
            {npc["Biệt Danh"] && (
              <span className="shrink-0 text-[10px] italic text-[var(--text-faint)]">"{npc["Biệt Danh"]}"</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {npc["Nhà"] && <span className="text-[var(--text-faint)]">Nhà {npc["Nhà"]}</span>}
            {npc["Chức Vụ"] && <span className="text-[var(--text-muted)]">{npc["Chức Vụ"]}</span>}
            <span className="text-[var(--text-faint)]">{npc["Tuổi"]} tuổi</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
            <span style={{ color: stageColor }} className="font-medium">
              {npc["Giai Đoạn Quan Hệ"]} ({npc["Độ Hảo Cảm"]})
            </span>
            <span className="text-[var(--text-faint)]">Tin Cậy: {npc["Tin Cậy"]}</span>
            {group === "family" && <span className="rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-200">GIA TỘC</span>}
            {npc["Tình Trạng"] !== "Bình Thường" && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${npc["Tình Trạng"] === "Chưa Sinh" ? "bg-amber-400/15 text-amber-200" : "bg-[var(--danger)]/20 text-[var(--danger)]"}`}>
                {npc["Tình Trạng"]}
              </span>
            )}
            {!npc["Còn Sống"] && (
              <span className="rounded bg-[var(--text-faint)]/20 px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">
                ĐÃ MẤT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[var(--glass-border)] pt-3">
          {/* Hồ sơ đọc nhanh — các trường này có tác động trực tiếp tới roleplay. */}
          <div className="rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.18)] p-2.5 text-[11px]">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--accent-text)]">Hồ Sơ</p>
            <div className="space-y-1 text-[var(--text-muted)]">
              {npc["Đánh Giá"] && <p>{npc["Đánh Giá"]}</p>}
              {(npc["Xuất Thân"] || npc["Văn Hoá"] || npc["Tôn Giáo"]) && (
                <p>
                  <span className="text-[var(--text-faint)]">Xuất thân:</span> {npc["Xuất Thân"] || "Chưa rõ"}
                  {npc["Văn Hoá"] && <> · <span className="text-[var(--text-faint)]">Văn hoá:</span> {npc["Văn Hoá"]}</>}
                  {npc["Tôn Giáo"] && <> · <span className="text-[var(--text-faint)]">Tôn giáo:</span> {npc["Tôn Giáo"]}</>}
                </p>
              )}
              {npc["Lãnh Địa"].length > 0 && <p><span className="text-[var(--text-faint)]">Lãnh địa:</span> {npc["Lãnh Địa"].join(" · ")}</p>}
              {npc["Trang Bị Canon"].length > 0 && <p><span className="text-[var(--text-faint)]">Trang bị:</span> {npc["Trang Bị Canon"].join(" · ")}</p>}
              {npc["Ngoại Hình"] && <p><span className="text-[var(--text-faint)]">Ngoại hình:</span> {npc["Ngoại Hình"]}</p>}
              {npc["Vị Trí Hiện Tại"] && <p><span className="text-[var(--text-faint)]">Hiện ở:</span> {npc["Vị Trí Hiện Tại"]}</p>}
              {npc["Mục Tiêu Cá Nhân"] && <p><span className="text-[var(--text-faint)]">Mục tiêu:</span> {npc["Mục Tiêu Cá Nhân"]}</p>}
              {npc["Loại Quan Hệ"].length > 0 && <p><span className="text-[var(--text-faint)]">Với ngươi:</span> {npc["Loại Quan Hệ"].join(" · ")}</p>}
              {npc["Người Thừa Kế"] && <p className="text-[var(--accent-text)]">Người thừa kế{npc["Thứ Bậc Kế Vị"] ? ` · thứ ${npc["Thứ Bậc Kế Vị"]}` : ""}</p>}
            </div>
          </div>

          {relationships.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Mối Quan Hệ Liên Quan</p>
              <div className="space-y-1.5">
                {relationships.map((edge) => {
                  const counterparty = relationshipCounterparty(edge, personId, "Người chơi");
                  const nextPersonId = edge.sourceId === personId
                    ? edge.targetId
                    : edge.sourceId !== "player" ? edge.sourceId : undefined;
                  return (
                    <div key={edge.id} className="rounded-md border border-[var(--glass-border)] bg-[rgba(0,0,0,0.14)] px-2 py-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        {nextPersonId && onOpenPerson ? (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); onOpenPerson(nextPersonId); }}
                            className="font-medium text-[var(--text-soft)] hover:text-[var(--accent-text)]"
                          >
                            {counterparty}
                          </button>
                        ) : <span className="font-medium text-[var(--text-soft)]">{counterparty}</span>}
                        <span className={`rounded border px-1 py-0.5 text-[9px] ${RELATIONSHIP_TONE_CLASS[edge.tone]}`}>{edge.label}</span>
                        {!edge.isPublic && <span className="text-red-300">Bí mật</span>}
                        {edge.inferred && <span className="text-[var(--text-faint)]">Gia phả</span>}
                      </div>
                      {(edge.detail || edge.affinity !== 0 || edge.trust !== 0) && (
                        <p className="mt-0.5 text-[var(--text-faint)]">
                          {edge.detail || `Hảo cảm ${edge.affinity >= 0 ? "+" : ""}${edge.affinity} · Tin cậy ${edge.trust >= 0 ? "+" : ""}${edge.trust}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Huyết Thống Thật Sự (Bí Mật Lore) */}
          {npc["Huyết Thống Thật Sự"] && (npc["Huyết Thống Thật Sự"]["Cha/Mẹ"]?.length > 0 || npc["Huyết Thống Thật Sự"]["Con Cái"]?.length > 0) && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--accent-text)]">Bí Mật: Huyết Thống Thật Sự</p>
              <div className="space-y-0.5 text-[11px] text-[var(--text-soft)]">
                {npc["Huyết Thống Thật Sự"]["Cha/Mẹ"]?.length > 0 && (
                  <p>Cha/Mẹ ruột: <span className="font-medium text-[var(--danger)]">{npc["Huyết Thống Thật Sự"]["Cha/Mẹ"].join(", ")}</span></p>
                )}
                {npc["Huyết Thống Thật Sự"]["Con Cái"]?.length > 0 && (
                  <p>Con đẻ bí mật: <span className="font-medium text-[var(--danger)]">{npc["Huyết Thống Thật Sự"]["Con Cái"].join(", ")}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Mạng Lưới Quan Hệ (Lore) */}
          {npc["Mạng Lưới Quan Hệ"] && Object.keys(npc["Mạng Lưới Quan Hệ"]).length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Mạng Lưới Quan Hệ</p>
              <div className="space-y-1">
                {Object.entries(npc["Mạng Lưới Quan Hệ"]).map(([tgt, info], i) => (
                  <div key={i} className="flex flex-col text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-soft)]">{tgt}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] ${info["Công Khai"] ? "bg-[var(--glass-border)] text-[var(--text-muted)]" : "bg-[var(--danger)]/20 text-[var(--danger)]"}`}>
                        {info["Loại Quan Hệ"]} {info["Công Khai"] ? "" : "(Bí Mật)"}
                      </span>
                      <span className="text-[var(--text-faint)] text-[10px]">Hảo cảm: {info["Độ Hảo Cảm"]}</span>
                    </div>
                    {info["Chi Tiết"] && <span className="mt-0.5 text-[10px] text-[var(--text-muted)] pl-1 border-l border-[var(--glass-border)]">"{info["Chi Tiết"]}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Chỉ Số Cốt Lõi (RPG Stats) */}
          {npc["Chỉ Số Cốt Lõi"] && (
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-[var(--text-faint)] flex items-center gap-1">
                <IconSpark size={12} className="text-[#eab308]" /> CHỈ SỐ
              </p>
              <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-[11px] mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Sức Mạnh</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Sức Mạnh"] ?? 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Nhanh Nhẹn</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Nhanh Nhẹn"] ?? 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Thể Chất</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Thể Chất"] ?? 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Trí Tuệ</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Trí Tuệ"] ?? 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Tinh Tường</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Tinh Tường"] ?? 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Uy Tín</span>
                  <span className="font-semibold text-[var(--text-bright)]">{npc["Chỉ Số Cốt Lõi"]["Uy Tín"] ?? 10}</span>
                </div>
              </div>
              
              {/* Thiên Phú */}
              {npc["Thiên Phú"] && npc["Thiên Phú"].length > 0 && (
                <div className="text-[11px] text-[var(--text-muted)] mb-2">
                  {npc["Thiên Phú"].map((tId: string) => {
                    const t = TALENTS_BY_ID[tId];
                    return t ? t.name : tId;
                  }).join(" · ")}
                </div>
              )}
            </div>
          )}

          {/* Kỹ Năng */}
          {npc["Kỹ Năng"] && Object.keys(npc["Kỹ Năng"]).length > 0 && (
            <div className="border-t border-[var(--glass-border)] pt-2">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Kỹ Năng</p>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {Object.entries(npc["Kỹ Năng"]).map(([k, v]) => (
                  <span key={k} className="rounded bg-[var(--glass-border)]/20 px-1.5 py-0.5 text-[var(--text-muted)]">
                    {k}: <span className="font-medium text-[var(--text-bright)]">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Personality bars */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Tính Cách</p>
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
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Ký Ức</p>
              <div className="space-y-1">
                {memories.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="shrink-0 font-mono text-[var(--text-faint)]">{m["Ngày"]}/{m["Tháng"]}</span>
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
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Lời Hứa Chưa Giữ</p>
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
            
            // Lọc bỏ lỗi hallucination của AI: Nếu chưa từng ân ái và không phải vợ/hôn thê thì không hiển thị
            const isSpouse = ["Vợ", "Hôn Thê"].includes(intimacy["Vai Trò"]);
            if (!isSpouse && (intimacy["Số Lần Ân Ái"] ?? 0) === 0) {
              return null;
            }

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
                  Quan Hệ Thân Mật
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
                      <span>Ân ái: {intimacy["Số Lần Ân Ái"]} lần</span>
                      {intimacy["Số Lần Xuất Trong"] > 0 && (
                        <span className="text-[var(--text-faint)]">
                          ({intimacy["Số Lần Xuất Trong"]} lần xuất trong)
                        </span>
                      )}
                    </div>
                  )}

                  {intimacy["Lần Cuối Ân Ái"] && (
                    <div className="text-[var(--text-faint)]">
                      Lần cuối: {intimacy["Lần Cuối Ân Ái"]}
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
                          Tháng {intimacy["Tháng Thai Kỳ"]}/9
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
                      Đã sinh: {intimacy["Số Con Đã Sinh"]} con
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
