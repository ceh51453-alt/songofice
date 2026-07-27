import { genId } from "../../lib/id";
import type { WizardData } from "../../character/characterInit";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";
import { IconPlus, IconX } from "../icons";

interface Props {
  force: NonNullable<WizardData["customForce"]>;
  onChange: (force: NonNullable<WizardData["customForce"]>) => void;
}

export function CustomForceEditor({ force, onChange }: Props) {
  const addNpc = () => {
    onChange({
      ...force,
      npcs: [...force.npcs, { 
        id: "npc_" + genId(), 
        name: "", 
        role: "Tướng Quân", 
        statPreset: "balanced",
        nangLuc: { voLuc: 14, thongSoai: 16, triMuu: 12, ngoaiGiao: 10 },
        tuoi: 30,
        netTinhCach: "Trung Thành"
      }],
    });
  };

  const removeNpc = (id: string) => {
    onChange({
      ...force,
      npcs: force.npcs.filter((n) => n.id !== id),
      // also remove from units if assigned
      units: force.units.map(u => u.commander === id ? { ...u, commander: "" } : u)
    });
  };

  const updateNpc = (id: string, updates: Partial<typeof force.npcs[0]>) => {
    onChange({
      ...force,
      npcs: force.npcs.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });
  };

  const addUnit = () => {
    onChange({
      ...force,
      units: [...force.units, { id: "unit_" + genId(), type: "Bộ Binh", count: 1000, commander: "" }],
    });
  };

  const removeUnit = (id: string) => {
    onChange({ ...force, units: force.units.filter((u) => u.id !== id) });
  };

  const updateUnit = (id: string, updates: Partial<typeof force.units[0]>) => {
    onChange({
      ...force,
      units: force.units.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    });
  };

  return (
    <div className="mt-4 border-t border-[var(--glass-border)] pt-3 space-y-4">
      <span className="block text-[13px] font-semibold text-[var(--accent-text)] mb-2">Lực Lượng Tùy Chỉnh (Gia Thần & Quân Đội)</span>
      
      {/* NPCs Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-muted)]">Gia Thần / Tướng Lĩnh</span>
          <GlassButton onClick={addNpc} className="px-2 py-1 text-[11px]"><IconPlus size={12} className="inline mr-1" /> Thêm NPC</GlassButton>
        </div>
        {force.npcs.length === 0 && <span className="text-[11px] text-[var(--text-faint)] italic">Chưa có gia thần nào.</span>}
        {force.npcs.map((n) => (
          <div key={n.id} className="flex gap-2 items-center bg-[var(--glass-bg)] p-2 rounded border border-[var(--glass-border-bright)]">
            <GlassInput
              placeholder="Tên NPC"
              value={n.name}
              onChange={(e) => updateNpc(n.id, { name: e.target.value })}
              className="flex-1 text-[12px]"
            />
            <select
              value={n.role}
              onChange={(e) => updateNpc(n.id, { role: e.target.value })}
              className="bg-transparent border border-[var(--glass-border)] rounded px-1 py-1 text-[12px] text-[var(--text-soft)]"
            >
              <option value="Tướng Quân">Tướng Quân</option>
              <option value="Hiệp Sĩ">Hiệp Sĩ</option>
              <option value="Cố Vấn">Cố Vấn</option>
              <option value="Thị Vệ">Thị Vệ</option>
            </select>
            <button onClick={() => removeNpc(n.id)} className="text-red-400 hover:text-red-300 p-1"><IconX size={14} /></button>
          </div>
        ))}
      </div>

      {/* Units Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-muted)]">Quân Đội Thường Trực</span>
          <GlassButton onClick={addUnit} className="px-2 py-1 text-[11px]"><IconPlus size={12} className="inline mr-1" /> Chiêu Mộ</GlassButton>
        </div>
        {force.units.length === 0 && <span className="text-[11px] text-[var(--text-faint)] italic">Chưa có đội quân nào.</span>}
        {force.units.map((u) => (
          <div key={u.id} className="flex flex-wrap gap-2 items-center bg-[var(--glass-bg)] p-2 rounded border border-[var(--glass-border-bright)]">
            <select
              value={u.type}
              onChange={(e) => updateUnit(u.id, { type: e.target.value })}
              className="bg-transparent border border-[var(--glass-border)] rounded px-1 py-1 text-[12px] text-[var(--text-soft)]"
            >
              <option value="Bộ Binh">Bộ Binh</option>
              <option value="Kỵ Binh">Kỵ Binh</option>
              <option value="Cung Thủ">Cung Thủ</option>
              <option value="Kỵ Binh Hạng Nặng">Kỵ Binh Hạng Nặng</option>
              <option value="Lính Đánh Thuê">Lính Đánh Thuê</option>
            </select>
            <GlassInput
              type="number"
              placeholder="Số lượng"
              value={u.count}
              onChange={(e) => updateUnit(u.id, { count: parseInt(e.target.value) || 0 })}
              className="w-20 text-[12px]"
            />
            <select
              value={u.commander}
              onChange={(e) => updateUnit(u.id, { commander: e.target.value })}
              className="bg-transparent border border-[var(--glass-border)] rounded px-1 py-1 text-[12px] text-[var(--text-soft)] flex-1"
            >
              <option value="">Trực tiếp chỉ huy</option>
              {force.npcs.map(n => (
                <option key={n.id} value={n.id}>{n.name || "NPC Vô Danh"}</option>
              ))}
            </select>
            <button onClick={() => removeUnit(u.id)} className="text-red-400 hover:text-red-300 p-1"><IconX size={14} /></button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-faint)] italic">Lưu ý: Bạn có thể nhập số lượng quân tuỳ ý, nhưng quân số quá đông sẽ làm cạn kiệt tài nguyên rất nhanh!</p>
    </div>
  );
}
