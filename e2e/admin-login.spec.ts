import { test, expect } from "@playwright/test";

test.describe("Admin Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no auth

  test("should render the admin login page", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByText("Admin Portal")).toBeVisible();
    await expect(page.getByText("System Administrator")).toBeVisible();
    await expect(page.getByPlaceholder("admin@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder("admin@example.com").fill("wrong@email.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible({ timeout: 5000 });
  });

  test("should show 'Authenticating...' while submitting", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder("admin@example.com").fill("dracorig@gmail.com");
    await page.getByPlaceholder("••••••••").fill("X6dc003aKF@drac");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should briefly show authenticating state
    await expect(page.getByText("Authenticating...")).toBeVisible();
  });

  test("should redirect to /admin on successful login", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder("admin@example.com").fill("dracorig@gmail.com");
    await page.getByPlaceholder("••••••••").fill("X6dc003aKF@drac");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page.getByText("Dashboard").first()).toBeVisible();
  });

  test("should redirect unauthenticated user from /admin to /admin/login", async ({ page }) => {
    await page.goto("/admin");

    await page.waitForURL("**/admin/login", { timeout: 10000 });
    await expect(page.getByText("Admin Portal")).toBeVisible();
  });
});
