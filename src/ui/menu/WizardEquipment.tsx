import { useState, useMemo } from "react";
import type { WizardData, CraftingRequest } from "../../character/characterInit";
import { LORE_EQUIPMENT } from "../../content/westeros/equipment";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";
import { IconCheck } from "../icons";

interface Props {
  wiz: WizardData;
  patch: (p: Partial<WizardData>) => void;
  gold: number;
}

export function WizardEquipment({ wiz, patch, gold }: Props) {
  const [tab, setTab] = useState<"lore" | "craft">("lore");
  
  const selectedLore = wiz.loreEquipmentIds || [];
  const customEquips = wiz.customEquipments || [];

  const handleToggleLore = (id: string) => {
    if (selectedLore.includes(id)) {
      patch({ loreEquipmentIds: selectedLore.filter((x) => x !== id) });
    } else {
      patch({ loreEquipmentIds: [...selectedLore, id] });
    }
  };

  const currentGold = useMemo(() => {
    let spent = 0;
    for (const id of selectedLore) {
      const e = LORE_EQUIPMENT.find((x) => x.id === id);
      if (e?.goldCost) spent += e.goldCost;
    }
    for (const c of customEquips) {
      let cost = 100;
      if (c.material === "Thép Tinh Luyện") cost += 300;
      else if (c.material === "Thép Valyria") cost += 2000;
      if (c.crafter === "Thợ rèn Qohor") cost += 500;
      spent += cost;
    }
    return Math.max(0, gold - spent);
  }, [selectedLore, customEquips, gold]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <GlassButton variant={tab === "lore" ? "accent" : "default"} onClick={() => setTab("lore")}>
          Bảo Vật Trứ Danh
        </GlassButton>
        <GlassButton variant={tab === "craft" ? "accent" : "default"} onClick={() => setTab("craft")}>
          Đặt Thợ Rèn
        </GlassButton>
      </div>

      <div className="text-[13px] text-[var(--accent-text)] mb-2">
        Ngân khố hiện tại: {currentGold} Vàng
      </div>

      {tab === "lore" && (
        <div className="grid gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto">
          {LORE_EQUIPMENT.filter(e => !e.requiredHouseId || (wiz.houseId && e.requiredHouseId.toLowerCase() === wiz.houseId.toLowerCase())).map((e) => {
            const isSelected = selectedLore.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => handleToggleLore(e.id)}
                className={`glass relative p-3 text-left transition-all ${
                  isSelected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "hover:bg-[var(--glass-bg-hover)]"
                }`}
              >
                {isSelected && <IconCheck size={14} className="absolute right-2 top-2 text-[var(--accent)]" />}
                <div className="font-display text-[14px] text-[var(--text-bright)]">{e.name}</div>
                <div className="text-[12px] text-[var(--text-faint)]">
                  {e.pointCost ? `Tốn ${e.pointCost} điểm Point-buy` : `Tốn ${e.goldCost} Vàng`}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">{e.itemData["Mô Tả"]}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "craft" && (
        <CraftingForm
          onAdd={(req) => patch({ customEquipments: [...customEquips, req] })}
        />
      )}

      {customEquips.length > 0 && (
        <div className="mt-4 p-3 glass">
          <h4 className="text-[13px] font-bold text-[var(--text-soft)] mb-2">Trang Bị Đã Đặt:</h4>
          {customEquips.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-[13px] text-[var(--text-muted)] mb-1">
              <span>{c.name} ({c.material} - {c.crafter})</span>
              <button
                onClick={() => patch({ customEquipments: customEquips.filter((_, idx) => idx !== i) })}
                className="text-red-400 hover:text-red-300"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CraftingForm({ onAdd }: { onAdd: (req: CraftingRequest) => void }) {
  const [name, setName] = useState("");
  const [slot, setSlot] = useState<CraftingRequest["slot"]>("Vũ Khí Chính");
  const [material, setMaterial] = useState<CraftingRequest["material"]>("Thép Thường");
  const [crafter, setCrafter] = useState<CraftingRequest["crafter"]>("Bản thân");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name, slot, material, crafter });
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 glass">
      <label className="block text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">Tên trang bị</label>
      <GlassInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Kiếm Băng"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">Loại Trang Bị</label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as any)}
            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-2 py-1.5 text-[13px] text-[var(--text-soft)]"
          >
            <option value="Vũ Khí Chính">Vũ Khí Chính</option>
            <option value="Vũ Khí Phụ">Vũ Khí Phụ</option>
            <option value="Giáp Thân">Giáp Thân</option>
            <option value="Khiên">Khiên</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">Vật Liệu</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as any)}
            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-2 py-1.5 text-[13px] text-[var(--text-soft)]"
          >
            <option value="Thép Thường">Thép Thường (+100 Vàng)</option>
            <option value="Thép Tinh Luyện">Thép Tinh Luyện (+400 Vàng)</option>
            <option value="Thép Valyria">Thép Valyria (+2100 Vàng)</option>
          </select>
        </div>
        
        <div className="col-span-2">
          <label className="block text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">Người Rèn</label>
          <select
            value={crafter}
            onChange={(e) => setCrafter(e.target.value as any)}
            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-2 py-1.5 text-[13px] text-[var(--text-soft)]"
          >
            <option value="Bản thân">Bản thân (Miễn phí)</option>
            <option value="Thợ rèn Lâu Đài">Thợ rèn Lâu Đài (+100 Vàng)</option>
            <option value="Thợ rèn Qohor">Thợ rèn Qohor (+500 Vàng)</option>
          </select>
        </div>
      </div>

      <GlassButton type="submit" variant="accent" className="w-full mt-2">
        Đặt Rèn
      </GlassButton>
    </form>
  );
}
