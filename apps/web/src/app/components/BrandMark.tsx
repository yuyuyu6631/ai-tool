"use client";

interface BrandMarkProps {
  label: string;
  size?: "sm" | "md" | "lg";
}

function getInitials(label: string) {
  const cleaned = label.trim();

  if (!cleaned) {
    return "AI";
  }

  if (/[\u4e00-\u9fa5]/.test(cleaned)) {
    return cleaned.slice(0, 2);
  }

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export default function BrandMark({ label, size = "md" }: BrandMarkProps) {
  const sizeClass =
    size === "sm"
      ? "w-8 h-8 rounded-lg text-[11px]"
      : size === "lg"
        ? "w-20 h-20 rounded-2xl text-lg"
        : "w-11 h-11 rounded-xl text-xs";

  return (
    <div
      aria-label={`${label} 标识`}
      className={`brand-mark ${sizeClass} flex items-center justify-center font-semibold tracking-[0.14em]`}
    >
      {getInitials(label)}
    </div>
  );
}
