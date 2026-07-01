/**
 * update-quote.js
 * Picks a quote deterministically based on the day of the year,
 * then writes it into README.md between the QUOTE_START / QUOTE_END markers.
 * Run daily by the GitHub Action in .github/workflows/update-quote.yml
 */

const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "..", "README.md");
const QUOTES_PATH = path.join(__dirname, "quotes.json");

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function main() {
  const quotes = JSON.parse(fs.readFileSync(QUOTES_PATH, "utf8"));
  const today = new Date();
  const dayIndex = getDayOfYear(today) % quotes.length;
  const quote = quotes[dayIndex];

  const block = [
    "<!--QUOTE_START-->",
    "```",
    `"${quote.text}"`,
    `                                              — ${quote.author}, ${quote.role}`,
    "```",
    "<!--QUOTE_END-->",
  ].join("\n");

  const readme = fs.readFileSync(README_PATH, "utf8");
  const pattern = /<!--QUOTE_START-->[\s\S]*?<!--QUOTE_END-->/;

  if (!pattern.test(readme)) {
    console.error("QUOTE_START / QUOTE_END markers not found in README.md");
    process.exit(1);
  }

  const updated = readme.replace(pattern, block);
  fs.writeFileSync(README_PATH, updated, "utf8");
  console.log(`Quote updated for day ${dayIndex}: "${quote.text}" — ${quote.author}`);
}

main();