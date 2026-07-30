/**
 * IntriguePanel (14.5 + đại tu M20) — "phòng tối": nền thẫm hơn phần còn lại,
 * chữ như thì thầm.
 *
 * KHÔNG CÒN NÚT BẤM. Trước đây đây là một bảng điều khiển: nhập bí danh, bấm
 * Tuyển, bấm Đẩy nhanh, bấm Kích hoạt — mưu đồ biến thành bấm nút. Giờ nó là
 * một cái SỔ: ai đang cài ở đâu, vỏ bọc còn mấy phần, ta đang nắm bí mật gì và
 * bí mật đó nặng cỡ nào, âm mưu đang ở giai đoạn nào và ai đang lần theo dấu.
 * Mọi hành động diễn ra bằng LỜI trong cuộc chơi.
 *
 * 4 tab: Tai Mắt · Bí Mật · Âm Mưu · Con Tin. Không emoji — icon SVG.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { secretLeverage } from "../../strategy/intrigue";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { formatDuration } from "../../mvu/calendar";
import { absoluteDay } from "../../mvu/calendar";
import { IconX, IconMask, IconEye, IconCoins, IconAlert, IconTarget, IconScroll, IconUsers } from "../icons";

type Tab = "spies" | "secrets" | "plots" | "captives";
type Stat = ReturnType<typeof useMvuStore.getState>["stat"];

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

function TwoBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="mb-0.5 flex justify-between text-[10.5px] text-[var(--text-faint)]">
        <span>{label}</span><span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.45)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

function Whisper({ children }: { children: React.ReactNode }) {
  return <p className="text-[11.5px] italic leading-relaxed text-[var(--text-faint)]">{children}</p>;
}

function Chip({ text, tone }: { text: string; tone?: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10.5px]"
      style={{ color: tone ?? "var(--text-faint)", borderColor: tone ? `${tone}55` : "rgba(255,255,255,0.1)" }}
    >
      {text}
    </span>
  );
}

const susColor = (v: number) => (v > 80 ? "var(--danger)" : v > 50 ? "#d97706" : "var(--ok)");

export function IntriguePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const [tab, setTab] = useState<Tab>("spies");
  if (!open) return null;

  const spyCount = Object.keys(stat["Tình Báo"]["Điệp Viên"]).length;
  const secretCount = Object.keys(stat["Tình Báo"]["Bí Mật"] ?? {}).length;
  const plotCount = Object.keys(stat["Âm Mưu"]).length;
  const captiveCount = Object.keys(stat["Tù Binh"]).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "spies", label: spyCount > 0 ? `Tai Mắt (${spyCount})` : "Tai Mắt" },
    { key: "secrets", label: secretCount > 0 ? `Bí Mật (${secretCount})` : "Bí Mật" },
    { key: "plots", label: plotCount > 0 ? `Âm Mưu (${plotCount})` : "Âm Mưu" },
    { key: "captives", label: captiveCount > 0 ? `Con Tin (${captiveCount})` : "Con Tin" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Mưu Đồ">
      <div className="absolute inset-0 bg-[rgba(3,4,7,0.66)]" onClick={onClose} />
      {/* "phòng tối" — nền thẫm hơn phần còn lại */}
      <aside
        className="anim-in relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[rgba(255,255,255,0.06)] backdrop-blur-xl"
        style={{ background: "linear-gradient(180deg, rgba(8,8,13,0.96), rgba(5,5,9,0.98))" }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconMask size={19} color="var(--text-muted)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">Mưu Đồ</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-faint)] hover:bg-[rgba(255,255,255,0.05)]">
            <IconX size={18} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)] px-3 py-2">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === tb.key ? "bg-[rgba(255,255,255,0.07)] text-[var(--text-soft)]" : "text-[var(--text-faint)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "spies" && <SpiesTab stat={stat} />}
          {tab === "secrets" && <SecretsTab stat={stat} />}
          {tab === "plots" && <PlotsTab stat={stat} />}
          {tab === "captives" && <CaptivesTab stat={stat} />}
        </div>

        <p className="border-t border-[rgba(255,255,255,0.06)] px-4 py-2.5 text-[11px] italic leading-relaxed text-[var(--text-faint)]">
          Trong bóng tối không có nút bấm. Hãy nói ra ý ngươi trong cuộc chơi — cài một con hầu vào phòng ai,
          mua lấy miệng một tên lính, thì thầm một lời vào tai đúng người. Cỗ máy giữ vỏ bọc, nghi ngờ và
          những gì rỉ ra.
        </p>
      </aside>
    </div>
  );
}

