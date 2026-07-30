/**
 * BẢNG TRANG BỊ & CƠ THỂ (M23) — thay cho hình nộm trống trơn của bản trước.
 *
 * Trước đây mục "TRANG BỊ" chỉ vẽ một bóng người màu xanh đen: không thấy đang
 * cầm gì, không thấy giáp che tới đâu, không thấy vết thương làm mất khả năng
 * nào. Người chơi phải bấm vào hình mới biết mình có gì.
 *
 * Bản này biến nó thành BẢNG THẬT:
 *   • Ô TRANG BỊ vây quanh hình người — thấy ngay đang cầm gì, mặc gì, món nào
 *     sắp hỏng (viền đỏ), ô nào còn trống.
 *   • VÙNG CHE của giáp hiện thành số ngay trên từng phần cơ thể.
 *   • NĂM NĂNG LỰC (Cầm Nắm / Di Chuyển / Nhìn / Hô Hấp / Trụ Vững) — đây là
 *     thứ vết thương thật sự lấy đi, và là thứ engine chiến đấu đọc.
 *   • CẢNH BÁO nói thẳng: vũ khí gãy, cầm hai tay mà còn đeo khiên, không có mũ
 *     giáp, gãy tay nên hết dùng được vũ khí hai tay.
 */
import { useState } from "react";
import type { EquipItem, StatData } from "../../../mvu/schema";
import { BodyVisualizer } from "./BodyVisualizer";
import { summarizeGear, describeGear, quoteRepair } from "../../../character/gearEngine";
import {
  bodyProfile, bodyCombatMods, shockLevel, describeBody,
  CAPABILITY_INTRO, SHOCK_INTRO, symptomDef,
  type Capability,
} from "../../../character/bodyEngine";
import { formatCurrencyShort } from "../../../economy/currency";
import { IconShield, IconCrossedSwords, IconAlert, IconSpark } from "../../icons";

const CAPS: Capability[] = ["Cầm Nắm", "Di Chuyển", "Nhìn", "Hô Hấp", "Trụ Vững"];

const SLOT_LABEL: Record<string, string> = {
  "Vũ Khí Chính": "Tay Chính",
  "Vũ Khí Phụ": "Tay Phụ",
  "Mũ/Nón": "Mũ Giáp",
  "Giáp Thân": "Giáp Thân",
  "Khiên": "Khiên",
  "Trang Sức": "Trang Sức",
  "Vật Phẩm Đặc Biệt": "Vật Phẩm",
};

