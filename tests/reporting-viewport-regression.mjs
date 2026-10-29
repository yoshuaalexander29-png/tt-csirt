import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:8080";
const tolerancePx = 2;

async function waitForQuestion(page, text) {
  await page.waitForFunction(
    (expected) => {
      const heading = document.querySelector("#incident-reporting-heading");
      return heading && heading.innerText.includes(expected);
    },
    { timeout: 8000 },
    text
  );
}

async function readAnchorPositions(page) {
  return page.evaluate(() => {
    const breadcrumb = document.querySelector(".app-breadcrumb-bar gcds-breadcrumbs");
    const heading = document.querySelector("#incident-reporting-heading");
    if (!breadcrumb || !heading) {
      throw new Error("Expected reporting breadcrumb and question heading to exist");
    }
    return {
      breadcrumbTop: breadcrumb.getBoundingClientRect().top,
      headingTop: heading.getBoundingClientRect().top,
    };
  });
}

function assertStable(actual, baseline, label) {
  for (const key of ["breadcrumbTop", "headingTop"]) {
    assert.ok(
      Math.abs(actual[key] - baseline[key]) <= tolerancePx,
      `${label}: ${key} moved from ${baseline[key].toFixed(2)}px to ${actual[key].toFixed(2)}px`
    );
  }
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

try {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 375, height: 812 },
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/report-an-incident`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#start-incident-report-button", { visible: true });
    await page.click("#start-incident-report-button");
    await waitForQuestion(page, "What type of incident are you reporting?");

    const baseline = await readAnchorPositions(page);
    assert.ok(
      Math.abs(baseline.breadcrumbTop - 45) <= tolerancePx,
      `breadcrumb should start at 45px; got ${baseline.breadcrumbTop.toFixed(2)}px at ${viewport.width}px viewport`
    );

    await page.select("#incident-type", "Ransomware");
    await page.click("#continue-button-step-1");
    await waitForQuestion(page, "When did the incident occur");
    assertStable(await readAnchorPositions(page), baseline, "forward to step 2");

    await page.click("#incident-timing-unknown");
    await page.click("#continue-button-step-2");
    await waitForQuestion(page, "What happened?");
    assertStable(await readAnchorPositions(page), baseline, "forward to step 3");

    await page.click("#incident-details-unknown");
    await page.click("#continue-button-step-3");
    await waitForQuestion(page, "Which systems, services or equipment");
    assertStable(await readAnchorPositions(page), baseline, "forward to step 4");

    await page.click("#form-back-button");
    await waitForQuestion(page, "What happened?");
    assertStable(await readAnchorPositions(page), baseline, "back to step 3");

    console.log(`PASS viewport stability at ${viewport.width}x${viewport.height}`);
    await page.close();
  }
} finally {
  await browser.close();
}
