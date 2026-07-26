import { IconBook } from "../icons";

export function TabDecree({ holding }: { territoryId: string, holding: any }) {
  const decrees = holding["Pháp Lệnh"] || {};

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-white font-bold tracking-widest text-sm uppercase flex items-center gap-2">
            <IconBook size={18} /> QUẢN LÝ PHÁP LỆNH
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Ban hành các chính sách để điều chỉnh thuế, luật pháp và phúc lợi.</p>
        </div>
        <button className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-lg hover:bg-opacity-80 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          + BAN HÀNH MỚI
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-max overflow-y-auto pr-2">
        {Object.entries(decrees).length === 0 ? (
           <div className="col-span-2 text-center py-10 text-[var(--text-muted)] italic bg-black/20 rounded-xl border border-white/5">
              Chưa có pháp lệnh nào được ban hành tại lãnh địa này.
           </div>
        ) : (
          Object.entries(decrees).map(([id, decree]) => (
            <DecreeCard key={id} decree={decree} />
          ))
        )}
        
        {/* Placeholder for demonstration since currently decrees object is likely empty */}
        {Object.entries(decrees).length === 0 && (
          <>
            <DecreeCard decree={{ "Tên": "Đạo Luật Đất Đai V9", "Loại": "Luật", "Trạng Thái": "Đang hiệu lực", "Hiệu Ứng": "+10% Sản lượng Nông Nghiệp, -5 Lòng Dân" }} />
            <DecreeCard decree={{ "Tên": "Thuế Thương Mại Mùa Đông", "Loại": "Thuế", "Trạng Thái": "Đình trệ", "Hiệu Ứng": "+50% Vàng từ Thương Nhân, -15 Lòng Dân" }} />
          </>
        )}
      </div>
    </div>
  );
}

function DecreeCard({ decree }: { decree: any }) {
  const isActive = decree["Trạng Thái"] === "Đang hiệu lực";
  
  return (
    <div className={`glass rounded-xl p-5 border ${isActive ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5' : 'border-white/5 bg-black/20'} flex flex-col gap-3 relative overflow-hidden`}>
      {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />}
      
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-0.5 rounded bg-white/5 inline-block mb-2">
            {decree["Loại"]}
          </span>
          <h3 className="text-white font-bold text-lg">{decree["Tên"]}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${isActive ? 'bg-[var(--ok)]/20 text-[var(--ok)]' : 'bg-white/10 text-[var(--text-muted)]'}`}>
          {decree["Trạng Thái"]}
        </span>
      </div>
      
      <p className="text-sm text-[var(--text-muted)] mt-2 italic flex-1">
        {decree["Hiệu Ứng"]}
      </p>
      
      <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
        {isActive ? (
           <button className="flex-1 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors">
              Đình chỉ
           </button>
        ) : (
           <button className="flex-1 py-1.5 text-xs text-[var(--ok)] hover:bg-[var(--ok)]/10 rounded transition-colors">
              Khôi phục
           </button>
        )}
      </div>
    </div>
  );
}
