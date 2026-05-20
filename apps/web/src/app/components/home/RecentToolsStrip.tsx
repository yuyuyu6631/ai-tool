"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { readRecentTools, type RecentToolItem } from "../../lib/recent-tools";

export default function RecentToolsStrip() {
  const [items, setItems] = useState<RecentToolItem[]>([]);

  useEffect(() => {
    setItems(readRecentTools().slice(0, 3));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="home-recent-tools mx-auto mt-5 w-full max-w-5xl rounded-lg border p-4 text-left backdrop-blur-xl motion-safe:animate-[agentReveal_520ms_ease-out_420ms_both]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="h-4 w-4" />
          最近浏览
        </div>
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/tools/${item.slug}`}
              className="home-recent-tool block min-w-0 rounded px-3 py-2 transition hover:-translate-y-0.5"
            >
              <div className="truncate text-sm font-semibold">{item.name}</div>
              <div className="mt-1 line-clamp-1 text-xs">{item.category || item.summary}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
