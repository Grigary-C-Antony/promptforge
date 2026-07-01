import { test, expect } from "@playwright/test";

test.describe("Middleware & Route Guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no auth

  test("should redirect unauthenticated user from /workspace to /", async ({ page }) => {
    await page.goto("/workspace");
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.getByText("Enter your UUID")).toBeVisible();
  });

  test("should redirect unauthenticated user from /onboarding to /", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.getByText("Enter your UUID")).toBeVisible();
  });

  test("should redirect unauthenticated user from /admin to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login", { timeout: 10000 });
    await expect(page.getByText("Admin Portal")).toBeVisible();
  });

  test("should allow access to /admin/login without session", async ({ page }) => {
    await page.goto("/admin/login");
    // Should stay on the login page, not redirect
    await expect(page.getByText("Admin Portal")).toBeVisible();
  });

  test("should allow access to landing page without session", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Enter your UUID")).toBeVisible();
  });
});
