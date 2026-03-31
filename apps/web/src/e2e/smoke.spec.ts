import { expect, test } from "@playwright/test";

test("core directory path, rankings, and scenarios use live routes", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "开始搜索" })).toBeVisible();

  await page.getByPlaceholder("搜索工具名称、用途或标签，例如：AI PPT、代码编辑器、会议总结").fill("AI");
  await page.getByRole("button", { name: "开始搜索" }).click();
  await expect(page).toHaveURL(/\/tools\?q=AI/);
  await expect(page.getByRole("heading", { name: "搜索结果" })).toBeVisible();

  const detailLink = page.getByRole("link", { name: "查看详情" }).first();
  await detailLink.click();
  await expect(page).toHaveURL(/\/tools\/.+/);

  const externalLink = page.getByRole("link", { name: /访问官网/ });
  await expect(externalLink).toBeVisible();

  await page.goto("/rankings", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "工具榜单" })).toBeVisible();

  await page.goto("/scenarios", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "使用场景" })).toBeVisible();
});
