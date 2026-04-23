import { expect, test } from "@playwright/test";

test("homepage search stays on root and can reach detail pages", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "搜索工具" })).toBeVisible();

  await page.getByPlaceholder("搜索工具名称、用途或关键词").fill("AI");
  await page.getByRole("button", { name: "搜索工具" }).click();

  await expect(page).toHaveURL(/\/\?q=AI/);
  await expect(page.getByText(/当前展示 \d+ 个工具/)).toBeVisible();

  const detailLink = page.getByRole("link", { name: "查看详情" }).first();
  await detailLink.click();
  await expect(page).toHaveURL(/\/tools\/.+/);

  const externalLink = page.getByRole("link", { name: /访问官网/ }).first();
  await expect(externalLink).toBeVisible();
});

test("legacy tools route permanently redirects to homepage state", async ({ page }) => {
  await page.goto("/tools?q=AI&category=chatbot", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/\?q=AI&category=chatbot|\/\?category=chatbot&q=AI/);
});

test("matches route shows candidate card and drawer", async ({ page }) => {
  await page.goto("/matches", { waitUntil: "networkidle" });

  await expect(page.getByTestId("match-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "同频" })).toBeVisible();
  await page.getByRole("button", { name: "同频" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
