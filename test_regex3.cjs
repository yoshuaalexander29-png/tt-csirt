const { unescape } = require('querystring');
function cleanHumanTitle(rawTitle) {
  if (!rawTitle) return "";
  let cleaned = rawTitle.replace(/&#8211;/g, "-").trim(); // simplified entity decode

  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—.]*\s*\d+[\d.]*\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^\d{2,4}\.\d{2}\.\d{2}\.\d{2}\s*[-–—:.]*\s*/i, "");
  }

  const docPrefixRegex =
    /^(?:cybersecurity\s+advisory|security\s+alert|threat\s+alert|malware\s+alert|phishing\s+alert|threat\s+advisory|vulnerability\s+advisory|security\s+update|cyber\s+security\s+advisory)\s*[:–—\-.]*\s*/i;
  const docMatch = cleaned.match(docPrefixRegex);
  if (docMatch) {
    const remainder = cleaned.slice(docMatch[0].length).trim();
    if (remainder.length > 0) {
      cleaned = remainder;
    }
  }
  
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
}

const tests = [
  "TT-CSIRT advisory – PHP security updates",
  "TT-CSIRT advisory PHP security updates",
  "TT-CSIRT warns about phishing",
];

for (const t of tests) {
  console.log(`"${t}" -> "${cleanHumanTitle(t)}"`);
}
