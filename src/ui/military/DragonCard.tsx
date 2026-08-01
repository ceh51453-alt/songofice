/**
 * DragonCard (M19) — MỘT thẻ rồng duy nhất cho cả bảng Quân Sự lẫn thanh trạng
 * thái. Trước đây hai chỗ đọc hai nguồn khác nhau (thanh trạng thái đọc bảng
 * "Rồng", bảng Quân Sự đọc biên chế bộ binh) nên có rồng mà tab Rồng trống trơn.
 * Giờ cả hai gọi component này với cùng dữ liệu — không thể lệch nữa.
 *
 * variant "compact": thanh trạng thái (gọn, không nút bấm).
 * variant "full": bảng Quân Sự (đủ chỉ số, kỹ năng, hậu cần, hành động).
 */
import type { Dragon } from "../../mvu/schema";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { formatDuration } from "../../mvu/calendar";
import { dragonPower } from "../../combat/dragon";
import { DRAGON_TAMING_THRESHOLD } from "../../strategy/dragons";
import { AnimatedNumber } from "../panels/status/AnimatedNumber";
import { IconDragon, IconWheat, IconMap, IconSpark } from "../icons";

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="mb-1.5">
      <div className="mb-0.5 flex justify-between text-[11px] text-[var(--text-faint)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--text-muted)]">{Math.round(value)}/{Math.round(max)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Chip({ text, tone = "muted" }: { text: string; tone?: "muted" | "warn" | "ok" | "danger" }) {
  const color =
    tone === "warn" ? "var(--accent-text)" : tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : "var(--text-muted)";
  return (
    <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10.5px]" style={{ color }}>
      {text}
    </span>
  );
}

/** Rồng này ra trận được không, và nếu không thì vì sao — nói thẳng ra. */
export function dragonReadiness(d: Dragon): { ready: boolean; reason: string } {
  if (d["_HP"] <= 0) return { ready: false, reason: "Đã chết" };
  if (d["Đang Bị Xích"]) return { ready: false, reason: "Đang bị xích" };
  if ((d["Ngày Hồi Phục Còn Lại"] ?? 0) > 0) return { ready: false, reason: `Dưỡng thương ${formatDuration(d["Ngày Hồi Phục Còn Lại"])}` };
  if (d["Tình Trạng"] === "Đang Hồi Phục") return { ready: false, reason: "Đang hồi phục" };
  if (d["Kích Cỡ"] === "Mới Nở" || d["Kích Cỡ"] === "Ấu Long") return { ready: false, reason: "Còn quá nhỏ để ra trận" };
  if (d["Sẵn Sàng Chiến Đấu"] === false) return { ready: false, reason: "Chưa chịu ra trận" };
  if (!d["Kỵ Sĩ"] && d["Mức Độ Thuần Hóa"] < DRAGON_TAMING_THRESHOLD) return { ready: false, reason: `Chưa đủ liên kết để cưỡi (cần ${DRAGON_TAMING_THRESHOLD})` };
  return { ready: true, reason: "Sẵn sàng" };
}

