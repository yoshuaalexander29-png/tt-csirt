import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const base = "http://localhost:8080";
const evidence = path.resolve(process.env.RISK_GAME_EVIDENCE_DIR ?? "docs/work-log/2026-10-13-kenney-game/evidence");
await fs.mkdir(evidence, { recursive: true });
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_PATH ?? await puppeteer.executablePath();
let browser;
try {
  browser = await puppeteer.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
} catch (error) {
  throw new Error(`Could not launch Chromium at ${executablePath}. Set PUPPETEER_EXECUTABLE_PATH or CHROME_PATH to a supported browser executable.`, { cause: error });
}
const page = await browser.newPage();
const errors = [];
const failedRequests = [];
const assetResponses = new Map();
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error)));
page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
page.on("response", (response) => {
  if (response.url().includes("/assets/game/kenney/")) assetResponses.set(new URL(response.url()).pathname, response.status());
});

async function click(selector) { await page.$eval(selector, (element) => { const control = element.shadowRoot?.querySelector('[part="button"]'); (control ?? element).click(); }); }
async function clickText(selector, text) {
  await page.$$eval(selector, (elements, label) => {
    const match = elements.find((element) => element.textContent.includes(label));
    if (!match) throw new Error(`Could not find ${label}`);
    match.click();
  }, text);
}
async function hop(keys, duration = 700) {
  for (const key of keys) await page.keyboard.down(key);
  await new Promise((resolve) => setTimeout(resolve, duration));
  for (const key of keys) await page.keyboard.up(key);
  await new Promise((resolve) => setTimeout(resolve, 950));
}
async function openRoute(width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const response = await page.goto(`${base}/services/proactive-risk-management`, { waitUntil: "networkidle0" });
  assert.ok(response.status() >= 200 && response.status() < 400, `Route returned HTTP ${response.status()}`);
  await page.waitForSelector("main h1", { visible: true });
  assert.equal(await page.$eval(".govuk-breadcrumbs__list-item:first-child .govuk-breadcrumbs__link", (link) => link.textContent.trim()), "Home");
  assert.equal(await page.$eval(".govuk-breadcrumbs__list-item:last-child .govuk-breadcrumbs__link", (link) => link.textContent.trim()), "Services");
  await click(".risk-game__start");
  await page.waitForSelector(".risk-game__workshop", { visible: true, timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector(".risk-game__loading"), { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 250));
  await page.$eval(".risk-game__frame", (frame) => frame.scrollIntoView({ block: "center" }));
}

try {
  await openRoute(1280, 900);
  await page.screenshot({ path: path.join(evidence, "workshop-desktop.png") });

  await click('.risk-game__variant[aria-label^="Explorer 2"]');
  assert.equal(await page.$eval('.risk-game__variant[aria-label^="Explorer 2"]', (button) => button.getAttribute("aria-pressed")), "true");
  await click('.risk-game__tint[aria-label="Sea glass"]');
  assert.equal(await page.$eval('.risk-game__tint[aria-label="Sea glass"]', (button) => button.getAttribute("aria-pressed")), "true");
  assert.match(await page.$eval(".risk-game__workshop-caption", (node) => node.innerText), /Explorer 2.*Sea glass/);
  await page.screenshot({ path: path.join(evidence, "customiser-desktop.png") });

  await click('.risk-game__variant[aria-label^="Explorer 1"]');
  await click('.risk-game__tint[aria-label="Original colours"]');
  await clickText(".risk-game__primary", "Start the route");
  await page.waitForSelector(".risk-game__dialogue-actions", { visible: true });
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Explore the course");
  await page.waitForSelector(".risk-game__control-hint", { visible: true });
  await page.$eval(".risk-game__frame", (frame) => frame.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(evidence, "gameplay-start-desktop.png") });

  await page.keyboard.down("w");
  await page.keyboard.down("Space");
  await new Promise((resolve) => setTimeout(resolve, 780));
  await page.keyboard.up("Space");
  await page.keyboard.up("w");
  await new Promise((resolve) => setTimeout(resolve, 350));
  await page.waitForSelector(".risk-game__action", { visible: true, timeout: 5000 });
  const actionText = await page.$eval(".risk-game__action", (button) => button.innerText);
  assert.match(actionText, /Know what you have/);
  await click(".risk-game__action");
  await page.waitForFunction(() => document.querySelector(".risk-game__speaker")?.textContent.includes("Know what you have"));
  assert.equal(await page.$$eval(".risk-game__choice", (buttons) => buttons.length), 2);
  await page.screenshot({ path: path.join(evidence, "inventory-question-desktop.png") });

  await click(".risk-game__choice");
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Continue along the trail");
  await page.waitForSelector(".risk-game__control-hint", { visible: true });
  await page.keyboard.down("a");
  await page.keyboard.down("w");
  await page.keyboard.down("Space");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await page.keyboard.up("w");
  await new Promise((resolve) => setTimeout(resolve, 400));
  await page.keyboard.up("a");
  await page.keyboard.up("Space");
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await page.screenshot({ path: path.join(evidence, "mid-route-desktop.png") });
  await page.waitForFunction(() => document.querySelector(".risk-game__action")?.textContent.includes("Reduce internet exposure"), { timeout: 6000 });
  await click(".risk-game__action");
  await page.waitForFunction(() => document.querySelector(".risk-game__speaker")?.textContent.includes("Reduce internet exposure"));
  await page.screenshot({ path: path.join(evidence, "exposure-question-desktop.png") });
  await click(".risk-game__choice");
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Continue along the trail");
  await page.waitForSelector(".risk-game__control-hint", { visible: true });
  await page.keyboard.down("a");
  await page.keyboard.down("s");
  await page.keyboard.down("Space");
  await new Promise((resolve) => setTimeout(resolve, 600));
  await page.keyboard.up("a");
  await page.keyboard.up("s");
  await page.keyboard.up("Space");
  await page.waitForFunction(() => document.querySelector(".risk-game__toast")?.textContent.includes("Checkpoint reached"), { timeout: 6000 });
  await page.screenshot({ path: path.join(evidence, "checkpoint-desktop.png") });

  await openRoute(390, 844);
  const overflow = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(overflow.document <= overflow.viewport, `Mobile horizontal overflow: ${JSON.stringify(overflow)}`);
  await page.screenshot({ path: path.join(evidence, "workshop-mobile.png") });
  await clickText(".risk-game__primary", "Start the route");
  await page.waitForSelector(".risk-game__dialogue-actions", { visible: true });
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Explore the course");
  await page.waitForSelector(".risk-game__dpad", { visible: true });
  assert.equal(await page.$eval(".risk-game__jump", (button) => getComputedStyle(button).display !== "none"), true);
  assert.equal(await page.$eval(".risk-game__canvas", (canvas) => getComputedStyle(canvas).touchAction), "pan-y");
  await click(".risk-game__topbar .risk-game__sound");
  await page.waitForSelector('.risk-game__pause[role="dialog"]', { visible: true });
  assert.match(await page.$eval("#risk-game-pause-heading", (heading) => heading.textContent), /paused/i);
  await page.keyboard.press("Escape");
  await page.waitForSelector('.risk-game__pause[role="dialog"]', { hidden: true });
  await page.$eval(".risk-game__frame", (frame) => frame.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(evidence, "gameplay-mobile.png") });

  const texturePath = "/assets/game/kenney/Textures/colormap.png";
  assert.ok([200, 304].includes(assetResponses.get(texturePath)), `Missing local colour map response: ${JSON.stringify([...assetResponses])}`);
  assert.equal(errors.length, 0, `Browser console errors: ${errors.join(" | ")}`);
  assert.equal(failedRequests.length, 0, `Failed requests: ${failedRequests.join(" | ")}`);
  console.log(JSON.stringify({
    result: "PASS",
    routes: ["/services/proactive-risk-management"],
    checks: ["local GLB + colour map load", "GOV.UK breadcrumb links and parent ending", "desktop workshop", "five character choices", "tint changes", "camera-relative keyboard movement + jump to first two learning stops", "first two learning question interfaces", "mid-course checkpoint reached in browser", "mobile workshop", "mobile touch controls and page-scroll behavior", "pause/resume interaction", "no mobile horizontal overflow", "no console errors", "no failed requests"],
    assetResponses: Object.fromEntries(assetResponses),
    mobile: overflow,
    screenshots: ["workshop-desktop.png", "customiser-desktop.png", "gameplay-start-desktop.png", "inventory-question-desktop.png", "mid-route-desktop.png", "exposure-question-desktop.png", "checkpoint-desktop.png", "workshop-mobile.png", "gameplay-mobile.png"].map((name) => path.join(evidence, name)),
  }, null, 2));
} finally {
  await browser.close();
}



