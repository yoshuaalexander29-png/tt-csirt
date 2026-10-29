/**
 * Search Index Builder for TT-CSIRT Site Search
 *
 * Derives documents directly from canonical application sources:
 * - National Guidance Library (`GUIDANCE_SUMMARIES` from `src/services/guidance/manifest.ts`)
 * - Editorial Content (`EDITORIAL_ITEMS` from `src/services/newsEventsContent.ts`)
 * - Canonical Services (Incident response, Proactive risk exposure, Services catalogue)
 * - Statistics Model (`getCanonicalAnalysis` from `src/services/statistics/index.ts`)
 * - Institutional Core Pages (About, National Strategy, Contact)
 * - Dynamic Advisories & Alerts (from `getSynchronousMemoryListEntry`)
 */

import { SearchDocument, IndexedSearchDocument } from "./searchTypes";
import {
  normalizeText,
  tokenize,
  extractCveIdentifiers,
  extractAdvisoryIdentifiers,
} from "./searchNormalize";
import { GUIDANCE_SUMMARIES } from "../guidance/manifest";
import { getGuidanceArticleBySlug } from "../guidance/articles/index";
import { EDITORIAL_ITEMS, EditorialItem } from "../newsEventsContent";
import { getCanonicalAnalysis } from "../statistics/index";
import { getSynchronousMemoryListEntry } from "../advisoryCache";

/**
 * Builds the canonical static search document list
 */
