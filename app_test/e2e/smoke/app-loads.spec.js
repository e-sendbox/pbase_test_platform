const { test, expect } = require("@playwright/test");

test.describe("Application Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/conduit/i);

    // Check for main navigation elements
    await expect(page.locator("nav")).toBeVisible();

    // Check for sign in link
    await expect(page.locator("text=Sign in")).toBeVisible();
    await expect(page.locator("text=Sign up")).toBeVisible();
  });

  test("can navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click sign in
    await page.click("text=Sign in");

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("can navigate to register page", async ({ page }) => {
    await page.goto("/");

    // Click sign up
    await page.click("text=Sign up");

    // Verify we're on the register page
    await expect(page).toHaveURL(/.*register.*/);
    await expect(page.locator('input[placeholder*="Username"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
