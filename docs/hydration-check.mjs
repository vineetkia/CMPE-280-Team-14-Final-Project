import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message.slice(0, 240)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("[console:error] " + m.text().slice(0, 240));
});

console.log("→ /sign-in");
await page.goto("http://web:3000/sign-in", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

console.log("→ submit credentials");
await page.fill('input[name="email"]', "demo@sjsu.edu");
await page.fill('input[name="password"]', "demo1234");
await Promise.all([
  page.waitForURL(/dashboard/, { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(1500);
console.log("  on", page.url());
const dashContent = await page.locator("h1").first().innerText().catch(() => "(none)");
console.log("  h1:", dashContent.slice(0, 80));

for (const route of ["/jobs", "/optimize", "/performance", "/dashboard"]) {
  console.log(`→ click sidebar → ${route}`);
  // Use the sidebar link — this is the path that failed for the user.
  const link = page.locator(`a[href="${route}"]`).first();
  if ((await link.count()) > 0) {
    await link.click();
  } else {
    await page.goto(`http://web:3000${route}`);
  }
  await page
    .waitForURL(new RegExp(route.replace(/\//g, "\\/")), { timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const headlineVisible = await page
    .locator("h1, [class*='serif']")
    .first()
    .isVisible()
    .catch(() => false);
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const isBlank = bodyText.trim().length < 80;
  console.log(`  visible: ${headlineVisible}, blank: ${isBlank}, body length: ${bodyText.length}`);
}

console.log("\n=== errors caught ===");
if (errors.length === 0) console.log("  ✓ none");
else errors.forEach((e) => console.log("  " + e));
await browser.close();