export function getCanonicalStaticDocuments(): SearchDocument[] {
  const documents: SearchDocument[] = [];

  // ==========================================
  // 1. Core Services
  // ==========================================
  documents.push(
    {
      id: "service-incident-response",
      type: "service",
      title: "Incident response service",
      description:
        "Official incident response service providing technical support, consultative guidance, coordination, and mitigation for cyber security incidents affecting government, business, and citizen systems across Trinidad and Tobago.",
      summary:
        "Official incident response service providing technical support, consultative guidance, coordination, and mitigation for cyber security incidents affecting government, business, and citizen systems across Trinidad and Tobago.",
      href: "/report-an-incident",
      keywords: [
        "incident",
        "response",
        "reporting",
        "triage",
        "coordination",
        "hotline",
        "emergency",
        "consultative",
        "incident handling",
        "compromise",
        "breach",
        "mitigation",
      ],
      aliases: ["incident response", "emergency response", "ir service"],
      categoryLabel: "Service",
    },
    {
      id: "service-proactive-risk",
      type: "service",
      title: "Proactive risk exposure management",
      description:
        "Continuous security monitoring, vulnerability identification, security assessments, capacity building, and proactive threat intelligence to prevent incidents before they occur.",
      summary:
        "Continuous security monitoring, vulnerability identification, security assessments, capacity building, and proactive threat intelligence to prevent incidents before they occur.",
      href: "/services/proactive-risk-management",
      keywords: [
        "proactive",
        "risk",
        "exposure",
        "management",
        "vulnerability",
        "assessment",
        "capacity building",
        "threat intelligence",
        "monitoring",
        "hygiene",
      ],
      aliases: ["risk management", "proactive service", "vulnerability assessment"],
      categoryLabel: "Service",
    },
    {
      id: "service-hub",
      type: "service",
      title: "Cyber security services",
      description:
        "Complete catalogue of services provided by TT-CSIRT in line with the FIRST CSIRT Services Framework, delivered at no cost to public and private sector organisations in Trinidad and Tobago.",
      summary:
        "Complete catalogue of services provided by TT-CSIRT in line with the FIRST CSIRT Services Framework, delivered at no cost to public and private sector organisations in Trinidad and Tobago.",
      href: "/services",
      keywords: [
        "services",
        "functions",
        "core functions",
        "first",
        "framework",
        "catalogue",
        "support",
        "no cost",
        "assistance",
      ],
      categoryLabel: "Service hub",
    }
  );

  // ==========================================
  // 2. Guidance Hub & Canonical Articles
  // ==========================================
  documents.push({
    id: "guidance-hub",
    type: "guidance",
    title: "Cyber security guidance hub",
    description:
      "Authoritative national cybersecurity guidance library published by TT-CSIRT across four primary sectors: Individuals and families, Organisations and businesses, Government and critical infrastructure, and Technical standards.",
    summary:
      "Authoritative national cybersecurity guidance library published by TT-CSIRT across four primary sectors: Individuals and families, Organisations and businesses, Government and critical infrastructure, and Technical standards.",
    href: "/guidance",
    keywords: [
      "guidance",
      "guidance library",
      "best practices",
      "how to",
      "advice",
      "frameworks",
      "procedures",
      "checklists",
      "standards",
      "national guidance",
    ],
    categoryLabel: "Guidance hub",
  });

  for (const item of GUIDANCE_SUMMARIES) {
    const fullArticle = item.slug ? getGuidanceArticleBySlug(item.slug) : undefined;
    const checklistKeywords: string[] = [];
    if (fullArticle?.checklist) {
      for (const chk of fullArticle.checklist.items) {
        if (chk.priority) checklistKeywords.push(chk.priority);
        if (chk.task) checklistKeywords.push(...tokenize(chk.task));
      }
    }

    documents.push({
      id: `guidance-${item.slug}`,
      type: "guidance",
      title: item.title,
      description: item.summary,
      summary: item.summary,
      href: `/guidance/${item.slug}`,
      date: item.lastReviewed,
      publishedAt: item.lastReviewed,
      keywords: [
        ...tokenize(item.title),
        item.slug,
        item.category,
        item.categoryLabel,
        item.audienceLabel,
        ...item.audience,
        ...(item.primarySource ? tokenize(item.primarySource) : []),
        ...(item.slug === "phishing-scams"
          ? ["business email compromise", "bec", "fake invoices", "wire fraud scam", "ceo fraud", "social engineering"]
          : []),
        ...(item.slug === "ransomware-response"
          ? ["extortionware", "cryptolocker", "data kidnapping", "backup recovery"]
          : []),
        "guidance",
        "checklist",
        "procedure",
        "best practice",
        "security",
        ...checklistKeywords,
      ],
      categoryLabel: item.categoryLabel,
    });
  }

  // ==========================================
  // 3. Editorial Items (Training, Events, News, Workshops)
  // ==========================================
  documents.push(
    {
      id: "training-hub",
      type: "training",
      title: "Cyber security training and education programs",
      description:
        "Overview of national cybersecurity capacity-building initiatives, school outreaches, workforce certifications, and tabletop crisis exercises.",
      summary:
        "Overview of national cybersecurity capacity-building initiatives, school outreaches, workforce certifications, and tabletop crisis exercises.",
      href: "/training",
      keywords: ["training", "education", "courses", "certifications", "workforce", "capacity building"],
      categoryLabel: "Training hub",
    },
    {
      id: "news-events-hub",
      type: "news",
      title: "News, events and training updates",
      description:
        "Authoritative national cybersecurity announcements, inter-agency agreements, regional exercises, and upcoming events.",
      summary:
        "Authoritative national cybersecurity announcements, inter-agency agreements, regional exercises, and upcoming events.",
      href: "/news-events",
      keywords: ["news", "events", "announcements", "updates", "bilateral"],
      categoryLabel: "News & events",
    }
  );

  for (const ed of EDITORIAL_ITEMS) {
    let docHref = `/news/${ed.slug}`;
    if (ed.type === "training") {
      docHref = `/training/${ed.slug}`;
    } else if (ed.type === "event" || ed.type === "workshop") {
      docHref = `/events/${ed.slug}`;
    }

    const typeMapping: Record<EditorialItem["type"], SearchDocument["type"]> = {
      training: "training",
      event: "event",
      workshop: "event",
      news: "news",
    };

    documents.push({
      id: `editorial-${ed.id}`,
      type: typeMapping[ed.type] || "news",
      title: ed.title,
      description: ed.summary,
      summary: ed.summary,
      href: docHref,
      date: ed.date,
      publishedAt: ed.date,
      keywords: [
        ...tokenize(ed.title),
        ed.slug,
        ed.tag,
        ed.type,
        ...(ed.audience ? tokenize(ed.audience) : []),
        ...(ed.organizers ? ed.organizers.flatMap((o) => tokenize(o)) : []),
      ],
      searchText: ed.bodyParagraphs ? ed.bodyParagraphs.join(" ") : "",
      categoryLabel: ed.tag,
    });
  }

  // ==========================================
  // 4. Incident Statistics
  // ==========================================
  try {
    const stats = getCanonicalAnalysis();
    const meta = stats.metadata;
    const latestP = stats.latestPeriod;
    const catWords = latestP.categoryMetrics.flatMap((c) => tokenize(c.name));

    documents.push({
      id: "data-statistics",
      type: "statistics",
      title: "National cyber security incident statistics",
      description: `Official verified incident notifications reported to TT-CSIRT across public and private sectors from ${meta.coverageStartYear} to ${meta.coverageEndYear}, detailing empirical incident classifications, sector exposure, and historical trends.`,
      summary: `Official verified incident notifications reported to TT-CSIRT across public and private sectors from ${meta.coverageStartYear} to ${meta.coverageEndYear}, detailing empirical incident classifications, sector exposure, and historical trends.`,
      href: "/statistics",
      date: `${meta.coverageEndYear}`,
      publishedAt: `${meta.coverageEndYear}`,
      keywords: [
        "statistics",
        "data",
        "incidents",
        "metrics",
        "trends",
        "reports",
        "authoritative",
        String(meta.coverageStartYear),
        String(meta.coverageEndYear),
        "historical",
        "sector",
        "public",
        "private",
        "taxonomy",
        ...catWords,
      ],
      aliases: ["incident data", "annual statistics", "threat landscape"],
      categoryLabel: "Data & statistics",
    });
  } catch (e) {
    // Graceful fallback if stats not initialized
  }

  // ==========================================
  // 5. Institutional & Governance Pages
  // ==========================================
  documents.push(
    {
      id: "inst-about",
      type: "institutional",
      title: "About TT-CSIRT",
      description:
        "Establishment, statutory mandate, mission, governance under the Ministry of Homeland Security, international partnerships (FIRST, OAS, ITU), and confidentiality policy.",
      summary:
        "Establishment, statutory mandate, mission, governance under the Ministry of Homeland Security, international partnerships (FIRST, OAS, ITU), and confidentiality policy.",
      href: "/about",
      keywords: [
        "about",
        "mission",
        "mandate",
        "background",
        "ministry of homeland security",
        "oas",
        "itu",
        "first",
        "governance",
        "history",
        "who we are",
      ],
      categoryLabel: "Institutional",
    },
    {
      id: "inst-strategy",
      type: "institutional",
      title: "National Cyber Security Strategy",
      description:
        "The foundational Government policy document setting national cyber resilience objectives and authorizing the establishment of the national CSIRT.",
      summary:
        "The foundational Government policy document setting national cyber resilience objectives and authorizing the establishment of the national CSIRT.",
      href: "/national-cyber-security-strategy",
      keywords: [
        "strategy",
        "national cyber security strategy",
        "policy",
        "cabinet",
        "framework",
        "objectives",
        "vision",
      ],
      aliases: ["ncss", "cyber strategy"],
      categoryLabel: "Institutional",
    },
    {
      id: "inst-contact",
      type: "institutional",
      title: "Contact TT-CSIRT and incident reporting",
      description:
        "Official emergency hotlines (+1 868 625-7937, +1 868 299-8827), PGP encryption key, physical office address, and hours. Contact the Trinidad and Tobago Police Service for suspected crime, cybercrime, fraud, or a criminal investigation.",
      summary:
        "Official emergency hotlines (+1 868 625-7937, +1 868 299-8827), PGP encryption key, physical office address, and hours. Contact the Trinidad and Tobago Police Service for suspected crime, cybercrime, fraud, or a criminal investigation.",
      href: "/contact",
      aliases: ["cyber crime", "cybercrime", "crime report", "report fraud", "police cybercrime"],
      keywords: [
        "contact",
        "phone",
        "email",
        "address",
        "location",
        "hotline",
        "pgp",
        "reporting",
        "office",
        "emergency contact",
        "police",
        "ttps",
        "csmu",
        "crime",
        "cyber crime",
        "cybercrime",
        "fraud",
        "criminal investigation",
      ],
      categoryLabel: "Contact",
    },
    {
      id: "inst-accessibility",
      type: "institutional",
      title: "Accessibility statement",
      description:
        "TT-CSIRT accessibility commitment, WCAG 2.2 AA compliance status, accessible features, and reporting mechanisms.",
      summary:
        "TT-CSIRT accessibility commitment, WCAG 2.2 AA compliance status, accessible features, and reporting mechanisms.",
      href: "/accessibility-statement",
      keywords: [
        "accessibility",
        "wcag",
        "screen reader",
        "keyboard navigation",
        "contrast",
        "assistive technology",
        "accessibility statement",
      ],
      categoryLabel: "Institutional",
    },
    {
      id: "inst-privacy",
      type: "institutional",
      title: "Privacy policy (Data Protection Act)",
      description:
        "TT-CSIRT compliance with the Data Protection Act (DPA), confidentiality protocols, TLP sharing standards, and data subject rights.",
      summary:
        "TT-CSIRT compliance with the Data Protection Act (DPA), confidentiality protocols, TLP sharing standards, and data subject rights.",
      href: "/privacy-policy",
      keywords: [
        "privacy",
        "privacy policy",
        "data protection",
        "dpa",
        "confidentiality",
        "traffic light protocol",
        "tlp",
        "personal data",
      ],
      aliases: ["dpa", "privacy policy"],
      categoryLabel: "Institutional",
    }
  );

  return documents;
}

