import { withoutPublicPath } from "./public-path";

const HIDDEN_EXACT_PATHS = new Set<string>(["/", "/tools", "/experiences", "/matches", "/auth", "/admin"]);

const HIDDEN_PREFIX_PATHS = ["/tools/", "/experiences/", "/matches/", "/auth/", "/admin/"];

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

  const normalizedPathname = withoutPublicPath(pathname);
  const deploymentAliasPathname = normalizedPathname.replace(/^\/xingdp(?=\/|$)/, "") || "/";

  if (isHiddenPath(normalizedPathname) || isHiddenPath(deploymentAliasPathname)) {
    return true;
  }

  return modeQueryValue === "ai";
}
