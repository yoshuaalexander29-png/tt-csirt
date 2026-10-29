const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Restore AboutSection
const aboutSection = `
function AboutSection() {
  return (
    <section className="about-ttcsirt" id="about-tt-csirt" aria-labelledby="about-heading">
      <h2 className="govuk-heading-l" id="about-heading">
        About TT-CSIRT
      </h2>
      <h3 className="govuk-heading-m">
        Working with partners
      </h3>
      <p className="govuk-body">
        TT-CSIRT works with national, regional and international partners to
        protect critical infrastructure and strengthen cyber resilience.
      </p>
      <h3 className="govuk-heading-m">
        Partner agencies
      </h3>
      <ul className="govuk-list govuk-list--spaced">
        <li><a href="https://www.ttps.gov.tt/" className="govuk-link">TTPS CSMU</a></li>
        <li><a href="https://www.caricomimpacs.org/" className="govuk-link">CARICOM IMPACS</a></li>
        <li><a href="https://www.getsafeonline.tt/" className="govuk-link">GetSafeOnlineTT</a></li>
        <li><a href="https://igovtt.tt/" className="govuk-link">iGovTT</a></li>
        <li><a href="https://csirtamericas.org/" className="govuk-link">OAS CSIRT Americas</a></li>
        <li><a href="https://www.oas.org/en/topics/cyber_security.asp" className="govuk-link">OAS Cyber</a></li>
      </ul>
      <h3 className="govuk-heading-m">
        Key facts
      </h3>
      <dl className="govuk-summary-list">
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Established</dt>
          <dd className="govuk-summary-list__value">November 2015</dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Policy Foundation</dt>
          <dd className="govuk-summary-list__value">National Cyber Security Strategy (2012)</dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Scope</dt>
          <dd className="govuk-summary-list__value">National</dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Membership</dt>
          <dd className="govuk-summary-list__value">Public and private sectors</dd>
        </div>
      </dl>
    </section>
  );
}
`;

code = code.replace(/function Footer\(\) \{/, aboutSection + '\nfunction Footer() {');

// We also need to restore <AboutSection /> in App
code = code.replace(/<ServicesSection \/>/, '<ServicesSection />\n                <AboutSection />');

fs.writeFileSync('src/App.tsx', code);