/**
 * Derives documents dynamically from cached advisories
 */
export function getCanonicalAdvisoryDocuments(): SearchDocument[] {
  try {
    const memoryAdvisories =
      getSynchronousMemoryListEntry("corpus_all")?.advisories ||
      getSynchronousMemoryListEntry("page=1&perPage=100")?.advisories ||
      getSynchronousMemoryListEntry("page=1&perPage=10")?.advisories ||
      getSynchronousMemoryListEntry("page=1&perPage=5")?.advisories ||
      [];

    return memoryAdvisories.map((adv) => ({
      id: `adv-${adv.id}`,
      type: adv.categoryName === "Alert" ? "alert" : "advisory",
      title: adv.title,
      description: adv.displaySummary || adv.sourceExcerpt || "",
      summary: adv.displaySummary || adv.sourceExcerpt || "",
      href: `/advisories/${adv.slug || adv.id}`,
      date: adv.date,
      publishedAt: adv.date,
      keywords: [
        ...tokenize(adv.rawTitle || adv.title),
        adv.referenceNumber || "",
        ...(adv.cveList || []),
        adv.categoryName || "",
      ],
      cves: adv.cveList,
      advisoryId: adv.referenceNumber,
      categoryLabel: adv.categoryName === "Alert" ? "Alert" : "Advisory",
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Converts a raw SearchDocument into an IndexedSearchDocument with precomputed fields
 */
export function indexDocument(doc: SearchDocument): IndexedSearchDocument {
  const normTitle = normalizeText(doc.title);
  const normDesc = normalizeText(doc.description || doc.summary || "");
  const normKws = (doc.keywords || []).map((k) => normalizeText(k)).filter(Boolean);
  const normAliases = (doc.aliases || []).map((a) => normalizeText(a)).filter(Boolean);
  const normSearchText = normalizeText(doc.searchText || "");

  const tokTitle = tokenize(normTitle);
  const tokDesc = tokenize(normDesc);
  const tokKws = normKws.flatMap((k) => tokenize(k));

  const cvesUpper = extractCveIdentifiers(
    `${doc.title} ${doc.summary} ${(doc.cves || []).join(" ")}`
  );
  const advIdsUpper = extractAdvisoryIdentifiers(
    `${doc.title} ${doc.advisoryId || ""} ${(doc.keywords || []).join(" ")}`
  );

  return {
    ...doc,
    description: doc.description || doc.summary,
    normalizedTitle: normTitle,
    normalizedDescription: normDesc,
    normalizedKeywords: normKws,
    normalizedAliases: normAliases,
    normalizedSearchText: normSearchText,
    tokenizedTitle: tokTitle,
    tokenizedDescription: tokDesc,
    tokenizedKeywords: tokKws,
    titleTokenSet: new Set(tokTitle),
    descriptionTokenSet: new Set(tokDesc),
    keywordTokenSet: new Set(tokKws),
    cvesUpper,
    advisoryIdsUpper: advIdsUpper,
  };
}

/**
 * Builds and returns the unified indexed search document corpus
 */
export function buildSearchIndex(): {
  documents: IndexedSearchDocument[];
  vocabulary: Map<string, number>;
  documentMap: Map<string, IndexedSearchDocument>;
} {
  const staticDocs = getCanonicalStaticDocuments();
  const advisoryDocs = getCanonicalAdvisoryDocuments();

  const allRawDocs = [...staticDocs, ...advisoryDocs];

  // Deduplicate by ID and Href
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();
  const uniqueDocs: SearchDocument[] = [];

  for (const doc of allRawDocs) {
    if (!doc.id || !doc.href) continue;
    if (seenIds.has(doc.id) || seenHrefs.has(doc.href)) continue;
    seenIds.add(doc.id);
    seenHrefs.add(doc.href);
    uniqueDocs.push(doc);
  }

  const indexedDocs = uniqueDocs.map(indexDocument);
  const documentMap = new Map<string, IndexedSearchDocument>();
  const vocabulary = new Map<string, number>();

  for (const doc of indexedDocs) {
    documentMap.set(doc.id, doc);

    // Populate corpus vocabulary with token frequency
    for (const token of [...doc.tokenizedTitle, ...doc.tokenizedKeywords]) {
      if (token.length >= 4) {
        vocabulary.set(token, (vocabulary.get(token) || 0) + 1);
      }
    }
  }

  return {
    documents: Object.freeze(indexedDocs) as IndexedSearchDocument[],
    vocabulary,
    documentMap,
  };
}
