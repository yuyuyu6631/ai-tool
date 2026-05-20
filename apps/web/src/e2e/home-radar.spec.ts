import { expect, test } from "@playwright/test";

const HOME_SEARCH_PLACEHOLDER = "比如：做销售周报 PPT / 分析投放数据 / 修复前端报错";

test("home hero renders semantic search without exposing workflow internals", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "按任务找到合适的 AI 工具" })).toBeVisible();
  await expect(page.getByPlaceholder(HOME_SEARCH_PLACEHOLDER)).toBeVisible();
  await expect(page.getByRole("button", { name: "找工具" })).toBeVisible();
  await expect(page.getByText("任务路线预览")).toHaveCount(0);
  await expect(page.getByText("LIVE")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /看任务场景/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /逛工具库/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "写作润色" })).toBeVisible();
});

test("home first viewport keeps search and quick tasks visible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "按任务找到合适的 AI 工具" });
  const search = page.getByPlaceholder(HOME_SEARCH_PLACEHOLDER);
  const quickTask = page.getByRole("link", { name: "写作润色" });
  await expect(heading).toBeVisible();
  await expect(search).toBeVisible();
  await expect(quickTask).toBeVisible();

  const searchBox = await search.boundingBox();
  const quickTaskBox = await quickTask.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(quickTaskBox).not.toBeNull();
  expect(searchBox!.y + searchBox!.height).toBeLessThan(quickTaskBox!.y + quickTaskBox!.height);
});

test("semantic search returns results without showing reasoning panels", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder(HOME_SEARCH_PLACEHOLDER).fill("做答辩 PPT 用什么 AI");
  await page.getByRole("button", { name: "找工具" }).click();

  await expect(page).toHaveURL(/\/tools\?/);
  await expect(page).toHaveURL(/mode=ai/);
  await expect(page).toHaveURL(/q=.*%E7%AD%94%E8%BE%A9.*PPT/);
  await expect(page.getByRole("heading", { name: "搜索结果" })).toBeVisible();
  await expect(page.getByText("AI 理解")).toHaveCount(0);
  await expect(page.getByText("查看 AI 推荐报告")).toHaveCount(0);
  await expect(page.getByText(/找到 \d+ 个结果/)).toBeVisible();
});

test("tool detail opened from the homepage tools entry leads with third-party review fields", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: /逛工具库/ }).click();
  await expect(page).toHaveURL(/\/tools/);
  await page.getByRole("link", { name: /^详情$/ }).first().click();
  await expect(page).toHaveURL(/\/tools\/.+/);
  await expect(page.getByText("评测结论", { exact: true })).toBeVisible();
  await expect(page.getByText("缺陷 / 限制")).toBeVisible();
  await expect(page.getByText("核心特点")).toBeVisible();
  await expect(page.getByRole("heading", { name: "适合人群" })).toBeVisible();
  await expect(page.getByText("优惠 / 免费额度")).toBeVisible();
  await expect(page.getByRole("heading", { name: "用户评论" })).toBeVisible();
});
