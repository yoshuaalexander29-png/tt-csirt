# Proactive risk page content architecture review

**Reviewed:** 8 October 2026  
**Route:** `/services/proactive-risk-management`  
**Production status:** Not verified

## Decision and result

Replaced the four long service prose sections with four single-column service choices. Each has a descriptive linked heading and a short summary, using the site’s existing document-list styling and TT-CSIRT typography. The active-incident route remains in the Information Notice near the top and is not a peer choice in the list. The page now has one useful `On this page` entry, “What help you can get”, which points to the actual list section.

The page title is “Reduce your organisation’s cyber security risk”. Its lead explains TT-CSIRT in full before using the abbreviation. No assessment, threat-intelligence, vulnerability-management or business-continuity route was invented. Four choices were kept because they represent distinct user outcomes without turning the page into a service directory.

## Requirements and invariants

**Requirements met:** shorten the page; use a single-column linked-choice pattern; describe the user outcome in each link; verify every destination; keep active incident reporting distinct; keep the existing in-page navigation aligned to real sections; render at desktop and mobile.

**Invariants preserved:** one `h1`; sentence case; British spelling; existing TT-CSIRT fonts, type scale, container, link styles and page-navigation component; no cards, icons, shadows, Canada assets, tokens, CSS, framework classes or dependencies. The incident-reporting page was not edited.

## Destination verification and final link matrix

Each route was opened in the local browser, its page content inspected, and the choice was clicked from the proactive-risk page at desktop width. The `/services` page’s proactive-risk link was also followed to this page.

| Link text | Destination | Type | User outcome | Technical clarity | Non-technical clarity | Source support | Destination verified |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Contact TT-CSIRT about security assessment support | `/contact` | Contact information | Find general contact details and ask about assessment support | Names security assessment support; the destination has secure PGP details for vulnerability reports | “Contact TT-CSIRT” makes the action clear; no assessment is promised | Current TT-CSIRT service page and Ministry page list security assessments; local contact page provides general enquiry email and PGP details for vulnerability reports | **Yes** — opened and clicked; page title “Contact TT-CSIRT” |
| Check current cyber security threats and vulnerabilities | `/advisories` | Current alerts and advisories | Review current threats, advisories and recommended actions | Explicitly names threats and vulnerabilities | “Check current” makes the purpose legible | Current TT-CSIRT services page describes Alerts and Advisories as updates on emerging threats and vulnerabilities; local page publishes advisories and remediation information | **Yes** — opened and clicked; page title “Cyber security advisories”; latest local advisory dated 25 September 2026 |
| Build cyber security skills and prepare for disruption | `/training` | Training and education information | Find training, awareness and exercise opportunities | Names training and incident response exercises | Describes skills and preparedness outcomes | Current TT-CSIRT services page identifies capacity building and training; local page includes training programmes, awareness activities, technical workshops and tabletop exercises | **Yes** — opened and clicked; page title “Cyber training and education” |
| Get guidance on core cyber security controls | `/guidance/cyber-security-baseline` | Organisation guidance | Find practical controls for an organisation | Asset inventory, access management, device protection and recovery planning | “Get guidance” plus concrete controls explains what the user will find | Local manifest and destination page name those control areas; general framing is consistent with NIST CSF 2.0, which describes outcomes without prescribing one method | **Yes** — opened and clicked; page title “Cyber security baseline for organisations and businesses” |

No dedicated local assessment destination exists. `/contact` is the nearest appropriate existing route. Its destination description is deliberately limited to material present there: general and training contact plus secure vulnerability-report channels. The heading invites an enquiry; it does not promise a completed assessment.

## Source audit

### GOV.UK and project content rules

