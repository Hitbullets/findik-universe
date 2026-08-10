import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("ana deneyim açılır ve temel erişilebilirlik taramasını geçer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Fındık dünyası bölümleri" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
});

test("production profili yalnız teslim kapsamını gösterir", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Tramvay" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hikâye" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Harita" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adventure Studio" })).toHaveCount(0);
  await page.getByRole("button", { name: "Yerel ayarlar" }).first().click();
  await expect(page.getByText(/Hesap, bulut yedekleme/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Sihirli bağlantı/ })).toHaveCount(0);
});

test("Tramvay ödülü reload sonrası korunur ve reset atomiktir", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tramvay" }).click();
  await page.getByRole("button", { name: /Tramvay Hattı/ }).click();
  await page.getByRole("button", { name: "Güneş alan pencere" }).click();
  await expect(page.getByText(/Görev tamam/)).toBeVisible();
  await page.getByRole("button", { name: "Anıya dön" }).click();
  await page.getByRole("button", { name: "Albüm" }).click();
  await expect(page.getByRole("article").getByText(/İlk tramvay hattı görevi/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Albüm" }).click();
  await expect(page.getByRole("article").getByText(/İlk tramvay hattı görevi/)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Yerel ayarlar" }).first().click();
  await page.getByRole("button", { name: /ilerlemeyi sıfırla/ }).click();
  await page.reload();
  await page.getByRole("button", { name: "Albüm" }).click();
  await expect(page.getByText(/Tramvay Macerası'nı tamamladığında/)).toBeVisible();
});

for (const viewport of [{ width: 320, height: 700 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}x${viewport.height} görünümünde yatay taşma yok`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBe(dimensions.client);
  });
}

test("service worker app shell ile çevrimdışı yeniden açılışı destekler", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Playwright WebKit service worker desteklemez.");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
