export interface ToolSummary {
  id: number;
  slug: string;
  name: string;
  category: string;
  score: number;
  summary: string;
  tags: string[];
  officialUrl: string;
  logoPath?: string | null;
  logoStatus?: string | null;
  logoSource?: string | null;
  status: "published" | "draft" | "archived";
  featured: boolean;
  createdAt: string;
}

export interface ToolDetail extends ToolSummary {
  description: string;
  editorComment: string;
  developer: string;
  country: string;
  city: string;
  price: string;
  platforms: string;
  vpnRequired: string;
  targetAudience: string[];
  abilities: string[];
  pros: string[];
  cons: string[];
  scenarios: string[];
  alternatives: string[];
  lastVerifiedAt: string;
}

export interface FacetOption {
  slug: string;
  label: string;
  count: number;
}

export interface PresetView {
  id: string;
  label: string;
  description: string;
  count: number;
}

export interface ToolsDirectoryResponse {
  items: ToolSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  categories: FacetOption[];
  tags: FacetOption[];
  statuses: FacetOption[];
  presets: PresetView[];
}

export interface ScenarioSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  problem: string;
  toolCount: number;
  primaryTools: string[];
  alternativeTools: string[];
  targetAudience: string[];
}

export interface RankingItem {
  rank: number;
  reason: string;
  tool: ToolSummary;
}

export interface RankingSection {
  slug: string;
  title: string;
  description: string;
  items: RankingItem[];
}
