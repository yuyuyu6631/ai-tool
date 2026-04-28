import { expect, test } from "@playwright/test";

test.describe("Homepage-first navigation", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("loads homepage and exposes primary demo actions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/星点评/);
    await expect(page.getByRole("heading", { name: "3 秒找到能用的 AI 工具" })).toBeVisible();
    await expect(page.getByRole("button", { name: "智能匹配" })).toBeVisible();
    await expect(page.getByRole("button", { name: "生成测试用例" })).toBeVisible();
    await expect(page.getByTestId("search-recommendation-flow")).toBeVisible();
    await expect(page.locator("header.site-header nav")).toHaveCount(0);
  });

  test("semantic search result and detail flow work from homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式").fill("写论文");
    await page.getByRole("button", { name: "智能匹配" }).click();

    await expect(page).toHaveURL(/mode=ai/);
    await expect(page).toHaveURL(/q=(%E5%86%99%E8%AE%BA%E6%96%87|写论文)/);

    await expect(page.getByRole("link", { name: /查看详情/ }).first()).toBeVisible();
    await page.getByRole("link", { name: /查看详情/ }).first().click();
    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test("legacy tools path redirects back to homepage", async ({ page }) => {
    await page.goto("/tools", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/$/);
  });
});
