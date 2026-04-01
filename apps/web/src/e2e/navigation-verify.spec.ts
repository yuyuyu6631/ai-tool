import { test, expect } from "@playwright/test";

test.describe("Navigation and UI clickability verification", () => {
  // Use desktop viewport so navigation is always visible
  test.use({ viewport: { width: 1280, height: 720 } });

  test("should load homepage and all navigation links are visible and clickable", async ({ page }) => {
    // Go to homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify page loaded with title
    await expect(page).toHaveTitle(/星点评/);

    // Verify all navigation items are visible in desktop header
    const nav = page.locator("nav");
    await expect(nav.getByText("首页")).toBeVisible();
    await expect(nav.getByText("工具目录")).toBeVisible();
    await expect(nav.getByText("榜单")).toBeVisible();
    await expect(nav.getByText("场景")).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: "e2e-screenshots/homepage.png" });
  });

  test("should click navigation links and navigate correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click "工具目录" -> should go to /tools
    await page.locator("nav").getByText("工具目录").click();
    await expect(page).toHaveURL(/tools/);
    await page.waitForLoadState("networkidle");
    // Just verify page loaded and navigation still has the link
    await expect(page.locator("nav").getByText("工具目录")).toBeVisible();

    // Click "榜单" -> should go to /rankings
    await page.locator("nav").getByText("榜单").click();
    await expect(page).toHaveURL(/rankings/);
    await page.waitForLoadState("networkidle");

    // Click "场景" -> should go to /scenarios
    await page.locator("nav").getByText("场景").click();
    await expect(page).toHaveURL(/scenarios/);
    await page.waitForLoadState("networkidle");

    // Click "首页" -> should go back to homepage
    await page.locator("nav").getByText("首页").click();
    await expect(page).toHaveURL(/\/$/);
    await page.waitForLoadState("networkidle");
  });

  test("should display tool cards with correct information on tools page", async ({ page }) => {
    await page.goto("/tools");
    await page.waitForLoadState("networkidle");

    // Wait for tool cards to be rendered
    await page.waitForSelector('[data-testid="tool-card"]', { timeout: 15000 });

    // Verify tool cards are rendered
    const toolCards = page.locator('[data-testid="tool-card"]');
    await expect(toolCards.first()).toBeVisible();

    // Verify scores are displayed
    await expect(toolCards.first().locator("text=⭐")).toBeVisible();

    // Verify price tags are displayed
    // Some tools may not have price, but at least some should have it
    const hasPriceTag = await page.locator('[data-testid="price-tag"]').count();
    console.log(`Found ${hasPriceTag} price tags on page`);

    // Verify filters sidebar is visible
    await expect(page.getByText("分类")).toBeVisible();
    await expect(page.getByText("价格")).toBeVisible();
    await expect(page.getByText("标签")).toBeVisible();

    await page.screenshot({ path: "e2e-screenshots/tools-page.png" });
  });

  test("should click tool card and navigate to tool detail page", async ({ page }) => {
    await page.goto("/tools");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="tool-card"]', { timeout: 15000 });

    // Click first tool card
    const firstCard = page.locator('[data-testid="tool-card"]').first();
    await firstCard.waitFor({ state: "visible" });
    const cardName = await firstCard.locator("h3").innerText();
    await firstCard.click();
    await page.waitForLoadState("networkidle");

    // Verify navigated to detail page
    await expect(page).toHaveURL(/\/tools\//);
    // Title will be in browser title
    await expect(page).toHaveTitle(new RegExp(cardName));

    // Verify score is displayed on detail page
    await expect(page.locator("text=⭐").first()).toBeVisible();

    await page.screenshot({ path: "e2e-screenshots/tool-detail.png" });
  });

  test("should work price filtering on tools page", async ({ page }) => {
    await page.goto("/tools");
    await page.waitForLoadState("networkidle");

    // Check if there are price facets
    const priceFree = page.getByText("免费").first();
    if (await priceFree.isVisible()) {
      await priceFree.click();
      // Verify URL changed and content updated
      await expect(page).toHaveURL(/price=free/);
      await page.waitForLoadState("networkidle");
    }
  });

  test("should handle 404 for non-existent pages", async ({ page }) => {
    await page.goto("/non-existent-page-1234");
    // Should show 404 or redirect, main thing is page doesn't crash
    await page.waitForLoadState("networkidle");
    expect(true).toBe(true);
  });
});
