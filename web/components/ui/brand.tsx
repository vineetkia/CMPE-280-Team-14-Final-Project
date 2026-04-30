type Size = "sm" | "md" | "lg";

const FS: Record<Size, number> = { sm: 16, md: 22, lg: 28 };

export function Brand({ size = "md" }: { size?: Size }) {
  return (
    <span className="brand" style={{ fontSize: FS[size] }}>
      Hyrd
    </span>
  );
}
