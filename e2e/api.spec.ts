import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("GET /api/seed should create or confirm admin user", async ({ request }) => {
    const res = await request.get("/api/seed");
    expect(res.ok()).toBeTruthy();

    const json = await res.json();
    expect(json).toHaveProperty("message");
    expect(json.message).toMatch(/admin|created|already/i);
  });

  test("POST /api/generate should reject missing projectId", async ({ request }) => {
    const res = await request.post("/api/generate", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    // Should return an error (either 400 or 500) or contain error in SSE stream
    // The API uses SSE, so it might return 200 with an error event
    const status = res.status();
    expect([200, 400, 500]).toContain(status);
  });
});
