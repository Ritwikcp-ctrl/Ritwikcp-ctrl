const fs = require("fs");
const path = require("path");

jest.mock("fs");

const { getDayOfYear, buildQuoteBlock, replaceQuoteInReadme, selectQuote, main } = require("./Update_quote");

describe("getDayOfYear", () => {
  it("returns 1 for January 1st", () => {
    const date = new Date(2025, 0, 1); // Jan 1
    expect(getDayOfYear(date)).toBe(1);
  });

  it("returns 32 for February 1st", () => {
    const date = new Date(2025, 1, 1); // Feb 1
    expect(getDayOfYear(date)).toBe(32);
  });

  it("returns 365 for December 31st in a non-leap year", () => {
    const date = new Date(2025, 11, 31); // Dec 31, 2025
    expect(getDayOfYear(date)).toBe(365);
  });

  it("returns 366 for December 31st in a leap year", () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024 (leap year)
    expect(getDayOfYear(date)).toBe(366);
  });

  it("returns 60 for March 1st in a leap year", () => {
    const date = new Date(2024, 2, 1); // March 1, 2024 (leap year)
    expect(getDayOfYear(date)).toBe(61);
  });

  it("returns 60 for March 1st in a non-leap year", () => {
    const date = new Date(2025, 2, 1); // March 1, 2025
    expect(getDayOfYear(date)).toBe(60);
  });
});

describe("buildQuoteBlock", () => {
  it("formats a quote into the expected markdown block", () => {
    const quote = { text: "Hello world", author: "Test Author", role: "Developer" };
    const result = buildQuoteBlock(quote);

    expect(result).toContain("<!--QUOTE_START-->");
    expect(result).toContain("<!--QUOTE_END-->");
    expect(result).toContain('"Hello world"');
    expect(result).toContain("Test Author");
    expect(result).toContain("Developer");
  });

  it("includes the code fence markers", () => {
    const quote = { text: "Test", author: "Author", role: "Role" };
    const result = buildQuoteBlock(quote);
    const lines = result.split("\n");

    expect(lines[0]).toBe("<!--QUOTE_START-->");
    expect(lines[1]).toBe("```");
    expect(lines[lines.length - 2]).toBe("```");
    expect(lines[lines.length - 1]).toBe("<!--QUOTE_END-->");
  });

  it("formats the attribution line with em dash", () => {
    const quote = { text: "Wisdom", author: "Sage", role: "Philosopher" };
    const result = buildQuoteBlock(quote);

    expect(result).toMatch(/— Sage, Philosopher/);
  });

  it("handles quotes with special characters", () => {
    const quote = { text: "It's a \"test\" & more", author: "O'Brien", role: "Dev & QA" };
    const result = buildQuoteBlock(quote);

    expect(result).toContain("It's a \"test\" & more");
    expect(result).toContain("O'Brien");
    expect(result).toContain("Dev & QA");
  });
});

describe("replaceQuoteInReadme", () => {
  const sampleReadme = [
    "# Hello",
    "Some content",
    "<!--QUOTE_START-->",
    "```",
    '"Old quote"',
    "— Old Author, Old Role",
    "```",
    "<!--QUOTE_END-->",
    "More content",
  ].join("\n");

  it("replaces the quote block in a valid README", () => {
    const newBlock = "<!--QUOTE_START-->\n```\n\"New quote\"\n```\n<!--QUOTE_END-->";
    const result = replaceQuoteInReadme(sampleReadme, newBlock);

    expect(result).toContain("New quote");
    expect(result).not.toContain("Old quote");
    expect(result).toContain("# Hello");
    expect(result).toContain("More content");
  });

  it("returns null when markers are not found", () => {
    const noMarkers = "# Hello\nNo quote markers here";
    const result = replaceQuoteInReadme(noMarkers, "replacement");

    expect(result).toBeNull();
  });

  it("handles README with only the quote block", () => {
    const onlyQuote = "<!--QUOTE_START-->\nold\n<!--QUOTE_END-->";
    const newBlock = "<!--QUOTE_START-->\nnew\n<!--QUOTE_END-->";
    const result = replaceQuoteInReadme(onlyQuote, newBlock);

    expect(result).toBe(newBlock);
  });

  it("handles multiline content between markers", () => {
    const multiline = "before\n<!--QUOTE_START-->\nline1\nline2\nline3\n<!--QUOTE_END-->\nafter";
    const newBlock = "<!--QUOTE_START-->\nreplaced\n<!--QUOTE_END-->";
    const result = replaceQuoteInReadme(multiline, newBlock);

    expect(result).toBe("before\n<!--QUOTE_START-->\nreplaced\n<!--QUOTE_END-->\nafter");
  });
});

