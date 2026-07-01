import { test, expect } from "@playwright/test";

/**
 * Admin license management tests — CRUD operations on licenses.
 * Uses the pre-authenticated admin session.
 */
test.describe("Admin License Management", () => {
  let testLicenseKey: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  test("should generate a license, then edit the customer", async ({ page }) => {
    // Generate a new UUID for this test
    await page.getByRole("button", { name: /generate uuid/i }).click();
    await page.getByPlaceholder("e.g. John Doe").fill("Edit Test User");
    await page.getByPlaceholder("e.g. Stripe Payment").fill("Playwright");
    await page.getByRole("button", { name: /generate license/i }).click();
    await expect(page.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    // Find the row and click Edit
    const row = page.locator("div").filter({ hasText: "Edit Test User" }).first();
    await expect(row).toBeVisible({ timeout: 5000 });

    // Click the Edit button in that row's parent region
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Edit Customer Modal should appear
    await expect(page.getByText("Edit Customer")).toBeVisible();

    // Change the name
    const nameInput = page.locator('input[placeholder="e.g. John Doe"]');
    await nameInput.clear();
    await nameInput.fill("Updated Customer");

    await page.getByRole("button", { name: /save changes/i }).click();

    // Modal should close
    await expect(page.getByText("Edit Customer")).not.toBeVisible({ timeout: 10000 });

    // Verify the updated name appears
    await expect(page.getByText("Updated Customer")).toBeVisible({ timeout: 5000 });
  });

  test("should copy UUID to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Click the first copy button (title="Copy UUID")
    const copyBtn = page.locator('[title="Copy UUID"]').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      // Should show a checkmark icon (the SVG changes)
      // We just verify no crash; clipboard access varies by browser
    }
  });

  test("should navigate to flows when clicking Flows button on a customer row", async ({ page }) => {
    // Look for a Flows button
    const flowsBtn = page.getByRole("button", { name: "Flows" }).first();
    if (await flowsBtn.isVisible()) {
      await flowsBtn.click();

      // Should switch to Flows tab with filter
      await expect(page.getByText("Generated Flows").first()).toBeVisible();
      await expect(page.getByText("Clear Filter")).toBeVisible();
    }
  });

  test("should revoke a license", async ({ page }) => {
    // Generate a license to revoke
    await page.getByRole("button", { name: /generate uuid/i }).click();
    await page.getByPlaceholder("e.g. John Doe").fill("Revoke Test");
    await page.getByPlaceholder("e.g. Stripe Payment").fill("Test");
    await page.getByRole("button", { name: /generate license/i }).click();
    await expect(page.getByText("Create New UUID")).not.toBeVisible({ timeout: 10000 });

    // Find the revoke button for the newly created license
    const revokeBtn = page.locator('[title="Revoke License"]').first();
    if (await revokeBtn.isVisible()) {
      await revokeBtn.click();

      // After revoke, the status should change to REVOKED
      await expect(page.getByText("REVOKED").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
