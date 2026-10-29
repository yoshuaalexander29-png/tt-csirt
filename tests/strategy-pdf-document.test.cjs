const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("National Cyber Security Strategy Locally Hosted Document Suite", async (t) => {
  const publicPdfPath = path.resolve(__dirname, "../public/documents/national-cyber-security-strategy-2012.pdf");
  const distPdfPath = path.resolve(__dirname, "../dist/documents/national-cyber-security-strategy-2012.pdf");
  const strategyPagePath = path.resolve(__dirname, "../src/pages/NationalStrategyPage.tsx");

  await t.test("1. PDF exists at public/documents/national-cyber-security-strategy-2012.pdf", () => {
    assert.ok(fs.existsSync(publicPdfPath), "PDF must exist at public/documents/national-cyber-security-strategy-2012.pdf");
    const stat = fs.statSync(publicPdfPath);
    assert.ok(stat.size > 100000, "PDF file must be a non-empty document (>100KB)");
    assert.strictEqual(stat.size, 442950, "PDF file size must match authoritative source exactly (442,950 bytes)");
  });

  await t.test("2. PDF has valid PDF signature and authoritative metadata", () => {
    const buffer = fs.readFileSync(publicPdfPath);
    const header = buffer.subarray(0, 8).toString("latin1");
    assert.ok(header.startsWith("%PDF-"), "File must start with valid PDF magic bytes (%PDF-)");

    const zlib = require("zlib");
    const rawStr = buffer.toString("binary");
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    let fullText = "";
    while ((match = streamRegex.exec(rawStr)) !== null) {
      try {
        const decomp = zlib.inflateSync(Buffer.from(match[1], "binary"));
        fullText += decomp.toString("latin1") + "\n";
      } catch (e) {}
    }

    const tjMatches = fullText.match(/\[([^\]]+)\]\s*TJ/g) || [];
    const phrases = [];
    tjMatches.forEach((tj) => {
      const parts = tj.match(/\(([^)]*)\)/g) || [];
      const text = parts.map((p) => p.slice(1, -1)).join("");
      if (text.trim()) phrases.push(text.trim());
    });

    assert.ok(phrases.some((p) => p.includes("Cyber Security")), "PDF must contain 'Cyber Security' in extracted phrases");
    assert.ok(phrases.some((p) => p.includes("Trinidad")), "PDF must contain 'Trinidad' in extracted phrases");
    assert.ok(phrases.some((p) => p.includes("National Cyber Security Strategy")), "PDF must contain 'National Cyber Security Strategy' in extracted phrases");
  });

  await t.test("3. Production build output includes PDF at stable public path", () => {
    assert.ok(fs.existsSync(distPdfPath), "PDF must exist in dist/documents/national-cyber-security-strategy-2012.pdf after build");
    const publicBuf = fs.readFileSync(publicPdfPath);
    const distBuf = fs.readFileSync(distPdfPath);
    assert.ok(publicBuf.equals(distBuf), "Production build PDF must be byte-for-byte identical to public document");
  });

  await t.test("4. NationalStrategyPage renders native link with preferred text and target attributes", () => {
    assert.ok(fs.existsSync(strategyPagePath), "NationalStrategyPage.tsx must exist");
    const pageSrc = fs.readFileSync(strategyPagePath, "utf8");

    assert.ok(
      pageSrc.includes('href="/documents/national-cyber-security-strategy-2012.pdf"'),
      "Must contain link pointing to local /documents/national-cyber-security-strategy-2012.pdf"
    );
    assert.ok(
      pageSrc.includes('View the National Cyber Security Strategy (PDF)'),
      "Must contain preferred link text 'View the National Cyber Security Strategy (PDF)'"
    );
    assert.ok(
      pageSrc.includes('target="_blank"'),
      "Must specify target='_blank' to open in browser's native PDF viewer"
    );
    assert.ok(
      pageSrc.includes('rel="noopener noreferrer"'),
      "Must specify rel='noopener noreferrer' for security"
    );
    assert.ok(
      !pageSrc.includes("Download official PDF document (external PDF link)"),
      "Must not contain obsolete download link text"
    );
    assert.ok(
      !pageSrc.includes("https://ttcsirt.gov.tt/wp-content/uploads/2018/06/national-cyber-security-strategy.pdf"),
      "Must not contain obsolete external PDF link"
    );
  });

  await t.test("5. No broken external PDF references in any source files", () => {
    const srcDir = path.resolve(__dirname, "../src");
    function checkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(tsx?|jsx?|html)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf8");
          assert.ok(
            !content.includes("national-cyber-security-strategy.pdf"),
            `File ${fullPath} must not contain obsolete national-cyber-security-strategy.pdf reference`
          );
        }
      }
    }
    checkDir(srcDir);
  });
});
