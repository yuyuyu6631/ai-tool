import HomePage from "@/src/app/pages/HomePage";
import { fetchDirectory } from "@/src/app/lib/catalog-api";
import type { ToolsDirectoryResponse } from "@/src/app/lib/catalog-types";

export const dynamic = "force-dynamic";

const EMPTY_DIRECTORY: ToolsDirectoryResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
  hasMore: false,
  categories: [],
  tags: [],
  statuses: [],
  presets: [],
};

export default async function Page() {
  const directory = await fetchDirectory("view=hot&status=published&page=1&page_size=8").catch(() => EMPTY_DIRECTORY);

  return (
    <HomePage
      featuredTools={directory.items.slice(0, 4)}
      categories={directory.categories}
      presets={directory.presets}
    />
  );
}
