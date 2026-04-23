import { expect, test, type Page } from "@playwright/test";

async function mockLoggedOut(page: Page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ detail: "当前未登录。" }),
    });
  });
}

async function openAuth(page: Page) {
  await mockLoggedOut(page);
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "登录星点评" })).toBeVisible();
  await page.waitForTimeout(300);
}

test.describe("/auth checklist", () => {
  const loginIdentifier = 'input[name="identifier"]';
  const loginPassword = 'input[name="password"]';
  const registerUsername = 'input[name="username"]';
  const registerEmail = 'input[name="email"]';
  const registerPassword = 'input[name="password"]';
  const registerConfirmPassword = 'input[name="confirmPassword"]';

  test("页面基础渲染正常", async ({ page }) => {
    await openAuth(page);

    await expect(page).toHaveTitle(/星点评/);
    await expect(page.getByRole("button", { name: "登录", exact: true }).first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(loginIdentifier)).toBeVisible();
    await expect(page.locator(loginPassword)).toBeVisible();
    await expect(page.getByRole("button", { name: "QQ 登录" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "微信登录" })).toBeDisabled();
    await expect(page.getByText("QQ / 微信登录暂未开放，请先使用账号密码登录。")).toBeVisible();
    await expect(page.getByText("2,000+")).toHaveCount(0);
    await expect(page.getByText("AI 工具索引")).toHaveCount(0);
  });

  test("登录和注册 tab 可以正常切换", async ({ page }) => {
    await openAuth(page);

    const authCard = page.locator(".auth-form-card");
    await expect(authCard.locator(loginIdentifier).first()).toBeVisible();
    await authCard.getByRole("button", { name: "注册", exact: true }).click();
    await expect(page.getByRole("heading", { name: "加入星点评" })).toBeVisible();
    await expect(page.locator(registerUsername)).toBeVisible();
    await expect(page.locator(registerEmail)).toBeVisible();
    await expect(page.locator(registerConfirmPassword)).toBeVisible();

    await authCard.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page.getByRole("heading", { name: "登录星点评" })).toBeVisible();
    await expect(page.locator(loginIdentifier)).toBeVisible();
    await expect(page.locator(registerUsername)).toHaveCount(0);
  });

  test("登录表单必填校验生效且不会误进入 loading", async ({ page }) => {
    await openAuth(page);

    const form = page.locator("form").first();
    const identifierInput = form.locator(loginIdentifier);
    const passwordInput = form.locator(loginPassword);
    const submitButton = form.getByRole("button", { name: "登录", exact: true });

    await submitButton.click();

    await expect(identifierInput).toHaveAttribute("aria-invalid", "true");
    await expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator(".text-rose-600")).toHaveCount(2);
    await expect(identifierInput).toHaveAttribute("aria-describedby", /-error$/);
    await expect(passwordInput).toHaveAttribute("aria-describedby", /-error$/);
    await expect(page.getByRole("button", { name: "正在登录..." })).toHaveCount(0);
    await expect(submitButton).toBeEnabled();
  });

  test("注册表单校验覆盖用户名、密码、确认密码和协议", async ({ page }) => {
    await openAuth(page);
    const authCard = page.locator(".auth-form-card");
    await authCard.getByRole("button", { name: "注册", exact: true }).click();
    await expect(page.getByRole("heading", { name: "加入星点评" })).toBeVisible();

    await page.locator(registerEmail).fill("demo@example.com");
    await page.locator(registerPassword).fill("1234567");
    await page.locator(registerConfirmPassword).fill("7654321");
    await page.locator("form").getByRole("button", { name: "注册", exact: true }).click();

    await expect(page.getByText("请先填写一个你想使用的用户名。")).toBeVisible();
    await expect(page.getByText("密码至少 8 位，安全性会更稳妥一些。")).toBeVisible();
    await expect(page.getByText("两次输入的密码还不一致，请重新确认。")).toBeVisible();
    await expect(page.getByText("注册前需要先勾选用户协议。")).toBeVisible();
  });

  test("注册表单对非法邮箱给出自然语言错误", async ({ page }) => {
    await openAuth(page);
    await page.getByRole("button", { name: "注册", exact: true }).first().click();

    await page.locator(registerUsername).fill("tester");
    await page.locator(registerEmail).fill("invalid-email");
    await page.locator(registerPassword).fill("12345678");
    await page.locator(registerConfirmPassword).fill("12345678");
    await page.getByRole("checkbox").check();
    await page.locator("form").getByRole("button", { name: "注册", exact: true }).click();

    await expect(page.getByText("这个邮箱格式看起来不太对，请再检查一下。")).toBeVisible();
  });

  test("密码框支持显示和隐藏", async ({ page }) => {
    await openAuth(page);

    const passwordInput = page.locator(loginPassword).first();
    const toggleButton = page.locator("button[aria-controls]").first();

    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(toggleButton).toHaveAttribute("aria-label", "显示密码");

    await toggleButton.click({ force: true });
    await expect(toggleButton).toHaveAttribute("aria-label", "隐藏密码");
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleButton.click({ force: true });
    await expect(toggleButton).toHaveAttribute("aria-label", "显示密码");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("登录提交后的 loading 状态和恢复正常", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          username: "demo-user",
          email: "demo@example.com",
          status: "active",
          role: "user",
          createdAt: "2026-03-31T00:00:00Z",
        }),
      });
    });
    await openAuth(page);

    await page.locator(loginIdentifier).fill("demo@example.com");
    await page.locator(loginPassword).fill("12345678");
    await expect(page.locator(loginIdentifier)).toHaveValue("demo@example.com");
    await expect(page.locator(loginPassword)).toHaveValue("12345678");

    const submitButton = page.locator("form").getByRole("button", { name: "登录", exact: true });
    await submitButton.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "demo-user" })).toBeVisible();
  });

  test("输入框聚焦、报错和禁用状态都有对应表现", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          username: "demo-user",
          email: "demo@example.com",
          status: "active",
          role: "user",
          createdAt: "2026-03-31T00:00:00Z",
        }),
      });
    });
    await openAuth(page);

    const identifier = page.locator(loginIdentifier);
    const beforeFocus = await identifier.evaluate((node) => getComputedStyle(node).boxShadow);
    await identifier.focus();
    const afterFocus = await identifier.evaluate((node) => getComputedStyle(node).boxShadow);

    expect(afterFocus).not.toBe(beforeFocus);

    await page.locator("form").getByRole("button", { name: "登录", exact: true }).click();
    await expect(identifier).toHaveAttribute("aria-invalid", "true");

    await identifier.fill("demo@example.com");
    await page.locator(loginPassword).fill("12345678");
    await page.locator("form").getByRole("button", { name: "登录", exact: true }).click();
    await expect(identifier).toBeDisabled();
  });

  test("桌面端双栏、移动端单栏，且移动端仍可操作登录注册", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await openAuth(page);

    const desktopLayout = await page.evaluate(() => {
      const brand = document.querySelector(".auth-brand-panel") as HTMLElement | null;
      const form = document.querySelector(".auth-form-shell") as HTMLElement | null;
      if (!brand || !form) return null;
      const brandRect = brand.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      return {
        sameRow: Math.abs(brandRect.top - formRect.top) < 80,
        formRightOfBrand: formRect.left > brandRect.left + 100,
      };
    });

    expect(desktopLayout).toEqual({ sameRow: true, formRightOfBrand: true });

    await page.setViewportSize({ width: 390, height: 1100 });
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { name: "登录星点评" })).toBeVisible();

    const mobileLayout = await page.evaluate(() => {
      const brand = document.querySelector(".auth-brand-panel") as HTMLElement | null;
      const form = document.querySelector(".auth-form-shell") as HTMLElement | null;
      if (!brand || !form) return null;
      const brandRect = brand.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      return {
        stacked: formRect.top > brandRect.top + 100,
        alignedLeft: Math.abs(formRect.left - brandRect.left) < 20,
      };
    });

    expect(mobileLayout).toEqual({ stacked: true, alignedLeft: true });
    await page.locator(".auth-form-card").getByRole("button", { name: "注册", exact: true }).click();
    await expect(page.getByRole("heading", { name: "加入星点评" })).toBeVisible();
    await expect(page.locator(registerUsername)).toBeVisible();
    await page.locator(".auth-form-card").getByRole("button", { name: "登录", exact: true }).click();
    await expect(page.getByRole("heading", { name: "登录星点评" })).toBeVisible();
    await expect(page.locator(loginIdentifier)).toBeVisible();
  });
});
