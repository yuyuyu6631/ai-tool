"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Gift, MessageSquareText } from "lucide-react";
import { HOME_ENTRY_CARDS } from "./home-data";

export default function TaskEntryCards() {
  return (
    <div className="mx-auto mt-7 grid w-full max-w-5xl gap-3 motion-safe:animate-[agentReveal_520ms_ease-out_360ms_both] md:grid-cols-3">
      {HOME_ENTRY_CARDS.map((entry, index) => {
        const Icon = index === 0 ? BadgeCheck : index === 1 ? MessageSquareText : Gift;
        const tone = index === 0 ? "home-entry-card--tests" : index === 1 ? "home-entry-card--library" : "home-entry-card--deals";
        return (
          <Link
            key={entry.href}
            href={entry.href}
            prefetch
            className={`home-entry-card group relative overflow-hidden rounded-[8px] border p-5 text-left backdrop-blur-xl transition duration-150 hover:-translate-y-0.5 ${tone}`}
          >
            <div className="relative flex min-h-[138px] flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="home-entry-icon grid h-9 w-9 place-items-center rounded-full">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <h2 className="home-entry-title mt-3 text-xl font-semibold tracking-normal">{entry.title}</h2>
              <p className="home-entry-body mt-3 text-sm leading-7 dark:hidden">{entry.lightBody}</p>
              <p className="home-entry-body mt-3 hidden text-sm leading-7 dark:block">{entry.darkBody}</p>
              <span className="home-entry-link mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold transition">
                进入
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
