"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bot, FileUp, Plus, Search, Sparkles } from "lucide-react";
import { fetchAdminTools } from "../../lib/catalog-api";
import type { AdminToolListItem } from "../../lib/catalog-types";
import { repairDisplayText } from "../../lib/catalog-utils";

const STATUS_LABELS: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  archived: "已归档",
};

const STATUS_CLASSES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  archived: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(value?: string) {
  if (!value) return "待补充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "待补充";
  return date.toLocaleDateString("zh-CN");
}

export default function AdminToolsList() {
  const [items, setItems] = useState<AdminToolListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchAdminTools()
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch(() => {
        setItems([]);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((item) => repairDisplayText(item.categoryName, "")).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const name = repairDisplayText(item.name, "").toLowerCase();
      const slug = repairDisplayText(item.slug, "").toLowerCase();
      const itemCategory = repairDisplayText(item.categoryName, "");
      const matchesQuery = !normalizedQuery || `${name} ${slug} ${itemCategory.toLowerCase()}`.includes(normalizedQuery);
      const matchesCategory = !category || itemCategory === category;
      const matchesStatus = !status || item.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, items, query, status]);

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载工具列表...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">工具管理</h2>
          <p className="mt-1 text-sm text-slate-500">维护真实工具数据，前台首页、搜索和详情页会直接读取这些内容。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <Sparkles className="h-4 w-4" />
            智能补全
          </button>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <FileUp className="h-4 w-4" />
            批量导入
          </button>
          <Link href="/admin/tools/new" className="inline-flex h-10 items-center gap-2 rounded bg-slate-950 px-3 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            新增工具
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_160px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索工具名称、slug、分类"
            className="h-11 w-full rounded border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="w-[28%] px-3 py-3">工具名称</th>
              <th className="w-[18%] px-3 py-3">分类</th>
              <th className="w-[12%] px-3 py-3">状态</th>
              <th className="w-[10%] px-3 py-3">评分</th>
              <th className="w-[10%] px-3 py-3">浏览量</th>
              <th className="w-[12%] px-3 py-3">更新时间</th>
              <th className="w-[10%] px-3 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const statusLabel = STATUS_LABELS[item.status] ?? repairDisplayText(item.status);
              return (
                <tr key={item.id} className="border-b border-slate-100 align-middle hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-950">{repairDisplayText(item.name)}</div>
                        <div className="truncate text-xs text-slate-500">{repairDisplayText(item.slug)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="truncate px-3 py-3 text-slate-700">{repairDisplayText(item.categoryName)}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ring-1 ${STATUS_CLASSES[item.status] ?? STATUS_CLASSES.archived}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{Number.isFinite(item.score) ? item.score.toFixed(1) : "待补充"}</td>
                  <td className="px-3 py-3 text-slate-700">{Number.isFinite(item.reviewCount) ? item.reviewCount : 0}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(item.updatedAt)}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/admin/tools/${item.id}`} className="font-medium text-slate-950 underline-offset-4 hover:underline">
                      编辑
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 ? (
              <tr>
                <td className="px-3 py-10 text-center text-slate-500" colSpan={7}>
                  没有匹配的工具。可以调整搜索条件，或点击“新增工具”补充数据。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
