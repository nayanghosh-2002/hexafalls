import type { Source } from "@/lib/types";

export function SourceTag({ source }: { source: Source }) {
  const isReddit = source === "reddit";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isReddit ? "text-[#FF4500]" : "text-[#FF6600]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isReddit ? "bg-[#FF4500]" : "bg-[#FF6600]"}`} />
      {isReddit ? "via Reddit" : "via HN"}
    </span>
  );
}
