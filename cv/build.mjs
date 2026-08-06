/**
 * Renders cv/resume.html to public/resume.pdf (served at /resume.pdf).
 *
 * Uses the Chrome/Edge already installed on the machine in headless mode rather
 * than pulling in Puppeteer — this repo doesn't otherwise need a 100MB+ browser
 * download just to print one page.
 *
 * Usage: npm run cv
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "resume.html");
// Filename must stay resume.pdf: the Hero's "Download CV" button links to /resume.pdf.
const output = resolve(here, "..", "public", "resume.pdf");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const browser = CANDIDATES.find((path) => existsSync(path));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to a browser executable and retry.");
  process.exit(1);
}

// Remember what was there before. On Windows a PDF open in a viewer holds a lock on
// the file, and Chrome then fails to overwrite it while STILL exiting 0 — so a run can
// look successful while leaving the previous PDF untouched. Comparing timestamps after
// the fact is the only reliable way to catch that.
const before = existsSync(output) ? statSync(output).mtimeMs : 0;

execFileSync(browser, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer", // no browser-added URL/date furniture in the margins
  `--print-to-pdf=${output}`,
  pathToFileURL(source).href,
], { stdio: ["ignore", "ignore", "pipe"] });

if (!existsSync(output) || statSync(output).mtimeMs <= before) {
  console.error(
    `FAILED: ${output} was not rewritten.\n` +
    "It is almost certainly open in a PDF viewer holding a lock on the file. " +
    "Close it and run again.",
  );
  process.exit(1);
}

// A resume that silently spills onto a second page is the one failure mode worth
// catching automatically, so report the page count rather than assuming it fits.
const pdf = readFileSync(output, "latin1");
const pages = Number((pdf.match(/\/Count\s+(\d+)/) || [])[1] || 0);
console.log(`${output} — ${pages} page(s), ${Math.round(statSync(output).size / 1024)} KB`);
if (pages > 1) console.warn("WARNING: more than one page. Trim content or reduce font-size in resume.html.");
