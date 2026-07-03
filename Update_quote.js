/**
 * update-quote.js
 * Picks a quote deterministically based on the day of the year,
 * then writes it into README.md between the QUOTE_START / QUOTE_END markers.
 * Run daily by the GitHub Action in .github/workflows/update-quote.yml
 */

const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "README.md");
const QUOTES_PATH = path.join(__dirname, "Quotes.json");

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function loadQuotes() {
  let raw;
  try {
    raw = fs.readFileSync(QUOTES_PATH, "utf8");
  } catch (err) {
    throw new Error(`Failed to read quotes file at ${QUOTES_PATH}: ${err.message}`);
  }

  let quotes;
  try {
    quotes = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse quotes JSON: ${err.message}`);
  }

  if (!Array.isArray(quotes)) {
    throw new Error("Quotes file must contain a JSON array");
  }

  if (quotes.length === 0) {
    throw new Error("Quotes array is empty — need at least one quote");
  }

  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    if (!q.text || !q.author || !q.role) {
      throw new Error(
        `Quote at index ${i} is missing required fields (text, author, role): ${JSON.stringify(q)}`
      );
    }
  }

  return quotes;
}

function main() {
  const quotes = loadQuotes();
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

  let readme;
  try {
    readme = fs.readFileSync(README_PATH, "utf8");
  } catch (err) {
    throw new Error(`Failed to read README at ${README_PATH}: ${err.message}`);
  }

  const pattern = /<!--QUOTE_START-->[\s\S]*?<!--QUOTE_END-->/;

  if (!pattern.test(readme)) {
    throw new Error("QUOTE_START / QUOTE_END markers not found in README.md");
  }

  const updated = readme.replace(pattern, block);

  try {
    fs.writeFileSync(README_PATH, updated, "utf8");
  } catch (err) {
    throw new Error(`Failed to write updated README: ${err.message}`);
  }

  console.log(`Quote updated for day ${dayIndex}: "${quote.text}" — ${quote.author}`);
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
