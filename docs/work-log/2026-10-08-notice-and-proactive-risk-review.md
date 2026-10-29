# TT-CSIRT Notice and proactive risk page review

**Reviewed:** 8 October 2026  
**Scope:** Rename the shared in-page navigation label; introduce a local Notice pattern for eligible live warnings; improve the existing proactive-risk service page and its link from Services.  
**Production status:** Not verified.

## 1. Source review and decision

The user-pasted DevTools document is the rendered **Get Cyber Safe** homepage, not the GC Design System Notice example. It identifies itself as `lang="en" dir="ltr"`, has one `h1`, a main region, header/search/navigation, nine `h2` and thirteen `h3` elements, and a footer. Its navigation and search use WET-style classes and ARIA patterns such as `gcweb-menu`, `role="search"`, `role="menu"`, `role="menuitem"`, `aria-expanded`, `aria-label`, `wb-inv`, responsive `hidden-xs`/`visible-xs`, and `.glyphicon-search`. Angular-generated `_ngcontent-*` attributes are present. The provided HTML has no `<gcds-notice>` and therefore contains no Notice DOM, title/message relation, or guide-line geometry to copy. Its page hierarchy and responsive utilities were treated as implementation evidence for that page only. The page metadata reports a 28 September 2026 modification date.

I separately inspected the GC Design System Notice documentation and its rendered preview. Its stated anatomy is guide line, icon, title and message. The guide line marks the notice’s start and end; the title names its topic. The documentation advises short messages and sparse use. The live GC Design System documentation page and official code page were checked on 8 October 2026.

The official code reference supplied in the task is:

```html
<gcds-notice
  notice-role="success"
  notice-title="Success notice title"
  notice-title-tag="h2">
  <gcds-text margin-bottom="0">
    This is a success message.
  </gcds-text>
</gcds-notice>
```

The local component retains explicit role, title, heading level, message and the guide-line/icon/title/message relationship. It adapts these to React props, semantic HTML headings, `role="note"`, a generated `aria-labelledby` relationship, Lucide icons and scoped CSS. It visibly names the role (for example, “Warning:”) and uses TT-CSIRT/GOV.UK typography, links and focus styling. It does **not** use `gcds-notice`, `<gcds-text>`, Canadian tokens, generated classes, framework CSS, web components, or Canada branding.

**Why Notice:** it creates a real contextual-message pattern while keeping the existing service-page architecture. Canada Details would collapse consequential content; Cards are for navigation; Side Navigation and Canada’s full On-this-page replacement would duplicate or replace the deeply integrated shared anchor component; Breadcrumbs solve a different navigation need. The shared component was retained and relabelled as requested.

### Sources, currency and limits

