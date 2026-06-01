import { test, expect } from "@playwright/test";

test.describe("auth routing", () => {
  test("customer login page keeps customer-only navigation", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Hesabina giris yap" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Musteri hesabi olustur" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sifremi unuttum" })).toBeVisible();
    await expect(page.getByText("Bu ekran sadece musteri hesaplari icin.")).toBeVisible();
  });

  test("admin login page stays separate from customer auth flow", async ({ page }) => {
    await page.goto("/admin-login");

    await expect(page.getByRole("heading", { name: "Admin girisi", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Musteri girisi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Uye ol" })).toBeVisible();
  });

  test("legacy admin login route redirects to admin-login", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin-login$/);
  });

  test("protected customer pages redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/account/addresses");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("protected admin pages redirect unauthenticated users to admin-login", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin-login$/);
  });
});