export function DragonCard({
  dragonKey,
  dragon,
  variant = "full",
  onFeed,
  onFly,
}: {
  dragonKey: string;
  dragon: Dragon;
  variant?: "compact" | "full";
  onFeed?: (key: string) => void;
  onFly?: (key: string) => void;
}) {
  const d = dragon;
  const stats = d["Chỉ Số"];
  const skills = Object.entries(d["Kỹ Năng"] ?? {}).filter(([, lv]) => lv > 0);
  const readiness = dragonReadiness(d);
  const place = d["Đang Bay Đến"]
    ? `Đang bay tới ${REGIONS_BY_ID[d["Đang Bay Đến"]]?.name ?? d["Đang Bay Đến"]} · còn ${formatDuration(d["Ngày Bay Còn Lại"])}`
    : `Đậu tại ${REGIONS_BY_ID[d["Đồn Trú"]]?.name ?? d["Đồn Trú"] ?? d["Nơi Ổ"] ?? "chưa rõ"}`;
  const hunger = d["Độ Đói"] ?? 0;
  const power = dragonPower(d);

  return (
    <div className={variant === "full" ? "glass rounded-[var(--radius-md)] p-3" : "space-y-2"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display flex items-center gap-1.5 text-[15px] text-[var(--accent-text)]">
            <IconDragon size={14} color="var(--accent-text)" />
            {d["Tên"] || dragonKey}
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            {d["Kích Cỡ"]} · màu {d["Màu Sắc"]} · {d["Tuổi"]} tuổi · {d["Số Đầu"]} đầu · sải cánh ~{d["_Sải Cánh"]}m
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-[13px] text-[var(--text-soft)]">×{(1 + power).toFixed(2)}</span>
          <span className="block text-[10px] text-[var(--text-faint)]">chiến lực</span>
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        <Chip text={d["Tình Trạng"]} tone={d["Tình Trạng"] === "Khỏe" ? "ok" : "warn"} />
        <Chip text={readiness.reason} tone={readiness.ready ? "ok" : "danger"} />
        <Chip text={d["Trạng Thái Thu Phục"]} />
        {d["Kỵ Sĩ"] ? <Chip text={`Kỵ sĩ: ${d["Kỵ Sĩ"]}`} tone="warn" /> : <Chip text={`Thuần hoá ${d["Mức Độ Thuần Hóa"]}/100`} />}
        {d["Năng Lực Đặc Biệt"] && <Chip text={d["Năng Lực Đặc Biệt"]} tone="warn" />}
        {d["Đang Bị Xích"] && <Chip text="Bị xích" tone="danger" />}
      </div>

      <div className="mt-2">
        <Bar label="HP Rồng" value={d["_HP"]} max={d["_HP Tối Đa"]} color="#c06030" />
        <Bar
          label={hunger >= 80 ? "Đói cồn cào" : hunger >= 50 ? "Đang đói" : "No đủ"}
          value={100 - hunger}
          max={100}
          color={hunger >= 80 ? "var(--danger)" : hunger >= 50 ? "#d97706" : "var(--ok)"}
        />
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[12px]">
          {(Object.entries(stats) as [string, number][]).map(([name, v]) => (
            <div key={name} className="flex items-baseline justify-between gap-1">
              <span className="truncate text-[var(--text-faint)]">{name}</span>
              <span className="font-mono text-[13px] text-[var(--text-soft)]">
                <AnimatedNumber value={v} />
              </span>
            </div>
          ))}
        </div>
      )}

      {variant === "full" && (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
            <IconMap size={13} /> {place}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--text-faint)]">
            <IconWheat size={12} /> ăn ~{d["_Khẩu Phần Tháng"]} phần/tháng · {d["Số Trận"]} trận · kinh nghiệm {d["Kinh Nghiệm"]}/100
          </p>
          {(d["Vết Thương"]?.length ?? 0) > 0 && (
            <p className="mt-1 text-[11.5px] text-[var(--danger)]">
              Vết thương: {d["Vết Thương"].join(", ")}
              {d["Ngày Hồi Phục Còn Lại"] > 0 ? ` — còn ${formatDuration(d["Ngày Hồi Phục Còn Lại"])}` : ""}
            </p>
          )}
        </>
      )}

      {skills.length > 0 && (
        <div className="mt-1.5 space-y-1 border-t border-[var(--glass-border)] pt-1.5">
          {skills.map(([name, lv]) => (
            <div key={name} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1 text-[var(--text-muted)]"><IconSpark size={11} /> {name}</span>
              <span className="rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] px-1.5 text-[11px] text-[var(--accent-text)]">
                {lv}
              </span>
            </div>
          ))}
        </div>
      )}

      {(d["Đặc Tính"]?.length ?? 0) > 0 && (
        <p className="mt-1.5 text-[11.5px] text-[var(--text-faint)]">Đặc tính: {d["Đặc Tính"].join(", ")}</p>
      )}
      {d["Mô Tả"] && <p className="mt-1 text-[11px] italic leading-relaxed text-[var(--text-faint)]">{d["Mô Tả"]}</p>}

      {variant === "full" && (onFeed || onFly) && (
        <div className="mt-2 flex gap-2">
          {onFeed && (
            <button
              onClick={() => onFeed(dragonKey)}
              className="flex-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1 text-[11.5px] text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]"
            >
              Cho ăn
            </button>
          )}
          {onFly && (
            <button
              onClick={() => onFly(dragonKey)}
              className="flex-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1 text-[11.5px] text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]"
            >
              Điều bay
            </button>
          )}
        </div>
      )}
    </div>
  );
}
