const { test, expect } = require("@playwright/test");

test.describe("Article Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("logged-in user can create a new article", async ({ page }) => {
    // Navigate to new article page
    await page.click("text=New Article");
    await expect(page).toHaveURL(/.*editor.*/);

    // Fill in article details
    const timestamp = Date.now();
    await page.fill(
      'input[placeholder*="Article Title"]',
      `Test Article ${timestamp}`,
    );
    await page.fill(
      'input[placeholder*="about"]',
      "This is a test article description",
    );
    await page.fill(
      'textarea[placeholder*="Write your article"]',
      "This is the body of the test article. It contains some content for testing purposes.",
    );
    await page.fill('input[placeholder*="Enter tags"]', "test");
    await page.keyboard.press("Enter");

    // Publish article
    await page.click('button[type="button"]:has-text("Publish Article")');

    // Should navigate to article page
    await expect(page).toHaveURL(/.*article.*/);

    // Verify article content
    await expect(page.locator(`text=Test Article ${timestamp}`)).toBeVisible();
    await expect(
      page.locator("text=This is a test article description"),
    ).toBeVisible();
  });

  test("can view existing articles", async ({ page }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector(".article-preview", { timeout: 10000 });

    // Check that articles are displayed
    const articles = await page.locator(".article-preview").count();
    expect(articles).toBeGreaterThan(0);

    // Click on first article
    await page.locator(".article-preview").first().click();

    // Should navigate to article page
    await expect(page).toHaveURL(/.*article.*/);
  });
});
