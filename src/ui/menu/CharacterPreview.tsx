/**
 * Panel preview nhân vật REALTIME (8.5) — thấy ngay lựa chọn ảnh hưởng
 * chỉ số phái sinh thế nào. Nhận StatData đã dựng (wizard draft hoặc canon).
 */
import type { StatData } from "../../mvu/schema";
import { CONTINENTS } from "../../content/world/geography";
import { CULTURES_BY_ID } from "../../content/westeros/cultures";

/** State vẫn giữ lãnh địa NPC cho bản đồ, nhưng preview chỉ hiển thị đất của người chơi. */
export function playerHoldings(state: StatData) {
  const playerName = state["Thông Tin Nhân Vật"]["Họ Tên"];
  return Object.entries(state["Lãnh Địa"]).filter(([, holding]) => holding["Người Kiểm Soát"] === playerName);
}

export function CharacterPreview({ state, title }: { state: StatData; title?: string }) {
  const info = state["Thông Tin Nhân Vật"];
  const core = state["Chỉ Số Cốt Lõi"];
  const derived = state["Chỉ Số Phái Sinh"];
  const talents = Object.entries(state["Thiên Phú"]);
  const skills = Object.entries(state["Kỹ Năng"]).filter(([, s]) => s["Cấp"] > 0);
  const equipped = Object.entries(state["Trang Bị Đang Mặc"]).filter(([, i]) => i && i["Tên"]);
  const lands = playerHoldings(state);
  const totalFood = lands.reduce((sum, [, t]) => sum + (t["Tài Nguyên"]?.["Lương Thực"] ?? 0), 0);
  const npcs = Object.entries(state["Mối Quan Hệ"]["NPC Chính"]);
  const dragons = Object.entries(state["Rồng"]);
  const continentName = CONTINENTS.find((continent) =>
    continent.id === info["Lục Địa"].toLocaleLowerCase("en-US")
    || continent.name.toLocaleLowerCase("vi") === info["Lục Địa"].toLocaleLowerCase("vi"),
  )?.name ?? info["Lục Địa"];
  const cultureName = CULTURES_BY_ID[info["Văn Hoá"]]?.name ?? info["Văn Hoá"];

  return (
    <div className="glass-strong space-y-3 p-4 text-[12.5px]">
      <div>
        <h3 className="font-display text-base tracking-wide text-[var(--accent-text)]">
          {title ?? (info["Họ Tên"] || "Nhân vật")}
        </h3>
        <p className="text-[var(--text-muted)]">
          {info["Tước Vị"] !== "Thường Dân" ? `[${info["Tước Vị"]}] ` : ""}Nhà {info["Nhà"]}{info["Xuất Thân"] ? ` · ${info["Xuất Thân"]}` : ""} · Vàng {info["Ngân Khố"].toLocaleString("vi-VN")}
        </p>
        <p className="text-[var(--text-faint)] mt-1">
          {continentName} · {cultureName} · {info["Tôn Giáo"]}
        </p>
        {state.Persona["Đặc Điểm"]?.["Màu Mắt"] && (
          <p className="text-[var(--text-faint)] mt-0.5 text-[11px]">
            Đặc điểm: {state.Persona["Đặc Điểm"]["Màu Mắt"]} · {state.Persona["Đặc Điểm"]["Màu Tóc"]} · {state.Persona["Đặc Điểm"]["Chiều Cao"]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-1">
        {Object.entries(core).map(([name, v]) => (
          <div key={name} className="flex justify-between">
            <span className="text-[var(--text-faint)]">{name.split(" ")[0]}</span>
            <span className="font-mono text-[var(--text-soft)]">{v as number}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-[var(--glass-border)] pt-2 text-[12px]">
        <span className="text-[var(--text-faint)]">HP tối đa <b className="font-mono text-[var(--ok)]">{derived["_HP Tối Đa"]}</b></span>
        <span className="text-[var(--text-faint)]">Thể lực <b className="font-mono text-[var(--text-soft)]">{derived["_Thể Lực Tối Đa"]}</b></span>
        <span className="text-[var(--text-faint)]">Phòng thủ <b className="font-mono text-[var(--text-soft)]">{derived["_Phòng Thủ"]}</b></span>
        <span className="text-[var(--text-faint)]">Sát thương <b className="font-mono text-[var(--text-soft)]">{derived["_Sát Thương Cận"]}/{derived["_Sát Thương Xa"]}</b></span>
      </div>

      {talents.length > 0 && (
        <p className="border-t border-[var(--glass-border)] pt-2 leading-relaxed">
          <span className="text-[var(--text-faint)]">Thiên phú: </span>
          <span className="text-[var(--accent-text)]">{talents.map(([n, t]) => (t["Ẩn"] ? `${n} (ẩn)` : n)).join(" · ")}</span>
        </p>
      )}

      {skills.length > 0 && (
        <p className="leading-relaxed">
          <span className="text-[var(--text-faint)]">Kỹ năng: </span>
          <span className="text-[var(--text-soft)]">{skills.map(([n, s]) => `${n} ${s["Cấp"]}`).join(" · ")}</span>
        </p>
      )}

      {equipped.length > 0 && (
        <p className="leading-relaxed">
          <span className="text-[var(--text-faint)]">Trang bị: </span>
          {equipped.map(([slot, item], i) => (
            <span key={slot} className="text-[var(--text-soft)]">
              {i > 0 && " · "}
              {item!["Tên"]}
              {item!["Phẩm Chất"] === "Thép Valyria" || item!["Phẩm Chất"] === "Vô Giá" ? (
                <span className="text-[var(--accent-text)]"> ({item!["Phẩm Chất"]})</span>
              ) : null}
            </span>
          ))}
        </p>
      )}

      {(lands.length > 0 || totalFood > 0) && (
        <p className="leading-relaxed text-[var(--text-muted)]">
          {lands.length > 0 && <>Lãnh địa: {lands.map(([id, holding]) => holding["Mô Tả"] || id).join(", ")} · </>}
          Lương {totalFood.toLocaleString("vi-VN")} · Thuế: {state["Chính Sách Thuế"]["Mức Thuế"]}
        </p>
      )}

      {npcs.length > 0 && (
        <p className="leading-relaxed text-[var(--text-muted)]">Tâm phúc: {npcs.map(([n]) => n).join(", ")}</p>
      )}

      {dragons.length > 0 && (
        <p className="leading-relaxed">
          <span className="text-[var(--text-faint)]">Rồng: </span>
          {dragons.map(([name, d], i) => (
            <span key={name} className="text-[var(--text-soft)]">
              {i > 0 && " · "}
              {name} ({d["Kích Cỡ"]}, {d["Màu Sắc"]})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
