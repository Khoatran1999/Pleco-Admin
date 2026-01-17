import { test, expect } from "@playwright/test";

test("app navigation flow", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page).toHaveTitle(/FishMarket/i);

  // Click on Reports in sidebar
  await page.click("text=Reports");
  await expect(page.locator("h2")).toContainText("Sales & Inventory Reports");

  // Open Inventory
  await page.click("text=Inventory");
  await expect(page.locator("h2")).toContainText("Inventory");
});
