import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const outputRoot = path.join(repoRoot, "output", "demo");
const baseURL = process.env.DEMO_BASE_URL || "http://127.0.0.1:3100";

const cues = [];
let timelineMs = 0;

function formatSrtTime(valueMs) {
  const totalMs = Math.max(0, Math.round(valueMs));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const milliseconds = totalMs % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

function addCue(startMs, endMs, text) {
  cues.push({ startMs, endMs, text });
}

async function hold(page, ms) {
  timelineMs += ms;
  await page.waitForTimeout(ms);
}

async function smoothWheel(page, distance, steps = 6, waitMs = 220) {
  const step = distance / steps;
  for (let index = 0; index < steps; index += 1) {
    await page.mouse.wheel(0, step);
    await hold(page, waitMs);
  }
}

async function typeSlow(locator, value) {
  for (const char of value) {
    await locator.type(char, { delay: 90 });
  }
}

async function main() {
  const sessionId = new Date().toISOString().replace(/[:.]/g, "-");
  const videoRoot = path.join(outputRoot, "raw", sessionId);
  await fs.mkdir(videoRoot, { recursive: true });
  console.log(`Recording demo from ${baseURL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    screen: { width: 1600, height: 900 },
    recordVideo: {
      dir: videoRoot,
      size: { width: 1600, height: 900 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  addCue(0, 3500, "星点评首页：先看聚合入口，再进入目录检索。");
  await hold(page, 1800);
  await smoothWheel(page, 580, 4, 260);
  addCue(3500, 7600, "首页同时展示常用分类和精选工具，适合演示站点的信息组织。");
  await smoothWheel(page, 420, 3, 240);
  await hold(page, 1000);

  console.log("Navigating to draft tools directory");
  await page.goto(`${baseURL}/tools?status=draft&view=latest`, { waitUntil: "domcontentloaded" });
  addCue(7600, 11800, "切到草稿数据后，目录会展示完整待审库，而不是只看已发布内容。");
  await hold(page, 1800);

  const searchInput = page.locator('input[name="q"]').first();
  await searchInput.click();
  await hold(page, 500);
  await typeSlow(searchInput, "Wolfram");
  addCue(11800, 16200, "通过关键词检索，能快速从两千多条草稿里定位目标工具。");
  await hold(page, 600);
  await searchInput.press("Enter");
  await page.waitForURL(/\/tools\?/);
  await page.waitForLoadState("domcontentloaded");
  await hold(page, 1600);

  const detailLink = page.locator('a[href="/tools/wolframalpha"]').first();
  console.log("Opening tool detail");
  await detailLink.click();
  await page.waitForURL(/\/tools\/wolframalpha$/);
  await page.waitForLoadState("domcontentloaded");
  addCue(16200, 20900, "详情页保留工具摘要、状态、标签和同类工具，方便做人工审核与发布判断。");
  await hold(page, 1800);

  await smoothWheel(page, 760, 5, 260);
  addCue(20900, 25500, "继续下滑可以看到简介、标签，以及右侧的同类工具推荐。");
  await hold(page, 1000);

  const backToList = page.locator('a[href="/tools"]').nth(1);
  if (await backToList.count()) {
    await backToList.click();
    await page.waitForURL(/\/tools$/);
    await page.waitForLoadState("domcontentloaded");
  } else {
    await page.goto(`${baseURL}/tools?status=draft&view=latest`, { waitUntil: "domcontentloaded" });
  }
  addCue(25500, 30000, "回到列表后，可以继续按分类、标签和排序做二次筛选。");
  await hold(page, 1500);

  const categoryLink = page.locator('a[href*="category=ai"]').first();
  if (await categoryLink.count()) {
    await categoryLink.click();
    await page.waitForLoadState("domcontentloaded");
    await hold(page, 1600);
  }
  addCue(30000, 34600, "这套流程适合现场演示数据检索、内容审核和目录运营三类能力。");

  await hold(page, 1800);

  await context.close();
  await browser.close();

  const [videoFile] = await fs.readdir(videoRoot);
  const rawVideoPath = path.join(videoRoot, videoFile);
  const finalRawVideoPath = path.join(outputRoot, "system-demo-raw.webm");
  await fs.copyFile(rawVideoPath, finalRawVideoPath);

  const srtContent = cues
    .map((cue, index) => `${index + 1}\n${formatSrtTime(cue.startMs)} --> ${formatSrtTime(cue.endMs)}\n${cue.text}\n`)
    .join("\n");

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseURL,
    durationMs: timelineMs,
    rawVideoPath: finalRawVideoPath,
    subtitlesPath: path.join(outputRoot, "system-demo.srt"),
    cues,
  };

  await fs.writeFile(path.join(outputRoot, "system-demo.srt"), srtContent, "utf8");
  await fs.writeFile(path.join(outputRoot, "system-demo-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Raw video saved to ${finalRawVideoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
