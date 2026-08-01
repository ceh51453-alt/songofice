import { GlassInput } from "../components/GlassInput";
import type { OriginDef } from "../../content/westeros/origins";
import type { CoreStat } from "../../content/westeros/skills";
import { CORE_STATS } from "../../character/characterInit";

const TITLES = [
  "Thường Dân",
  "Hiệp Sĩ",
  "Lãnh Chúa",
  "Đại Lãnh Chúa",
  "Vua",
  "Vua Bảy Vương Quốc",
  "Hoàng Đế",
] as const;

export function CustomOriginEditor({
  origin,
  onChange,
  continentId,
}: {
  origin?: OriginDef;
  onChange: (o: OriginDef) => void;
  continentId: string;
}) {
  const current: OriginDef = origin || {
    id: "custom",
    name: "Tùy Chỉnh",
    desc: "",
    continentIds: [continentId],
    statBonus: {},
    extraPointBuy: 0,
    giftTalentIds: [],
    equipment: [],
    items: [],
    assets: { vang: 100, luongThuc: 50, thuNhapKy: 0, chiPhiKy: 10, moTa: "" },
    reputation: {},
    ghiChu: "",
    tuocVi: "Thường Dân",
  };

  const update = (patch: Partial<OriginDef>) => {
    onChange({ ...current, ...patch });
  };

  const updateAsset = (patch: Partial<OriginDef["assets"]>) => {
    update({ assets: { ...current.assets, ...patch } });
  };

  const updateStat = (stat: CoreStat, val: number) => {
    const newStats = { ...current.statBonus };
    if (val === 0) delete newStats[stat];
    else newStats[stat] = val;
    update({ statBonus: newStats });
  };

  return (
    <div className="glass p-4 mt-4 space-y-4">
      <span className="block text-[14px] text-[var(--accent-text)] border-b border-[var(--glass-border)] pb-2 mb-2">
        Chỉnh Sửa Xuất Thân Thủ Công
      </span>
      
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="block mb-1 text-[12px] text-[var(--text-muted)]">Tên Xuất Thân</span>
          <GlassInput
            value={current.name}
            onChange={(e: any) => update({ name: e.target.value })}
            placeholder="Ví dụ: Kỵ sĩ lang thang"
          />
        </div>
        <div>
          <span className="block mb-1 text-[12px] text-[var(--text-muted)]">Tước Vị</span>
          <select
            className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
            value={current.tuocVi}
            onChange={(e: any) => update({ tuocVi: e.target.value as any })}
          >
            {TITLES.map((t) => (
              <option key={t} value={t} className="bg-[var(--bg-panel)]">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block mb-1 text-[12px] text-[var(--text-muted)]">Mô Tả</span>
        <textarea
          className="glass w-full px-3 py-2 text-[13px] text-[var(--text-soft)] bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)] min-h-[60px]"
          value={current.desc}
          onChange={(e: any) => update({ desc: e.target.value })}
          placeholder="Mô tả về xuất thân..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[var(--glass-border)]">
        <div>
          <span className="block mb-2 text-[12px] text-[var(--text-muted)]">Chỉ Số Thưởng (Bonus)</span>
          <div className="space-y-1">
            {CORE_STATS.map((stat: CoreStat) => (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-soft)]">{stat}</span>
                <input
                  type="number"
                  className="glass w-16 px-2 py-1 text-[12px] text-right bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                  value={current.statBonus[stat] || 0}
                  onChange={(e: any) => updateStat(stat, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="block mb-2 text-[12px] text-[var(--text-muted)]">Tài Sản Bắt Đầu</span>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-soft)]">Vàng</span>
              <input
                type="number"
                className="glass w-20 px-2 py-1 text-[12px] text-right bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                value={current.assets.vang}
                onChange={(e: any) => updateAsset({ vang: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-soft)]">Lương Thực</span>
              <input
                type="number"
                className="glass w-20 px-2 py-1 text-[12px] text-right bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                value={current.assets.luongThuc}
                onChange={(e: any) => updateAsset({ luongThuc: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-soft)]">Thu Nhập / Kỳ</span>
              <input
                type="number"
                className="glass w-20 px-2 py-1 text-[12px] text-right bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                value={current.assets.thuNhapKy}
                onChange={(e: any) => updateAsset({ thuNhapKy: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-soft)]">Chi Phí / Kỳ</span>
              <input
                type="number"
                className="glass w-20 px-2 py-1 text-[12px] text-right bg-[rgba(0,0,0,0.4)] outline-none focus:border-[var(--accent)]"
                value={current.assets.chiPhiKy}
                onChange={(e: any) => updateAsset({ chiPhiKy: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
