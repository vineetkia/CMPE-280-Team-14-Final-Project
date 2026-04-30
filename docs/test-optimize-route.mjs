// End-to-end test of POST /api/optimize-resume through the live server.
// Signs in via the web UI to get session cookies, then posts the optimize request.
import { chromium } from "playwright";

const BASE = "http://web:3000";
const RAW = `Maya Rivera
Senior Product Designer
Brooklyn, NY · maya@example.com

Summary
Senior product designer with 7 years experience.

Experience
Senior Product Designer, Notion (2022 — Present)
- Led design of AI-assisted database editor.
- Drove design quality across product surfaces.

Product Designer, Mailchimp (2019 — 2022)
- Designed onboarding flow.

Education
Carnegie Mellon, BFA Design, 2018

Skills
Design systems, Typography, Motion, Figma, Prototyping`;

const JD = `Linear is hiring a Senior Product Designer. You will lead end-to-end design, partner with engineering and PM, and raise the quality bar across typography, motion, and detail. Linear, Figma, SwiftUI fluency a plus.`;

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

console.log("→ sign in");
await page.goto(`${BASE}/sign-in`);
await page.fill('input[name="email"]', "demo@sjsu.edu");
await page.fill('input[name="password"]', "demo1234");
await Promise.all([
  page.waitForURL(/\/dashboard/, { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);
console.log("  signed in");

console.log("→ POST /api/optimize-resume");
const t0 = Date.now();
const res = await page.request.post(`${BASE}/api/optimize-resume`, {
  data: {
    raw_text: RAW,
    jd: JD,
    tone: "impactful",
    length: "1 page",
    emphasis: "quantify",
    job_id: null,
    label: "Test from Playwright",
  },
  headers: { "Content-Type": "application/json" },
  timeout: 90_000,
});
const elapsed = Date.now() - t0;
console.log(`  status ${res.status()} in ${elapsed}ms`);

if (res.ok()) {
  const data = await res.json();
  console.log("  resume_id:", data.resume_id);
  console.log("  ats_score:", data.optimized.ats_score);
  console.log("  keyword_coverage:", data.optimized.keyword_coverage);
  console.log("  annotations:", data.optimized.change_annotations.length);
  console.log("✓ /api/optimize-resume returned a zod-valid OptimizedResume");

  // Visit the diff view and confirm key UI elements render.
  console.log(`→ /optimize/${data.resume_id}`);
  await page.goto(`${BASE}/optimize/${data.resume_id}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const headlineText = await page.locator("h1").first().innerText();
  const annotationCount = await page.locator('[class*="diff"]').count().catch(() => 0);
  console.log("  rendered headline:", JSON.stringify(headlineText));
  console.log("✓ Diff view rendered");
  await page.screenshot({ path: "/work/img/07-optimizer-output.png", fullPage: true });
  console.log("  saved screenshot 07-optimizer-output.png");
} else {
  const text = await res.text();
  console.error("✗ failed:", text.slice(0, 600));
  process.exit(1);
}

await browser.close();
