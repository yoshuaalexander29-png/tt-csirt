const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newIntro = `function IntroSection() {
  return (
    <section style={{ marginBottom: "30px" }} id="what-we-do" aria-labelledby="main-page-heading">
      <h1 id="main-page-heading" className="govuk-heading-xl" style={{ marginBottom: "30px" }}>
        Cyber security in Trinidad and Tobago
      </h1>
      <p className="govuk-body-l">
        We help people and organisations across Trinidad and Tobago respond to cyber security incidents and reduce cyber risks.
      </p>

      <h2 className="govuk-heading-l" id="what-we-do-heading">
        What TT-CSIRT does
      </h2>
      <p className="govuk-body">
        TT-CSIRT coordinates national cyber incident response, publishes trusted guidance and works with organisations across Trinidad and Tobago to strengthen cyber resilience.
      </p>

      <dl className="govuk-summary-list">
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Established</dt>
          <dd className="govuk-summary-list__value">November 2015</dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Policy foundation</dt>
          <dd className="govuk-summary-list__value">
            <a href="https://ttcsirt.gov.tt/national-cyber-security-strategy/" className="govuk-link">National Cyber Security Strategy (2012)</a>
          </dd>
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

      <p className="govuk-body govuk-!-margin-bottom-2">
        <strong>Partner agencies</strong>
      </p>
      <ul className="govuk-list govuk-list--spaced">
        <li><a href="https://www.ttps.gov.tt/" className="govuk-link">TTPS CSMU</a></li>
        <li><a href="https://www.caricomimpacs.org/" className="govuk-link">CARICOM IMPACS</a></li>
        <li><a href="https://www.getsafeonline.tt/" className="govuk-link">GetSafeOnlineTT</a></li>
        <li><a href="https://igovtt.tt/" className="govuk-link">iGovTT</a></li>
        <li><a href="https://csirtamericas.org/" className="govuk-link">OAS CSIRT Americas</a></li>
        <li><a href="https://www.oas.org/en/topics/cyber_security.asp" className="govuk-link">OAS Cyber</a></li>
      </ul>

      <p className="govuk-body">
        <a className="govuk-link" href="https://ttcsirt.gov.tt/about-us/">
          About TT-CSIRT
        </a>
      </p>
    </section>
  );
}`;

// Replace IntroSection
code = code.replace(/function IntroSection\(\) \{[\s\S]*?\}\s*function EmergencySupportSection/, newIntro + '\n\nfunction EmergencySupportSection');

// Remove AboutSection definition
code = code.replace(/function AboutSection\(\) \{[\s\S]*?\}\s*function Footer/, 'function Footer');

// Remove <AboutSection /> usage
code = code.replace(/\s*<AboutSection \/>\s*/, '\n                ');

// Update ContextualNavigation
code = code.replace(/\{ id: "overview-and-mandate", label: "Our role and mandate" \}/, '{ id: "what-we-do", label: "What TT-CSIRT does" }');
code = code.replace(/useState\("overview-and-mandate"\)/, 'useState("what-we-do")');
// Remove { id: "about-tt-csirt", label: "About TT-CSIRT" }
code = code.replace(/\s*\{ id: "about-tt-csirt", label: "About TT-CSIRT" \},/, '');

fs.writeFileSync('src/App.tsx', code);
