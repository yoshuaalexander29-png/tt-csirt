import type { CanonicalStatisticsDataset } from "./schema.ts";

/**
 * CANONICAL TT-CSIRT INCIDENT STATISTICS DATASET
 *
 * Single Source of Truth.
 * Contains purely raw, uncomputed incident counts officially verified and logged by TT-CSIRT.
 *
 * MAINTAINER NOTICE:
 * To update this publication, simply append or modify period records below.
 * All totals, percentages, ranks, historical benchmarks, concentration indices,
 * textual insights, accessible tables, and export files are calculated deterministically.
 */
export const CANONICAL_INCIDENT_TYPES = [
  "Phishing",
  "Business Email Compromise",
  "Data breach & System Compromise",
  "Ransomware",
  "Website Defacement & Denial of Service",
  "Malicious Insider"
] as const;

export type CanonicalIncidentType = (typeof CANONICAL_INCIDENT_TYPES)[number];

export const CANONICAL_INCIDENT_STATISTICS: CanonicalStatisticsDataset = {
  metadata: {
    agency: "Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)",
    source: "Official verified incident notifications received by TT-CSIRT",
    methodologyVersion: "Cyber Security Incident Taxonomy",
    lastUpdated: "2026-07-23",
    unitOfMeasure: "Verified incident notifications received and processed",
    coverageStartYear: 2019,
    coverageEndYear: 2026,
    scopeNote:
      "Figures depict cyber security incident notifications officially submitted to and verified by TT-CSIRT. They do not constitute an exhaustive census of all cyber threat events occurring within the Republic of Trinidad and Tobago.",
    limitations: [
      "Represents verified incident notifications received by TT-CSIRT, not all cyber security incidents occurring domestically.",
      "Reporting for the current calendar period (2026) is partial (through 23 July 2026) and cannot be directly compared to full 12-month historical periods without standardisation.",
      "Public sector institutions operate under administrative notification circulars, whereas private sector submissions remain largely voluntary, introducing potential sector-level reporting differences."
    ]
  },
  periods: [
    {
      year: 2019,
      isPartial: false,
      dataThrough: "2019-12-31",
      matrix: {
        publicSector: {
          "Phishing": 6,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 1,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 9,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 0,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 0,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 1,
        "Ransomware": 1,
        "Phishing & Business Email Compromise": 8,
        "Website Defacement & Denial of Service": 13,
        "Malicious Insider": 0
      },
      sectors: {
        publicSector: 17,
        privateSector: 6
      }
    },
    {
      year: 2020,
      isPartial: false,
      dataThrough: "2020-12-31",
      matrix: {
        publicSector: {
          "Phishing": 3,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 8,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 7,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 20,
          "Ransomware": 4,
          "Website Defacement & Denial of Service": 3,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 28,
        "Ransomware": 5,
        "Phishing & Business Email Compromise": 12,
        "Website Defacement & Denial of Service": 7,
        "Malicious Insider": 0
      },
      sectors: {
        publicSector: 17,
        privateSector: 35
      }
    },
    {
      year: 2021,
      isPartial: false,
      dataThrough: "2021-12-31",
      matrix: {
        publicSector: {
          "Phishing": 10,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 1,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 12,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 1,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 1
        }
      },
      categories: {
        "Data breach & System Compromise": 2,
        "Ransomware": 2,
        "Phishing & Business Email Compromise": 27,
        "Website Defacement & Denial of Service": 2,
        "Malicious Insider": 2
      },
      sectors: {
        publicSector: 15,
        privateSector: 20
      }
    },
    {
      year: 2022,
      isPartial: false,
      dataThrough: "2022-12-31",
      matrix: {
        publicSector: {
          "Phishing": 6,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 3,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 9,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 6,
          "Ransomware": 5,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 9,
        "Ransomware": 7,
        "Phishing & Business Email Compromise": 18,
        "Website Defacement & Denial of Service": 9,
        "Malicious Insider": 0
      },
      sectors: {
        publicSector: 16,
        privateSector: 27
      }
    },
    {
      year: 2023,
      isPartial: false,
      dataThrough: "2023-12-31",
      matrix: {
        publicSector: {
          "Phishing": 10,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 3,
          "Ransomware": 4,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 9,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 4,
          "Ransomware": 9,
          "Website Defacement & Denial of Service": 3,
          "Malicious Insider": 1
        }
      },
      categories: {
        "Data breach & System Compromise": 7,
        "Ransomware": 13,
        "Phishing & Business Email Compromise": 23,
        "Website Defacement & Denial of Service": 8,
        "Malicious Insider": 1
      },
      sectors: {
        publicSector: 23,
        privateSector: 29
      }
    },
    {
      year: 2024,
      isPartial: false,
      dataThrough: "2024-12-31",
      matrix: {
        publicSector: {
          "Phishing": 81,
          "Business Email Compromise": 8,
          "Data breach & System Compromise": 4,
          "Ransomware": 7,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 7,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 1,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 5,
        "Ransomware": 9,
        "Phishing & Business Email Compromise": 97,
        "Website Defacement & Denial of Service": 6,
        "Malicious Insider": 1
      },
      sectors: {
        publicSector: 106,
        privateSector: 12
      }
    },
    {
      year: 2025,
      isPartial: false,
      dataThrough: "2025-12-31",
      matrix: {
        publicSector: {
          "Phishing": 47,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 7,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 10,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 10,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 3,
          "Ransomware": 3,
          "Website Defacement & Denial of Service": 2,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 10,
        "Ransomware": 5,
        "Phishing & Business Email Compromise": 63,
        "Website Defacement & Denial of Service": 12,
        "Malicious Insider": 1
      },
      sectors: {
        publicSector: 70,
        privateSector: 21
      }
    },
    {
      year: 2026,
      isPartial: true,
      dataThrough: "2026-07-23",
      matrix: {
        publicSector: {
          "Phishing": 40,
          "Business Email Compromise": 0,
          "Data breach & System Compromise": 9,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 6,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 8,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 0,
          "Malicious Insider": 0
        }
      },
      categories: {
        "Data breach & System Compromise": 17,
        "Ransomware": 1,
        "Phishing & Business Email Compromise": 48,
        "Website Defacement & Denial of Service": 4,
        "Malicious Insider": 1
      },
      sectors: {
        publicSector: 55,
        privateSector: 16
      }
    }
  ]
};
