import { test, expect } from "@playwright/test";

/**
 * Admin Dashboard tests — these run with the pre-authenticated admin session
 * (set up via auth.setup.ts).
 */
test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  // ─── Layout & Navigation ───
  test("should display sidebar with branding and nav items", async ({ page }) => {
    await expect(page.getByText("Rotifex").first()).toBeVisible();
    await expect(page.getByText("ADMIN").first()).toBeVisible();
    await expect(page.getByText("Dashboard")).first().toBeVisible();
    await expect(page.getByText("Generated Flows").first()).toBeVisible();
  });

  test("should display top bar with 'Generate UUID' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /generate uuid/i })).toBeVisible();
  });

  test("should show Sign Out button in sidebar", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  // ─── Stats Cards ───
  test("should display 4 stat cards on dashboard", async ({ page }) => {
    await expect(page.getByText("ACTIVE UUIDs")).toBeVisible();
    await expect(page.getByText("WORKFLOWS")).toBeVisible();
    await expect(page.getByText("PROMPTS")).toBeVisible();
    await expect(page.getByText("EXPIRING SOON")).toBeVisible();
  });

  // ─── Customers & UUIDs Table ───
  test("should show the combined 'Customers & UUIDs' table", async ({ page }) => {
    await expect(page.getByText("Customers & UUIDs")).toBeVisible();
    await expect(page.getByText("CUSTOMER / UUID")).toBeVisible();
    await expect(page.getByText("STATUS").first()).toBeVisible();
    await expect(page.getByText("CREDITS").first()).toBeVisible();
  });

  test("should have filter toggles (All / Active)", async ({ page }) => {
    const allBtn = page.locator("span").filter({ hasText: /^All$/ }).first();
    const activeBtn = page.locator("span").filter({ hasText: /^Active$/ }).first();

    await expect(allBtn).toBeVisible();
    await expect(activeBtn).toBeVisible();

    // Click Active filter
    await activeBtn.click();
    // Click All filter to reset
    await allBtn.click();
  });

  // ─── Generate UUID Modal ───
  test("should open and close the 'Create New UUID' modal", async ({ page }) => {
    await page.getByRole("button", { name: /generate uuid/i }).click();

    // Modal should be visible
    await expect(page.getByText("Create New UUID")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Stripe Payment")).toBeVisible();
    await expect(page.getByText("INITIAL CREDITS")).toBeVisible();
    await expect(page.getByRole("button", { name: /generate license/i })).toBeVisible();

    // Close modal
    await page.locator(".fixed").locator("svg").first().click();
    await expect(page.getByText("Create New UUID")).not.toBeVisible();
  });

  test("should generate a new UUID successfully", async ({ page }) => {
    await page.getByRole("button", { name: /generate uuid/i }).click();

    await page.getByPlaceholder("e.g. John Doe").fill("Test Customer");
    await page.getByPlaceholder("e.g. Stripe Payment").fill("Manual");

    // Verify default credits is 20
    const creditsInput = page.locator('input[type="number"]');
    await expect(creditsInput).toHaveValue("20");

    await page.getByRole("button", { name: /generate license/i }).click();

    // Modal should close after successful generation
    await expect(page.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    // The new customer should now appear in the table
    await expect(page.getByText("Test Customer").first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Tab Navigation ───
  test("should switch to Generated Flows tab", async ({ page }) => {
    await page.getByText("Generated Flows").click();

    await expect(page.getByText("PROJECT NAME")).toBeVisible();
    await expect(page.getByText("CUSTOMER / KEY")).toBeVisible();
    await expect(page.getByText("DATE").first()).toBeVisible();
  });

  test("should switch back to Dashboard tab", async ({ page }) => {
    // Go to flows first
    await page.getByText("Generated Flows").click();
    await expect(page.getByText("PROJECT NAME")).toBeVisible();

    // Switch back
    await page.getByText("Dashboard").first().click();
    await expect(page.getByText("Customers & UUIDs")).toBeVisible();
  });
});