// ── Tai Mắt (14.1 + M20: vỏ bọc, hạng, người điều khiển, phản gián) ──────────
function SpiesTab({ stat }: { stat: Stat }) {
  const spies = Object.entries(stat["Tình Báo"]["Điệp Viên"]);
  const enemySpies = Object.entries(stat["Tình Báo"]["Điệp Viên Địch"] ?? {});
  const infiltrated = stat["Tình Báo"]["Bị Cài Điệp Viên"];
  const exposed = stat["Tình Báo"]["_Điệp Viên Vừa Lộ"];
  const today = absoluteDay(stat["Thế Giới"]);

  return (
    <div className="space-y-4">
      {spies.length === 0 && enemySpies.length === 0 && (
        <Whisper>
          Bóng tối là nơi kẻ yếu lật đổ kẻ mạnh — nhưng ngươi chưa có tai mắt nào. Một con hầu trong phòng
          ngủ, một tên lính canh nợ nần, một ả kỹ nữ nghe được nhiều hơn cả một tiểu hội đồng…
        </Whisper>
      )}

      {exposed && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.08)] px-3 py-2">
          <p className="flex items-center gap-1.5 text-[12px] text-[var(--danger)]">
            <IconAlert size={13} /> {exposed} vừa bị bắt.
          </p>
        </div>
      )}

      {spies.map(([name, spy]) => {
        const cover = spy["Vỏ Bọc"] ?? 70;
        const danger = spy["Bị Nghi Ngờ"] > 80 || cover <= 20;
        return (
          <div
            key={name}
            className={`rounded-[var(--radius-md)] border p-3 ${danger ? "border-[rgba(176,106,95,0.5)]" : "border-[rgba(255,255,255,0.06)]"} bg-[rgba(255,255,255,0.02)]`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13.5px] text-[var(--text-soft)]">
                  <IconEye size={13} /> {name}
                </span>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                  {spy["Hạng"]} · cài ở {spy["Cài Ở"] || "—"} · {spy["Nhiệm Vụ"]}
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[12px] text-[var(--text-muted)]">{spy["Số Tin Đã Gửi"]}</span>
                <span className="block text-[10px] text-[var(--text-faint)]">tin đã gửi</span>
              </span>
            </div>

            <div className="mt-2 flex gap-3">
              <TwoBar label="Thâm nhập" value={spy["Độ Sâu Thâm Nhập"]} color="var(--accent-text)" />
              <TwoBar label="Bị nghi ngờ" value={spy["Bị Nghi Ngờ"]} color={susColor(spy["Bị Nghi Ngờ"])} />
            </div>
            <div className="mt-2 flex gap-3">
              <TwoBar label="Vỏ bọc" value={cover} color={cover <= 20 ? "var(--danger)" : cover <= 50 ? "#d97706" : "var(--ok)"} />
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {spy["Người Điều Khiển"] && <Chip text={`đầu mối: ${spy["Người Điều Khiển"]}`} />}
              {spy["_Ngày Cài"] > 0 && <Chip text={`đã ${formatDuration(Math.max(0, today - spy["_Ngày Cài"]))} nằm trong đó`} />}
            </div>

            {danger && (
              <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[var(--danger)]">
                <IconAlert size={12} />
                {spy["Bị Nghi Ngờ"] > 80 ? "Sắp bị lộ — rút về hay liều tiếp?" : "Vỏ bọc gần như trần trụi. Cho hắn nằm im một thời gian."}
              </p>
            )}
            {spy["Ghi Chú"] && <Whisper>{spy["Ghi Chú"]}</Whisper>}
          </div>
        );
      })}

      {infiltrated > 0 && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)] px-3 py-2">
          <TwoBar label="Sân nhà ngươi bị địch thâm nhập" value={infiltrated} color={susColor(infiltrated)} />
          <Whisper>Một Đại Điệp Viên giỏi sẽ hạ mức này mỗi ngày — đó là việc của lũ chim nhỏ.</Whisper>
        </div>
      )}

      {enemySpies.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            <IconUsers size={13} /> Kẻ bị nghi trong sân nhà
          </h3>
          <div className="space-y-2">
            {enemySpies.map(([key, e]) => (
              <div key={key} className="rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] text-[var(--text-soft)]">{e["Nghi Là"] || key}</span>
                  <Chip text={`của ${HOUSES_BY_ID[e["Của Nhà"]]?.name ?? (e["Của Nhà"] || "?")}`} />
                </div>
                <div className="mt-1.5">
                  <TwoBar label="Chứng cứ" value={e["Chứng Cứ"]} color={e["Chứng Cứ"] >= 60 ? "var(--ok)" : "#d97706"} />
                </div>
                {e["Đang Rình"] && <Whisper>Đang rình: {e["Đang Rình"]}</Whisper>}
                {e["Chứng Cứ"] < 60 && <Whisper>Bắt bây giờ là bắt oan — mất mặt, và Nhà kia có cớ oán.</Whisper>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bí Mật (M20) ────────────────────────────────────────────────────────────
function SecretsTab({ stat }: { stat: Stat }) {
  const secrets = Object.entries(stat["Tình Báo"]["Bí Mật"] ?? {});
  // tin cũ của ván trước chưa vào sổ bí mật — vẫn hiện để không mất dữ liệu
  const legacy = Object.entries(stat["Tình Báo"]["Tin Tình Báo Đã Biết"] ?? {}).filter(([k]) => !secrets.some(([sk]) => sk === k));

  if (secrets.length === 0 && legacy.length === 0) {
    return (
      <Whisper>
        Sổ còn trắng. Bí mật là thứ đắt nhất trong ván cờ này — nhưng chỉ khi vừa NẶNG vừa ĐÁNG TIN.
        Lời một con hầu kể lại không đủ để buộc một lãnh chúa quỳ.
      </Whisper>
    );
  }

  const sorted = [...secrets].sort((a, b) => secretLeverage(b[1]) - secretLeverage(a[1]));

  return (
    <div className="space-y-3">
      {sorted.map(([key, s]) => {
        const lev = secretLeverage(s);
        const tone = lev >= 50 ? "var(--ok)" : lev >= 25 ? "#d97706" : "var(--text-faint)";
        return (
          <div key={key} className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-soft)]">
                  <IconScroll size={13} /> {s["Chủ Đề"] || key}
                </span>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">về {s["Về Ai"] || "—"}</p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[13px]" style={{ color: tone }}>{lev}</span>
                <span className="block text-[10px] text-[var(--text-faint)]">đòn bẩy</span>
              </span>
            </div>

            {s["Nội Dung"]
              ? <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">{s["Nội Dung"]}</p>
              : <Whisper>Tai mắt gửi về một mẩu tin nhưng chưa ai ghép được thành chuyện — hãy hỏi tới trong cuộc chơi.</Whisper>}

            <div className="mt-2 flex gap-3">
              <TwoBar label="Sức nặng" value={s["Sức Nặng"]} color="var(--accent-text)" />
              <TwoBar label="Độ tin cậy" value={s["Độ Tin Cậy"]} color="var(--ok)" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {s["Nguồn"] && <Chip text={`nguồn: ${s["Nguồn"]}`} />}
              {s["Đã Dùng"] && <Chip text="đã tung ra" tone="#d97706" />}
              {s["Đã Lan Ra"] && <Chip text="đã lan ra — mất thế độc quyền" tone="var(--danger)" />}
            </div>
          </div>
        );
      })}

      {legacy.length > 0 && (
        <div>
          <h3 className="font-display mb-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">Tin cũ chưa xếp loại</h3>
          <div className="space-y-1.5">
            {legacy.map(([key, val]) => (
              <div key={key} className="rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <p className="text-[12.5px] text-[var(--text-soft)]">{key}</p>
                <p className="text-[11.5px] text-[var(--text-faint)]">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Âm Mưu (14.2 + M20: giai đoạn, vốn, kẻ điều tra) ────────────────────────
const PHASE_TONE: Record<string, string> = {
  "Ấp Ủ": "var(--text-faint)",
  "Chiêu Mộ": "var(--text-muted)",
  "Chuẩn Bị": "#d97706",
  "Ra Tay": "var(--danger)",
  "Che Dấu": "var(--accent-text)",
  "Đã Xong": "var(--ok)",
  "Đã Vỡ": "var(--danger)",
};

function PlotsTab({ stat }: { stat: Stat }) {
  const plots = Object.entries(stat["Âm Mưu"]);
  const broken = stat["Tình Báo"]["_Âm Mưu Vừa Vỡ"];
  const today = absoluteDay(stat["Thế Giới"]);

  return (
    <div className="space-y-3">
      {broken && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.08)] px-3 py-2">
          <p className="flex items-start gap-1.5 text-[12px] text-[var(--danger)]">
            <IconAlert size={13} /> Âm mưu vừa vỡ: {broken}
          </p>
        </div>
      )}

      {plots.length === 0 && (
        <Whisper>
          Chưa có âm mưu nào đang chạy. Một lời thì thầm đúng chỗ có thể lật đổ cả một triều đại — nhưng
          mỗi cái miệng biết chuyện là một khe hở.
        </Whisper>
      )}

      {plots.map(([name, p]) => {
        const disloyal = p["Đồng Mưu"].filter((n) => {
          const npc = stat["Mối Quan Hệ"]["NPC Chính"][n] ?? stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][n];
          return npc && npc["Độ Hảo Cảm"] < 0;
        });
        const age = p["_Ngày Bắt Đầu"] > 0 ? today - p["_Ngày Bắt Đầu"] : 0;
        return (
          <div key={name} className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13.5px] text-[var(--text-soft)]">
                  <IconTarget size={13} color="var(--text-muted)" /> {name}
                </span>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                  {p["Loại"]} · nhắm {p["Mục Tiêu"] || "—"}
                </p>
              </div>
              <Chip text={p["Giai Đoạn"]} tone={PHASE_TONE[p["Giai Đoạn"]]} />
            </div>

            <div className="mt-2 flex gap-3">
              <TwoBar label="Tiến độ" value={p["Tiến Độ"]} color="var(--ok)" />
              <TwoBar label="Độ bại lộ" value={p["Độ Bại Lộ"]} color={susColor(p["Độ Bại Lộ"])} />
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              {age > 0 && <Chip text={`ấp ủ ${formatDuration(age)}`} />}
              {p["Vốn Đã Bỏ"] > 0 && <Chip text={`đã rót ${fmt(p["Vốn Đã Bỏ"])}`} />}
              {p["Đồng Mưu"].length > 0 && <Chip text={`${p["Đồng Mưu"].length} đồng mưu`} />}
            </div>

            {p["Đồng Mưu"].length > 0 && (
              <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
                Đồng mưu: {p["Đồng Mưu"].join(", ")}
                {disloyal.length > 0 && <span className="text-[var(--danger)]"> · {disloyal.join(", ")} có thể phản</span>}
              </p>
            )}
            {p["Kẻ Điều Tra"] && (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[var(--danger)]">
                <IconAlert size={12} /> {p["Kẻ Điều Tra"]} đang lần theo dấu.
              </p>
            )}
            {p["Hậu Quả Nếu Lộ"] && <Whisper>Nếu vỡ: {p["Hậu Quả Nếu Lộ"]}</Whisper>}
            {p["Tiến Độ"] >= 100 && <Whisper>Mọi thứ đã vào chỗ. Chỉ còn chờ ngươi nói một lời.</Whisper>}
          </div>
        );
      })}
    </div>
  );
}

// ── Con Tin & Tù Binh (14.4) ─────────────────────────────────────────────────
function CaptivesTab({ stat }: { stat: Stat }) {
  const captives = Object.entries(stat["Tù Binh"]);
  if (captives.length === 0) {
    return (
      <Whisper>
        Chưa giữ con tin nào. Tướng địch bại trận có thể bị bắt để đòi chuộc, để đổi chác — hoặc để
        treo lên tường thành cho kẻ khác nhìn.
      </Whisper>
    );
  }

  return (
    <div className="space-y-3">
      {captives.map(([name, c]) => {
        const house = HOUSES_BY_ID[(c["Nhà"]?.toLowerCase?.() ?? "") || ""];
        return (
          <div key={name} className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[13.5px] text-[var(--text-soft)]">{c["Họ Tên"] || name}</span>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                  {c["Vai Trò"]}{c["Nhà"] ? ` · ${house?.name ?? `Nhà ${c["Nhà"]}`}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="flex items-center gap-1 font-mono text-[12px] text-[var(--accent-text)]">
                  <IconCoins size={12} /> {fmt(c["Giá Chuộc"])}
                </span>
                <span className="block text-[10px] text-[var(--text-faint)]">giá chuộc</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Chip
                text={c["Đối Xử"]}
                tone={c["Đối Xử"] === "Khách Quý" ? "var(--ok)" : c["Đối Xử"] === "Ngục Tối" ? "var(--danger)" : undefined}
              />
            </div>
            <Whisper>
              {c["Đối Xử"] === "Khách Quý"
                ? "Đối xử tử tế thì Nhà bên kia dịu giọng — và con tin nhớ điều đó khi được thả."
                : c["Đối Xử"] === "Ngục Tối"
                  ? "Ném xuống ngục thì có tin nhanh hơn, và có một món nợ máu nhanh hơn nữa."
                  : "Giam lỏng: đủ lịch sự để còn đường thương lượng."}
            </Whisper>
          </div>
        );
      })}
    </div>
  );
}
