const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetIntro = `function IntroSection() {
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
        TT-CSIRT coordinates national cyber incident response and publishes trusted guidance to help people and organisations manage cyber security risks.
      </p>
      <p className="govuk-body">
        TT-CSIRT has a national remit across the public and private sectors and was established in November 2015. Its work is guided by the <a className="govuk-link" href="https://ttcsirt.gov.tt/national-cyber-security-strategy/">National Cyber Security Strategy (2012)</a>.
      </p>

      <h3 className="govuk-heading-m">
        Working with partners
      </h3>
      <p className="govuk-body">
        TT-CSIRT coordinates with national, regional and international partners to share expertise, information and support.
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

code = code.replace(/function IntroSection\(\) \{[\s\S]*?\}\s*function EmergencySupportSection/, targetIntro + '\n\nfunction EmergencySupportSection');

// also update the ContextualNavigation ID if needed, though it's already "what-we-do"
fs.writeFileSync('src/App.tsx', code);
