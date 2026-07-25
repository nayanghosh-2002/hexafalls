export function OpportunityScore({ score }: { score: number }) {
  const color =
    score >= 85
      ? "bg-emerald-50 text-emerald-700"
      : score >= 75
        ? "bg-primary-light text-primary"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${color}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6z" />
      </svg>
      {score}/100
    </span>
  );
}
