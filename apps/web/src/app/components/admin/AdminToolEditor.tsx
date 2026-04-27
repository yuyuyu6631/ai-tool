"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAdminTool, saveAdminTool } from "../../lib/catalog-api";
import type { AdminToolPayload, ToolDetail, ToolMediaItem } from "../../lib/catalog-types";

type MediaDraft = ToolMediaItem & { id: string };

const EMPTY_MEDIA_ITEM: MediaDraft = {
  id: "media-1",
  type: "image",
  url: "",
  thumbnailUrl: "",
  title: "",
  sourceName: "",
  sourceUrl: "",
};

const EMPTY_FORM: AdminToolPayload = {
  slug: "",
  name: "",
  categorySlug: "",
  categoryName: "",
  summary: "",
  description: "",
  editorComment: "",
  developer: "",
  country: "",
  city: "",
  price: "",
  platforms: "",
  officialUrl: "",
  logoPath: "",
  featured: false,
  status: "draft",
  pricingType: "unknown",
  priceMinCny: null,
  priceMaxCny: null,
  freeAllowanceText: "",
  features: [],
  limitations: [],
  bestFor: [],
  dealSummary: "",
  mediaItems: [],
  accessFlags: { needs_vpn: false, cn_lang: false, cn_payment: false },
  tags: [],
  createdOn: null,
  lastVerifiedAt: null,
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values?: string[] | null) {
  return (values ?? []).join("\n");
}

function cleanMediaItem(item: MediaDraft): ToolMediaItem | null {
  const url = item.url.trim();
  if (!url) return null;
  return {
    type: item.type === "video" ? "video" : "image",
    url,
    thumbnailUrl: item.thumbnailUrl?.trim() || undefined,
    title: item.title?.trim() || "",
    sourceName: item.sourceName?.trim() || "",
    sourceUrl: item.sourceUrl?.trim() || undefined,
  };
}

function toMediaDrafts(items?: ToolMediaItem[] | null): MediaDraft[] {
  if (!items || items.length === 0) return [{ ...EMPTY_MEDIA_ITEM }];
  return items.map((item, index) => ({
    id: `media-${index + 1}`,
    type: item.type === "video" ? "video" : "image",
    url: item.url || "",
    thumbnailUrl: item.thumbnailUrl || "",
    title: item.title || "",
    sourceName: item.sourceName || "",
    sourceUrl: item.sourceUrl || "",
  }));
}

function buildFormState(tool: ToolDetail): AdminToolPayload {
  return {
    slug: tool.slug,
    name: tool.name,
    categorySlug: tool.categorySlug || "",
    categoryName: tool.category,
    summary: tool.summary,
    description: tool.description,
    editorComment: tool.editorComment,
    developer: tool.developer,
    country: tool.country,
    city: tool.city,
    price: tool.price,
    platforms: tool.platforms,
    officialUrl: tool.officialUrl,
    logoPath: tool.logoPath || "",
    featured: tool.featured,
    status: tool.status,
    pricingType: tool.pricingType || "unknown",
    priceMinCny: tool.priceMinCny ?? null,
    priceMaxCny: tool.priceMaxCny ?? null,
    freeAllowanceText: tool.freeAllowanceText || "",
    features: tool.features || [],
    limitations: tool.limitations || [],
    bestFor: tool.bestFor || [],
    dealSummary: tool.dealSummary || "",
    mediaItems: tool.mediaItems || [],
    accessFlags: {
      needs_vpn: tool.accessFlags?.needsVpn ?? false,
      cn_lang: tool.accessFlags?.cnLang ?? false,
      cn_payment: tool.accessFlags?.cnPayment ?? false,
    },
    tags: tool.tags || [],
    createdOn: tool.createdAt?.slice(0, 10) || null,
    lastVerifiedAt: tool.lastVerifiedAt?.slice(0, 10) || null,
  };
}

function FieldSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "待补充",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = "待补充",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

