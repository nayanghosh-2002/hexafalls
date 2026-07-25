import type { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, [string, string]> = {
  Easy: ["bg-primary-light", "text-primary"],
  Medium: ["bg-[#FFF8ED]", "text-[#7A5010]"],
  Hard: ["bg-[#F2F2F0]", "text-[#444440]"],
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const [bg, text] = styles[difficulty] ?? styles.Medium;
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${bg} ${text}`}
    >
      {difficulty}
    </span>
  );
}
