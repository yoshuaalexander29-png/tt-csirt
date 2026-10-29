const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The layout right now is:
// <div className="govuk-width-container">
//   <GovernmentMasthead />
//   <ServiceIdentity />
//   <ServiceNavigation ... />
//   <Breadcrumbs ... />
//   <main ...>
// ...
// </div>

const currentLayout = `<div className="govuk-width-container">
        <GovernmentMasthead />
        <ServiceIdentity />
        <ServiceNavigation currentPath={currentPath} onNavigate={navigateTo} />
        <Breadcrumbs
          currentPath={currentPath}
          onNavigateHome={() => navigateTo("/")}
          onNavigateAdvisories={() => navigateTo("/advisories")}
        />

        <main className="govuk-main-wrapper govuk-main-wrapper--auto-spacing" id="main-content" role="main">`;

const newLayout = `
        <div className="govuk-width-container">
          <GovernmentMasthead />
          <ServiceIdentity />
        </div>
        <ServiceNavigation currentPath={currentPath} onNavigate={navigateTo} />
        <div className="govuk-width-container">
        <Breadcrumbs
          currentPath={currentPath}
          onNavigateHome={() => navigateTo("/")}
          onNavigateAdvisories={() => navigateTo("/advisories")}
        />

        <main className="govuk-main-wrapper govuk-main-wrapper--auto-spacing" id="main-content" role="main">`;

if (code.includes(currentLayout)) {
  code = code.replace(currentLayout, newLayout);
  
  // also need to add a closing div at the end before footer?
  // Actually, wait, <Footer /> is outside the <div className="govuk-width-container">?
  // Let's check where the closing div is.
} else {
  console.log("Could not find layout to replace");
}

fs.writeFileSync('src/App.tsx', code);
