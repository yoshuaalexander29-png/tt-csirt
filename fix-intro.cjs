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
        TT-CSIRT coordinates national cyber incident response, publishes trusted guidance and works with organisations across Trinidad and Tobago to strengthen cyber resilience.
      </p>
      <p className="govuk-body">
        <a 
          className="govuk-link" 
          href="#about-tt-csirt"
        >
          About TT-CSIRT
        </a>
      </p>
    </section>
  );
}`;

code = code.replace(/function IntroSection\(\) \{[\s\S]*?\}\s*function EmergencySupportSection/, targetIntro + '\n\nfunction EmergencySupportSection');

fs.writeFileSync('src/App.tsx', code);