- [A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/): “The first time you use an abbreviation on a page, explain it in full.” Expanded the full TT-CSIRT name in the lead. “All content on GOV.UK should be written in plain English.” Kept recognisable technical terms, paired with concrete outcomes, and used British spelling such as “organisation”.
- [Identify user needs](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/): “Every piece of published content should meet a valid user need.” The page now quickly answers why someone is here and presents choices for their next task.
- [Write effective links](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/add-links/): links should “be descriptive”, “frontload it with relevant terms”, and start with a verb when they lead to a task. The four titles start with Contact, Check, Build and Get; none uses generic “Learn more” wording. The same guidance cautions against unnecessary anchor links; the doormats use real routes.
- [Choose a content type](https://guidance.publishing.service.gov.uk/publish-update-retire-content/choose-content-type/): “The right content type will depend on the purpose of your content.” This route is service information that directs users to existing services and guidance, so details live on those destination pages rather than in lengthy prose here.
- [Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/) says to write plainly for specialists as well as general readers. The link labels pair familiar actions with precise cyber security concepts.
- Project `/guidelines/Guidelines.md` and `/DECISIONS.md` retain the single-`h1`, sentence-case, TT-CSIRT typography/layout and existing navigation constraints. They also prohibit dashboard-style cards and artificial decorative link treatments.

### Canada pattern and implementation evidence

- [Canada.ca Services and information pattern](https://design.canada.ca/common-design-patterns/services-information.html), last updated 2 December 2025, defines the pattern as links with descriptions that act as a roadmap. It says each doormat has a linked heading and description, advises against decorative icons, and permits one column for all screen sizes. Its recommended ranges are about 45 characters for titles (extending to 75 where clarity needs it) and 120 characters for descriptions. The four titles are 44–56 characters; descriptions are 71–95 characters.
- [GCWeb implementation reference](https://wet-boew.github.io/GCWeb/components/gc-srvinfo/gc-srvinfo-fieldflow-en.html) confirms semantic heading-plus-link-plus-paragraph structure for the single-column example. The local implementation uses `ul` / `li`, `h3` link headings and description paragraphs. It does not use GCWeb classes or runtime code.
- [GCWeb current reference index](https://wet-boew.github.io/themes-dist/GCWeb/demos/index-en.html) lists “Services and information” as a stable pattern. The user-provided rendered Get Cyber Safe HTML was inspected as separate evidence; it is an Angular/WET awareness page, not a rendered services-information example, so it was not treated as the source of the doormat implementation.
- [Canada.ca Content Style Guide, links](https://design.canada.ca/style-guide/): “A link must describe the content a person will find once they click on it.” The descriptions say what is on each real destination and do not repeat the exact linked title or use promotional copy.
- [Get Cyber Safe](https://www.getcybersafe.gc.ca/en) provides Canadian public-awareness material. It was used only as an example of a separate national awareness service, not as evidence of TT-CSIRT services.
- Canadian typography, colours, generated classes, layout tokens and dependencies were not imported. The local list keeps TT-CSIRT’s existing 19px linked titles and 16px descriptions.

### Cyber security references: scope and limits

- [TT-CSIRT current services](https://ttcsirt.gov.tt/core-functions/) explicitly names Proactive Risk Exposure Management, Alerts and Advisories, Capacity Building, Cyber Threat Intelligence and Security Assessments. It supports those service areas, not an invented destination or guaranteed individual assessment.
- [Ministry of Homeland Security TT-CSIRT page](https://homelandsecurity.gov.tt/divisions/tt-csirt/) independently identifies threat intelligence/advisories, security assessments and vulnerability management, training/awareness, and assistance to government and critical-infrastructure operators. It supports institutional scope, not a claim that every service is available to every organisation.
- The [2012 National Cyber Security Strategy](https://ttcsirt.gov.tt/national-cyber-security-strategy/) establishes historical national strategy context for risk assessment, continuity planning, training and incident reporting. Its older goals are not presented as current operational guarantees.
- A [2023 Parliament public-hearing summary](https://www.ttparliament.org/wp-content/uploads/2022/01/phs20231211.pdf) surfaced in source research and mentions a TT-CSIRT industry-standard baseline assessment. It is historical corroboration only and is not used to promise that an assessment is currently available. No directly relevant Gazette provision was identified or needed for this service-information change; no legal authority claim was added.
- [FIRST CSIRT Services Framework 2.1](https://www.first.org/standards/frameworks/csirts/csirt_services_framework_v2.1) says “No CSIRT is expected to provide all described services.” It prevents treating framework categories as proof of this team’s complete offerings.
- [CISA Cross-Sector Cybersecurity Performance Goals](https://www.cisa.gov/cybersecurity-performance-goals) prioritise a limited number of essential, high-impact actions. Used only as general support for avoiding an overloaded service menu, not as evidence of TT-CSIRT capability.
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20) describes high-level outcomes and does not prescribe how to achieve them. It supports general risk-control vocabulary; the destination itself supplies the local guidance.
- [NCSC external attack surface management guidance](https://www.ncsc.gov.uk/guidance/external-attack-surface-management-buyers-guide) defines internet-accessible asset exposure and risk management. It informs technical terminology only; the page does not claim TT-CSIRT scans internet-facing assets.

## Required two-pass A-to-Z wording audit

### Pass 1: rules applied before final wording

| Exact A-to-Z guidance | Why it applies | Wording decision |
| --- | --- | --- |
| “The first time you use an abbreviation on a page, explain it in full.” | TT-CSIRT appears in a link and the active-incident notice | Expand “Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)” in the lead |
| “All content on GOV.UK should be written in plain English.” | The page must work for both security professionals and organisation representatives | Use everyday verbs, retain “cyber security”, “vulnerabilities” and “security assessment” where they give needed precision |
| “Use UK English spelling and grammar.” | The project follows GOV.UK conventions | Keep “organisation” and “organisations” throughout |
| GOV.UK link guidance: “make it descriptive”; frontload relevant terms; start task links with a verb | Headings are the primary navigation choices and may be read outside surrounding paragraphs | Use Contact / Check / Build / Get and name the relevant outcome in every title |
| GOV.UK warns anchor links “can be disorientating for some users with accessibility needs.” | The Canada-inspired choices are meant to navigate to tasks and information | Use verified page routes for all four choices; retain one same-page anchor only for the existing On this page navigation |

### Pass 2: final rendered titles and descriptions

| Final text | Rule checked | Problem found | Correction/result |
| --- | --- | --- | --- |
| Contact TT-CSIRT about security assessment support — “General enquiries, training requests and secure PGP details for vulnerability reports.” | Acronym expanded earlier; descriptive task link; Canada limit 75/120 | `/contact` is not a dedicated assessment page | Kept it as an enquiry, not a promise. Description now reflects the page’s general contact, training and PGP details. |
| Check current cyber security threats and vulnerabilities — “Current alerts, advisories, threat information and recommended actions.” | Verb-led, descriptive, technical term paired with plain task | Earlier service taxonomy label “Cyber Threat Intelligence” did not say what the user gets | Replaced with a current-information task and verified `/advisories` content. |
| Build cyber security skills and prepare for disruption — “Training, awareness activities, technical workshops and incident response exercises.” | Plain English for both audiences; descriptive route promise | “Capacity building” is internal service terminology | Replaced it with a clear outcome and kept supported technical activity detail. |
| Get guidance on core cyber security controls — “Guidance for organisations on asset inventory, access, device protection and recovery planning.” | Verb-led task; short title and concise keyword description | `/guidance` is broad; a specific organisation page exists | Linked directly to `/guidance/cyber-security-baseline` and checked its content. |

Final rendered title lengths are 50, 56, 54 and 44 characters. Description lengths are 86, 71, 84 and 95 characters. All are under the Canada limits; none is promotional or ends in punctuation.

## Rendered and runtime verification

- **Browser tooling:** Codex in-app browser with accessibility-tree inspection, Playwright DOM snapshots/locators and read-only page evaluation; plus headless local Chrome through Puppeteer/Chrome DevTools Protocol for final screenshots and runtime checks. Final full-page captures: [1280px desktop](/C:/Users/yoshua.alexander/Downloads/ttcsirt-website-v28-30-sept-2026/tmp/proactive-risk-final-1280.png) and [375px mobile](/C:/Users/yoshua.alexander/Downloads/ttcsirt-website-v28-30-sept-2026/tmp/proactive-risk-final-375.png).
- **Routes inspected:** `/services`, `/services/proactive-risk-management`, `/contact`, `/advisories`, `/training`, `/guidance/cyber-security-baseline`, `/report-an-incident`. The links were clicked from the proactive-risk page; all four choices reached the expected route and `h1`. The active-incident destination was separately opened and verified. The final page returned HTTP 200 at desktop and 304 on the browser’s conditional mobile reload; all assets loaded without request failures.
- **Visual iterations:** rendered and reviewed more than twice. Desktop 1280px and narrow mobile 375px views were inspected, including full-page captures. The four choices stay in one column at both sizes, descriptions wrap cleanly, the Notice remains above the choices, and the page is substantially shorter than the removed long-form version.
- **Layout/DOM:** no horizontal overflow at either tested viewport; one page `h1`; no duplicate IDs; one `On this page` item points to `#help`; doormat headings are actual links with descriptions; Notice title remains associated with its message. At 375px each linked heading wraps to two lines and measures 48px high.
- **Keyboard:** first Tab reached “Skip to main content” with the site’s yellow `#ffdd00` focus outline (about 3px). No browser console errors or warnings were recorded on the final rendered page.
- **Mobile caveat:** the pre-existing shared page-navigation CSS hides `.app-page-nav` below its breakpoint. This page keeps that existing project behavior; the service list and Notice remain visible and usable. No CSS/navigation redesign was part of this content-architecture change.
- **BUILD VERIFIED:** `npm run lint` (`tsc --noEmit`) and `npm run build` passed for the site and publishing app. Existing asset/font build-time resolution warnings remain.
- **RUNTIME VERIFIED:** local routes rendered and in-page links changed routes as expected; final-page console and page-error logs were empty.
- **VISUALLY VERIFIED:** inspected rendered desktop and mobile output in the browser.
- **ACCESSIBILITY CHECKED:** heading/list/notice relationships and skip-link focus checked; no full screen-reader or WCAG audit performed.
- **PRODUCTION VERIFIED:** no; no production deployment or production-domain check was performed.
