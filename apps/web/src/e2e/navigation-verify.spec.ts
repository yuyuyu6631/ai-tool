import { test, expect } from "@playwright/test";

test.describe("Homepage-first navigation", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("loads homepage and exposes primary actions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/星点评/);
    await expect(page.locator("nav").getByText("首页")).toBeVisible();
    await expect(page.getByRole("button", { name: "搜索工具" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI 写作" })).toBeVisible();
  });

  test("search result and detail flow still work from homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("搜索工具名称、用途或关键词").fill("写作");
    await page.getByRole("button", { name: "搜索工具" }).click();

    await expect(page).toHaveURL(/\/\?q=%E5%86%99%E4%BD%9C|\/\?q=写作/);
    await expect(page.getByText(/当前展示 \d+ 个工具/)).toBeVisible();

    await page.getByRole("link", { name: "查看详情" }).first().click();
    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test("legacy tools path redirects back to homepage", async ({ page }) => {
    await page.goto("/tools", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/$/);
  });
});
