import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { detectFlags } from "../../backend/src/detectFlags";
import { SAMPLE_LATE_FEE_CLAUSE, SAMPLE_LEASE_TEXT } from "../src/lib/samples";

for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test(`shows a cited finding before input at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const preview = page.getByRole("figure", { name: /Sample lease · Clause 3/ });
    await expect(preview).toBeInViewport({ ratio: 1 });
    await expect(preview.locator("blockquote")).toHaveText(SAMPLE_LATE_FEE_CLAUSE);
    const [flag] = detectFlags(SAMPLE_LATE_FEE_CLAUSE);
    await expect(preview.getByText(flag.label, { exact: true })).toBeVisible();
    await expect(preview).toContainText("by the 5th, this clause adds $75 plus $10 per day");
    await expect(page.getByRole("link", { name: "Check my lease" })).toBeInViewport({ ratio: 1 });
    await expect(page.getByLabel("Paste your lease text")).toHaveValue("");
    expect(await page.locator("body").innerText()).not.toContain("—");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const audit = await new AxeBuilder({ page }).analyze();
    expect(audit.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    await page.screenshot({ path: info.outputPath(`home-${width}.png`) });
  });
}

test("lets a renter check the source and submit only on request", async ({ page }) => {
  const inputs: string[] = [];
  await page.route("**/analyze", async route => {
    inputs.push(route.request().postDataJSON().text);
    await route.fulfill({ json: { flags: [], summaryBullets: ["Fixture result"] } });
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Check my lease" }).click();
  await expect(page.getByLabel("Paste your lease text")).toBeFocused();
  await page.getByRole("button", { name: "Analyze Lease" }).click();
  await expect(page.getByText("Please paste your lease text.")).toBeVisible();
  await page.getByRole("button", { name: "Use sample text" }).click();
  expect(SAMPLE_LEASE_TEXT).toContain("3. Late Fees. " + SAMPLE_LATE_FEE_CLAUSE);
  await expect(page.getByLabel("Paste your lease text")).toHaveValue(SAMPLE_LEASE_TEXT);
  expect(inputs).toEqual([]);
  await page.getByRole("button", { name: "Analyze Lease" }).click();
  await expect(page.getByText("Fixture result")).toBeVisible();
  expect(inputs).toEqual([SAMPLE_LEASE_TEXT]);
});

test("serves home metadata and crawl files", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Termsplain.*lease clauses and fees/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /sample late fee/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://termsplain.com/");
  for (const [file, marker] of [["robots.txt", "Sitemap: https://termsplain.com/sitemap.xml"], ["sitemap.xml", "<loc>https://termsplain.com/</loc>"]]) {
    const response = await request.get("/" + file);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(marker);
  }
});

test("disclaimer meets 4.5 to 1 contrast on its form", async ({ page }) => {
  await page.goto("/");
  const colors = await page.locator("form .disclaimer").first().evaluate(el => [
    getComputedStyle(el).color,
    getComputedStyle(el.closest("form")!).backgroundColor,
  ]);
  const luminance = (css: string) => {
    const [r, g, b] = css.match(/\d+/g)!.map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [dark, light] = colors.map(luminance).sort((a, b) => a - b);
  const contrast = (light + 0.05) / (dark + 0.05);
  console.log(`Disclaimer contrast ${contrast.toFixed(2)}:1 (${colors.join(" on ")})`);
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
