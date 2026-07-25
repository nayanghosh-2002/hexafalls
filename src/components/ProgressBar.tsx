export function ProgressBar({
  pct,
  height = 2,
}: {
  pct: number;
  height?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-full bg-[#EEEEED]"
      style={{ height }}
    >
      <div
        className="rounded-full bg-primary"
        style={{ width: `${pct}%`, height }}
      />
    </div>
  );
}

export function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
