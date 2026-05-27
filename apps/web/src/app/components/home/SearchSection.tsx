"use client";

import type { RefObject } from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchSectionProps {
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
}

export default function SearchSection({ query, inputRef, onQueryChange, onSubmit, placeholder }: SearchSectionProps) {
  return (
    <form
      data-testid="compact-hero-search"
      className="home-search-form mx-auto mt-7 w-full min-w-0 max-w-full rounded-[24px] p-2 backdrop-blur-xl transition duration-200 motion-safe:animate-[agentReveal_500ms_ease-out_180ms_both] sm:max-w-[820px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(query);
      }}
    >
      <div className="flex min-w-0 flex-col gap-2 md:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="home-search-icon pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input
            ref={inputRef}
            id="tools-search"
            type="search"
            name="q"
            aria-label="搜索 AI 工具、任务或使用场景"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            data-global-search-target="home"
            className="home-search-input min-h-14 w-full rounded-[18px] border border-transparent py-3 pl-12 pr-3 text-base outline-none transition duration-200"
          />
        </div>
        <button
          type="submit"
          className="home-cta inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-[18px] px-6 py-3 text-base font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <Sparkles className="h-4 w-4" />
          找工具
        </button>
      </div>
    </form>
  );
}
