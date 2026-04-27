import { expect, test } from "@playwright/test";

test("demo smoke: search from home and open a tool detail", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("例如：我要把 Word 文档自动排版成论文格式").fill("做答辩 PPT");
  await page.getByRole("button", { name: "智能匹配" }).click();

  await expect(page).toHaveURL(/mode=ai/);
  await expect(page.getByRole("link", { name: /查看详情/ }).first()).toBeVisible();

  await page.getByRole("link", { name: /查看详情/ }).first().click();
  await expect(page.getByText("评测结论", { exact: true })).toBeVisible();
  await expect(page.getByText("信息来源")).toBeVisible();
});
