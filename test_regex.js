const tests = [
  "TT-CSIRT advisory – php security updates",
  "TT-CSIRT advisory – Chrome security updates",
  "TT-CSIRT advisory – Oracle security updates",
  "TT-CSIRT advisory - Microsoft security updates",
  "TT CSIRT advisory – Netgear security updates",
  "TT-CSIRT Advisory - Android security updates"
];

for (const t of tests) {
  let cleaned = t;
  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—.]*\s*\d+[\d.]*\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—:.]+\s*/i, "");
    cleaned = cleaned.replace(/^\d{2,4}\.\d{2}\.\d{2}\.\d{2}\s*[-–—:.]*\s*/i, "");
  }
  console.log(cleaned);
}
