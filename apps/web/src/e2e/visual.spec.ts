import { expect, test } from "@playwright/test";

const cases = [
  { name: "home-1280", path: "/", width: 1280, height: 1200 },
  { name: "home-1440", path: "/", width: 1440, height: 1200 },
  { name: "home-1920", path: "/", width: 1920, height: 1280 },
  { name: "tools-390", path: "/tools", width: 390, height: 1100 },
];

for (const item of cases) {
  test(`visual snapshot ${item.name}`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(item.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot(`${item.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.015,
    });
  });
}
