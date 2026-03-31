import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import RouteFeedback from "@/src/app/components/RouteFeedback";
import "./globals.css";

export const metadata: Metadata = {
  title: "星点评",
  description: "搜索优先的 AI 工具导航站。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="absolute pointer-events-none opacity-0"
        >
          <defs>
            <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.018"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="16"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <Suspense fallback={null}>
          <RouteFeedback />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
