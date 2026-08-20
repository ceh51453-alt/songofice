import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useCourtStore } from "../../state/courtStore";
import { useUiStore } from "../../state/uiStore";
import { SUCCESSION_LAWS } from "../../mvu/schema";
import type { FamilyBranch, FamilyDuty, Npc } from "../../mvu/npcSchema";
import {
  livingFamily,
  recommendHeirFromStory,
  successionCrisisInfo,
  successionOrder,
  type SuccessionLaw,
} from "../../strategy/succession";
import { HOUSE_ID_BY_SCHEMA } from "../../territory/territoryEngine";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";
import { GlassSelect } from "../components/GlassSelect";
import {
  IconAlert,
  IconCastle,
  IconCoins,
  IconCrown,
  IconCrossedSwords,
  IconScroll,
  IconSpark,
  IconUsers,
  IconX,
} from "../icons";

type Filter = "all" | "main" | "cadet";
type FamilyEntry = [string, Npc];

function branchOf(npc: Npc): FamilyBranch {
  return npc["Nhánh Gia Tộc"] ?? "Dòng Chính";
}

function memberLabel(key: string, npc: Npc): string {
  return npc["Họ Tên"] || key;
}

function Avatar({ name, house, size = 34 }: { name: string; house?: string; size?: number }) {
  const id = house ? HOUSE_ID_BY_SCHEMA[house] ?? house.toLowerCase() : "";
  const color = houseColor(id);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display"
      style={{
        width: size,
        height: size,
        color: color.light,
        border: `1px solid ${color.base}`,
        background: `${color.base}2d`,
        fontSize: size * 0.4,
      }}
    >
      {(name.trim()[0] || "?").toUpperCase()}
    </span>
  );
}

