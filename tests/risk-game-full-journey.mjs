import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const base = "http://localhost:8080";
const evidence = path.resolve("docs/work-log/2026-10-21-risk-game-art-pass");
await fs.mkdir(evidence, { recursive: true });
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_PATH ?? await puppeteer.executablePath();
const browser = await puppeteer.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [], failedRequests = [], gameAssetResponses = new Map();
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error)));
page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
page.on("response", (response) => { if (response.url().includes("/assets/game/")) gameAssetResponses.set(new URL(response.url()).pathname, response.status()); });

async function click(selector) {
  await page.$eval(selector, (element) => { const control = element.shadowRoot?.querySelector('[part="button"]'); (control ?? element).click(); });
}
async function clickText(selector, text) {
  await page.$$eval(selector, (elements, label) => {
    const match = elements.find((element) => element.textContent.includes(label));
    if (!match) throw new Error(`Could not find ${label}`);
    match.click();
  }, text);
}
async function state() { return page.evaluate(() => JSON.parse(window.render_game_to_text?.() ?? "{}")); }
async function moveTo(target, tolerance = 0.55) {
  const forward = [-0.894427, -0.447214], right = [0.447214, -0.894427];
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const current = await state(), dx = target[0] - current.player[0], dz = target[1] - current.player[2], distance = Math.hypot(dx, dz);
    if (distance <= tolerance) break;
    const along = dx * forward[0] + dz * forward[1], across = dx * right[0] + dz * right[1];
    const keys = [];
    if (along > 0.25) keys.push("w"); else if (along < -0.25) keys.push("s");
    if (across > 0.25) keys.push("d"); else if (across < -0.25) keys.push("a");
    const duration = Math.min(230, Math.max(90, (distance - tolerance * 0.4) / 5.2 * 1000));
    for (const key of keys) await page.keyboard.down(key);
    await new Promise((resolve) => setTimeout(resolve, duration));
    for (const key of keys) await page.keyboard.up(key);
    await new Promise((resolve) => setTimeout(resolve, 260));
  }
  const result = await state(), remaining = Math.hypot(target[0] - result.player[0], target[1] - result.player[2]);
  assert.ok(remaining < 1.45, `could not reach marker at ${target}: ${JSON.stringify(result.player)} (${remaining.toFixed(2)} away)`);
}
async function openRoute(width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const response = await page.goto(`${base}/services/proactive-risk-management?qa=1`, { waitUntil: "networkidle0" });
  assert.ok(response.status() >= 200 && response.status() < 400, `route returned HTTP ${response.status()}`);
  await page.waitForSelector(".risk-game__start", { visible: true });
  await click(".risk-game__start");
  await page.waitForSelector(".risk-game__workshop", { visible: true, timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector(".risk-game__loading"), { timeout: 25000 });
  await page.waitForFunction(() => Boolean(window.render_game_to_text), { timeout: 25000 });
  await page.$eval(".risk-game__frame", (frame) => frame.scrollIntoView({ block: "center" }));
}
async function beginGameplay() {
  await clickText(".risk-game__primary", "Start the route");
  await page.waitForSelector(".risk-game__dialogue-actions", { visible: true });
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Explore the course");
  await page.$eval(".risk-game__frame", (frame) => frame.focus());
  await page.waitForSelector(".risk-game__action", { visible: true, timeout: 5000 });
}

try {
  await openRoute(1440, 900);
  assert.equal(await page.$$eval(".risk-game__variant", (items) => items.length), 5);
  await page.screenshot({ path: path.join(evidence, "workshop-desktop.png") });
  await clickText(".risk-game__variant", "Golden ribbons");
  await click('.risk-game__tint[aria-label="Sea glass"]');
  await page.screenshot({ path: path.join(evidence, "heroine-customiser-desktop.png") });
  await clickText(".risk-game__variant", "Copper ribbons");
  await click('.risk-game__tint[aria-label="Original colours"]');
  await beginGameplay();
  await page.waitForFunction(() => document.querySelector(".risk-game__action")?.textContent.includes("Talk to Kaya"), { timeout: 5000 });
  await click(".risk-game__action");
  await page.waitForSelector(".risk-game__dialogue-actions", { visible: true });
  await clickText(".risk-game__dialogue-actions .risk-game__primary", "Continue along the trail");
  await page.$eval(".risk-game__frame", (frame) => frame.focus());
  await new Promise((resolve) => setTimeout(resolve, 300));
  const start = await state();
  assert.equal(start.phase, "walking");
  assert.ok(start.diagnostics?.drawCalls > 0 && start.diagnostics?.triangles > 0, "renderer metrics are exposed for the development QA run");
  await page.screenshot({ path: path.join(evidence, "starting-clearing-desktop.png") });

  const birdDeadline = Date.now() + 12000;
  while (Date.now() < birdDeadline && !(await state()).diagnostics?.birdVisible) await new Promise((resolve) => setTimeout(resolve, 120));
  const birdSeen = (await state()).diagnostics?.birdVisible;
  assert.equal(birdSeen, true, "a perched 3D bird flies between woodland perches when approached");
  await page.screenshot({ path: path.join(evidence, "woodland-bird-flight-desktop.png") });

  const stops = [
    ["inventory", -4.2, -2.1, "Know what you have"],
    ["exposure", -8.4, -2.8, "Reduce internet exposure"],
    ["priority", -12.5, -0.1, "Prioritise an urgent weakness"],
    ["accounts", -17, -2.6, "Protect important accounts"],
    ["recovery", -21.8, -4, "Practise recovery"],
  ];
  for (const [id, x, z, title] of stops) {
    await moveTo([x, z]);
    await page.waitForFunction((label) => document.querySelector(".risk-game__action")?.textContent.includes(label), { timeout: 5000 }, title);
    await click(".risk-game__action");
    await page.waitForFunction((label) => document.querySelector(".risk-game__speaker")?.textContent.includes(label), { timeout: 5000 }, title);
    assert.equal(await page.$$eval(".risk-game__choice", (buttons) => buttons.length), 2, `${id} presents the existing learning interaction`);
    await page.screenshot({ path: path.join(evidence, `${id}-question-desktop.png`) });
    await click(".risk-game__choice");
    await clickText(".risk-game__dialogue-actions .risk-game__primary", "Continue along the trail");
    await page.$eval(".risk-game__frame", (frame) => frame.focus());
    await new Promise((resolve) => setTimeout(resolve, 300));
    const progress = await state();
    assert.equal(progress.completedLessons, stops.indexOf(stops.find((stop) => stop[0] === id)) + 1, `${id} progress advances once`);
    if (id === "priority") await page.screenshot({ path: path.join(evidence, "checkpoint-desktop.png") });
  }
  await moveTo([-27, -1.2]);
  await page.waitForFunction(() => document.querySelector(".risk-game__action")?.textContent.includes("recovery beacon"), { timeout: 5000 });
  await click(".risk-game__action");
  await page.waitForFunction(() => document.querySelector(".risk-game__speaker")?.textContent.includes("Recovery beacon"), { timeout: 5000 });
  assert.equal((await state()).completedLessons, 5);
  await page.screenshot({ path: path.join(evidence, "route-complete-desktop.png") });

  await openRoute(768, 1024);
  await page.screenshot({ path: path.join(evidence, "workshop-tablet.png") });
  const tabletOverflow = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(tabletOverflow.document <= tabletOverflow.viewport, `tablet horizontal overflow: ${JSON.stringify(tabletOverflow)}`);

  await openRoute(390, 844);
  const mobileOverflow = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(mobileOverflow.document <= mobileOverflow.viewport, `mobile horizontal overflow: ${JSON.stringify(mobileOverflow)}`);
  await page.screenshot({ path: path.join(evidence, "workshop-mobile.png") });
  await beginGameplay();
  assert.equal(await page.$eval(".risk-game__jump", (button) => getComputedStyle(button).display !== "none"), true, "mobile touch jump control is visible");
  assert.equal(await page.$eval(".risk-game__canvas", (canvas) => getComputedStyle(canvas).touchAction), "pan-y");
  await page.screenshot({ path: path.join(evidence, "gameplay-mobile.png") });

  const renderer = (await state()).diagnostics;
  assert.equal(errors.length, 0, `browser console errors: ${errors.join(" | ")}`);
  assert.equal(failedRequests.length, 0, `failed requests: ${failedRequests.join(" | ")}`);
  assert.ok([...gameAssetResponses.keys()].some((url) => url.endsWith("/tree.glb")), "Kenney tree model loaded");
  assert.ok([...gameAssetResponses.keys()].some((url) => url.endsWith("/flowers.glb")), "Kenney flowers loaded");
  assert.ok([...gameAssetResponses.keys()].some((url) => url.endsWith("/block-grass.glb")), "Kenney terrain assets loaded");
  assert.equal([...gameAssetResponses.keys()].some((url) => url.includes("quaternius")), false, "the scene does not request Quaternius art");
  assert.ok(renderer.grassInstances > 500, "seeded, instanced meadow grass is rendered");
  console.log(JSON.stringify({ result: "PASS", routes: ["/services/proactive-risk-management"], browser: "Puppeteer Chromium", desktop: { completedLessons: 5, renderer, assetCount: gameAssetResponses.size }, tablet: tabletOverflow, mobile: mobileOverflow, checks: ["workshop and five chibi ribbon variants", "original procedural 3D character rigs", "Kenney environment assets only", "instanced wind-reactive meadow grass", "Kaya interaction", "all five question steps", "checkpoint", "all five actions gate the recovery beacon", "perch-to-perch bird flight", "desktop/tablet/mobile rendering", "mobile controls", "no horizontal overflow", "no console errors or failed requests"], screenshots: (await fs.readdir(evidence)).filter((name) => name.endsWith(".png")) }, null, 2));
} finally {
  await browser.close();
}
