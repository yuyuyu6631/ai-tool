export const TOOL_SUBMISSION_URL = "/#submit-tool";

const GARBAGE_FACET_VALUES = new Set([
  "",
  "unknown",
  "unknown-category",
  "uncategorized",
  "none",
  "null",
  "undefined",
  "test",
  "demo",
  "sample",
  "temp",
  "placeholder",
  "other",
]);

const GARBAGE_FACET_PATTERNS = [/^c\d+$/i, /^test(?:ing)?$/i, /^demo(?:-.+)?$/i, /^unknown(?:-.+)?$/i];

export function repairDisplayText(value: unknown, fallback = "待补充") {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  const lowered = raw.toLowerCase();
  if (lowered === "undefined" || lowered === "null" || lowered === "nan" || lowered === "none") return fallback;

  const looksMojibake = /[ÃÂ�]|[åæçèé][\u0080-\u00ff]?|[閸闁濮姝缂鐠]/.test(raw);
  if (!looksMojibake) return raw;

  try {
    const bytes = new Uint8Array(Array.from(raw, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (decoded && !/[ÃÂ�]/.test(decoded) && decoded !== raw) return decoded;
  } catch {
  }

  return raw;
}

export function repairDisplayList(values?: Array<string | null | undefined> | null, limit?: number) {
  const cleaned = (values ?? []).map((item) => repairDisplayText(item, "")).filter(Boolean);
  return typeof limit === "number" ? cleaned.slice(0, limit) : cleaned;
}

export function slugifyLabel(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_]+/gu, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function buildToolsHref(
  current: Record<string, string | undefined>,
  updates: Record<string, string | number | null | undefined>,
) {
  const params = new URLSearchParams();
  const next = { ...current };
  const resolveKey = (key: string) => {
    if (key === "priceRange") return "price_range";
    if (key === "aiFocus") return "ai_focus";
    return key;
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      delete next[key];
      continue;
    }
    next[key] = String(value);
  }

  for (const [key, value] of Object.entries(next)) {
    if (!value) continue;
    params.set(resolveKey(key), value);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export interface DecisionBadgeSource {
  price?: string;
  summary?: string;
  tags?: string[];
  platforms?: string;
}

export function buildDecisionBadges(source: DecisionBadgeSource) {
  const text = [source.price || "", source.summary || "", source.tags?.join(" ") || "", source.platforms || ""]
    .join(" ")
    .toLowerCase();

  const badges: string[] = [];
  const push = (label: string) => {
    if (!badges.includes(label)) {
      badges.push(label);
    }
  };

  if (text.includes("免费") || text.includes("free")) push("免费");
  if (text.includes("商用") || text.includes("commercial") || text.includes("企业")) push("可商用");
  if (text.includes("ad-free") || text.includes("无广告")) push("无广告");
  if (text.includes("手机") || text.includes("mobile") || text.includes("ios") || text.includes("android") || text.includes("app")) {
    push("移动端可用");
  }
  if (text.includes("版权安全") || text.includes("无版权风险")) push("版权友好");

  return badges.slice(0, 4);
}

export function derivePriceFacets(items: Array<{ price?: string; name: string; summary: string; tags: string[] }>) {
  const counter = new Map<string, number>();

  const detect = (text: string) => {
    const normalized = text.toLowerCase();
    if (normalized.includes("freemium") || normalized.includes("免费增值")) return "freemium";
    if (normalized.includes("free") || normalized.includes("免费")) return "free";
    if (
      normalized.includes("subscription") ||
      normalized.includes("monthly") ||
      normalized.includes("yearly") ||
      normalized.includes("订阅") ||
      normalized.includes("月付") ||
      normalized.includes("年付")
    ) {
      return "subscription";
    }
    if (
      normalized.includes("one-time") ||
      normalized.includes("lifetime") ||
      normalized.includes("一次性") ||
      normalized.includes("终身") ||
      normalized.includes("付费")
    ) {
      return "one-time";
    }
    return null;
  };

  for (const item of items) {
    const priceType = detect([item.price || "", item.name, item.summary, item.tags.join(" ")].join(" "));
    if (!priceType) continue;
    counter.set(priceType, (counter.get(priceType) || 0) + 1);
  }

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([slug, count]) => ({
      slug,
      count,
      label:
        slug === "free"
          ? "免费"
          : slug === "freemium"
            ? "免费增值"
            : slug === "subscription"
              ? "订阅"
              : "一次性付费",
    }));
}

export function hasValidOfficialUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isDisplayableFacetValue(value?: string | null) {
  if (!value) return false;

  const normalized = value.normalize("NFKC").trim().toLowerCase();
  if (!normalized) return false;
  if (GARBAGE_FACET_VALUES.has(normalized)) return false;
  return !GARBAGE_FACET_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function filterDisplayableFacets<T extends { slug: string; label: string }>(items: T[]) {
  return items.filter((item) => isDisplayableFacetValue(item.slug) && isDisplayableFacetValue(item.label));
}
