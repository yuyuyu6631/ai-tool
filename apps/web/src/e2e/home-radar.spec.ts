import { expect, test } from "@playwright/test";

test("home hero renders semantic search and the recommendation workflow", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "3 秒找到能用的 AI 工具" })).toBeVisible();
  await expect(page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式")).toBeVisible();
  await expect(page.getByRole("button", { name: "智能匹配" })).toBeVisible();
  await expect(page.getByRole("button").nth(1)).toBeVisible();
  await expect(page.getByTestId("search-recommendation-flow")).toBeVisible();
  await expect(page.getByText("搜索后生成使用流程推荐")).toBeVisible();
  await expect(page.getByText("Docx 文档处理使用流程推荐")).toBeVisible();
  await expect(page.getByText("用 WPS AI 或 Word 样式处理正文和标题，再用文档格式检查工具做二次核验")).toBeVisible();
  await expect(page.getByText("直接输入你要完成的任务")).toHaveCount(0);
});

test("home first viewport keeps search above workflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "3 秒找到能用的 AI 工具" });
  const search = page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式");
  const workflow = page.getByTestId("search-recommendation-flow");
  await expect(heading).toBeVisible();
  await expect(search).toBeVisible();
  await expect(workflow).toBeVisible();

  const searchBox = await search.boundingBox();
  const workflowBox = await workflow.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(workflowBox).not.toBeNull();
  expect(searchBox!.y + searchBox!.height).toBeLessThan(workflowBox!.y + workflowBox!.height);
});

test("semantic search updates visible understanding state", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式").fill("做答辩 PPT 用什么 AI");
  await page.getByRole("button", { name: "智能匹配" }).click();

  await expect(page).toHaveURL(/mode=ai/);
  await expect(page.getByText("搜索结果推荐的使用流程")).toBeVisible();
  await expect(page.getByText("答辩 PPT 使用流程推荐")).toBeVisible();
  await expect(page.getByText("AI PPT制作 / AI 图像").first()).toBeVisible();
  await expect(page.getByText("Gamma 生成页面初稿，再用 Canva AI 或学校模板统一视觉和版式")).toBeVisible();
});

test("tool detail opened from a real homepage card leads with third-party review fields", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: /查看详情/ }).first().click();
  await expect(page).toHaveURL(/\/tools\/.+/);
  await expect(page.getByText("评测结论", { exact: true })).toBeVisible();
  await expect(page.getByText("先看缺陷 / 限制")).toBeVisible();
  await expect(page.getByText("核心特点")).toBeVisible();
  await expect(page.getByRole("heading", { name: "适合人群" })).toBeVisible();
  await expect(page.getByText("优惠 / 免费额度")).toBeVisible();
  await expect(page.getByRole("heading", { name: "用户评论" })).toBeVisible();
});
