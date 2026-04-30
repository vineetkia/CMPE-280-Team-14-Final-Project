import { scoreRange } from "@/lib/utils";

export function ScoreChip({ value, max = 100 }: { value: number; max?: number }) {
  const range = scoreRange(value);
  return (
    <span className="score-chip" data-range={range}>
      <span className="num tnum">{value}</span>
      <span className="max">/ {max}</span>
    </span>
  );
}
