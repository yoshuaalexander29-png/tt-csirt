const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace dangerouslySetInnerHTML with actual JSX so React renders the links properly
content = content.replace(/<template dangerouslySetInnerHTML={{ __html: \\`([\s\S]*?)\\` }} \/>/g, '<template>$1</template>');

// Restore the classNames
content = content.replace(/class="app-mobile-navigation-section__list/g, 'className="app-mobile-navigation-section__list');
content = content.replace(/class="app-mobile-navigation-section__item/g, 'className="app-mobile-navigation-section__item');
content = content.replace(/class="govuk-service-navigation__link/g, 'className="govuk-service-navigation__link');

// Re-add the onClick handlers for the links so we get client-side routing
content = content.replace(/href="\/advisories"/g, 'href="/advisories" onClick={(e) => { e.preventDefault(); onNavigate("/advisories"); }}');
content = content.replace(/href="#alerts"/g, 'href="#alerts" onClick={(e) => { e.preventDefault(); onNavigate("/", "alerts"); }}');
content = content.replace(/href="#vulnerabilities"/g, 'href="#vulnerabilities" onClick={(e) => { e.preventDefault(); onNavigate("/", "vulnerabilities"); }}');
content = content.replace(/href="#about"/g, 'href="#about" onClick={(e) => { e.preventDefault(); onNavigate("/", "about"); }}');
content = content.replace(/href="#mandate"/g, 'href="#mandate" onClick={(e) => { e.preventDefault(); onNavigate("/", "mandate"); }}');
content = content.replace(/href="#strategy"/g, 'href="#strategy" onClick={(e) => { e.preventDefault(); onNavigate("/", "strategy"); }}');
content = content.replace(/href="#resources"/g, 'href="#resources" onClick={(e) => { e.preventDefault(); onNavigate("/", "resources"); }}');
content = content.replace(/href="#reports"/g, 'href="#reports" onClick={(e) => { e.preventDefault(); onNavigate("/", "reports"); }}');
content = content.replace(/href="#contact"/g, 'href="#contact" onClick={(e) => { e.preventDefault(); onNavigate("/", "contact"); }}');

fs.writeFileSync('src/App.tsx', content);