function BranchBadge({ branch }: { branch: FamilyBranch }) {
  const main = branch === "Dòng Chính";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10.5px] ${
        main
          ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
          : "border-[var(--glass-border)] text-[var(--text-faint)]"
      }`}
    >
      {branch}
    </span>
  );
}

export function DynastyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const setLaw = useCourtStore((s) => s.setSuccessionLaw);
  const designateHeir = useCourtStore((s) => s.designateHeir);
  const setFamilyBranch = useCourtStore((s) => s.setFamilyBranch);
  const assignFamilyDuty = useCourtStore((s) => s.assignFamilyDuty);
  const acceptBetrothal = useCourtStore((s) => s.acceptBetrothal);
  const rejectBetrothal = useCourtStore((s) => s.rejectBetrothal);
  const setComposerText = useUiStore((s) => s.setComposerText);
  const setGameView = useUiStore((s) => s.setGameView);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [pendingLaw, setPendingLaw] = useState<SuccessionLaw | null>(null);

  if (!open) return null;

  const living = livingFamily(stat);
  const family: FamilyEntry[] = living.map(({ name, npc }) => [name, npc]);
  const mainLine = family.filter(([, npc]) => branchOf(npc) === "Dòng Chính");
  const cadetLine = family.filter(([, npc]) => branchOf(npc) === "Dòng Phụ");
  const shown = family.filter(([, npc]) =>
    filter === "all" ? true : filter === "main" ? branchOf(npc) === "Dòng Chính" : branchOf(npc) === "Dòng Phụ",
  );
  const activeEntry: FamilyEntry | undefined =
    (selected ? family.find(([key]) => key === selected) : undefined) ?? shown[0] ?? family[0];
  const order = successionOrder(stat);
  const heirKey = stat["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"] || order[0] || "";
  const heirNpc = stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][heirKey];
  const crisis = successionCrisisInfo(stat);
  const betrothals = Object.entries(stat["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"]);
  const treasury = stat["Thông Tin Nhân Vật"]["Ngân Khố"];
  const prestige = stat["Chỉ Số Cốt Lõi"]["Uy Tín"];

  const narrate = (prompt: string) => {
    setComposerText(prompt);
    setGameView("chat");
    onClose();
    setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
  };

  const appointAndNarrate = (key: string, evidence: string[] = []) => {
    const npc = stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][key];
    if (!npc) return;
    const label = memberLabel(key, npc);
    designateHeir(key);
    const basis = evidence.length > 0
      ? ` Những dấu mốc cần nhắc lại: ${evidence.join("; ")}.`
      : " Hãy liên hệ những diễn biến và ký ức đã có trong truyện.";
    narrate(`Ta chính thức chọn ${label} làm người thừa kế.${basis} Hãy kể cảnh công bố trước gia tộc, phản ứng của dòng chính lẫn dòng phụ, và hệ quả chính trị ngay sau đó. Không đổi lựa chọn sang người khác.`);
  };

  const chooseFromStory = () => {
    const recommendation = recommendHeirFromStory(stat);
    if (recommendation) appointAndNarrate(recommendation.name, recommendation.evidence);
  };

  const issueDuty = (key: string, duty: FamilyDuty) => {
    const npc = stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][key];
    if (!npc) return;
    const label = memberLabel(key, npc);
    const destination = target.trim();
    assignFamilyDuty(key, duty, destination);
    const action =
      duty === "Quản Lý Lãnh Địa"
        ? `đi quản lý ${destination || "một lãnh địa thích hợp"}`
        : duty === "Ra Trận"
          ? `ra trận tại ${destination || "mặt trận đang nóng"}`
          : duty === "Liên Hôn"
            ? `xúc tiến liên hôn với ${destination || "một đối tượng xứng đáng"}`
            : "trở về tại gia";
    narrate(`Ta điều ${label} ${action}. Hãy kể cảnh nhận lệnh, phản ứng của người ấy và gia tộc, thời gian chuẩn bị cùng những rủi ro có thể nảy sinh. Giữ đúng nhiệm vụ vừa được ghi trong sổ gia tộc.`);
  };

  const arrangeMarriage = () => {
    narrate("Ta muốn mở một cuộc dạm hỏi chính trị cho hậu duệ trong gia tộc. Hãy xét tuổi tác, dòng chính/dòng phụ, các Nhà đang có quan hệ với ta và diễn biến gần đây; đưa ra 2–3 mối phù hợp cùng lợi ích, rủi ro và của hồi môn.");
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Gia Tộc & Kế Vị">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.62)]" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-6xl flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] p-2 text-[var(--accent-text)]">
              <IconUsers size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)] sm:text-[21px]">Gia Tộc & Kế Vị</h2>
              <p className="truncate text-[11.5px] text-[var(--text-faint)]">Quản dòng chính, dòng phụ, hôn phối và con đường của từng hậu duệ</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            <IconX size={19} />
          </button>
        </header>

        <div className="grid gap-2 border-b border-[var(--glass-border)] p-3 sm:grid-cols-4 sm:p-4">
          <Summary icon={<IconCrown size={16} />} label="Người thừa kế" value={heirNpc ? memberLabel(heirKey, heirNpc) : "Chưa định"} />
          <Summary icon={<IconSpark size={16} />} label="Dòng chính" value={`${mainLine.length} người`} />
          <Summary icon={<IconUsers size={16} />} label="Dòng phụ" value={`${cadetLine.length} người`} />
          <Summary icon={<IconScroll size={16} />} label="Hôn ước chờ" value={`${betrothals.length} đề nghị`} />
        </div>

        {(crisis.inCrisis || stat["Gia Tộc Học"]["_Khủng Hoảng Kế Vị"]) && (
          <div className="mx-3 mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.08)] px-3 py-2.5 text-[12px] text-[var(--danger)] sm:mx-4">
            <IconAlert size={15} className="mt-0.5 shrink-0" />
            <span>{crisis.reason || "Tranh chấp kế vị đang âm ỉ trong dòng họ."}</span>
          </div>
        )}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.35fr)]">
          <section className="min-h-0 overflow-y-auto border-b border-[var(--glass-border)] p-3 sm:p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] p-1">
                {([['all', 'Tất cả'], ['main', 'Dòng chính'], ['cadet', 'Dòng phụ']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded px-2.5 py-1 text-[11.5px] ${filter === key ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text-faint)] hover:text-[var(--text-soft)]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">{living.length}/{family.length} còn sống</span>
            </div>

            {shown.length === 0 ? (
              <div className="glass rounded-[var(--radius-md)] p-5 text-center text-[12px] italic text-[var(--text-faint)]">Chưa có ai trong nhánh này.</div>
            ) : (
              <div className="space-y-1.5">
                {shown.map(([key, npc]) => {
                  const label = memberLabel(key, npc);
                  const isHeir = key === heirKey;
                  const active = activeEntry?.[0] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelected(key); setTarget(npc["Mục Tiêu Nhiệm Vụ"] ?? ""); }}
                      className={`glass flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-all hover:border-[var(--accent-border)] ${active ? "border-[var(--accent-border)] bg-[var(--glass-bg-hover)]" : ""}`}
                    >
                      <Avatar name={label} house={npc["Nhà"]} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[13.5px] text-[var(--text-soft)]">{label}</span>
                          {isHeir && <IconCrown size={13} color="var(--accent-text)" />}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--text-faint)]">
                          {npc["Tuổi"]} tuổi · {npc["Giới Tính"]} · {npc["Nhiệm Vụ Gia Tộc"] ?? "Tại Gia"}
                        </span>
                      </span>
                      <BranchBadge branch={branchOf(npc)} />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-5">
            <div className="grid gap-3 xl:grid-cols-[1fr_0.92fr]">
              <div className="space-y-3">
                <div className="glass rounded-[var(--radius-md)] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">Luật kế vị</p>
                      <p className="mt-1 text-[13px] text-[var(--text-soft)]">{stat["Gia Tộc Học"]["Luật Kế Vị"]}</p>
                    </div>
                    <GlassButton size="sm" variant="accent" disabled={living.length === 0} onClick={chooseFromStory}>
                      <IconSpark size={13} /> Theo diễn biến + AI kể
                    </GlassButton>
                  </div>
                  {pendingLaw ? (
                    <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--glass-border)] p-3">
                      <p className="text-[12px] text-[var(--text-soft)]">Đổi sang <span className="text-[var(--accent-text)]">{pendingLaw}</span>?</p>
                      <p className={`mt-1 text-[11px] ${treasury >= 5_880_000 && prestige >= 14 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
                        500 Rồng Vàng · cần Uy Tín 14+ (hiện {prestige})
                      </p>
                      <div className="mt-2 flex gap-2">
                        <GlassButton size="sm" variant="accent" disabled={treasury < 5_880_000 || prestige < 14} onClick={() => { setLaw(pendingLaw); setPendingLaw(null); }}>Xác nhận</GlassButton>
                        <GlassButton size="sm" variant="ghost" onClick={() => setPendingLaw(null)}>Hủy</GlassButton>
                      </div>
                    </div>
                  ) : (
                    <GlassSelect
                      className="mt-3"
                      value={stat["Gia Tộc Học"]["Luật Kế Vị"]}
                      onChange={(event) => {
                        const law = event.target.value as SuccessionLaw;
                        if (law !== stat["Gia Tộc Học"]["Luật Kế Vị"]) setPendingLaw(law);
                      }}
                    >
                      {SUCCESSION_LAWS.map((law) => <option key={law} value={law}>{law}</option>)}
                    </GlassSelect>
                  )}
                  {order.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {order.slice(0, 5).map((key, index) => {
                        const npc = stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"][key];
                        return <span key={key} className="rounded-full border border-[var(--glass-border)] px-2 py-1 text-[10.5px] text-[var(--text-faint)]">{index + 1}. {npc ? memberLabel(key, npc) : key}</span>;
                      })}
                    </div>
                  )}
                </div>

                {activeEntry ? (
                  <MemberDetail
                    entry={activeEntry}
                    heirKey={heirKey}
                    target={target}
                    onTarget={setTarget}
                    onBranch={(branch) => setFamilyBranch(activeEntry[0], branch)}
                    onHeir={() => appointAndNarrate(activeEntry[0])}
                    onDuty={(duty) => issueDuty(activeEntry[0], duty)}
                  />
                ) : (
                  <div className="glass rounded-[var(--radius-md)] p-6 text-center text-[12px] italic text-[var(--text-faint)]">Chưa có hậu duệ để quản lý.</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="glass rounded-[var(--radius-md)] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Hôn ước đang thương lượng</p>
                    <GlassButton size="sm" variant="ghost" onClick={arrangeMarriage}>+ Dạm hỏi</GlassButton>
                  </div>
                  {betrothals.length === 0 ? (
                    <p className="mt-3 text-[11.5px] italic text-[var(--text-faint)]">Chưa có lời cầu hôn nào. AI có thể đề xuất mối dựa trên bàn cờ hiện tại.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {betrothals.map(([id, betrothal]) => {
                        const house = HOUSES_BY_ID[betrothal["Nhà Đối Tác"]];
                        return (
                          <div key={id} className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] text-[var(--text-soft)]">{betrothal["Đối Tượng"]}</span>
                              <span className="text-[10.5px] text-[var(--text-faint)]">{house?.name ?? betrothal["Nhà Đối Tác"]}</span>
                            </div>
                            {betrothal["Lợi Ích Chính Trị"] && <p className="mt-1 text-[11px] italic text-[var(--text-muted)]">{betrothal["Lợi Ích Chính Trị"]}</p>}
                            <p className="mt-1 flex items-center gap-1 text-[10.5px] text-[var(--text-faint)]"><IconCoins size={12} /> {betrothal["Của Hồi Môn"].toLocaleString("vi-VN")} · {betrothal["Chi Trả"]}</p>
                            <div className="mt-2 flex gap-1.5">
                              <GlassButton size="sm" variant="accent" onClick={() => acceptBetrothal(id)}>Chấp nhận</GlassButton>
                              <GlassButton size="sm" variant="ghost" onClick={() => rejectBetrothal(id)}>Từ chối</GlassButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="glass rounded-[var(--radius-md)] p-3.5 text-[11.5px] text-[var(--text-faint)]">
                  <p className="font-display mb-2 text-[12px] uppercase tracking-widest">Nguyên tắc</p>
                  <p>Dòng phụ không nằm trong thứ tự kế vị. Chỉ định một người dòng phụ làm thừa kế sẽ tự nâng người ấy lên dòng chính.</p>
                  <p className="mt-2">Điều phái được ghi vào hồ sơ ngay; lời nhắc sau đó đưa sang màn nhập vai để AI kể diễn biến và hậu quả.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5">
      <span className="text-[var(--accent-text)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{label}</span>
        <span className="block truncate text-[12.5px] text-[var(--text-soft)]">{value}</span>
      </span>
    </div>
  );
}

function MemberDetail({
  entry,
  heirKey,
  target,
  onTarget,
  onBranch,
  onHeir,
  onDuty,
}: {
  entry: FamilyEntry;
  heirKey: string;
  target: string;
  onTarget: (value: string) => void;
  onBranch: (branch: FamilyBranch) => void;
  onHeir: () => void;
  onDuty: (duty: FamilyDuty) => void;
}) {
  const [key, npc] = entry;
  const label = memberLabel(key, npc);
  const branch = branchOf(npc);
  const isHeir = key === heirKey;
  return (
    <div className="glass rounded-[var(--radius-md)] p-3.5">
      <div className="flex items-start gap-3">
        <Avatar name={label} house={npc["Nhà"]} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[16px] text-[var(--text-soft)]">{label}</h3>
            <BranchBadge branch={branch} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-faint)]">{npc["Tuổi"]} tuổi · {npc["Giới Tính"]} · Nhà {npc["Nhà"] || "chưa rõ"}</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Tin cậy {npc["Tin Cậy"]} · Thống soái {npc["Năng Lực"]["Thống Soái"]} · Trí mưu {npc["Năng Lực"]["Trí Mưu"]}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">Vị trí trong tộc</p>
        <div className="flex flex-wrap gap-2">
          <GlassButton size="sm" variant={branch === "Dòng Chính" ? "accent" : "default"} onClick={() => onBranch("Dòng Chính")}>Nâng dòng chính</GlassButton>
          <GlassButton size="sm" variant={branch === "Dòng Phụ" ? "danger" : "default"} onClick={() => onBranch("Dòng Phụ")}>Giáng dòng phụ</GlassButton>
          <GlassButton size="sm" variant={isHeir ? "accent" : "default"} disabled={isHeir || !npc["Còn Sống"]} onClick={onHeir}>
            <IconCrown size={13} /> {isHeir ? "Đang kế vị" : "Chọn thừa kế"}
          </GlassButton>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
        <p className="text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">Điều phái & liên hôn</p>
        <GlassInput className="mt-2" value={target} onChange={(event) => onTarget(event.target.value)} placeholder="Lãnh địa, mặt trận hoặc đối tượng liên hôn…" />
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <GlassButton size="sm" onClick={() => onDuty("Quản Lý Lãnh Địa")}><IconCastle size={13} /> Quản lãnh địa</GlassButton>
          <GlassButton size="sm" onClick={() => onDuty("Ra Trận")}><IconCrossedSwords size={13} /> Ra trận</GlassButton>
          <GlassButton size="sm" onClick={() => onDuty("Liên Hôn")}><IconScroll size={13} /> Liên hôn</GlassButton>
          <GlassButton size="sm" variant="ghost" onClick={() => onDuty("Tại Gia")}><IconUsers size={13} /> Gọi về</GlassButton>
        </div>
        <p className="mt-2 text-[10.5px] text-[var(--text-faint)]">Hiện tại: {npc["Nhiệm Vụ Gia Tộc"] ?? "Tại Gia"}{npc["Mục Tiêu Nhiệm Vụ"] ? ` — ${npc["Mục Tiêu Nhiệm Vụ"]}` : ""}</p>
      </div>
    </div>
  );
}
