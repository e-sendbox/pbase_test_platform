const { test, expect } = require("@playwright/test");

test.describe("Login Flow", () => {
  test("user can login with valid credentials", async ({ page }) => {
    await page.goto("/");

    // Navigate to login
    await page.click("text=Sign in");
    await expect(page).toHaveURL(/.*login.*/);

    // Fill in credentials (using seeded user)
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to home
    await page.waitForURL("/");

    // Verify logged in state - user menu should be visible
    await expect(page.locator("text=New Article")).toBeVisible();
    await expect(page.locator("text=Settings")).toBeVisible();

    // Sign in/up links should not be visible
    await expect(page.locator("text=Sign in")).not.toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=/error/i")).toBeVisible({ timeout: 5000 });
  });
});
