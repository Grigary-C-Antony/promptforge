import { test, expect } from "@playwright/test";

/**
 * Full user login → onboarding → workspace E2E flow.
 * This test generates a license via admin, then uses it to go through the user journey.
 */
test.describe("User Flow: Login → Onboarding → Workspace", () => {
  let licenseKey: string;

  test.beforeAll(async ({ browser }) => {
    // Use admin session to generate a license key for testing
    const context = await browser.newContext({
      storageState: "e2e/.auth/admin.json",
    });
    const page = await context.newPage();

    // Navigate to admin
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Generate a new UUID
    await page.getByRole("button", { name: /generate uuid/i }).click();
    await page.getByPlaceholder("e.g. John Doe").fill("E2E Test User");
    await page.getByPlaceholder("e.g. Stripe Payment").fill("Playwright E2E");
    await page.getByRole("button", { name: /generate license/i }).click();

    // Wait for modal to close
    await expect(page.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    // Find the license key — it will be in the table. Get the first UUID (monospace text)
    // We need to copy it. Click the copy button for the E2E Test User row
    await page.waitForTimeout(1000);

    // Get the UUID by looking for the monospace key in the E2E Test User row
    const keyElement = page.locator("div").filter({ hasText: "E2E Test User" })
      .locator(".font-mono").first();
    licenseKey = await keyElement.innerText();

    await context.close();
  });

  test("should login with valid license key and reach onboarding", async ({ browser }) => {
    // Use a fresh context (no auth)
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("Enter your UUID")).toBeVisible();

    // Enter the license key
    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill(licenseKey);
    await page.getByRole("button", { name: /access platform/i }).click();

    // Should redirect to /workspace or /onboarding (depends on whether projects exist)
    // Since this is a new license, workspace will redirect to /onboarding
    await page.waitForURL("**/onboarding", { timeout: 15000 });
    await expect(page.getByText("Select Platform")).toBeVisible();

    await context.close();
  });

  test("should complete the onboarding wizard", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login first
    await page.goto("/");
    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill(licenseKey);
    await page.getByRole("button", { name: /access platform/i }).click();
    await page.waitForURL("**/onboarding", { timeout: 15000 });

    // ── Step 0: Platform ──
    await expect(page.getByText("Select Platform")).toBeVisible();
    await page.getByText("Web App").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 1: Category ──
    await expect(page.getByText("Select Category")).toBeVisible();
    await page.getByText("SaaS & Business").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 2: Business Info ──
    await expect(page.getByText("Business Information")).toBeVisible();
    await page.getByPlaceholder("e.g. PromptForge").fill("E2E Test Project");
    await page.getByPlaceholder("e.g. Acme Corp").fill("Test Corp");
    await page.getByPlaceholder("e.g. Technology").fill("Technology");
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 3: Tech Stack ──
    await expect(page.getByText("Technology Stack")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 4: Features ──
    await expect(page.getByText("Core Features")).toBeVisible();
    await page.getByText("Authentication").click();
    await page.getByText("Admin Dashboard").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 5: Design ──
    await expect(page.getByText("Design Preferences").first()).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 6: Goals ──
    await expect(page.getByText("Business Goals")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Step 7: Constraints ──
    await expect(page.getByText("Project Constraints")).toBeVisible();
    await page.getByRole("button", { name: /complete setup/i }).click();

    // Should redirect to workspace after project creation
    await page.waitForURL("**/workspace", { timeout: 15000 });

    // Workspace should show the project name
    await expect(page.getByText("E2E Test Project").first()).toBeVisible({ timeout: 10000 });

    await context.close();
  });
});
