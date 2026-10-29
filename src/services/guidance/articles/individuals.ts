/**
 * Guidance Articles: Individuals & Families
 * Authoritative synthesis based on TT-CSIRT Cyber Safety Tips, CISA Secure Our World,
 * UK NCSC guidance, and UNICEF Child Online Protection.
 */

import { GuidanceArticle } from "../types";

export const INDIVIDUAL_ARTICLES: GuidanceArticle[] = [
  // 1. Cyber safety basics
  {
    slug: "cyber-safety-basics",
    title: "Cyber safety basics for citizens and households",
    shortPurpose:
      "Core defensive actions and everyday digital habits to protect your personal identity, devices, financial accounts, and home network against prevalent cyber threats in Trinidad and Tobago.",
    audienceDescription:
      "Citizens, families, students, and home internet users seeking clear, practical steps to protect their everyday digital lives.",
    audiences: ["individuals"],
    audienceLabel: "Individuals and families",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    lastReviewed: "14 August 2026",
    provenanceNote:
      "Synthesized from TT-CSIRT official Cyber Safety Tips, CISA Secure Our World baseline principles, and NIST Cybersecurity Basics.",
    keyActions: [
      "Use three random words to create strong, memorable passphrases for all primary accounts",
      "Turn on multi-factor authentication (MFA) on personal email, social media, and banking portals",
      "Enable automatic operating system and application updates on smartphones and computers",
      "Change default administrative credentials and disable remote management on home Wi-Fi routers",
      "Never disclose one-time SMS verification codes or banking PINs to anyone, even callers claiming to be bank staff",
    ],
    sections: [
      {
        id: "understanding-threats",
        title: "Understanding common threats targeting citizens",
        lead:
          "Cyber criminals targeting citizens in Trinidad and Tobago rarely rely on complex software exploits. Instead, they exploit common oversights: shared passwords, delayed software patches, and deceptive phone or message requests.",
        paragraphs: [
          "The most common attacks experienced by households include unauthorised account takeover, fake banking notifications, lottery or grant scams, and malware delivered through unverified downloads.",
          "Building effective digital resilience does not require deep technical knowledge. By establishing a few disciplined baseline routines, you can eliminate the vast majority of consumer cyber risks.",
        ],
      },
      {
        id: "passwords-passphrases",
        title: "Creating strong passphrases with three random words",
        lead:
          "Traditional password advice requiring complex symbols often leads people to choose predictable substitutions that are easily cracked by automated tools.",
        paragraphs: [
          "TT-CSIRT recommends combining three distinct, unrelated words to create a passphrase that is long enough to resist cracking yet easy for you to remember without writing it down.",
          "For example, combining three unrelated everyday words such as 'breeze-mango-anchor' creates a passphrase that exceeds 16 characters while remaining simple to type.",
        ],
        subsections: [
          {
            title: "Core passphrase rules",
            paragraphs: [
              "Always maintain distinct passphrases for critical accounts. A breach on one shopping website must never compromise your personal email or online banking.",
            ],
            list: [
              "Never reuse your primary email password on any other platform",
              "Avoid predictable personal details such as birthdates, family names, or vehicle numbers",
              "Use a reputable password manager to store and autofill credentials securely",
            ],
          },
        ],
      },
      {
        id: "multi-factor-authentication",
        title: "Enabling multi-factor authentication (MFA)",
        lead:
          "Multi-factor authentication adds an indispensable second layer of defence by requiring two different proofs of your identity before granting access.",
        paragraphs: [
          "Even if an attacker discovers your passphrase through a data breach or deceptive phishing page, MFA prevents them from logging in without your secondary physical verification factor.",
          "Prioritise activating MFA on your primary email address first, as password reset links for all your other services are sent to this mailbox.",
        ],
        subsections: [
          {
            title: "Recommended MFA methods",
            paragraphs: [
              "While SMS verification codes provide an improvement over passwords alone, authenticator apps or hardware security keys provide superior protection against SIM swapping and interception.",
            ],
            list: [
              "Authenticator apps (such as Google Authenticator or Microsoft Authenticator) generating time-based codes",
              "Biometric passkeys stored on your smartphone or computer",
              "SMS verification codes when app-based options are unavailable",
            ],
          },
        ],
      },
      {
        id: "device-updates",
        title: "Keeping software and devices up to date",
        lead:
          "Software updates contain vital security corrections that patch known vulnerabilities before criminals can exploit them.",
        paragraphs: [
          "When device manufacturers or app developers release security updates, attackers reverse-engineer the patches to target systems that have not yet installed them.",
          "Enabling automatic updates across your phone, tablet, laptop, and smart home appliances ensures you receive critical security fixes promptly without manual intervention.",
        ],
      },
      {
        id: "home-wifi-security",
        title: "Securing your home Wi-Fi network and smart devices",
        lead:
          "Your home broadband router is the digital gateway connecting all family computers, phones, smart TVs, and security cameras to the internet.",
        paragraphs: [
          "Many domestic routers retain factory-default administrative credentials that allow anyone connected to the network to alter security settings or redirect web traffic.",
        ],
        subsections: [
          {
            title: "Essential router configuration steps",
            paragraphs: [
              "Log into your router's administrative portal using a web browser and verify the following baseline settings:",
            ],
            list: [
              "Change the default administrator password from 'admin' to a strong custom passphrase",
              "Select WPA3 or WPA2-AES wireless encryption; disable obsolete WEP or WPA standards",
              "Disable Remote Management and Universal Plug and Play (UPnP) if not strictly needed",
              "Create a separate guest Wi-Fi network for smart home gadgets and visiting friends",
            ],
          },
        ],
      },
    ],
    checklist: {
      title: "Household cyber safety action checklist",
      description: "Review and complete these essential hygiene actions across your home devices:",
      items: [
        {
          task: "Secure primary email account",
          detail: "Set a unique 3-word passphrase and activate app-based two-factor authentication.",
          priority: "immediate",
        },
        {
          task: "Turn on automatic device updates",
          detail: "Check settings on all smartphones, tablets, laptops, and home computers to ensure OS updates install automatically.",
          priority: "immediate",
        },
        {
          task: "Audit password reuse",
          detail: "Replace identical passwords shared across banking, social media, and online retail accounts.",
          priority: "high",
        },
        {
          task: "Harden home Wi-Fi router",
          detail: "Change the default admin login, verify WPA2/WPA3 encryption, and disable remote access.",
          priority: "high",
        },
        {
          task: "Back up important family files",
          detail: "Store irreplaceable family photos and official documents on an external drive disconnected after backup or in encrypted cloud storage.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If you suspect your online banking credentials have been compromised, contact your financial institution immediately to freeze your accounts. If you have fallen victim to a significant digital scam or extortion attempt, report the incident to TT-CSIRT and the Trinidad and Tobago Police Service (TTPS) Fraud Squad.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report an incident to TT-CSIRT",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "account-security",
        title: "Personal account security and multi-factor authentication",
        description: "In-depth guide to passkeys, authenticator apps, and preventing account takeovers.",
      },
      {
        slug: "phishing-scams",
        title: "Recognizing and preventing phishing and social engineering scams",
        description: "How to identify deceptive emails, WhatsApp messages, and fake banking notifications.",
      },
      {
        slug: "online-child-safety",
        title: "Online child safety and digital protection strategies",
        description: "Practical advice for parents and educators on protecting children in digital spaces.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Cyber Safety Tips",
        url: "/guidance/protecting-your-devices-data",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "Official national consumer cyber hygiene guidance.",
      },
      {
        title: "CISA Secure Our World",
        url: "https://www.cisa.gov/secure-our-world",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Foundational four-action consumer security baseline.",
      },
      {
        title: "NIST Cybersecurity Basics",
        url: "https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/cybersecurity-basics",
        publisher: "National Institute of Standards and Technology",
        context: "Fundamental cyber hygiene principles and threat defence overview.",
      },
    ],
  },

  // 2. Phishing & scams
  {
    slug: "phishing-scams",
    title: "Recognizing and preventing phishing and social engineering scams",
    shortPurpose:
      "A practical citizen and workplace guide to identifying deceptive emails, fraudulent SMS messages (smishing), WhatsApp scams, and impersonation attempts targeting individuals and organisations in Trinidad and Tobago.",
    audienceDescription:
      "Citizens, small business employees, and public officers who handle incoming emails, phone calls, and digital messages.",
    audiences: ["individuals", "organisations"],
    audienceLabel: "Citizens and organisations",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    lastReviewed: "18 August 2026",
    provenanceNote:
      "Synthesized from TT-CSIRT awareness guidance, CISA social engineering advisories, and the UK National Cyber Security Centre (NCSC) phishing guidance.",
    keyActions: [
      "Be suspicious of unexpected messages conveying extreme urgency, panic, or too-good-to-be-true financial offers",
      "Check the sender's actual email address or phone number, not just the displayed sender name",
      "Never click embedded verification links in unsolicited SMS or WhatsApp messages claiming your bank account is suspended",
      "Verify unexpected payment requests or invoice changes via a trusted, independent telephone call",
      "If you accidentally enter credentials on a suspect website, immediately change your password and notify your IT team or bank",
    ],
    sections: [
      {
        id: "how-phishing-works",
        title: "How social engineering and phishing operate",
        lead:
          "Social engineering relies on human psychology rather than technical exploits. Attackers manipulate natural emotions, including urgency, fear, helpfulness or curiosity, to prompt victims into taking hasty actions.",
        paragraphs: [
          "Phishing is the most common form of social engineering. Fraudsters send deceptive communications disguised as trustworthy entities, such as local commercial banks, government ministries, courier delivery services or trusted colleagues.",
          "Their primary objective is usually to harvest account credentials, trick the recipient into transferring money, or persuade them to download a malicious file containing ransomware or a spyware trojan.",
        ],
      },
      {
        id: "common-scam-vectors",
        title: "Prevalent scam vectors in Trinidad and Tobago",
        lead:
          "Threat actors frequently customize scam messages to reflect local institutions, current economic news, or regional communication platforms.",
        paragraphs: [
          "Understanding the formats attackers use helps individuals spot warning signs before disclosing sensitive information or clicking malicious links.",
        ],
        subsections: [
          {
            title: "1. Banking suspension smishing (SMS scams)",
            paragraphs: [
              "Citizens receive SMS alerts stating: 'Your bank account has been locked due to suspicious activity. Click here to verify your identity.' The link leads to a counterfeit login page designed to capture your username, password, and one-time verification code.",
            ],
            callout:
              "Local commercial banks will never send you an unsolicited SMS or WhatsApp message requiring you to click a link to unlock your online banking profile.",
          },
          {
            title: "2. WhatsApp account hijacking and family emergencies",
            paragraphs: [
              "Attackers attempt to register WhatsApp using a victim's phone number, then contact the victim impersonating a friend or mutual contact requesting the 6-digit registration code sent to their phone. Once hijacked, attackers message contacts requesting urgent financial loans.",
            ],
          },
          {
            title: "3. Business Email Compromise (BEC) and fake invoices",
            paragraphs: [
              "In corporate settings, attackers impersonate company directors or regular suppliers, requesting urgent wire transfers or notifying the accounting team of 'updated supplier bank account details.'",
            ],
          },
        ],
      },
      {
        id: "spotting-red-flags",
        title: "Key indicators of a phishing attempt",
        lead:
          "Always pause and evaluate incoming messages against these tell-tale warning signs:",
        paragraphs: [
          "Modern phishing attempts can appear remarkably polished, but careful scrutiny of specific structural details often reveals their fraudulent nature.",
        ],
        subsections: [
          {
            title: "Inspection checklist",
            list: [
              "Urgency and threats: Demands immediate action within hours to avoid legal penalties, account suspension, or financial loss",
              "Mismatched sender domain: The sender name says 'Republic Bank' or 'First Citizens', but the actual email address originates from a generic free webmail or obscure foreign domain",
              "Generic greetings: Messages addressing you as 'Dear Valued Customer' rather than your registered name",
              "Requests for confidential data: Direct prompts for your password, PIN, credit card CVV, or one-time SMS verification code",
              "Suspicious links and attachments: Hyperlinks leading to strange URLs with unusual spelling variations, or attachments with unexpected file extensions (.html, .zip, .exe, .iso)",
            ],
          },
        ],
      },
      {
        id: "immediate-actions",
        title: "What to do if you clicked a suspicious link",
        lead:
          "Speed is critical when dealing with potential credential theft or malware execution.",
        paragraphs: [
          "If you realize you have submitted personal credentials or downloaded an unverified attachment, take these mitigation steps without delay:",
        ],
        subsections: [
          {
            title: "Step-by-step remediation",
            list: [
              "Disconnect your device: Turn off Wi-Fi and unplug network cables if an executable file was downloaded",
              "Change compromised passwords: Log into the real service from another trusted device and change your passphrase immediately",
              "Revoke active sessions: In your account security settings, select 'Log out of all other devices' to invalidate stolen session cookies",
              "Alert your bank: If financial details were entered, contact your bank's fraud hotline immediately to block cards and freeze online transfers",
              "Notify your organisation: If this occurred on a corporate device or involved work credentials, notify your IT helpdesk or Security Operations Center immediately",
            ],
          },
        ],
      },
    ],
    checklist: {
      title: "Phishing prevention checklist for citizens and staff",
      items: [
        {
          task: "Verify payment details out-of-band",
          detail: "Always confirm supplier bank account changes by placing a direct phone call using a known official number.",
          priority: "immediate",
        },
        {
          task: "Never share 6-digit WhatsApp codes",
          detail: "Enable Two-Step Verification in WhatsApp Settings > Account > Two-step verification with a private PIN.",
          priority: "immediate",
        },
        {
          task: "Hover before clicking",
          detail: "Inspect the destination URL of hyperlinks before clicking to confirm it points to the genuine domain.",
          priority: "high",
        },
        {
          task: "Report suspicious emails to IT",
          detail: "Forward suspicious internal corporate messages to your internal security contact for domain-level blocking.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If you encounter a phishing campaign impersonating a Government of Trinidad and Tobago ministry or a national utility, forward the email headers or message screenshots to TT-CSIRT so we can issue protective advisories and coordinate domain takedown actions.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Submit a scam sample or report an incident",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "account-security",
        title: "Personal account security and multi-factor authentication",
        description: "Hardening accounts against credential harvesting and unauthorised access.",
      },
      {
        slug: "cyber-safety-basics",
        title: "Cyber safety basics for citizens and households",
        description: "Foundational cyber hygiene routines for home and mobile devices.",
      },
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "How organisations should formally report phishing outbreaks to TT-CSIRT.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Cyber Awareness and Scam Guidance",
        url: "/guidance/recognising-phishing-and-social-engineering",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National guidance on identifying phishing and social engineering.",
      },
      {
        title: "CISA Recognize and Report Phishing",
        url: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Authoritative recognition indicators and response techniques.",
      },
      {
        title: "NCSC Phishing Attacks: Defending Your Organisation",
        url: "https://www.ncsc.gov.uk/guidance/phishing",
        publisher: "UK National Cyber Security Centre",
        context: "Multi-layered defensive guidance against social engineering.",
      },
    ],
  },

  // 3. Account security
  {
    slug: "account-security",
    title: "Personal account security and multi-factor authentication",
    shortPurpose:
      "A comprehensive guide to locking down personal, corporate, and government accounts using password managers, phishing-resistant multi-factor authentication, passkeys, and account recovery safeguards.",
    audienceDescription:
      "Citizens, professionals, and system administrators seeking advanced protection against account takeover and identity theft.",
    audiences: ["individuals", "organisations"],
    audienceLabel: "Individuals and organisations",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    lastReviewed: "12 August 2026",
    provenanceNote:
      "Synthesized from TT-CSIRT Cyber Safety Tips, UK NCSC Identity and Access Management guidance, and CISA authentication baselines.",
    keyActions: [
      "Deploy a trusted password manager to generate and store 16+ character unique passwords for every service",
      "Upgrade from SMS verification codes to app-based authenticator apps or FIDO2/WebAuthn passkeys",
      "Secure and print offline recovery codes for critical accounts (email, cloud storage, password manager)",
      "Review account security dashboards quarterly to terminate stale device sessions and unneeded app permissions",
      "Ensure your primary recovery email and telephone number are kept strictly up to date",
    ],
    sections: [
      {
        id: "why-passwords-fail",
        title: "Why traditional passwords fail on their own",
        lead:
          "Data breaches occur across commercial websites daily. When a service you use is compromised, your email address and password become available in credential stuffing databases used by automated bots.",
        paragraphs: [
          "If you reuse the same password across multiple services, a compromise on an obscure discussion forum can immediately unlock your personal email, social media, and online banking profiles.",
          "Relying solely on single-factor passwords is no longer sufficient. Modern account security requires two complementary pillars: unique, high-entropy credentials and multi-factor authentication.",
        ],
      },
      {
        id: "password-managers",
        title: "Using a password manager effectively",
        lead:
          "Human memory cannot safely retain dozens of distinct, complex passwords. Password managers solve this problem securely.",
        paragraphs: [
          "A password manager functions as an encrypted vault that generates, stores, and autofills strong random credentials for every website you visit.",
          "With a password manager, you only need to memorize one exceptionally strong master passphrase (such as four random words). The manager handles the rest.",
        ],
        subsections: [
          {
            title: "Benefits of password managers",
            list: [
              "Automatic phishing protection: A password manager will not autofill your credentials on a fake phishing URL because the domain name does not match the saved entry",
              "Unique passwords by default: Ensures a breach on one service never compromises another account",
              "Encrypted storage across devices: Synchronizes credentials securely across your computer and smartphone using end-to-end encryption",
            ],
          },
        ],
      },
      {
        id: "mfa-hierarchy",
        title: "The authentication security hierarchy",
        lead:
          "Not all multi-factor authentication methods offer the same degree of protection against targeted attacks.",
        paragraphs: [
          "Understanding the differences helps you select the strongest available option for each online service:",
        ],
        subsections: [
          {
            title: "1. Passkeys and hardware security keys (Most secure)",
            paragraphs: [
              "FIDO2 and WebAuthn passkeys use cryptographic public-key pairs stored on your device or a USB security key. They are mathematically immune to phishing, as the cryptographic response will only be sent to the genuine registered domain.",
            ],
          },
          {
            title: "2. Authenticator apps (Time-based one-time passwords - TOTP)",
            paragraphs: [
              "Apps such as Google Authenticator, Microsoft Authenticator, or 2FAS generate 6-digit codes that refresh every 30 seconds. They do not depend on mobile telecommunications networks and cannot be intercepted via SIM swapping.",
            ],
          },
          {
            title: "3. SMS text messages and voice calls (Basic baseline)",
            paragraphs: [
              "SMS codes provide meaningful protection against unsophisticated attacks, but remain susceptible to SIM card hijacking, mobile network interception, and phishing relay tools. Use SMS only when app-based MFA is not supported.",
            ],
          },
        ],
      },
      {
        id: "recovery-safeguards",
        title: "Account recovery and preventing lockouts",
        lead:
          "Setting up strong authentication must always be paired with secure recovery pathways in case you lose your phone or hardware key.",
        paragraphs: [
          "When you activate MFA on services like Google, Microsoft, Apple, or GitHub, the platform generates a set of single-use emergency backup codes.",
          "Print these recovery codes or store them on an offline, encrypted USB drive stored in a secure physical location (such as a fireproof safe). Never save emergency codes in unencrypted plain text files on your desktop.",
        ],
      },
    ],
    checklist: {
      title: "Account lockdown checklist",
      items: [
        {
          task: "Install a reputable password manager",
          detail: "Set up a reputable password manager with a strong 4-word master passphrase.",
          priority: "immediate",
        },
        {
          task: "Enable TOTP or passkeys on primary email",
          detail: "Switch your primary email account from SMS codes to an authenticator app or passkey.",
          priority: "immediate",
        },
        {
          task: "Store backup recovery codes safely",
          detail: "Download and print emergency recovery codes for your primary cloud identity accounts.",
          priority: "high",
        },
        {
          task: "Audit active sessions",
          detail: "Inspect connected devices in your Google, Apple, or Microsoft security settings and terminate unrecognized logins.",
          priority: "high",
        },
        {
          task: "Set up account recovery contact",
          detail: "Verify that secondary recovery phone numbers and email addresses are current and accessible.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If you experience an active account takeover involving an official government email address (.gov.tt) or a critical infrastructure administrative portal, contact TT-CSIRT immediately for incident containment assistance.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report an unauthorised access incident",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "cyber-safety-basics",
        title: "Cyber safety basics for citizens and households",
        description: "Essential cyber hygiene routines for home and mobile devices.",
      },
      {
        slug: "phishing-scams",
        title: "Recognizing and preventing phishing and social engineering scams",
        description: "Protecting account credentials against deceptive harvesting websites.",
      },
      {
        slug: "secure-remote-access",
        title: "Secure remote access and hybrid work protection",
        description: "Enterprise authentication standards and Zero Trust network access.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Cyber Safety Tips: Passwords & Authentication",
        url: "/guidance/passwords-and-account-security",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National guidance on password management and authentication.",
      },
      {
        title: "NCSC Identity and Access Management",
        url: "https://www.ncsc.gov.uk/collection/identity-and-access-management",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative architectural guidance on authentication and access controls.",
      },
      {
        title: "CISA Multi-Factor Authentication",
        url: "https://www.cisa.gov/secure-our-world/turn-on-mfa",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Implementation standards for modern multi-factor authentication.",
      },
    ],
  },

  // 4. Online child safety
  {
    slug: "online-child-safety",
    title: "Online child safety and digital protection strategies",
    shortPurpose:
      "Evidence-based guidance for parents, caregivers, and educators on safeguarding children and adolescents against digital harms, online predatory behaviour, cyberbullying, and exposure to inappropriate content.",
    audienceDescription:
      "Parents, guardians, educators, school administrators, and youth mentors in Trinidad and Tobago.",
    audiences: ["individuals"],
    audienceLabel: "Parents, families, and educators",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    lastReviewed: "20 July 2026",
    provenanceNote:
      "Grounded in UNICEF Child Online Protection guidelines, TT-CSIRT community outreach materials, and educational cyber safety frameworks.",
    keyActions: [
      "Foster regular, open family conversations about online experiences without threatening immediate device confiscation",
      "Configure privacy and location-sharing settings across gaming consoles, tablets, and social media platforms",
      "Implement age-appropriate parental screen-time controls and content filters at the home router and operating system level",
      "Teach children to recognize predatory grooming signs, inappropriate personal requests, and suspicious direct messages",
      "Report online child sexual exploitation material or severe cyber harassment to the TTPS Child Protection Unit and TT-CSIRT",
    ],
    sections: [
      {
        id: "understanding-digital-risks",
        title: "Understanding digital risks facing children and youth",
        lead:
          "The internet offers rich educational, creative, and social opportunities for young citizens. However, unsupervised digital access also exposes children to distinct categories of online risk.",
        paragraphs: [
          "International child protection frameworks, including UNICEF standards, categorise online risks into four main areas: Content risks (exposure to violence or inappropriate material), Contact risks (communication with predatory adults or strangers), Conduct risks (cyberbullying or participating in harmful behaviour), and Contract risks (commercial profiling, hidden micro-transactions, or data harvesting).",
          "Technical controls provide useful boundaries, but they can never replace an ongoing relationship of trust, open dialogue, and parental guidance.",
        ],
      },
      {
        id: "open-communication",
        title: "Building an atmosphere of open communication",
        lead:
          "Fear of having their phone or tablet taken away is the number one reason children conceal online harassment, cyberbullying, or uncomfortable interactions from their parents.",
        paragraphs: [
          "Parents should establish a supportive household environment where children know they can come forward about unsettling digital encounters without fear of immediate punishment.",
          "Discuss online safety proactively, just as you would teach street safety or vehicle seatbelt rules, rather than waiting for a crisis to occur.",
        ],
        subsections: [
          {
            title: "Guiding conversation starters",
            list: [
              "Ask what games, apps, and creators they enjoy most, and explore those digital spaces together",
              "Discuss what kinds of personal information (school name, home address, daily routine) must never be shared publicly",
              "Establish clear family boundaries regarding where devices can be used (for example, keeping computers in shared family spaces and charging phones outside bedrooms overnight)",
            ],
          },
        ],
      },
      {
        id: "technical-controls",
        title: "Setting up technical guardrails and privacy configurations",
        lead:
          "Device-level controls and home network filtering provide important protective safety nets for younger children.",
        paragraphs: [
          "Major operating systems and gaming platforms offer comprehensive parental management suites that should be configured before handing a device to a child.",
        ],
        subsections: [
          {
            title: "Essential configuration steps",
            list: [
              "Enable Apple Screen Time or Google Family Link to manage permitted apps, content age-ratings, and daily usage limits",
              "Disable location services on cameras and social apps to prevent metadata geotagging in photos posted online",
              "Lock down in-app purchases with a mandatory parental password to prevent unauthorised financial charges",
              "Configure DNS-level family filtering (such as CleanBrowsing or Cloudflare 1.1.1.3) on your home router to block adult and malicious domains network-wide",
              "Set gaming platform profiles (PlayStation Network, Xbox, Roblox, Discord) to 'Friends Only' communication",
            ],
          },
        ],
      },
      {
        id: "cyberbullying-grooming",
        title: "Recognizing cyberbullying and online grooming",
        lead:
          "Behavioural changes often provide the first warning signs that a child is experiencing distress online.",
        paragraphs: [
          "Watch for changes in mood, sudden withdrawal from family activities, reluctance to attend school, or defensive behaviour when their device receives notifications.",
        ],
        subsections: [
          {
            title: "Responding to cyberbullying",
            list: [
              "Do not retaliate: Instruct the child not to respond aggressively to harassers, as reactions often escalate the behaviour",
              "Preserve evidence: Capture screenshots of offending messages, user profiles, timestamps, and comments before reporting",
              "Block and report: Use the in-app reporting tools to block the offending accounts on social media platforms",
              "Coordinate with schools: If the harassment involves school peers, engage teachers and school administrators promptly",
            ],
          },
        ],
      },
    ],
    checklist: {
      title: "Parental digital safety checklist",
      items: [
        {
          task: "Review social media privacy settings",
          detail: "Ensure teenage profiles are set to private so that posts, friend lists, and photos are not visible to the public.",
          priority: "immediate",
        },
        {
          task: "Turn off location sharing in camera apps",
          detail: "Verify that camera apps do not embed precise GPS coordinates into uploaded photos.",
          priority: "immediate",
        },
        {
          task: "Set up family screen controls",
          detail: "Configure Google Family Link or Apple Screen Time with appropriate content age filters.",
          priority: "high",
        },
        {
          task: "Establish device-free bedrooms overnight",
          detail: "Create a central charging station in a common family area to prevent late-night unmonitored screen use.",
          priority: "high",
        },
        {
          task: "Establish an open reporting routine",
          detail: "Remind your child regularly that they will never get in trouble for reporting a distressing online encounter.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If you encounter evidence of online child exploitation, grooming, or credible physical threats directed at a minor, report the matter immediately to the Trinidad and Tobago Police Service (TTPS) Child Protection Unit and notify TT-CSIRT. Critical reports involving minor safety are treated with the highest urgency and discretion.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Contact TT-CSIRT incident handling team",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "cyber-safety-basics",
        title: "Cyber safety basics for citizens and households",
        description: "Everyday cyber hygiene routines for home internet users.",
      },
      {
        slug: "phishing-scams",
        title: "Recognizing and preventing phishing and social engineering scams",
        description: "Teaching youth to identify deceptive links, fake giveaways, and online scams.",
      },
      {
        slug: "account-security",
        title: "Personal account security and multi-factor authentication",
        description: "Securing student and family accounts against unauthorised access.",
      },
    ],
    sources: [
      {
        title: "UNICEF Guidelines on Child Online Protection",
        url: "https://www.unicef.org/protection/child-online-protection",
        publisher: "UNICEF",
        context: "Global standards on safeguarding children and adolescents in digital environments.",
      },
      {
        title: "NCSC Cyber Security for Families",
        url: "https://www.ncsc.gov.uk/collection/family",
        publisher: "UK National Cyber Security Centre",
        context: "Practical digital safety guidance for parents and guardians.",
      },
      {
        title: "TT-CSIRT Community Safety Resources",
        url: "/guidance/keeping-children-and-families-safe-online",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National educational cyber safety awareness material.",
      },
    ],
  },
];
