// Captures full-page screenshots of the running Hyrd stack into docs/img/.
// Run inside a temporary node container that joins the compose network:
//   docker run --rm --network 280finalproject_default \
//     -v "$PWD/docs:/work" -w /work mcr.microsoft.com/playwright:v1.48.2-jammy \
//     node capture-screenshots.mjs
import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE = "http://web:3000"; // service hostname on the compose network
const OUT = "/work/img";
const VIEW = { width: 1440, height: 900 };

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: 2, // retina-quality screenshots
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
});
const page = await context.newPage();

async function shoot(name) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  // Let fonts, page-transition fade, stagger, and the gauge count-up settle.
  // Longest animation in the app is RadialGauge at 1200ms; wait 1800ms.
  await page.waitForTimeout(1800);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`✓ ${name}.png`);
}

// 1. Sign-in page (unauthenticated)
console.log("→ /sign-in");
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await shoot("01-sign-in");

// 2. Sign in.
console.log("→ submit credentials");
await page.fill('input[name="email"]', "demo@sjsu.edu");
await page.fill('input[name="password"]', "demo1234");
await Promise.all([
  page.waitForURL(/\/dashboard/, { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);

// 3. Dashboard.
console.log("→ /dashboard");
await page.waitForTimeout(1500); // let server-rendered data settle
await shoot("02-dashboard");

// 4. Optimizer input.
console.log("→ /optimize");
await page.goto(`${BASE}/optimize`);
await shoot("03-optimizer-input");

// 5. Kanban.
console.log("→ /jobs");
await page.goto(`${BASE}/jobs`);
await shoot("04-kanban");

// 6. Performance dashboard (Stripe interview, seeded). Drill in via direct URL
// using the first /performance/* href from the list page.
console.log("→ /performance (list)");
await page.goto(`${BASE}/performance`);
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(800);

const perfHref = await page
  .locator('a[href^="/performance/"]')
  .first()
  .getAttribute("href");
if (perfHref) {
  console.log(`→ ${perfHref}`);
  await page.goto(`${BASE}${perfHref}`);
  await shoot("05-performance-dashboard");
} else {
  console.log("  (no completed interview to drill into)");
}

// 7. Pre-call lobby. Pull a Stripe/Notion job id from the data API directly so
// we don't have to wait for kanban + drawer + click to all finish.
console.log("→ /interview/<job>");
const jobsRes = await page.request.get(
  "http://kong:8000/rest/v1/jobs?status=eq.interview&select=id&limit=1",
  {
    headers: {
      apikey: process.env.ANON_KEY ?? "",
      Authorization: `Bearer ${process.env.ANON_KEY ?? ""}`,
    },
  },
);
let interviewJobId = null;
if (jobsRes.ok()) {
  const data = await jobsRes.json();
  interviewJobId = data?.[0]?.id ?? null;
}
// Fallback: scrape from the jobs page DOM.
if (!interviewJobId) {
  await page.goto(`${BASE}/jobs`);
  await page.waitForTimeout(1000);
  const drawerLink = await page
    .locator('a[href^="/interview/"]')
    .first()
    .getAttribute("href");
  if (drawerLink) interviewJobId = drawerLink.replace("/interview/", "");
}
if (interviewJobId) {
  console.log(`  job id: ${interviewJobId}`);
  await page.goto(`${BASE}/interview/${interviewJobId}`);
  await shoot("06-interview-lobby");
}

await browser.close();
console.log("Done.");
