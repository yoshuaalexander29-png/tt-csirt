const { unescape } = require('querystring');
function cleanHumanTitle(rawTitle) {
  if (!rawTitle) return "";
  let cleaned = rawTitle.replace(/&#8211;/g, "-").trim(); // simplified entity decode

  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—.]*\s*\d+[\d.]*\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—:.]+\s*/i, "");
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

  cleaned = cleaned.replace(/\s*\(?CVE-\d{4}-\d{4,7}\)?\s*/gi, " ");
  
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
}

const tests = [
  "TT-CSIRT advisory – PHP security updates",
  "TT-CSIRT advisory – Chrome security updates",
  "TT-CSIRT advisory – Oracle security updates",
  "TT-CSIRT advisory - Microsoft security updates",
  "TT CSIRT advisory – Netgear security updates",
  "TT-CSIRT Advisory - Android security updates",
  "TT-CSIRT – 456.08.05.26 – CYBERSECURITY ADVISORY: Critical Palo Alto Networks PAN-OS Vulnerability (CVE-2026-0300)",
  "TT-CSIRT - 451.13.09.25 - Malware Alert: Azure Function Abuse"
];

for (const t of tests) {
  console.log(`"${t}" -> "${cleanHumanTitle(t)}"`);
}
