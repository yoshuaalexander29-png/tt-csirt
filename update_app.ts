import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The goal is to move the content of Advisories and Incidents side-by-side.
// We can just define a new component DashboardRow and replace ContentCards/PartnersAndStatistics.

content = content.replace(/function ContentCards\(\) \{[\s\S]*?function Footer\(\) \{/, `
function DashboardRow() {
  const incidents = [
    [BellRing, "48", "Phishing incidents"],
    [LockKeyhole, "17", "Data breaches"],
    [TrendingUp, "71", "Total incidents reported in 2026"],
  ] as const;

  return (
    <section className="dashboard-row" aria-label="Advisories and current incidents">
      <article className="content-card advisories" id="advisory">
        <div className="advisories-header">
          <p>Cyber security updates</p>
          <div>
            <h2>Latest advisories</h2>
            <a href="#archive">View all advisories <ArrowRight size={17} /></a>
          </div>
        </div>
        <div className="advisory-list">
          {advisories.map(([level, title, date]) => (
            <a href="#advisory" className="advisory" key={title}>
              <span className={\`severity severity--\${level.toLowerCase().replace(/\\s+/g, '-')}\`}>{level}</span>
              <span className="advisory-content"><b>{title}</b></span>
              <time>{date}</time>
              <ArrowRight className="advisory-arrow" size={17} />
            </a>
          ))}
        </div>
        <aside className="advisory-callout">
          <BellRing aria-hidden="true" />
          <div>
            <b>Stay informed. Stay secure.</b>
            <p>Receive the latest TT-CSIRT advisories and alerts.</p>
          </div>
          <a href="#alerts">Subscribe to alerts <ArrowRight size={16} /></a>
        </aside>
      </article>

      <article className="incidents-panel content-card">
        <p>CYBER INCIDENTS IN 2026</p>
        <h2>What’s happening now</h2>
        <span className="incidents-panel__rule" />
        <h3>Phishing remains the most reported cyber incident type.</h3>
        <div className="incident-list">
          {incidents.map(([Icon, value, label]) => (
            <div className="incident-row" key={label}>
              <Icon aria-hidden="true" />
              <div>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <a href="#statistics" className="card-bottom-link" style={{ marginTop: "auto" }}>View statistics <ArrowRight /></a>
      </article>
    </section>
  );
}

function ServicesAndPartners() {
  const services = [
    [ShieldCheck, "Incident Response", "Coordinate and support the management of cyber security incidents affecting organisations."],
    [Radio, "Cyber Threat Intelligence", "Analyse cyber threats, indicators of compromise and emerging trends to support informed decision-making."],
    [ShieldAlert, "Alerts & Advisories", "Publish timely cyber security alerts, advisories and technical guidance."],
    [Network, "Vulnerability Coordination", "Notify affected organisations of significant vulnerabilities and facilitate responsible disclosure."],
    [UsersRound, "Awareness & Capacity", "Deliver awareness initiatives, technical guidance and training to improve national cyber resilience."],
  ] as const;

  const partners = [
    [Landmark, "Government agencies", "Supporting cyber security coordination across the public sector."],
    [Building2, "Businesses and organisations", "Working with the private sector to improve cyber security practices."],
    [ShieldCheck, "Essential service providers", "Helping protect systems and services that communities rely on."],
    [Globe2, "Regional and international partners", "Sharing expertise, information and approaches to cyber security."],
  ] as const;

  return (
    <section className="content-cards">
      <article className="content-card services" id="services">
        <p className="section-eyebrow">National cyber security support</p>
        <h2>Our Services</h2>
        <p className="section-intro">TT-CSIRT provides practical national support to help organisations prepare for, respond to and recover from cyber security incidents.</p>
        <div className="service-list">
          {services.map(([Icon, title, copy]) => (
            <a href="#services" className="service" key={title}>
              <Icon aria-hidden="true" />
              <div>
                <b>{title}</b>
                <p>{copy}</p>
              </div>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>
        <a className="card-bottom-link" href="#services">View all services <ArrowRight size={17} /></a>
      </article>

      <article className="partners-panel content-card" style={{ padding: 0 }}>
        <div className="partners-panel__intro">
          <p>OUR MANDATE</p>
          <h2>Working together to strengthen national cybersecurity</h2>
          <span />
        </div>
        <div className="partners-panel__list">
          {partners.map(([Icon, title, copy]) => (
            <div className="partner-row" key={title}>
              <Icon aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="#partners" className="partners-panel__link">Learn how TT-CSIRT works with partners <ArrowRight /></a>
      </article>

      <article className="content-card about" id="about">
        <p className="section-eyebrow">National authority</p>
        <h2>About TT-CSIRT</h2>
        <p className="section-intro">TT-CSIRT coordinates cyber incident response, publishes trusted guidance and strengthens cyber resilience across Trinidad and Tobago.</p>
        <div className="about-facts">
          <span>Established<b>November 2015</b></span>
          <span>Policy Foundation<b>National Cyber Security Strategy (2012)</b></span>
          <span>Scope<b>National</b></span>
          <span>Membership<b>Public & Private</b></span>
        </div>
        <div className="about-links">
          <a href="#mandate">Our Mandate <ArrowRight size={17} /></a>
          <a href="#strategy">National Cyber Security Strategy <ArrowRight size={17} /></a>
          <a href="#resources">Publications & Guidelines <ArrowRight size={17} /></a>
          <a href="#reports">Annual Reports <ArrowRight size={17} /></a>
          <a href="#contact">Contact TT-CSIRT <ArrowRight size={17} /></a>
        </div>
      </article>
    </section>
  );
}

function Footer() {`);

content = content.replace(/<ContentCards \/>\s*<PartnersAndStatistics \/>/, '<DashboardRow />\n      <ServicesAndPartners />');
fs.writeFileSync('src/App.tsx', content);
