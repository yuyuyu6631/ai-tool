"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "xingdianping-theme";
type ThemeMode = "dark" | "light";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const isLight = mode === "light";

  useEffect(() => {
    const initial = resolveInitialTheme();
    setMode(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";
    setMode(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`header-utility-button inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium ${compact ? "h-11 w-11 px-0" : "px-4 py-2"}`}
      aria-label={isLight ? "切换深色模式" : "切换浅色模式"}
      title={isLight ? "切换深色模式" : "切换浅色模式"}
    >
      {isLight ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
      {compact ? null : <span>{isLight ? "深色" : "浅色"}</span>}
    </button>
  );
}
