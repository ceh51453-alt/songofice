/**
 * Sparkline — SVG inline nhỏ gọn vẽ xu hướng giá trị qua các turn.
 * Nhận mảng số, vẽ đường polyline + gradient fill.
 * Dùng chung (ngân khố, lương thực, dân số...).
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Màu stroke. Mặc định accent. */
  color?: string;
  /** Hiện gradient fill bên dưới. */
  fill?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "var(--accent-text)",
  fill = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + ((max - v) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = points.join(" ");
  const fillPath = `M0,${height} L${points.join(" L")} L${width},${height} Z`;
  const gradientId = `spark-fill-${Math.random().toString(36).slice(2, 8)}`;

  const trend = data[data.length - 1] - data[0];
  const trendColor = trend > 0
    ? "var(--ok, #4ade80)"
    : trend < 0
      ? "var(--danger, #f87171)"
      : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      style={{ display: "block" }}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
