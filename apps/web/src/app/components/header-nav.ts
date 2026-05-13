export const headerNavItems = [
  { href: "/", label: "首页" },
  { href: "/scenarios", label: "任务场景" },
  { href: "/tools?mode=search&page=1&page_size=24", label: "工具库" },
  { href: "/experiences", label: "经验社区" },
  { href: "/benefits", label: "免费福利" },
] as const;

function normalizeHref(value: string) {
  try {
    const url = new URL(value, "https://example.com");
    return {
      pathname: url.pathname.replace(/\/+$/, "") || "/",
      search: url.search,
    };
  } catch {
    return {
      pathname: value.replace(/\/+$/, "") || "/",
      search: "",
    };
  }
}

export function isHeaderNavActive(currentRoute: string, href: string) {
  const current = normalizeHref(currentRoute);
  const target = normalizeHref(href);

  if (target.pathname === "/") {
    return current.pathname === "/";
  }

  if (current.pathname !== target.pathname && !current.pathname.startsWith(`${target.pathname}/`)) {
    return false;
  }

  if (!target.search) {
    return true;
  }

  return current.search === target.search;
}
