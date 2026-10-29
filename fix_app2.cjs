const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove all onClick handlers that are directly after an injected onClick
content = content.replace(/onClick=\{\(e\) => \{ e\.preventDefault\(\); onNavigate\("[\/a-z]*"(?:, "[a-z]*")?\); \}\}\s*onClick=\{[\s\S]*?\}/g, (match) => {
  return match.split('onClick')[1] ? 'onClick' + match.split('onClick')[1] : match;
});

// Since the regex above might be brittle, let's just use simple sed-like replacements to fix duplicate onClicks.
content = content.replace(/href="\/advisories" onClick=\{\(e\) => \{ e\.preventDefault\(\); onNavigate\("\/advisories"\); \}\}\s*onClick=\{\(e\) => \{\s*e\.preventDefault\(\);\s*onNavigate\("\/advisories"\);\s*\}\}/g, 
  'href="/advisories" onClick={(e) => { e.preventDefault(); onNavigate("/advisories"); }}');

content = content.replace(/href="\/advisories" onClick=\{\(e\) => \{ e\.preventDefault\(\); onNavigate\("\/advisories"\); \}\}\s*onClick=\{\(e\) => \{\s*e\.preventDefault\(\);\s*onNavigateAdvisories\(\);\s*\}\}/g, 
  'href="/advisories" onClick={(e) => { e.preventDefault(); onNavigateAdvisories(); }}');

content = content.replace(/href="#about" onClick=\{\(e\) => \{ e\.preventDefault\(\); onNavigate\("\/", "about"\); \}\}\s*onClick=\{\(e\) => \{\s*e\.preventDefault\(\);\s*onNavigate\("\/", "about"\);\s*\}\}/g, 
  'href="#about" onClick={(e) => { e.preventDefault(); onNavigate("/", "about"); }}');

fs.writeFileSync('src/App.tsx', content);
