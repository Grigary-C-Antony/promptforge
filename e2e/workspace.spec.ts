import { test, expect } from "@playwright/test";

/**
 * Workspace page tests — use admin session to verify the workspace layout.
 * Note: workspace requires licenseId in session, but admin session may not have one.
 * These tests verify the redirect behavior and workspace rendering via user login.
 */
test.describe("Workspace Page", () => {
  test("workspace should show project sidebar and content area (via user login)", async ({ browser }) => {
    // First, create a license and project through admin
    const adminContext = await browser.newContext({
      storageState: "e2e/.auth/admin.json",
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/admin");
    await adminPage.waitForLoadState("networkidle");

    // Generate UUID
    await adminPage.getByRole("button", { name: /generate uuid/i }).click();
    await adminPage.getByPlaceholder("e.g. John Doe").fill("Workspace Test User");
    await adminPage.getByPlaceholder("e.g. Stripe Payment").fill("Playwright");
    await adminPage.getByRole("button", { name: /generate license/i }).click();
    await expect(adminPage.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    await adminPage.waitForTimeout(1000);

    // Get the key
    const keyElement = adminPage.locator("div").filter({ hasText: "Workspace Test User" })
      .locator(".font-mono").first();
    const licenseKey = await keyElement.innerText();
    await adminContext.close();

    // Now login as user
    const userContext = await browser.newContext();
    const page = await userContext.newPage();

    await page.goto("/");
    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill(licenseKey);
    await page.getByRole("button", { name: /access platform/i }).click();

    // New user goes to onboarding first
    await page.waitForURL("**/onboarding", { timeout: 15000 });

    // Quick onboarding
    await page.getByText("Web App").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByText("Developer Tools").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByPlaceholder("e.g. PromptForge").fill("Workspace E2E Project");
    await page.getByRole("button", { name: /continue/i }).click();
    // Skip through remaining steps
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /continue/i }).click();
    }
    await page.getByRole("button", { name: /complete setup/i }).click();
    await page.waitForURL("**/workspace", { timeout: 15000 });

    // Verify workspace elements
    await expect(page.getByText("Rotifex")).toBeVisible();
    await expect(page.getByText("CREDITS").first()).toBeVisible();
    await expect(page.getByText("Workspace E2E Project").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("My Projects").first()).toBeVisible();
    await expect(page.getByText("New Project")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();

    await userContext.close();
  });

  test("workspace generation modal should appear for new projects", async ({ browser }) => {
    const adminContext = await browser.newContext({
      storageState: "e2e/.auth/admin.json",
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/admin");
    await adminPage.waitForLoadState("networkidle");

    // Generate UUID
    await adminPage.getByRole("button", { name: /generate uuid/i }).click();
    await adminPage.getByPlaceholder("e.g. John Doe").fill("Modal Test User");
    await adminPage.getByPlaceholder("e.g. Stripe Payment").fill("Test");
    await adminPage.getByRole("button", { name: /generate license/i }).click();
    await expect(adminPage.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    await adminPage.waitForTimeout(1000);

    const keyElement = adminPage.locator("div").filter({ hasText: "Modal Test User" })
      .locator(".font-mono").first();
    const key = await keyElement.innerText();
    await adminContext.close();

    // Login and onboard
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/");
    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill(key);
    await page.getByRole("button", { name: /access platform/i }).click();
    await page.waitForURL("**/onboarding", { timeout: 15000 });

    // Quick onboard
    await page.getByText("Chrome Extension").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByText("Education & Learning").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByPlaceholder("e.g. PromptForge").fill("Modal Test Project");
    await page.getByRole("button", { name: /continue/i }).click();
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /continue/i }).click();
    }
    await page.getByRole("button", { name: /complete setup/i }).click();
    await page.waitForURL("**/workspace", { timeout: 15000 });

    // Generation modal should auto-appear since no prompts exist
    await expect(page.getByText("Generation Options")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Use Credits")).toBeVisible();
    await expect(page.getByText("Use Custom API Key")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();

    await ctx.close();
  });
});
