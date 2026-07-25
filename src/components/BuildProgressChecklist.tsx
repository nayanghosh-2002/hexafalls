"use client";

import type { BuildStage } from "@/lib/types";

const STAGES: { id: BuildStage; label: string; num: number }[] = [
  { id: "idea", label: "Idea", num: 1 },
  { id: "mvp", label: "MVP", num: 2 },
  { id: "shipped", label: "Shipped", num: 3 },
];

export function BuildProgressChecklist({
  stage,
  onStageChange,
}: {
  stage: BuildStage;
  onStageChange: (stage: BuildStage) => void;
}) {
  const currentIdx = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-6 py-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
          Your progress
        </h2>
        <span className="text-[11px] font-medium text-[#BBBBBA]">Tap a stage to update</span>
      </div>
      <div className="flex items-start">
        {STAGES.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const upcoming = i > currentIdx;

          return (
            <div key={s.id} className="flex flex-1 items-start">
              <button
                type="button"
                onClick={() => onStageChange(s.id)}
                title={`Mark as ${s.label}`}
                className="flex flex-1 flex-col items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-[#FAFAF8] group cursor-pointer"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold transition-all ${
                    active || done
                      ? "bg-primary text-white shadow-sm"
                      : "border-2 border-[#E8E8E8] bg-white text-[#BBBBBA] group-hover:border-primary group-hover:text-primary group-hover:shadow-md"
                  } ${upcoming ? "border-2" : ""} ${active ? "ring-4 ring-primary/20" : ""}`}
                >
                  {done ? "✓" : s.num}
                </div>
                <span
                  className={`text-[12px] font-semibold transition-colors ${
                    active
                      ? "text-primary"
                      : done
                        ? "text-foreground"
                        : "text-[#BBBBBA] group-hover:text-primary"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <div className="mx-0.5 mt-5 h-0.5 flex-1 self-start">
                  <div
                    className={`h-full transition-colors ${i < currentIdx ? "bg-primary" : "bg-[#EBEBEB]"}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
