import { test, expect } from "@playwright/test";

test("guest checkout can create an order from seeded product", async ({ page }) => {
  await page.goto("/products/manyetik-premium-telefon-standi");
  const addToCartButton = page.getByRole("button", { name: /Sepete ekle|Ekleniyor.../ });
  await addToCartButton.click();
  await expect(page.locator('a[aria-label="Sepet"] span')).toHaveText("1", { timeout: 10000 });

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /^Sepet$/ })).toBeVisible();
  await expect(page.getByText("Manyetik Premium Telefon Standi")).toBeVisible();

  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Misafir checkout aktif")).toBeVisible();

  await page.getByPlaceholder("Teslim alacak kisi").fill("E2E Misafir");
  await page.getByPlaceholder("E-posta adresi").fill("guest-e2e@example.com");
  await page.getByPlaceholder("Telefon numarasi").fill("05551234567");
  await page.getByPlaceholder("Sehir").fill("Van");
  await page.getByPlaceholder("Ilce").fill("Ipekyolu");
  await page.getByPlaceholder("Mahalle, sokak, bina ve daire bilgisi").fill(
    "Bahcivan Mahallesi Test Sokak No: 10 Daire: 2"
  );
  await page.getByPlaceholder("Kurye, teslimat veya operasyon notu").fill("E2E guest checkout");

  await page.getByRole("button", { name: "Siparisi olustur" }).click();

  await expect(page).toHaveURL(/\/orders\/.+\/success\?access=/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Siparis alindi" })).toBeVisible();
  await expect(page.getByText("Misafir siparisi icin bu sayfayi kaydedebilirsin")).toBeVisible();
});