describe("selectQuote", () => {
  const quotes = [
    { text: "Quote 0", author: "Author 0", role: "Role 0" },
    { text: "Quote 1", author: "Author 1", role: "Role 1" },
    { text: "Quote 2", author: "Author 2", role: "Role 2" },
    { text: "Quote 3", author: "Author 3", role: "Role 3" },
    { text: "Quote 4", author: "Author 4", role: "Role 4" },
  ];

  it("selects a quote based on day of year modulo quotes length", () => {
    const date = new Date(2025, 0, 1); // Day 1
    const { quote, dayIndex } = selectQuote(quotes, date);

    expect(dayIndex).toBe(1 % quotes.length);
    expect(quote).toBe(quotes[1]);
  });

  it("wraps around when day exceeds quotes length", () => {
    const date = new Date(2025, 0, 6); // Day 6
    const { quote, dayIndex } = selectQuote(quotes, date);

    expect(dayIndex).toBe(6 % quotes.length);
    expect(quote).toBe(quotes[1]); // 6 % 5 = 1
  });

  it("returns consistent results for the same date", () => {
    const date = new Date(2025, 5, 15);
    const result1 = selectQuote(quotes, date);
    const result2 = selectQuote(quotes, date);

    expect(result1.dayIndex).toBe(result2.dayIndex);
    expect(result1.quote).toBe(result2.quote);
  });

  it("returns different quotes for different days", () => {
    const date1 = new Date(2025, 0, 1); // Day 1
    const date2 = new Date(2025, 0, 2); // Day 2
    const result1 = selectQuote(quotes, date1);
    const result2 = selectQuote(quotes, date2);

    expect(result1.dayIndex).not.toBe(result2.dayIndex);
  });

  it("handles a single-quote array", () => {
    const singleQuote = [{ text: "Only", author: "One", role: "Quote" }];
    const date = new Date(2025, 6, 15); // Any day
    const { quote, dayIndex } = selectQuote(singleQuote, date);

    expect(dayIndex).toBe(0); // Any day % 1 = 0
    expect(quote).toBe(singleQuote[0]);
  });
});

describe("integration: buildQuoteBlock + replaceQuoteInReadme", () => {
  it("produces a valid replacement cycle", () => {
    const quote = { text: "New wisdom", author: "New Author", role: "New Role" };
    const originalReadme = "Header\n<!--QUOTE_START-->\n```\n\"Old\"\n```\n<!--QUOTE_END-->\nFooter";

    const block = buildQuoteBlock(quote);
    const updated = replaceQuoteInReadme(originalReadme, block);

    expect(updated).toContain("New wisdom");
    expect(updated).toContain("New Author");
    expect(updated).toContain("New Role");
    expect(updated).toContain("Header");
    expect(updated).toContain("Footer");

    // The updated README should still have valid markers for the next replacement
    const nextQuote = { text: "Even newer", author: "Another", role: "Person" };
    const nextBlock = buildQuoteBlock(nextQuote);
    const nextUpdated = replaceQuoteInReadme(updated, nextBlock);

    expect(nextUpdated).toContain("Even newer");
    expect(nextUpdated).not.toContain("New wisdom");
  });
});

describe("main", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();
  });

  it("reads quotes and README, then writes updated README", () => {
    const quotes = JSON.stringify([
      { text: "Test quote", author: "Tester", role: "QA" },
    ]);
    const readme = "Start\n<!--QUOTE_START-->\nold\n<!--QUOTE_END-->\nEnd";

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes("Quotes.json")) return quotes;
      if (filePath.includes("README.md")) return readme;
      throw new Error(`Unexpected read: ${filePath}`);
    });
    fs.writeFileSync.mockImplementation(() => {});

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    main();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const writtenContent = fs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain("Test quote");
    expect(writtenContent).toContain("Tester");
    expect(writtenContent).toContain("QA");
    expect(writtenContent).toContain("Start");
    expect(writtenContent).toContain("End");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("exits with code 1 when markers are missing", () => {
    const quotes = JSON.stringify([
      { text: "Quote", author: "Author", role: "Role" },
    ]);
    const readme = "No markers here";

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes("Quotes.json")) return quotes;
      if (filePath.includes("README.md")) return readme;
      throw new Error(`Unexpected read: ${filePath}`);
    });

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => main()).toThrow("process.exit called");

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "QUOTE_START / QUOTE_END markers not found in README.md"
    );

    mockExit.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
