import { test, expect } from "@playwright/test";

test.describe("password reset surfaces", () => {
  test("forgot password accepts a registered email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByPlaceholder("E-posta").fill(`forgot-e2e-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Sifirlama baglantisi gonder" }).click();

    await expect(
      page.getByText("E-posta adresi kayitliysa sifirlama baglantisi gonderilecektir.")
    ).toBeVisible();
  });

  test("reset password page shows missing token state without token", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByRole("heading", { name: "Baglanti eksik" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Yeni baglanti iste" })).toBeVisible();
  });
});
