import type {
  RankingSection,
  ScenarioSummary,
  ToolDetail,
  ToolsDirectoryResponse,
} from "./catalog-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;

  constructor(path: string, status: number) {
    super(`Request failed for ${path} with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(path, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchDirectory(
  queryString = "",
): Promise<ToolsDirectoryResponse> {
  return fetchJson<ToolsDirectoryResponse>(`/api/tools${queryString ? `?${queryString}` : ""}`);
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

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  return fetchJson<ScenarioSummary[]>("/api/scenarios");
}

export { ApiError };
