import { test, expect } from "@playwright/test";

test.describe("Landing Page — UUID Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no auth

  test("should render the landing page with branding and login form", async ({ page }) => {
    await page.goto("/");

    // Branding
    await expect(page.getByText("Rotifex").first()).toBeVisible();
    await expect(page.getByText("AI Prompt Engineering")).toBeVisible();

    // Login card
    await expect(page.getByText("Enter your UUID")).toBeVisible();
    await expect(page.getByText("Secure Access")).toBeVisible();
    await expect(page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")).toBeVisible();
    await expect(page.getByRole("button", { name: /access platform/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /request access/i })).toBeVisible();
  });

  test("should show error for empty UUID submission", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /access platform/i }).click();

    // The button should show loading then revert; the form will try to submit with empty key
    // Wait for the error message to appear
    await expect(page.getByText(/license key is required|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("should show error for invalid UUID", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill("invalid-uuid-12345");
    await page.getByRole("button", { name: /access platform/i }).click();

    await expect(page.getByText(/invalid/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should show 'Verifying...' state while submitting", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").fill("some-fake-uuid");
    await page.getByRole("button", { name: /access platform/i }).click();

    await expect(page.getByText("Verifying...")).toBeVisible();
  });

  test("should show alert when 'Request Access' is clicked", async ({ page }) => {
    await page.goto("/");

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("contact your administrator");
      await dialog.accept();
    });

    await page.getByRole("button", { name: /request access/i }).click();
  });

  test("should display footer links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("About")).toBeVisible();
    await expect(page.getByText("Documentation")).toBeVisible();
    await expect(page.getByText("Support")).toBeVisible();
  });
});
