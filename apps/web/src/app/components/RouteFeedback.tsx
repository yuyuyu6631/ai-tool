"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteFeedback() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      setIsTransitioning(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      const timer = window.setTimeout(() => {
        setIsTransitioning(false);
      }, 260);

      return () => window.clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={`route-feedback ${isTransitioning ? "is-active" : ""}`}
    />
  );
}