/** Ô trang bị: tên món, phẩm chất, thanh độ bền, viền đỏ khi sắp hỏng. */
function GearSlot({
  slot, item, onClick, align = "left",
}: { slot: string; item: EquipItem | undefined; onClick?: () => void; align?: "left" | "right" }) {
  const dur = item?.["Độ Bền"] ?? 100;
  const broken = !!item && dur <= 0;
  const worn = !!item && dur < 30;
  return (
    <button
      type="button"
      onClick={onClick}
      title={item ? describeGear(item) : `${SLOT_LABEL[slot] ?? slot}: đang trống`}
      className={`w-full rounded border px-2 py-1 transition-colors ${align === "right" ? "text-right" : "text-left"} ${
        broken
          ? "border-[var(--danger)] bg-[rgba(200,50,50,0.12)]"
          : worn
            ? "border-[rgba(200,150,50,0.5)]"
            : item
              ? "border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)]"
              : "border-dashed border-[rgba(255,255,255,0.12)]"
      }`}
    >
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-faint)]">{SLOT_LABEL[slot] ?? slot}</div>
      <div className={`truncate text-[11.5px] ${item ? "text-[var(--text-soft)]" : "text-[var(--text-faint)] italic"}`}>
        {item?.["Tên"] || "— trống —"}
      </div>
      {item && (
        <>
          <div className="text-[9px] text-[var(--accent-text)]">{item["Phẩm Chất"]}</div>
          <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-[rgba(0,0,0,0.4)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, dur))}%`,
                background: broken ? "var(--danger)" : worn ? "var(--warn)" : "var(--ok)",
              }}
            />
          </div>
        </>
      )}
    </button>
  );
}

function CapBar({ name, value }: { name: Capability; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 75 ? "var(--ok)" : pct > 40 ? "var(--warn)" : "var(--danger)";
  return (
    <div title={CAPABILITY_INTRO[name]} className="cursor-help">
      <div className="flex justify-between text-[10.5px]">
        <span className="text-[var(--text-muted)]">{name}</span>
        <span className="font-mono" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.35)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function GearBodyPanel({ stat, onOpenEquipment }: { stat: StatData; onOpenEquipment: () => void }) {
  const [tab, setTab] = useState<"trang-bi" | "co-the">("trang-bi");
  const equipped = (stat["Trang Bị Đang Mặc"] ?? {}) as StatData["Trang Bị Đang Mặc"];
  const body = stat["Cơ Thể"] ?? {};
  const vitals = stat["Chỉ Số Sinh Tồn"];
  const derived = stat["Chỉ Số Phái Sinh"];

  const gear = summarizeGear(equipped);
  const weapon = gear.weapon;
  const armor = gear.armor;
  const profile = bodyProfile(body);
  const mods = bodyCombatMods(profile);
  const shock = shockLevel(vitals["HP"], derived["_HP Tối Đa"], profile.bleedPerDay);
  const smithing = stat["Kỹ Năng"]?.["Rèn Đúc"]?.["Cấp"] ?? 0;
  const repair = quoteRepair(equipped["Vũ Khí Chính"], smithing);

  return (
    <div className="space-y-2">
      {/* ---- chuyển tab ---- */}
      <div className="flex gap-1">
        {([["trang-bi", "Trang Bị"], ["co-the", "Cơ Thể"]] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded border px-2 py-1 text-[11px] transition-colors ${
              tab === k
                ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- hình nộm ----
           Bảng trạng thái là một cột hẹp, không đủ chỗ cho ba cột cạnh nhau —
           nên hình nộm đứng riêng một hàng, ô trang bị xếp lưới bên dưới. */}
      <div className="mx-auto w-full max-w-[132px]">
        <BodyVisualizer body={body} zones={tab === "trang-bi" ? armor.zones : undefined} />
      </div>

      {/* ---- ô trang bị ---- */}
      <div className="grid grid-cols-2 gap-1.5">
        <GearSlot slot="Vũ Khí Chính" item={equipped["Vũ Khí Chính"]} onClick={onOpenEquipment} />
        <GearSlot slot="Vũ Khí Phụ" item={equipped["Vũ Khí Phụ"]} onClick={onOpenEquipment} />
        <GearSlot slot="Mũ/Nón" item={equipped["Mũ/Nón"]} onClick={onOpenEquipment} />
        <GearSlot slot="Giáp Thân" item={equipped["Giáp Thân"]} onClick={onOpenEquipment} />
        <GearSlot slot="Khiên" item={equipped["Khiên"]} onClick={onOpenEquipment} />
        <GearSlot slot="Vật Phẩm Đặc Biệt" item={equipped["Vật Phẩm Đặc Biệt"]} onClick={onOpenEquipment} />
      </div>

      {/* ---- TAB TRANG BỊ ---- */}
      {tab === "trang-bi" && (
        <div className="space-y-2">
          <div className="rounded border border-[var(--glass-border)] p-2">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
              <IconCrossedSwords size={11} /> {weapon.cls.name}
              {weapon.material.id !== "Thép" && ` · ${weapon.material.name}`}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-[var(--text-soft)]">
              {weapon.dice}
              {weapon.damageBonus > 0 && ` +${weapon.damageBonus}`} sát thương ·{" "}
              {weapon.accuracy >= 0 ? "+" : ""}{weapon.accuracy} trúng
              {weapon.armorPierce > 0 && ` · xuyên ${weapon.armorPierce}`}
            </p>
            <p className="text-[10px] text-[var(--text-faint)]">
              Tầm {weapon.bands.join("/")}{weapon.twoHanded ? " · hai tay" : ""} ·{" "}
              độ bền {Math.round(weapon.durability)} ({weapon.durabilityLabel})
            </p>
            {weapon.cutsThroughArmor && (
              <p className="text-[10px] text-[var(--accent-text)]">Cắt xuyên giáp — vảy và thép tấm gần như vô nghĩa.</p>
            )}
          </div>

          <div className="rounded border border-[var(--glass-border)] p-2">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
              <IconShield size={11} /> {armor.cls.name}
            </p>
            <div className="mt-1 grid grid-cols-4 gap-1 text-center">
              {(["Đầu", "Thân", "Tay", "Chân"] as const).map((z) => (
                <div key={z} className="rounded bg-[rgba(255,255,255,0.03)] py-0.5">
                  <div className="text-[9px] text-[var(--text-faint)]">{z}</div>
                  <div className={`font-mono text-[12px] ${armor.zones[z] > 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
                    {armor.zones[z]}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-[var(--text-faint)]">
              Nặng {armor.weight.toFixed(1)}
              {armor.agilityPenalty > 0 && ` · −${armor.agilityPenalty} Nhanh Nhẹn`}
              {armor.poisePenalty > 0 && ` · −${armor.poisePenalty} hồi Thăng Bằng`}
            </p>
          </div>

          {repair.ok && (
            <p className="text-[10.5px] text-[var(--text-muted)]">
              Sửa vũ khí: +{repair.restored} độ bền, tốn {formatCurrencyShort(repair.cost)}
              {repair.material && ` + ${repair.material}`}
            </p>
          )}
          {!repair.ok && repair.reason && weapon.durability < 100 && (
            <p className="text-[10.5px] text-[var(--warn)]">{repair.reason}</p>
          )}
        </div>
      )}

      {/* ---- TAB CƠ THỂ ---- */}
      {tab === "co-the" && (
        <div className="space-y-2">
          <div
            className="rounded border px-2 py-1.5"
            style={{
              borderColor: shock === "Ổn" ? "var(--glass-border)" : "rgba(176,106,95,0.45)",
            }}
            title={SHOCK_INTRO[shock]}
          >
            <p className="text-[11.5px]">
              <span className="text-[var(--text-faint)]">Thể trạng: </span>
              <b className={shock === "Ổn" ? "text-[var(--ok)]" : "text-[var(--danger)]"}>{shock}</b>
            </p>
            <p className="text-[10px] leading-relaxed text-[var(--text-faint)]">{SHOCK_INTRO[shock]}</p>
            {profile.bleedPerDay > 0 && (
              <p className="mt-0.5 text-[10.5px] text-[var(--danger)]">
                Đang mất {profile.bleedPerDay} máu mỗi ngày — cần băng bó.
              </p>
            )}
          </div>

          <div className="space-y-1 rounded border border-[var(--glass-border)] p-2">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Năng lực còn lại</p>
            {CAPS.map((c) => <CapBar key={c} name={c} value={profile.capabilities[c]} />)}
          </div>

          <div className="rounded border border-[var(--glass-border)] p-2 text-[10.5px] text-[var(--text-muted)]">
            <p className="mb-0.5 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Ảnh hưởng lên chiến đấu</p>
            <p>Đánh trúng {mods.hit >= 0 ? "+" : ""}{mods.hit} · Phòng thủ {mods.ac >= 0 ? "+" : ""}{mods.ac}</p>
            <p>Sát thương ×{mods.damageMult.toFixed(2)} · Thể lực ×{mods.staminaMult.toFixed(2)}</p>
            {mods.incapacitated && <p className="text-[var(--danger)]">Không còn hành động được.</p>}
          </div>

          {profile.crippled.length > 0 && (
            <p className="text-[10.5px] text-[var(--danger)]">
              Thương tật vĩnh viễn: {profile.crippled.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* ---- cảnh báo chung ---- */}
      {(gear.warnings.length > 0 || profile.lines.length > 0) && (
        <div className="space-y-0.5 rounded border border-[rgba(176,106,95,0.35)] bg-[rgba(176,106,95,0.08)] p-2">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--danger)]">
            <IconAlert size={11} /> Cần chú ý
          </p>
          {[...gear.warnings, ...profile.lines].slice(0, 5).map((w, i) => (
            <p key={i} className="text-[10.5px] leading-snug text-[var(--text-muted)]">• {w}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenEquipment}
        className="flex w-full items-center justify-center gap-1 rounded border border-[var(--glass-border)] py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]"
      >
        <IconSpark size={11} /> Mở kho & bộ trang bị
      </button>
    </div>
  );
}

/** Xuất riêng để bảng khác (và prompt cho AI) dùng lại được mô tả cơ thể. */
export function bodySummaryText(stat: StatData): string {
  return describeBody(stat["Cơ Thể"], stat["Chỉ Số Sinh Tồn"]["HP"], stat["Chỉ Số Phái Sinh"]["_HP Tối Đa"]);
}

/** Dùng cho tooltip của từng bộ phận — mô tả triệu chứng theo sổ M23. */
export function partSymptomText(symptoms: string[]): string {
  return symptoms
    .filter((s) => s !== "Bình Thường")
    .map((s) => `${s}: ${symptomDef(s).desc}`)
    .join("\n");
}
