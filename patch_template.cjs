const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/<template>[\s\S]*?<ul className="app-mobile-navigation-section__list app-mobile-navigation-section__subnav" hidden>([\s\S]*?)<\/ul>[\s\S]*?<\/template>/m, 
  `<template dangerouslySetInnerHTML={{ __html: \\\`<ul class="app-mobile-navigation-section__list app-mobile-navigation-section__subnav" hidden>$1</ul>\\\` }} />`);

content = content.replace(/<template>[\s\S]*?<ul className="app-mobile-navigation-section__list app-mobile-navigation-section__subnav" hidden>([\s\S]*?)<\/ul>[\s\S]*?<\/template>/m, 
  `<template dangerouslySetInnerHTML={{ __html: \\\`<ul class="app-mobile-navigation-section__list app-mobile-navigation-section__subnav" hidden>$1</ul>\\\` }} />`);

// Replace React classNames with class in the inner HTML strings
// This is a bit hacky but it should work for the specific strings we have
content = content.replace(/className="app-mobile-navigation-section__item"/g, 'class="app-mobile-navigation-section__item"');
content = content.replace(/className="govuk-service-navigation__link"/g, 'class="govuk-service-navigation__link"');
content = content.replace(/onClick=\{\(e\) => \{ e\.preventDefault\(\); onNavigate\("[\/a-z]*"(?:, "[a-z]*")?\); \}\}/g, ''); // We can't have React onClick handlers inside dangerouslySetInnerHTML!

fs.writeFileSync('src/App.tsx', content);

