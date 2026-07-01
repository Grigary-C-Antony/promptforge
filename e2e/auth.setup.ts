import { test as setup, expect } from "@playwright/test";
import path from "path";

const adminFile = path.join(__dirname, ".auth", "admin.json");

/**
 * Auth setup: seeds the admin user via the /api/seed endpoint,
 * then logs in as admin to capture the session cookie.
 */
setup("authenticate as admin", async ({ page }) => {
  // 1. Seed admin user
  const seedRes = await page.request.get("/api/seed");
  expect(seedRes.ok()).toBeTruthy();

  // 2. Navigate to admin login
  await page.goto("/admin/login");
  await expect(page.getByText("Admin Portal")).toBeVisible();

  // 3. Fill credentials
  await page.getByPlaceholder("admin@example.com").fill("dracorig@gmail.com");
  await page.getByPlaceholder("••••••••").fill("X6dc003aKF@drac");

  // 4. Submit
  await page.getByRole("button", { name: /sign in/i }).click();

  // 5. Wait for redirect to /admin dashboard
  await page.waitForURL("**/admin", { timeout: 15000 });
  await expect(page.getByText("Dashboard").first()).toBeVisible();

  // 6. Save the auth state (session cookie)
  await page.context().storageState({ path: adminFile });
});
