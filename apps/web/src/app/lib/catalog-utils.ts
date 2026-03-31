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

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      delete next[key];
      return;
    }
    next[key] = String(value);
  });

  Object.entries(next).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `/tools?${query}` : "/tools";
}