export default function AdminToolEditor({ toolId }: { toolId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminToolPayload>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [limitationsInput, setLimitationsInput] = useState("");
  const [bestForInput, setBestForInput] = useState("");
  const [mediaDrafts, setMediaDrafts] = useState<MediaDraft[]>([{ ...EMPTY_MEDIA_ITEM }]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(toolId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) return;
    void fetchAdminTool(toolId)
      .then((tool) => {
        const nextForm = buildFormState(tool);
        setForm(nextForm);
        setTagInput((tool.tags || []).join(", "));
        setFeaturesInput(joinLines(nextForm.features));
        setLimitationsInput(joinLines(nextForm.limitations));
        setBestForInput(joinLines(nextForm.bestFor));
        setMediaDrafts(toMediaDrafts(nextForm.mediaItems));
        setError(null);
      })
      .catch(() => setError("工具详情加载失败，请稍后重试。"))
      .finally(() => setLoading(false));
  }, [toolId]);

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载工具详情...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">{error}</div>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const mediaItems = mediaDrafts.map(cleanMediaItem).filter(Boolean) as ToolMediaItem[];
      const payload: AdminToolPayload = {
        ...form,
        tags: tagInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        features: splitLines(featuresInput),
        limitations: splitLines(limitationsInput),
        bestFor: splitLines(bestForInput),
        mediaItems,
      };
      const saved = await saveAdminTool(payload, toolId);
      setMessage("保存成功，前台刷新后即可读取最新数据。");
      if (!toolId) {
        router.push(`/admin/tools/${saved.id}`);
      }
    } catch {
      setMessage("保存失败，请检查输入后重试。");
    } finally {
      setSaving(false);
    }
  }

  function updateMedia(index: number, patch: Partial<MediaDraft>) {
    setMediaDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function updateAccessFlag(key: keyof AdminToolPayload["accessFlags"], value: boolean) {
    setForm((current) => ({ ...current, accessFlags: { ...current.accessFlags, [key]: value } }));
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <FieldSection title="基础信息" hint="决定工具在前台的名称、分类、状态和基础识别信息。">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} placeholder="例如 chatgpt" />
          <TextField label="工具名称" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="例如 ChatGPT" />
          <TextField label="分类 Slug" value={form.categorySlug} onChange={(value) => setForm((current) => ({ ...current, categorySlug: value }))} placeholder="例如 writing" />
          <TextField label="分类名称" value={form.categoryName} onChange={(value) => setForm((current) => ({ ...current, categoryName: value }))} placeholder="例如 AI 写作" />
          <TextField label="官网链接" value={form.officialUrl} onChange={(value) => setForm((current) => ({ ...current, officialUrl: value }))} placeholder="https://..." />
          <TextField label="Logo 路径" value={form.logoPath} onChange={(value) => setForm((current) => ({ ...current, logoPath: value }))} placeholder="/logos/example.svg" />
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>状态</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminToolPayload["status"] }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
            首页推荐展示
          </label>
        </div>
      </FieldSection>

      <FieldSection title="展示信息" hint="首页卡片只展示经过确认的短文案，空字段会显示“待补充”。">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="开发者" value={form.developer} onChange={(value) => setForm((current) => ({ ...current, developer: value }))} />
          <TextField label="支持平台" value={form.platforms} onChange={(value) => setForm((current) => ({ ...current, platforms: value }))} placeholder="Web, iOS, Android" />
          <TextField label="国家/地区" value={form.country} onChange={(value) => setForm((current) => ({ ...current, country: value }))} />
          <TextField label="城市" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
        </div>
        <div className="mt-4 grid gap-4">
          <TextAreaField label="一句话介绍" value={form.summary} rows={3} onChange={(value) => setForm((current) => ({ ...current, summary: value }))} placeholder="用一句话说明它解决什么问题" />
          <TextAreaField label="详情描述" value={form.description} rows={5} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="补充产品背景、典型场景和使用方式" />
          <TextField label="标签，逗号分隔" value={tagInput} onChange={setTagInput} placeholder="写作, PPT, 免费额度" />
        </div>
      </FieldSection>

      <FieldSection title="价格与可用性" hint="用于前台展示免费情况、访问条件和优惠信息，不确定的信息请留空。">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="价格文案" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="例如 免费试用 / Pro $20/月" />
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>价格类型</span>
            <select
              value={form.pricingType}
              onChange={(event) => setForm((current) => ({ ...current, pricingType: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="unknown">待核验</option>
              <option value="free">免费</option>
              <option value="freemium">免费增值</option>
              <option value="paid">付费</option>
            </select>
          </label>
          <TextField label="最低价格（CNY）" type="number" value={form.priceMinCny == null ? "" : String(form.priceMinCny)} onChange={(value) => setForm((current) => ({ ...current, priceMinCny: value === "" ? null : Number(value) }))} />
          <TextField label="最高价格（CNY）" type="number" value={form.priceMaxCny == null ? "" : String(form.priceMaxCny)} onChange={(value) => setForm((current) => ({ ...current, priceMaxCny: value === "" ? null : Number(value) }))} />
          <TextField label="免费额度说明" value={form.freeAllowanceText} onChange={(value) => setForm((current) => ({ ...current, freeAllowanceText: value }))} placeholder="例如 每月 50 次生成" />
          <TextField label="优惠说明" value={form.dealSummary} onChange={(value) => setForm((current) => ({ ...current, dealSummary: value }))} placeholder="例如 免费版适合轻量试用" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <input type="checkbox" checked={Boolean(form.accessFlags.needs_vpn)} onChange={(event) => updateAccessFlag("needs_vpn", event.target.checked)} />
            需要 VPN
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <input type="checkbox" checked={Boolean(form.accessFlags.cn_lang)} onChange={(event) => updateAccessFlag("cn_lang", event.target.checked)} />
            中文界面
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <input type="checkbox" checked={Boolean(form.accessFlags.cn_payment)} onChange={(event) => updateAccessFlag("cn_payment", event.target.checked)} />
            国内支付
          </label>
        </div>
      </FieldSection>

      <FieldSection title="评测信息" hint="逐行录入特点、限制和适合人群。不要自动生成未核验结论。">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="特点" value={featuresInput} onChange={setFeaturesInput} placeholder={"上手快\n模板丰富"} />
          <TextAreaField label="缺陷" value={limitationsInput} onChange={setLimitationsInput} placeholder={"高级能力需要付费\n中文模板质量待核验"} />
          <TextAreaField label="适合人群" value={bestForInput} onChange={setBestForInput} placeholder={"学生\n运营"} />
          <TextAreaField label="编辑点评" value={form.editorComment} onChange={(value) => setForm((current) => ({ ...current, editorComment: value }))} placeholder="只写已经核验过的判断" />
          <TextField label="创建日期" type="date" value={form.createdOn || ""} onChange={(value) => setForm((current) => ({ ...current, createdOn: value || null }))} />
          <TextField label="最近核验日期" type="date" value={form.lastVerifiedAt || ""} onChange={(value) => setForm((current) => ({ ...current, lastVerifiedAt: value || null }))} />
        </div>
      </FieldSection>

      <FieldSection title="媒体信息" hint="支持外链图片或视频。URL 为空的媒体项不会保存。">
        <div className="space-y-4">
          {mediaDrafts.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>媒体类型</span>
                <select value={item.type} onChange={(event) => updateMedia(index, { type: event.target.value as ToolMediaItem["type"] })} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                </select>
              </label>
              <TextField label="媒体地址" value={item.url} onChange={(value) => updateMedia(index, { url: value })} placeholder="https://..." />
              <TextField label="媒体标题" value={item.title || ""} onChange={(value) => updateMedia(index, { title: value })} />
              <TextField label="封面地址" value={item.thumbnailUrl || ""} onChange={(value) => updateMedia(index, { thumbnailUrl: value })} placeholder="https://..." />
              <TextField label="来源名称" value={item.sourceName || ""} onChange={(value) => updateMedia(index, { sourceName: value })} />
              <TextField label="来源链接" value={item.sourceUrl || ""} onChange={(value) => updateMedia(index, { sourceUrl: value })} placeholder="https://..." />
              <div className="flex items-center gap-3 md:col-span-2">
                <button type="button" onClick={() => setMediaDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600">
                  删除媒体
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setMediaDrafts((current) => [...current, { ...EMPTY_MEDIA_ITEM, id: `media-${Date.now()}` }])} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          添加媒体
        </button>
      </FieldSection>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">
          {saving ? "保存中..." : "保存工具"}
        </button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : <span className="text-sm text-slate-400">空字段会保存为空，并在前台显示待补充。</span>}
      </div>
    </form>
  );
}
