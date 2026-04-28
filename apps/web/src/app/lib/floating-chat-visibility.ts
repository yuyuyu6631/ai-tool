const HIDDEN_EXACT_PATHS = new Set<string>(["/", "/tools", "/matches", "/auth", "/admin"]);

const HIDDEN_PREFIX_PATHS = ["/tools/", "/matches/", "/auth/", "/admin/"];

function isHiddenPath(pathname: string): boolean {
  if (HIDDEN_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return HIDDEN_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function shouldHideFloatingChatBot(pathname: string, modeQueryValue?: string | null): boolean {
  if (!pathname) {
    return false;
  }

  if (isHiddenPath(pathname)) {
    return true;
  }

  return modeQueryValue === "ai";
}
