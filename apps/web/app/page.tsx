import HomePage from "@/src/app/pages/HomePage";
import { fetchAiSearch, fetchDirectory, fetchScenarios } from "@/src/app/lib/catalog-api";
import type { AiSearchResponse, ScenarioSummary, ToolsDirectoryResponse } from "@/src/app/lib/catalog-types";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 24;
const SECTION_PAGE_SIZE = 12;

const EMPTY_DIRECTORY: ToolsDirectoryResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  hasMore: false,
  categories: [],
  tags: [],
  statuses: [],
  priceFacets: [],
  accessFacets: [],
  priceRangeFacets: [],
  presets: [],
};

const EMPTY_SCENARIOS: ScenarioSummary[] = [];

interface HomeRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface HomePageState {
  mode?: string;
  q?: string;
  category?: string;
  tag?: string;
  price?: string;
  access?: string;
  priceRange?: string;
  sort?: string;
  view?: string;
  tab?: string;
  page?: string;
  source?: string;
}

function readValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function buildDirectoryQuery(state: HomePageState, pageSize = DEFAULT_PAGE_SIZE) {
  const params = new URLSearchParams();
  const allowedKeys: Array<keyof HomePageState> = ["q", "category", "tag", "price", "access", "sort", "view", "page", "source"];

  for (const key of allowedKeys) {
    const value = state[key];
    if (!value) continue;
    params.set(key, value);
  }

  if (state.priceRange) {
    params.set("price_range", state.priceRange);
  }

  if (!params.has("page")) {
    params.set("page", "1");
  }

  params.set("page_size", String(pageSize));
  return params.toString();
}

function hasHomepageFilters(state: HomePageState) {
  return Boolean(state.q || state.category || state.tag || state.price || state.access || state.priceRange || state.sort || state.view);
}

function buildDirectoryFromTools(items: ToolsDirectoryResponse["items"]): ToolsDirectoryResponse {
  return {
    ...EMPTY_DIRECTORY,
    items,
    total: items.length,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    hasMore: false,
  };
}

export default async function Page({ searchParams }: HomeRouteProps) {
  const params = await searchParams;
  const state: HomePageState = {
    mode: readValue(params.mode),
    q: readValue(params.q),
    category: readValue(params.category),
    tag: readValue(params.tag),
    price: readValue(params.price),
    access: readValue(params.access),
    priceRange: readValue(params.price_range),
    sort: readValue(params.sort),
    view: readValue(params.view),
    tab: readValue(params.tab),
    page: readValue(params.page),
    source: readValue(params.source),
  };

  const shouldUseAiSearch = state.mode === "ai" && Boolean(state.q?.trim());
  const aiSearchPromise: Promise<AiSearchResponse | null> = shouldUseAiSearch
    ? fetchAiSearch(buildDirectoryQuery(state, DEFAULT_PAGE_SIZE))
    : Promise.resolve(null);

  const [directoryResult, aiSearchResult, hotDirectoryResult, latestDirectoryResult, scenariosResult] = await Promise.allSettled([
    fetchDirectory(buildDirectoryQuery(state, DEFAULT_PAGE_SIZE)),
    aiSearchPromise,
    fetchDirectory(`view=hot&page=1&page_size=${SECTION_PAGE_SIZE}`),
    fetchDirectory(`view=latest&page=1&page_size=${SECTION_PAGE_SIZE}`),
    fetchScenarios(),
  ]);

  const aiSearch = aiSearchResult.status === "fulfilled" ? aiSearchResult.value : null;
  const hotTools = hotDirectoryResult.status === "fulfilled" ? hotDirectoryResult.value.items : [];
  const latestTools = latestDirectoryResult.status === "fulfilled" ? latestDirectoryResult.value.items : [];
  const scenarios = scenariosResult.status === "fulfilled" ? scenariosResult.value : EMPTY_SCENARIOS;

  let directory = aiSearch?.directory ?? (directoryResult.status === "fulfilled" ? directoryResult.value : EMPTY_DIRECTORY);
  if (directory.items.length === 0 && !hasHomepageFilters(state)) {
    const defaultTools = hotTools.length > 0 ? hotTools : latestTools;
    if (defaultTools.length > 0) {
      directory = buildDirectoryFromTools(defaultTools);
    }
  }

  return (
    <HomePage
      directory={directory}
      hotTools={hotTools}
      latestTools={latestTools}
      scenarios={scenarios}
      state={state}
      aiPanel={aiSearch?.ai_panel ?? null}
      aiMeta={aiSearch?.meta ?? null}
    />
  );
}
