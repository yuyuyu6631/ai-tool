"use client";

import { useEffect, useState } from "react";
import BrandMark from "./BrandMark";

interface ToolLogoProps {
  slug: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  logoPath?: string | null;
}

export default function ToolLogo({
  slug: _slug,
  name,
  size = "md",
  className = "",
  logoPath = null,
}: ToolLogoProps) {
  const [hasError, setHasError] = useState(false);
  const src = normalizeLogoPath(logoPath);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <BrandMark label={name} size={size} />;
  }

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : size === "lg"
        ? "w-20 h-20 rounded-2xl"
        : "w-11 h-11 rounded-xl";

  return (
    <div
      className={`overflow-hidden border border-white/50 bg-white/85 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${sizeClass} ${className}`}
    >
      <img
        src={src}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function normalizeLogoPath(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedSeparators = trimmed.replace(/\\/g, "/");
  const filename = normalizedSeparators.split("/").pop();
  if (!filename) {
    return null;
  }

  return encodePath(`/logos/${filename}`);
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");
}
