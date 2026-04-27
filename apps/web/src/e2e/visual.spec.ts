import { expect, test } from "@playwright/test";

const cases = [
  { name: "home-1280", path: "/", width: 1280, height: 1200 },
  { name: "home-1440", path: "/", width: 1440, height: 1200 },
  { name: "home-1920", path: "/", width: 1920, height: 1280 },
  { name: "home-search-390", path: "/?q=AI", width: 390, height: 1100 },
];

for (const item of cases) {
  test(`visual layout ${item.name}`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(item.path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: "3 秒找到能用的 AI 工具" });
    const search = page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式");
    const workflow = page.getByTestId("search-recommendation-flow");
    const firstDetail = page.getByRole("link", { name: /查看详情/ }).first();

    await expect(heading).toBeVisible();
    await expect(search).toBeVisible();
    await expect(workflow).toBeVisible();
    await expect(firstDetail).toBeVisible();
    await expect(page.getByText("当前没有可展示的工具")).toHaveCount(0);

    const headingBox = await heading.boundingBox();
    const searchBox = await search.boundingBox();
    const workflowBox = await workflow.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(workflowBox).not.toBeNull();

    expect(searchBox!.y).toBeGreaterThan(headingBox!.y);
    expect(searchBox!.height).toBeGreaterThan(40);
    expect(workflowBox!.width).toBeGreaterThan(160);
    expect(workflowBox!.height).toBeGreaterThan(20);

    if (item.width < 768) {
      expect(searchBox!.y + searchBox!.height).toBeLessThan(workflowBox!.y + workflowBox!.height);
    }
  });
}
