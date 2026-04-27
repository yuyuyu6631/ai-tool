import type {
  AdminRankingListItem,
  AdminRankingPayload,
  AdminOverviewResponse,
  AdminReviewListItem,
  AdminToolListItem,
  RankingSection,
  ScenarioSummary,
  AiSearchResponse,
  CategorySummary,
  HomeCatalogResponse,
  ToolSummary,
  ToolDetail,
  ToolReviewItem,
  ToolReviewsResponse,
  ToolsDirectoryResponse,
} from "./catalog-types";
import {
  getFallbackAdminOverview,
  getFallbackAdminTools,
  getFallbackCategories,
  getFallbackDirectory,
  getFallbackHomeCatalog,
  getFallbackRankings,
  getFallbackScenario,
  getFallbackScenarios,
  getFallbackSearchIndex,
  getFallbackToolDetail,
} from "./fallback-catalog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const CATALOG_CACHE_TAG = "catalog";
export const CATALOG_REVALIDATE_SECONDS = 60;
const CATALOG_FETCH_TIMEOUT_MS = 8000;
const MOCK_ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);

type CatalogFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

class ApiError extends Error {
  status: number;

  constructor(path: string, status: number) {
    super(`Request failed for ${path} with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

function withCatalogCache(options?: CatalogFetchOptions): CatalogFetchOptions {
  return {
    ...options,
    next: {
      revalidate: options?.next?.revalidate ?? CATALOG_REVALIDATE_SECONDS,
      tags: options?.next?.tags ?? [CATALOG_CACHE_TAG],
    },
  };
}

async function fetchJson<T>(path: string, options?: CatalogFetchOptions): Promise<T> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      withCatalogCache({
        ...options,
        signal: withTimeoutSignal(options?.signal ?? undefined),
      }),
    );

    if (!response.ok) {
      throw new ApiError(path, response.status);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    const fallback = resolveReadFallback<T>(path);
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

export async function fetchDirectory(
  queryString = "",
): Promise<ToolsDirectoryResponse> {
  return fetchJson<ToolsDirectoryResponse>(`/api/tools${queryString ? `?${queryString}` : ""}`);
}

export async function fetchAiSearch(queryString = ""): Promise<AiSearchResponse> {
  return fetchJson<AiSearchResponse>(`/api/ai-search${queryString ? `?${queryString}` : ""}`);
}

function withTimeoutSignal(signal?: AbortSignal, timeoutMs = CATALOG_FETCH_TIMEOUT_MS) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: withTimeoutSignal(init?.signal ?? undefined, 6000),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      throw new ApiError(path, response.status);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if ((init?.method ?? "GET").toUpperCase() === "GET") {
      const fallback = resolveReadFallback<T>(path);
      if (fallback !== null) {
        return fallback;
      }
    }
    throw error;
  }
}

export async function fetchCategories(): Promise<CategorySummary[]> {
  return fetchJson<CategorySummary[]>("/api/categories");
}

export async function fetchSearchIndex(): Promise<ToolSummary[]> {
  // 不传递 options 禁用缓存，或者给一个更长时间的缓存，依赖数据实时性，这里我们复用 catalog cache
  return fetchJson<ToolSummary[]>("/api/tools/search-index");
}

export async function fetchHomeCatalog(queryString = ""): Promise<HomeCatalogResponse> {
  return fetchJson<HomeCatalogResponse>(`/api/home${queryString ? `?${queryString}` : ""}`);
}

export async function fetchToolDetail(slug: string): Promise<ToolDetail | null> {
  try {
    return await fetchJson<ToolDetail>(`/api/tools/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchScenarioDetail(slug: string): Promise<ScenarioSummary | null> {
  try {
    return await fetchJson<ScenarioSummary>(`/api/scenarios/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchRankings(): Promise<RankingSection[]> {
  return fetchJson<RankingSection[]>("/api/rankings");
}

export async function fetchToolReviews(slug: string): Promise<ToolReviewsResponse> {
  return requestJson<ToolReviewsResponse>(`/api/tools/${slug}/reviews`, { method: "GET", cache: "no-store" });
}

export async function fetchMyToolReview(slug: string): Promise<ToolReviewItem | null> {
  try {
    return await requestJson<ToolReviewItem | null>(`/api/tools/${slug}/reviews/me`, { method: "GET", cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function saveMyToolReview(
  slug: string,
  payload: { rating: number; title: string; body: string },
): Promise<ToolReviewItem> {
  return requestJson<ToolReviewItem>(`/api/tools/${slug}/reviews/me`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminTools(): Promise<AdminToolListItem[]> {
  return requestJson<AdminToolListItem[]>("/api/admin/tools", { method: "GET", cache: "no-store" });
}

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  return requestJson<AdminOverviewResponse>("/api/admin/overview", { method: "GET", cache: "no-store" });
}

export async function fetchAdminTool(toolId: number): Promise<ToolDetail> {
  return requestJson<ToolDetail>(`/api/admin/tools/${toolId}`, { method: "GET", cache: "no-store" });
}

export async function saveAdminTool(payload: object, toolId?: number): Promise<ToolDetail> {
  return requestJson<ToolDetail>(toolId ? `/api/admin/tools/${toolId}` : "/api/admin/tools", {
    method: toolId ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminReviews(toolSlug?: string): Promise<AdminReviewListItem[]> {
  const query = toolSlug ? `?tool_slug=${encodeURIComponent(toolSlug)}` : "";
  return requestJson<AdminReviewListItem[]>(`/api/admin/reviews${query}`, { method: "GET", cache: "no-store" });
}

export async function deleteAdminReview(reviewId: number): Promise<void> {
  await requestJson<void>(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
}

export async function fetchAdminRankings(): Promise<AdminRankingListItem[]> {
  return requestJson<AdminRankingListItem[]>("/api/admin/rankings", { method: "GET" });
}

export async function fetchAdminRanking(rankingId: number): Promise<AdminRankingPayload> {
  return requestJson<AdminRankingPayload>(`/api/admin/rankings/${rankingId}`, { method: "GET" });
}

export async function saveAdminRanking(payload: object, rankingId?: number): Promise<AdminRankingPayload> {
  return requestJson<AdminRankingPayload>(rankingId ? `/api/admin/rankings/${rankingId}` : "/api/admin/rankings", {
    method: rankingId ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  return fetchJson<ScenarioSummary[]>("/api/scenarios");
}

export { ApiError };

export function isMockFallbackEnabled(): boolean {
  const value = (process.env.NEXT_PUBLIC_USE_MOCK ?? process.env.USE_MOCK_DATA ?? "").toLowerCase();
  return MOCK_ENABLED_VALUES.has(value);
}

function resolveReadFallback<T>(path: string): T | null {
  if (!isMockFallbackEnabled()) {
    return null;
  }

  const [pathname, queryString = ""] = path.split("?");

  if (pathname === "/api/categories") {
    return getFallbackCategories() as T;
  }

  if (pathname === "/api/tools/search-index") {
    return getFallbackSearchIndex() as T;
  }

  if (pathname === "/api/home") {
    return getFallbackHomeCatalog() as T;
  }

  if (pathname === "/api/scenarios") {
    return getFallbackScenarios() as T;
  }

  if (pathname.startsWith("/api/scenarios/")) {
    const slug = pathname.replace("/api/scenarios/", "");
    return getFallbackScenario(slug) as T;
  }

  if (pathname === "/api/rankings") {
    return getFallbackRankings() as T;
  }

  if (pathname === "/api/admin/tools") {
    return getFallbackAdminTools() as T;
  }

  if (pathname === "/api/admin/overview") {
    return getFallbackAdminOverview() as T;
  }

  if (pathname === "/api/tools") {
    return getFallbackDirectory(queryString) as T;
  }

  if (pathname.startsWith("/api/tools/") && !pathname.includes("/reviews")) {
    const slug = pathname.replace("/api/tools/", "");
    return getFallbackToolDetail(slug) as T;
  }

  return null;
}
