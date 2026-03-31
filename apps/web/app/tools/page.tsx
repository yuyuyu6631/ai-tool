import ToolsPage from "@/src/app/pages/ToolsPage";
import { fetchDirectory } from "@/src/app/lib/catalog-api";
import type { ToolsDirectoryResponse } from "@/src/app/lib/catalog-types";

export const dynamic = "force-dynamic";

const EMPTY_DIRECTORY: ToolsDirectoryResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 9,
  hasMore: false,
  categories: [],
  tags: [],
  statuses: [],
  presets: [],
};

interface ToolsRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

export default async function Page({ searchParams }: ToolsRouteProps) {
  const params = await searchParams;
  const state = {
    q: readValue(params.q),
    category: readValue(params.category),
    tag: readValue(params.tag),
    status: readValue(params.status),
    sort: readValue(params.sort),
    view: readValue(params.view),
    page: readValue(params.page),
  };

  const query = new URLSearchParams();
  if (state.q) query.set("q", state.q);
  if (state.category) query.set("category", state.category);
  if (state.tag) query.set("tag", state.tag);
  query.set("status", state.status ?? "published");
  if (state.sort) query.set("sort", state.sort);
  if (state.view) query.set("view", state.view);
  if (state.page) query.set("page", state.page);
  query.set("page_size", "9");

  let loadState: "idle" | "error" | "timeout" = "idle";

  const directory = await fetchDirectory(query.toString()).catch((error) => {
    loadState = String(error).includes("timeout") ? "timeout" : "error";
    return EMPTY_DIRECTORY;
  });

  return <ToolsPage directory={directory} state={state} loadState={loadState} />;
}
