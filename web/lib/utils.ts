import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreRange(value: number): "high" | "mid" | "low" {
  if (value >= 80) return "high";
  if (value >= 60) return "mid";
  return "low";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function formatDaysAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
  return `${days}d`;
}
