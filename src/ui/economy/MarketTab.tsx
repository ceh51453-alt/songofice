/**
 * MarketTab — SÀN GIAO DỊCH (M18).
 *
 * Không còn nút "Mua x100" với giá cố định. Người chơi CHỌN mặt hàng, GÕ số
 * lượng, và thấy ngay báo giá thật: giá niêm yết, giá trung bình sau trượt giá,
 * tổng tiền, và giá thị trường sẽ thành bao nhiêu sau khi lệnh khớp. Mua vét
 * lúa của một thị trấn nhỏ thì cả thị trấn biết — giá đội lên thật.
 *
 * Hàng mua về chảy vào kho gia tộc, hoặc thẳng vào kho một lãnh địa nếu ngươi
 * chọn — đó là cầu nối giữa buôn bán vĩ mô và sản xuất vi mô.
 */
import { useMemo, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { formatCurrencyShort } from "../../economy/currency";
import { marketOf, marketRows, quoteOrder, type MarketRow, type OrderSide } from "../../economy/market";
import { GOOD_CATEGORIES, type GoodCategory } from "../../content/westeros/goods";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { IconMap } from "../icons";
import { IconCoin } from "./EconomyIcons";

function resolveRegion(location: string): string {
  if (!location) return "the-crownlands";
  if (REGIONS_BY_ID[location]) return location;
  const byName = Object.values(REGIONS_BY_ID).find(
    (r) => r.name === location || r.seat === location,
  );
  return byName?.id ?? "the-crownlands";
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

export function MarketTab() {
  const stat = useMvuStore((s) => s.stat);
  const tradeOrder = useTerritoryStore((s) => s.tradeOrder);

  const [category, setCategory] = useState<GoodCategory | "Tất Cả">("Tất Cả");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [side, setSide] = useState<OrderSide>("buy");
  const [qtyText, setQtyText] = useState("100");
  const [notice, setNotice] = useState<string | null>(null);
  const [destination, setDestination] = useState<string>("");

  const location = stat["Thế Giới"]["Vị Trí"] || "Vương Đô";
  const regionId = resolveRegion(location);
  const regionName = REGIONS_BY_ID[regionId]?.name ?? location;

  // marketOf khởi tạo chợ nếu chưa có — đọc thôi, không ghi vào store
  const market = useMemo(() => marketOf(stat, regionId), [stat, regionId]);
  const rows = useMemo(() => marketRows(market), [market]);

  const playerName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const playerHouse = stat["Thông Tin Nhân Vật"]["Nhà"];
  const holdings = Object.entries(stat["Lãnh Địa"]).filter(
    ([, h]) => h["Người Kiểm Soát"] === playerName || (!!playerHouse && h["Nhà Kiểm Soát"] === playerHouse),
  );

  const family = stat["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"] as Record<string, number>;
  const heldOf = (goodId: string): number =>
    destination
      ? (stat["Lãnh Địa"][destination]?.["Tài Nguyên"][goodId] ?? 0)
      : (family[goodId] ?? 0);

  const visible = category === "Tất Cả" ? rows : rows.filter((r) => r.good.category === category);
  const selected = rows.find((r) => r.good.id === selectedId) ?? null;

  const qty = Math.max(0, Math.floor(Number(qtyText) || 0));
  const quote = selected ? quoteOrder(market, selected.good.id, qty, side) : null;
  const treasury = stat["Thông Tin Nhân Vật"]["Ngân Khố"];

  const affordable = selected
    ? Math.floor(treasury / Math.max(1, selected.buyPrice))
    : 0;

  const submit = () => {
    if (!selected || !quote?.ok) return;
    const r = tradeOrder(regionId, selected.good.id, qty, side, destination ? { holdingId: destination } : undefined);
    if (r.ok) {
      setNotice(
        side === "buy"
          ? `Đã mua ${fmt(quote.quantity)} ${selected.good.unit} ${selected.good.id} với giá ${formatCurrencyShort(quote.total)}.`
          : `Đã bán ${fmt(quote.quantity)} ${selected.good.unit} ${selected.good.id}, thu về ${formatCurrencyShort(quote.total)}.`,
      );
    } else {
      setNotice(r.error ?? "Lệnh không khớp được");
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Đầu sàn ── */}
      <section className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-[var(--accent-text)]">
            <IconMap size={14} /> SÀN GIAO DỊCH: {regionName.toUpperCase()}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span>Thanh khoản {Math.round(market["Thanh Khoản"] * 100)}%</span>
            <span>Chênh lệch {(market["Chênh Lệch"] * 100).toFixed(1)}%</span>
            {market["Đang Có Thương Nhân"] && (
              <span className="rounded bg-[rgba(234,179,8,0.14)] px-1.5 py-0.5 text-[var(--warn)]">
                Thương đoàn Essos
              </span>
            )}
          </div>
        </div>
        <p className="mb-3 text-[11.5px] italic text-[var(--text-muted)]">{market["Tin Đồn"]}</p>

        {/* lọc nhóm hàng */}
        <div className="mb-3 flex flex-wrap gap-1">
          {(["Tất Cả", ...GOOD_CATEGORIES] as (GoodCategory | "Tất Cả")[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded px-2 py-1 text-[11px] transition-colors ${
                category === c
                  ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.09)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* bảng giá */}
        <div className="max-h-[280px] overflow-y-auto rounded-lg border border-[var(--glass-border)]">
          <table className="w-full text-[11.5px]">
            <thead className="sticky top-0 bg-[rgba(12,15,20,0.95)]">
              <tr className="text-left text-[var(--text-faint)]">
                <th className="px-2 py-1.5 font-normal">Mặt hàng</th>
                <th className="px-2 py-1.5 text-right font-normal">Giá</th>
                <th className="px-2 py-1.5 text-right font-normal">Δ</th>
                <th className="px-2 py-1.5 text-right font-normal">Tồn kho</th>
                <th className="px-2 py-1.5 text-right font-normal">Cung/Cầu</th>
                <th className="px-2 py-1.5 text-right font-normal">Kho ta</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <MarketLine
                  key={r.good.id}
                  row={r}
                  held={heldOf(r.good.id)}
                  active={selectedId === r.good.id}
                  onSelect={() => {
                    setSelectedId(r.good.id);
                    setNotice(null);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Đặt lệnh ── */}
      <section className="glass-panel rounded-xl p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-[var(--accent-text)]">
          <IconCoin size={14} /> ĐẶT LỆNH
        </h3>

        {!selected ? (
          <p className="text-[12px] italic text-[var(--text-faint)]">
            Chọn một mặt hàng ở bảng trên để ra giá.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-[var(--text-soft)]">{selected.good.id}</p>
                <p className="text-[11px] italic text-[var(--text-faint)]">{selected.good.desc}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {(["buy", "sell"] as OrderSide[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSide(s); setNotice(null); }}
                    className={`rounded px-2.5 py-1 text-[11.5px] transition-colors ${
                      side === s
                        ? s === "buy"
                          ? "bg-[rgba(120,200,140,0.16)] text-[var(--ok)]"
                          : "bg-[rgba(220,110,110,0.16)] text-[var(--danger)]"
                        : "bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]"
                    }`}
                  >
                    {s === "buy" ? "Mua" : "Bán"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[120px] flex-1">
                <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">
                  Số lượng ({selected.good.unit})
                </span>
                <input
                  value={qtyText}
                  onChange={(e) => { setQtyText(e.target.value.replace(/[^\d]/g, "")); setNotice(null); }}
                  inputMode="numeric"
                  className="mt-1 w-full rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-right font-mono text-[13px] text-[var(--text-soft)] outline-none focus:border-[var(--accent-text)]"
                />
              </label>
              <button
                onClick={() => setQtyText(String(
                  side === "buy"
                    ? Math.min(affordable, selected.stock, quote?.maxQuantity ?? selected.stock)
                    : heldOf(selected.good.id),
                ))}
                className="rounded bg-[rgba(255,255,255,0.06)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-soft)] hover:bg-[rgba(255,255,255,0.12)]"
              >
                Tối đa
              </button>
              {holdings.length > 0 && (
                <label className="min-w-[150px] flex-1">
                  <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">
                    {side === "buy" ? "Chở về" : "Lấy từ"}
                  </span>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="mt-1 w-full rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-[12px] text-[var(--text-soft)]"
                  >
                    <option value="">Kho gia tộc</option>
                    {holdings.map(([id, h]) => (
                      <option key={id} value={id}>{h["Mô Tả"] || id}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {/* báo giá — đây là con số sẽ bị trừ thật */}
            <div className="rounded-lg bg-[rgba(0,0,0,0.25)] p-3 text-[12px]">
              {quote?.ok ? (
                <>
                  <QuoteRow label="Giá niêm yết" value={formatCurrencyShort(quote.listPrice)} />
                  <QuoteRow
                    label="Giá trung bình thực"
                    value={formatCurrencyShort(quote.unitPrice)}
                    tone={quote.slippage > 8 ? "warn" : undefined}
                  />
                  <QuoteRow
                    label="Trượt giá"
                    value={`${quote.slippage.toFixed(1)}%`}
                    tone={quote.slippage > 15 ? "bad" : quote.slippage > 5 ? "warn" : "good"}
                  />
                  <QuoteRow
                    label="Giá sau lệnh"
                    value={`${formatCurrencyShort(quote.priceAfter)} (${quote.priceAfter >= quote.listPrice ? "+" : ""}${(((quote.priceAfter - quote.listPrice) / Math.max(1, quote.listPrice)) * 100).toFixed(1)}%)`}
                  />
                  {quote.quantity < qty && (
                    <p className="mt-1 text-[11px] text-[var(--warn)]">
                      Chợ chỉ còn {fmt(quote.quantity)} — lệnh sẽ khớp phần này thôi.
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-[var(--glass-border)] pt-2">
                    <span className="text-[var(--text-faint)]">
                      {side === "buy" ? "Tổng phải trả" : "Tổng thu về"}
                    </span>
                    <span className={`font-mono text-[13px] ${side === "buy" ? "text-[var(--danger)]" : "text-[var(--ok)]"}`}>
                      {formatCurrencyShort(quote.total)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[11.5px] italic text-[var(--text-faint)]">
                  {quote?.error ?? "Nhập số lượng để xem báo giá."}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!quote?.ok}
                onClick={submit}
                className="rounded bg-[var(--accent-soft)] px-4 py-1.5 text-[12.5px] text-[var(--accent-text)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
              >
                {side === "buy" ? "Xác nhận mua" : "Xác nhận bán"}
              </button>
              <span className="text-[11px] text-[var(--text-faint)]">
                Ngân khố: {formatCurrencyShort(treasury)}
              </span>
            </div>

            {notice && (
              <p className="text-[11.5px] text-[var(--text-soft)]">{notice}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MarketLine({
  row, held, active, onSelect,
}: {
  row: MarketRow;
  held: number;
  active: boolean;
  onSelect: () => void;
}) {
  const up = row.change > 0.05;
  const down = row.change < -0.05;
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-t border-[var(--glass-border)]/50 transition-colors ${
        active ? "bg-[var(--accent-soft)]" : "hover:bg-[rgba(255,255,255,0.04)]"
      }`}
    >
      <td className="px-2 py-1.5 text-[var(--text-soft)]">
        {row.good.id}
        {row.cover < 0.8 && <span className="ml-1 text-[10px] text-[var(--danger)]">khan</span>}
        {row.good.foreign && <span className="ml-1 text-[10px] text-[var(--warn)]">ngoại</span>}
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[var(--text-soft)]">
        {formatCurrencyShort(row.price)}
      </td>
      <td className={`px-2 py-1.5 text-right font-mono ${up ? "text-[var(--ok)]" : down ? "text-[var(--danger)]" : "text-[var(--text-faint)]"}`}>
        {up ? "▲" : down ? "▼" : "–"}{Math.abs(row.change).toFixed(1)}%
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[var(--text-muted)]">{fmt(row.stock)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[var(--text-faint)]">
        {fmt(row.supply)}/{fmt(row.demand)}
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[var(--text-muted)]">{fmt(held)}</td>
    </tr>
  );
}

function QuoteRow({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "bad" ? "var(--danger)" : tone === "warn" ? "var(--warning)" : tone === "good" ? "var(--ok)" : "var(--text-soft)";
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[var(--text-faint)]">{label}</span>
      <span className="font-mono" style={{ color }}>{value}</span>
    </div>
  );
}