| Source checked | Status/currentness at review | Claim supported and limit |
| --- | --- | --- |
| [Ministry of Homeland Security: TT-CSIRT](https://homelandsecurity.gov.tt/divisions/tt-csirt/) | Official Ministry page; fetched 8 Oct 2026 | Identifies TT-CSIRT as the national CSIRT and names incident response/recovery, threat intelligence/advisories, security assessments/vulnerability management, training/awareness and coordination. It determines TT-specific claims. |
| [TT-CSIRT: Our Services](https://ttcsirt.gov.tt/core-functions/) and [TT-CSIRT homepage](https://ttcsirt.gov.tt/) | Official TT-CSIRT pages; fetched 8 Oct 2026; homepage showed posts through 25 Sep 2026 | Names the Proactive Risk Exposure Management service and its Alerts and Advisories, Capacity Building, Cyber Threat Intelligence and Security Assessments areas. Marketing language and broader capability claims on the source page were not repeated as independently verified guarantees. |
| [FIRST CSIRT Services Framework 2.1](https://www.first.org/standards/frameworks/csirts/csirt_services_framework_v2.1) | Official framework page; version labelled “for review purposes”; fetched 8 Oct 2026 | Says a CSIRT is not expected to provide every framework service. Used only as a caution against expanding TT-CSIRT’s remit; it does not prove TT-CSIRT capability. |
| [NIST Cybersecurity Framework 2.0](https://csrc.nist.gov/pubs/cswp/29/the-nist-cybersecurity-framework-csf-20/final) | Final publication dated 26 Feb 2024; checked 8 Oct 2026 | Describes high-level outcomes and says it does not prescribe how to achieve them. General context only, not evidence of TT-CSIRT services. |
| [CISA Cross-Sector Cybersecurity Performance Goals](https://www.cisa.gov/cybersecurity-performance-goals) and [CISA #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide) | Official search results were available; direct page fetch returned HTTP 403 on 8 Oct 2026 | General practice context for inventory, updates, authentication and backups. Because direct fetch was blocked, no TT-CSIRT service claim depends on these pages. |
| [NCSC External attack surface management guide](https://www.ncsc.gov.uk/guidance/external-attack-surface-management-buyers-guide) | Official NCSC guide; fetched 8 Oct 2026 | Defines EASM as identifying, monitoring and reducing vulnerabilities in internet-accessible assets. Used to check terminology only; the page does not claim TT-CSIRT offers EASM. |
| [GC Design System Notice: design](https://design-system.canada.ca/en/components/notice/design/), [code](https://design-system.canada.ca/en/components/notice/code/), [use](https://design-system.canada.ca/en/components/notice/use/) | Official documentation; checked 8 Oct 2026 | Component intent, anatomy, roles, concise title/message, heading tag and restrained use. Does not establish TT-CSIRT policy. |
| [GOV.UK A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/), [effective links](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/add-links/), [choose a content type](https://guidance.publishing.service.gov.uk/publish-update-retire-content/choose-content-type/) | Official guidance pages; checked 8 Oct 2026 | Plain English, acronym handling, sentence case, lowercase bullets that continue a lead-in, contextual descriptive links and choosing content by user need. Used as the editorial benchmark, not as TT law. |

## 2. Proactive-risk content audit

| Final claim or wording | Classification | Evidence and limit |
| --- | --- | --- |
| TT-CSIRT is the Trinidad and Tobago Cyber Security Incident Response Team and has the listed core functions. | **FACT** | Ministry source. |
| TT-CSIRT’s proactive service includes alerts/advisories, capacity building, cyber threat intelligence and security assessments. | **FACT** | TT-CSIRT Our Services page. The page’s broader “comprehensive” and continuous-readiness promises were not copied. |
| These functions can be presented as a path for organisations to understand risks and take informed steps. | **INFERENCE** | A plain-language grouping of the published functions; it is not a promise of a result. |
| “The right support depends on your organisation and its needs. Contact TT-CSIRT to discuss the relevant service.” | **PROPOSAL** | New service-navigation copy, not a claim that every support option is available to every visitor. |
| Inventory services exposed to the internet, review updates, use an extra sign-in check and test backups. | **PROPOSAL** | General practices, introduced explicitly as such and not represented as a TT-CSIRT-delivered service or deadline. They are consistent with general NIST/CISA guidance; no fixed remediation times or unsupported operational guarantees are stated. |

Claims removed from the prior proactive page include “neutralizing” vulnerabilities, continuous surveillance, immediate alerts, telemetry/IOC sharing, four pillars aligned to international standards, specific assessment deliverables, and fixed 48-hour/14-day patch targets. They were not supported by the reviewed TT-specific sources. The page does not portray TT-CSIRT as a regulator, law-enforcement body, or managed-security vendor.

## 3. Editorial A-to-Z audit

### Pass 1 — prior copy

| Rule | Short rule extract | Why relevant | Wording decision |
| --- | --- | --- | --- |
| Plain English / active voice | “Use the active voice” | Dense, long copy described tools and mechanisms rather than visitor actions. | Lead with what organisations can find, review and discuss. |
| Abbreviations | “Explain it in full” | TT-CSIRT appeared before its full name in the page body. | Spell out the team name on first use. |
| Specialist terms | “Use clear language” | “Telemetry”, “IOC”, “initial access vectors” and “attack surface” needed specialist knowledge. | Remove unsupported terms; retain official service names with short explanations. |
| Words to avoid / claims | “Do not fabricate a finding” | Prior claims sounded like guaranteed service levels and capabilities. | Remove unsupported capabilities and deadlines. |
| Bullets | “Use lowercase at the start” | Baseline control bullets used capitalised starts after an introductory sentence. | Use a colon lead-in and lowercase phrase bullets without full stops. |
| Links | “Make it descriptive” | The link should identify the page and reason to follow it. | Use service/action-specific link text at its point of use. |

### Pass 2 — final copy

| Rule | Final text checked | Problem found? | Correction |
| --- | --- | --- | --- |
| Plain English | “helps organisations identify cyber security risks…” | No material problem found. | Kept the direct service description. |
| Acronym | “The Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)” | No. | Full name precedes abbreviation. |
| Specialist terms | “security assessments and vulnerability management”; “multi-factor authentication” | Some terms remain because they name official services or a recognised control. | Context explains the service; the sign-in check is described before its technical term. |
| Bullets | “keep an accurate inventory…”, “review security updates…” | No. | Lowercase continuation phrases, one item each, no ending punctuation. |
| Link text | “Read TT-CSIRT cyber security advisories and alerts” | No. | Descriptive, contextual destination text. |
| Sentence case | Page headings and Notice titles | No. | Sentence case retained. |

## 4. Content type and link audit

The page serves people looking for TT-CSIRT’s preventive and readiness-related support. It remains service information under the existing `/services/proactive-risk-management` route, rather than becoming a generic security manual. No new page was needed. General organisational practices are brief and link to existing guidance; detailed advice remains in Guidance, current threat detail remains in Advisories, training detail remains in Training, and incident reporting remains on its existing route.

| Source location | Destination | Visible text | Why appropriate | Route verified / destination inspected |
| --- | --- | --- | --- | --- |
| `/services`, Proactive risk exposure management section | `/services/proactive-risk-management` | “proactive risk exposure management service” | Direct continuation from service overview to the detailed service page. | **VERIFIED** by clicking the link; destination H1 and content rendered. |
| Proactive page, Alerts and advisories | `/advisories` | “Read TT-CSIRT cyber security advisories and alerts” | Current public threat/advisory information. | **VERIFIED** HTTP 200 and page H1 rendered. |
| Proactive page, Capacity building | `/training` | “View TT-CSIRT training and awareness activities” | Existing training destination. | **VERIFIED** HTTP 200 and page H1 rendered. |
| Proactive page, Reduce your exposure | `/guidance` | “Read TT-CSIRT cyber security guidance” | Existing guidance destination for practical detail. | **VERIFIED** HTTP 200 and page H1 rendered. |
| Proactive page, active incident Notice | `/report-an-incident` | “TT-CSIRT incident reporting service” | Clear route when an incident is actually happening. | **VERIFIED** HTTP 200 and page H1 rendered; route/page not modified. |

No live warning in the scanned canonical advisory documents contained an inline link. The new Notice accepts linked React content; its active-incident service Notice includes a real link, which was rendered and route-checked. There was therefore no live “warning text with a link” to inspect as content. The stale-data condition on `/advisories` did not occur in this browser session; that renderer compiles to Notice, but that conditional state is **NOT VERIFIED** at runtime. The inactive `src/pages/RansomwareGuidePage.tsx` module is not imported by the app and is not reachable through `src/routing/routes.ts`; its old warning was left untouched rather than changing an unrenderable module. The live incident-reporting warning is also deliberately unchanged.

## 5. Implementation and route report

**Files changed in this pass**

- Added `src/components/Notice.tsx` and `src/components/Notice.module.css`.
- Updated `src/components/PageNavigation.tsx` and `src/components/AdvisoryContentRenderer.tsx`.
- Updated `src/pages/ServicesHubPage.tsx` and `src/pages/ProactiveRiskManagementPage.tsx`.
- Updated eligible live warning renderers in `src/pages/StatisticsPage.tsx`, `src/pages/AdvisoriesPage.tsx` and `src/pages/AdvisoryDetailPage.tsx`.
- Added this review report.

**Pages/routes:** No route definitions changed. The Services page, Proactive Risk Management page, Statistics page, Advisories list and advisory detail were updated. The shared in-page component’s desktop and mobile labels now read “On this page”; anchor IDs, order, active-state handling and navigation mechanism remain the same.

**Eligible warning map:** the partial-period notice on Statistics, stale-data notices on Advisories and advisory detail, and canonical advisory warning nodes now use local `Notice` with the warning role and existing warning text. The incident warning is protected and untouched. The unreferenced ransomware module remains unchanged.

`/report-an-incident` was not modified. `ReportIncidentPage.tsx`, its form, validation, date input, accordion, copy, layout and styles were outside this pass. No route, site-wide layout, global font or shared page width was changed. Notice styling is isolated in a CSS module.

## 6. Verification status

| Area | Status | Evidence |
| --- | --- | --- |
| Code | **VERIFIED** | `npm run lint` (`tsc --noEmit`) passed. `npm run build` passed for the site and publishing app. Build output still warns that a duplicate GOV.UK font URL expression and some asset URLs cannot be resolved at build time; valid local WOFF2 font requests returned HTTP 200. |
| Runtime | **VERIFIED** | Puppeteer with Chrome DevTools Protocol loaded `/services`, `/services/proactive-risk-management`, `/statistics`, the canonical advisory detail, `/advisories`, `/guidance`, `/training` and `/report-an-incident`. All final route checks returned HTTP 200; no final-route console exceptions or local failed requests were recorded. A live click from Services reached the proactive page. |
| Visual | **VERIFIED** | Two rendered iterations were inspected. Desktop 1280×800 and mobile 375×812 screenshots were captured for the proactive page; desktop and mobile Statistics screenshots and an advisory detail screenshot were inspected. The Notice appears with guide line, role icon, visible role/topic heading and message. No horizontal overflow was measured (375px mobile scroll width remained 375px). |
| Accessibility | **CHECKED** | CDP accessibility tree exposed the warning as a labelled `note` (“Warning: Partial reporting period”) and headings remained semantic. One H1 and no duplicate IDs were present on checked pages. Keyboard tab reached the skip link with a 3px `#ffdd00` focus outline. Notice icons are `aria-hidden`; the title is associated by `aria-labelledby`; static notices do not announce through `aria-live`. Icon/guide accent-to-background contrast calculations were 4.62:1 info, 5.99:1 warning, 4.41:1 danger, 5.78:1 success. No screen-reader session or full WCAG audit was performed. |
| Content | **VERIFIED** | Ministry and TT-CSIRT service statements were checked against the official pages listed above. Recommendations are separated as general practices. The FIRST framework was not used to claim TT capability. |
| Production | **NOT VERIFIED** | No production deployment or production-domain verification was performed. |

**Mobile navigation finding:** at 375px the existing `.app-page-nav` is hidden by the current global `display: none !important` media rule. The desktop and mobile labels were updated in the shared component, but the brief’s instruction to preserve current mobile behavior meant that hidden navigation was not changed. The Notice itself remains visible and fits the 375px viewport. A disclosure/anchor event was exercised in the DOM, but its hidden mobile control is not visually operable in the current layout.

**Notice-state limits:** the live warning and information roles were rendered. No current live success or danger notice was found, so those two visual variants are compile-verified and contrast-checked, but not route-rendered. No current live warning carrying an inline link was found, so that specific live-content case is **NOT VERIFIED**. Linked content in the active-incident Notice was rendered, keyboard focus styling was checked, and its destination was verified.

## 7. Red-team review

- **Scope/remit:** copy does not assign regulatory or law-enforcement powers or present TT-CSIRT as a managed-security vendor. General controls are labelled as general practices.
- **Canada influence:** the local Notice has the documented anatomy without Canada branding, colors, framework classes or web components.
- **GOV.UK compatibility:** native React, semantic headings, local link styling and existing GOV.UK page structure remain in use.
- **Meaning:** migrated warnings retain their warning role and wording; the active-incident message is explicitly informational and is not promoted to danger.
- **Mobile/accessibility:** notice content wraps without horizontal overflow; hidden shared page navigation is a pre-existing limitation and remains unchanged per scope.
- **Maintenance:** there is one reusable local component, used for current warning renderers and one contextual service note; no global banner or alternate navigation component was added.

## 8. Canada evidence summary

The pasted Get Cyber Safe DOM supports conclusions about that homepage’s WET/Angular-era structure, responsive utility classes, search/menu roles and content hierarchy. It does not contain Notice implementation evidence. The separate official GC Design System source supports the Notice anatomy and explicit role/title/heading concepts; those concepts are adapted locally. No Canadian implementation code or brand asset was imported.
