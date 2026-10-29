/**
 * Central Data Model & Store for News, Events, Training, and Workshops
 * Provides strongly-typed editorial items with distinct content types,
 * canonical slugs, and deterministic URL generation.
 */

export type EditorialContentType = "news" | "event" | "training" | "workshop";

export interface EditorialItem {
  id: string;
  slug: string;
  type: EditorialContentType;
  title: string;
  date: string;
  isoDate: string;
  summary: string;
  tag: string;
  audience?: string;
  purpose?: string;
  format?: string;
  status?: string;
  organizers?: string[];
  location?: string;
  bodyParagraphs: string[];
  keyHighlights?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export const EDITORIAL_ITEMS: EditorialItem[] = [
  {
    id: "item-1",
    slug: "cyber-paths-training-program",
    type: "training",
    title: "Invitation to register for the Cyber Paths Training Program",
    date: "21 July 2026",
    isoDate: "2026-07-21",
    tag: "Training",
    summary:
      "Registration is open for the upcoming cohort of the Cyber Paths Training Program, sponsored by the OAS and the Citi Foundation in partnership with TT-CSIRT. The program delivers certified cybersecurity credentials, practical lab exercises, and career readiness training.",
    audience:
      "University students, recent graduates, early-career IT professionals, and citizens seeking specialized cybersecurity qualifications.",
    purpose:
      "An intensive workforce capacity-building program funded by the Citi Foundation and implemented by the Organization of American States (OAS) Cybersecurity Program in partnership with TT-CSIRT, preparing local talent for high-demand cyber defense roles.",
    format: "Hybrid (instructor-led virtual modules and technical laboratory exercises)",
    status: "Registration open for upcoming cohort",
    organizers: [
      "Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)",
      "Organization of American States (OAS) Cybersecurity Program",
      "Citi Foundation",
    ],
    location: "Port of Spain / Virtual Training Environment",
    bodyParagraphs: [
      "TT-CSIRT, in joint sponsorship with the Organization of American States (OAS) and the Citi Foundation, announces open registration for the 2026 cohort of the Cyber Paths Training Program. This initiative addresses the critical regional shortage of skilled cybersecurity practitioners by providing targeted, high-impact workforce training.",
      "Participants receive comprehensive instruction spanning defensive security operations, network vulnerability analysis, secure systems architecture, and incident handling procedures. The program curriculum is aligned with international professional certifications and includes access to simulated cyber range environments.",
      "In addition to technical proficiencies, candidates participate in professional readiness workshops, CV optimization, and direct networking opportunities with industry partners and public sector security operations centers.",
    ],
    keyHighlights: [
      "Fully sponsored tuition covering certified training modules and examination vouchers",
      "Hands-on technical exercises in simulated enterprise network environments",
      "Mentorship from experienced incident responders and regional cybersecurity leaders",
      "Direct pathway for placement in national cybersecurity internships and operational roles",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-2",
    slug: "oas-cyber-challenge-trinidad-and-tobago-2026",
    type: "event",
    title: "Registration now open: OAS Cyber Challenge Trinidad and Tobago 2026",
    date: "8 June 2026",
    isoDate: "2026-06-08",
    tag: "Event",
    summary:
      "Technical defenders, university students, and cybersecurity enthusiasts are invited to register for the national hands-on capture-the-flag (CTF) challenge testing capabilities in forensics, reverse engineering, and threat analysis.",
    audience:
      "Cybersecurity practitioners, university teams, ethical hackers, and technical defenders across Trinidad and Tobago.",
    purpose:
      "A national competitive cyber exercise designed to test real-world offensive and defensive technical problem-solving capabilities under timed scenario constraints.",
    format: "In-person & Virtual Capture-The-Flag (CTF) competition",
    status: "Registration open",
    organizers: [
      "TT-CSIRT",
      "Organization of American States (OAS) Cybersecurity Program",
    ],
    location: "National Academy for the Performing Arts (NAPA) & Virtual Range",
    bodyParagraphs: [
      "The Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT), in collaboration with the Organization of American States (OAS), invites technical defenders and students to participate in the OAS Cyber Challenge Trinidad and Tobago 2026.",
      "The competition challenges participants across realistic operational scenarios, requiring teams and individuals to solve intricate technical problems in digital forensics, memory analysis, web application exploitation, reverse engineering, cryptography, and network traffic reconstruction.",
      "Top-performing participants will receive national recognition, advanced training vouchers, and opportunities to represent Trinidad and Tobago in regional hemispheric cybersecurity exercises.",
    ],
    keyHighlights: [
      "Jeopardy and attack-defense styled challenges designed by international CTF architects",
      "Real-time scoreboard tracking team problem-solving progress",
      "Categories: Memory forensics, binary reverse engineering, web security, and cryptography",
      "Awards ceremony and technical debriefing led by OAS and TT-CSIRT specialists",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-3",
    slug: "cyber-smee-tradewinds-2026",
    type: "news",
    title: "TT-CSIRT collaborates in Cyber Subject Matter Expert Exchange (SMEE) 2026",
    date: "15 April 2026",
    isoDate: "2026-04-15",
    tag: "News",
    summary:
      "TT-CSIRT technical specialists engaged in a comprehensive bilateral Subject Matter Expert Exchange with international military and cyber defence partners during Exercise TRADEWINDS 2026, sharing cyber threat intelligence methodologies and critical infrastructure defence strategies.",
    audience:
      "National security stakeholders, critical infrastructure operators, and regional cybersecurity partners.",
    purpose:
      "Strengthening bilateral operational cooperation, cyber threat intelligence exchange, and coordinated emergency response frameworks across the Caribbean basin.",
    format: "Operational exercise and bilateral technical exchange",
    status: "Completed official bilateral engagement",
    organizers: [
      "Ministry of Homeland Security",
      "TT-CSIRT",
      "International Partner Defense Forces",
    ],
    location: "Port of Spain, Trinidad and Tobago",
    bodyParagraphs: [
      "Technical specialists from the Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT) successfully concluded a comprehensive Subject Matter Expert Exchange (SMEE) in cybersecurity as part of multinational Exercise TRADEWINDS 2026.",
      "The exchange focused on standardizing Indicator of Compromise (IoC) dissemination formats, improving telemetry analysis from critical national infrastructure (CNI) sensors, and executing joint containment playbooks for advanced persistent threat (APT) actor campaigns.",
      "Senior government officials emphasized that regional cyber resilience depends on seamless communication channels and shared threat visibility across civil, military, and international computer emergency response teams.",
    ],
    keyHighlights: [
      "Bilateral alignment on STIX/TAXII threat intelligence ingestion and automated triage",
      "Simulated containment of coordinated ransomware outbreaks targeting maritime and port facilities",
      "Review of legal authorities and inter-agency coordination mechanisms under national cyber emergency declarations",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-4",
    slug: "mhs-tatt-mou-collaboration",
    type: "news",
    title: "Ministry of Homeland Security and TATT sign MOU to strengthen national cybersecurity collaboration",
    date: "13 March 2026",
    isoDate: "2026-03-13",
    tag: "News",
    summary:
      "The Ministry of Homeland Security and the Telecommunications Authority of Trinidad and Tobago (TATT) executed a Memorandum of Understanding establishing formal information-sharing mechanisms, incident coordination protocols, and joint regulatory initiatives to fortify national telecommunications infrastructure.",
    audience:
      "Telecommunications operators, internet service providers (ISPs), regulatory authorities, and the general public.",
    purpose:
      "Establishing a formalized statutory and operational bridge between national cybersecurity response capabilities and the telecommunications regulatory framework.",
    format: "Formal Memorandum of Understanding and inter-agency pact",
    status: "Active inter-agency agreement",
    organizers: [
      "Ministry of Homeland Security",
      "Telecommunications Authority of Trinidad and Tobago (TATT)",
      "TT-CSIRT",
    ],
    location: "Barataria, Trinidad and Tobago",
    bodyParagraphs: [
      "In a decisive step toward safeguarding Trinidad and Tobago's digital communications backbone, the Ministry of Homeland Security and the Telecommunications Authority of Trinidad and Tobago (TATT) formally executed a Memorandum of Understanding (MOU).",
      "The agreement institutes mandatory and voluntary incident notification thresholds for telecommunications service providers, ensures expedited technical support from TT-CSIRT during carrier-level disruptions, and establishes a joint working group on emerging telecommunications security standards.",
      "The partnership enhances national capability to detect and mitigate large-scale distributed denial-of-service (DDoS) attacks, BGP routing hijacks, and undersea cable infrastructure anomalies before public services are degraded.",
    ],
    keyHighlights: [
      "Establishment of direct 24/7 technical liaison channels between TT-CSIRT and major telecom operators",
      "Joint oversight of critical telecommunications resilience assessments and vulnerability remediations",
      "Collaborative public awareness campaigns addressing consumer mobile security and broadband safety",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-5",
    slug: "school-education-program-outreach",
    type: "training",
    title: "School Education Program outreach: Speyside High School and Bishop Anstey High School",
    date: "6 February 2026",
    isoDate: "2026-02-06",
    tag: "Education",
    summary:
      "TT-CSIRT officers conducted specialized interactive youth awareness workshops addressing cyber hygiene, social media safety, online scam detection, and exploring cybersecurity careers.",
    audience:
      "Secondary school students, teachers, guidance counselors, and school administrators across Trinidad and Tobago.",
    purpose:
      "Cultivating early digital resilience, responsible internet use, awareness of online exploitation, and inspiring young citizens to explore technical cybersecurity professions.",
    format: "In-person school presentations, interactive workshops, and educator toolkits",
    status: "Ongoing outreach program throughout the academic school year",
    organizers: [
      "TT-CSIRT",
      "Ministry of Education",
    ],
    location: "Speyside High School (Tobago) & Bishop Anstey High School East (Trinidad)",
    bodyParagraphs: [
      "Officers from TT-CSIRT's public awareness and capacity-building division conducted interactive cyber awareness sessions at Speyside High School in Tobago and Bishop Anstey High School East in Trinidad.",
      "The outreach curriculum addressed issues directly impacting youth, including online privacy settings, the dangers of social engineering scams, cyberbullying prevention, and safe practices when using public Wi-Fi networks and gaming platforms.",
      "Students were also introduced to the fundamentals of computer defense and guided on academic pathways, certifications, and technical competitions available to young citizens seeking cybersecurity careers in Trinidad and Tobago.",
    ],
    keyHighlights: [
      "Over 450 secondary students engaged across interactive classroom sessions",
      "Distribution of student Cyber Safety Handbooks and educator classroom guides",
      "Open invitations for schools nationwide to schedule free TT-CSIRT cyber awareness visits",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-6",
    slug: "cyber-threat-intelligence-crisis-communication-workshop",
    type: "workshop",
    title: "Cyber Threat Intelligence and Crisis Communication Workshop",
    date: "26 March 2025",
    isoDate: "2025-03-26",
    tag: "Workshop",
    summary:
      "Joint workshop hosted by TT-CSIRT and FIRST under the A4 initiative, training incident response teams from across Trinidad and Tobago in rapid crisis communication and actionable threat indicator dissemination.",
    audience:
      "Incident response team leads, SOC analysts, corporate communications officers, and risk executives.",
    purpose:
      "Building practical competency in managing the dual demands of technical threat containment and transparent, legally sound stakeholder communications during a major cyber crisis.",
    format: "Hands-on technical workshop and crisis simulation",
    status: "Completed technical workshop with follow-on resources available",
    organizers: [
      "TT-CSIRT",
      "Forum of Incident Response and Security Teams (FIRST)",
    ],
    location: "Hyatt Regency Trinidad, Port of Spain",
    bodyParagraphs: [
      "TT-CSIRT, in collaboration with the Forum of Incident Response and Security Teams (FIRST) under the A4 initiative, delivered an intensive technical workshop on Cyber Threat Intelligence (CTI) and Crisis Communication in Port of Spain.",
      "The session brought together cybersecurity professionals from the financial sector, energy infrastructure, government ministries, and regional healthcare institutions to practice actionable intelligence sharing and rapid incident triage.",
      "Participants engaged in interactive tabletop exercises simulating severe extortion and data breach scenarios, learning how to formulate timely executive briefings, regulatory notifications, and public advisories without compromising active forensic investigations.",
    ],
    keyHighlights: [
      "Frameworks for converting raw threat telemetry into actionable defensive indicators",
      "Templates and guidelines for public sector breach communications aligned with the Data Protection Act",
      "Collaborative peer networking across Trinidad and Tobago's incident response community",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-7",
    slug: "shesecures-trinidad-and-tobago",
    type: "event",
    title: "SheSecures Trinidad and Tobago: Women in Cybersecurity Challenge",
    date: "4 June 2025",
    isoDate: "2025-06-04",
    tag: "Event",
    summary:
      "A national initiative organized in collaboration with the Inter-American Commission of Women to support, inspire, and develop female cybersecurity leadership in Trinidad and Tobago.",
    audience:
      "Women students, early-career technologists, IT professionals, and aspiring cybersecurity leaders.",
    purpose:
      "Fostering diversity in the cybersecurity profession and expanding pathways for women in digital defense, technical incident response, and cybersecurity governance.",
    format: "Hands-on technical challenge, mentorship symposium, and career panels",
    status: "Annual national event (next cohort scheduled for 2026)",
    organizers: [
      "TT-CSIRT",
      "Inter-American Commission of Women (CIM)",
      "Organization of American States (OAS)",
    ],
    location: "Port of Spain, Trinidad and Tobago",
    bodyParagraphs: [
      "SheSecures Trinidad and Tobago is a national initiative spearheaded by TT-CSIRT alongside the Inter-American Commission of Women (CIM) and the OAS Cybersecurity Program to bridge the gender gap in cybersecurity.",
      "The event combines beginner-friendly and intermediate technical problem-solving exercises with inspiring keynote addresses from prominent women leaders in cybersecurity, risk management, and software engineering across the Caribbean.",
      "Participants gain hands-on experience in vulnerability assessment, digital evidence handling, and security auditing while establishing long-term professional mentorship connections with established cybersecurity practitioners.",
    ],
    keyHighlights: [
      "Hands-on introductory labs tailored for women with varying technical backgrounds",
      "Keynote addresses and breakout mentorship circles with female technical leaders",
      "Certificates of participation and access to ongoing international learning cohorts",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
  {
    id: "item-8",
    slug: "tabletop-exercises-enhancing-national-resilience",
    type: "news",
    title: "Cyber Security Tabletop Exercises (TTX) enhancing national resilience",
    date: "8 December 2023",
    isoDate: "2023-12-08",
    tag: "News",
    summary:
      "Senior government leadership and critical infrastructure executives participated in an intensive simulated cyber attack exercise testing inter-ministerial decision-making, public communication, and operational continuity.",
    audience:
      "Permanent secretaries, corporate executives, critical infrastructure directors, and disaster management coordinators.",
    purpose:
      "Evaluating inter-organizational governance, communication speed, and strategic decision-making protocols during simulated catastrophic cyber attacks.",
    format: "Executive simulation exercise and strategic debriefing",
    status: "Completed national simulation; institutionalized as periodic service",
    organizers: [
      "Ministry of Homeland Security",
      "TT-CSIRT",
    ],
    location: "Government Plaza, Port of Spain",
    bodyParagraphs: [
      "Senior executives from across central government and operators of critical national infrastructure gathered in Port of Spain to participate in the National Cyber Security Tabletop Exercise (TTX) facilitated by TT-CSIRT.",
      "The high-tempo simulation confronted leadership teams with a cascading multi-vector cyber attack affecting government revenue collection, public utility services, and hospital emergency operations simultaneously.",
      "The exercise highlighted the paramount importance of pre-established incident notification chains, rapid inter-ministerial coordination, and regular testing of off-line disaster recovery processes to maintain public trust and continuous continuity of essential services.",
    ],
    keyHighlights: [
      "Participation by over 60 senior directors representing 18 public and private infrastructure entities",
      "Evaluation of national incident triage protocols under simulated media scrutiny and service degradation",
      "Actionable recommendations integrated into the National Cyber Security Incident Management Framework",
    ],
    contactEmail: "contacts@ttcsirt.gov.tt",
    contactPhone: "+1 (868) 625-7937",
  },
];

/**
 * Deterministically generates the canonical URL for any editorial item based
 * strictly on its content type and canonical slug.
 *
 * Information Architecture:
 * - News: /news/:slug
 * - Events: /events/:slug
 * - Training / Education: /training/:slug
 * - Workshops: /events/:slug (with alias /workshops/:slug supported)
 */
export function getEditorialItemUrl(item: Pick<EditorialItem, "type" | "slug">): string {
  switch (item.type) {
    case "news":
      return `/news/${item.slug}`;
    case "event":
      return `/events/${item.slug}`;
    case "training":
      return `/training/${item.slug}`;
    case "workshop":
      return `/events/${item.slug}`;
  }
}

/**
 * Retrieves an editorial item by slug across all editorial types.
 */
export function getEditorialItemBySlug(slug: string): EditorialItem | undefined {
  const normalized = slug.trim().toLowerCase();
  return EDITORIAL_ITEMS.find(
    (item) => item.slug.toLowerCase() === normalized || item.id.toLowerCase() === normalized
  );
}

/**
 * Retrieves editorial items filtered by type.
 */
export function getEditorialItemsByType(type: EditorialContentType): EditorialItem[] {
  return EDITORIAL_ITEMS.filter((item) => item.type === type);
}
