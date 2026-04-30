import type { ReactNode } from "react";

export function SectionMark({
  num,
  title,
  right,
}: {
  num: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="section-mark">
      <div className="head">
        <span className="num">№ {num}</span>
        <span className="ttl">{title}</span>
      </div>
      {right}
    </div>
  );
}
