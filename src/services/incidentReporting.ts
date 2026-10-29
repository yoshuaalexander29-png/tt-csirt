/**
 * TT-CSIRT Incident Reporting Service
 * Client data models, client-side validation engine, and API integration.
 */

export interface IncidentReportData {
  incidentType: string;
  incidentTiming: string;
  incidentDetails: string;
  affectedSystems: string;
  impact: string;
  evidenceAvailable: "" | "yes" | "no";
  evidenceNotes: string;
  reporterType: "" | "organisation" | "individual";
  organisation: string;
  sector: string;
  reporterName: string;
  email: string;
  phone: string;
}

export const INITIAL_REPORT_DATA: IncidentReportData = {
  incidentType: "",
  incidentTiming: "",
  incidentDetails: "",
  affectedSystems: "",
  impact: "",
  evidenceAvailable: "",
  evidenceNotes: "",
  reporterType: "",
  organisation: "",
  sector: "",
  reporterName: "",
  email: "",
  phone: "",
};

export const ALLOWED_INCIDENT_TYPES = [
  "Ransomware",
  "Phishing & Business Email Compromise",
  "Data Breach & System Compromise",
  "Denial of Service (DoS / DDoS)",
  "Malware & Malicious Code",
  "Website Defacement",
  "Unauthorized Access & Intrusion Attempts",
  "Vulnerability Exploitation & Scanning",
  "Other Cyber Security Incident",
] as const;

export const ALLOWED_SECTORS = [
  "Government / Public Sector",
  "Financial Services & Banking",
  "Energy, Oil & Gas, and Utilities",
  "Telecommunications & Internet Services",
  "Healthcare & Social Services",
  "Education & Research Institutions",
  "Commerce, Retail & Manufacturing",
  "Transport & Logistics",
  "Legal & Professional Services",
  "Other Sector / Civil Society",
] as const;

export type ValidationErrors = Record<string, string>;

export interface SubmissionResponse {
  success: boolean;
  reference?: string;
  error?: string;
  idempotentReplay?: boolean;
}

/**
 * Validates fields for one question page in the reporting journey.
 */
export function validateStep(step: number, data: IncidentReportData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 1) {
    if (!data.incidentType || !data.incidentType.trim()) {
      errors.incidentType = "Select the type of incident you are reporting";
    }
  }

  if (step === 2) {
    if (!data.incidentTiming || !data.incidentTiming.trim()) {
      errors.incidentTiming = "Enter when the incident occurred or was first detected, or select 'I don't know when it happened or was first detected'";
    } else if (data.incidentTiming.trim().length > 250) {
      errors.incidentTiming = "Incident timing description must be 250 characters or fewer";
    }
  }

  if (step === 3) {
    if (!data.incidentDetails || !data.incidentDetails.trim()) {
      errors.incidentDetails = "Enter a description of what happened";
    } else if (data.incidentDetails.trim().length > 5000) {
      errors.incidentDetails = "Incident description must be 5,000 characters or fewer";
    }
  }

  if (step === 4) {
    if (!data.affectedSystems || !data.affectedSystems.trim()) {
      errors.affectedSystems = "Describe the affected systems or select 'I don't know'";
    } else if (data.affectedSystems.trim().length > 2000) {
      errors.affectedSystems = "Affected systems description must be 2,000 characters or fewer";
    }

  }

  if (step === 5) {
    if (!data.impact || !data.impact.trim()) {
      errors.impact = "Describe the impact or select 'I don't know the impact yet'";
    } else if (data.impact.trim().length > 3000) {
      errors.impact = "Impact description must be 3,000 characters or fewer";
    }

  }

  if (step === 6) {
    if (!data.evidenceAvailable) {
      errors.evidenceAvailable = "Select whether you have technical evidence or logs available";
    }
    if (data.evidenceAvailable === "yes") {
      if (!data.evidenceNotes || !data.evidenceNotes.trim()) {
        errors.evidenceNotes = "Enter a description of the evidence or logs you have preserved";
      } else if (data.evidenceNotes.trim().length > 3000) {
        errors.evidenceNotes = "Evidence notes must be 3,000 characters or fewer";
      }
    }
  }

  if (step === 7) {
    if (!data.reporterType) {
      errors.reporterType = "Select whether you are reporting on behalf of an organisation or as an individual";
    }

    if (data.reporterType === "organisation") {
      if (!data.organisation || !data.organisation.trim()) {
        errors.organisation = "Enter the name of the organisation";
      } else if (data.organisation.trim().length > 200) {
        errors.organisation = "Organization name must be 200 characters or fewer";
      }

      if (!data.sector || !data.sector.trim()) {
        errors.sector = "Select the sector that best describes the organisation";
      }
    }

  }

  if (step === 8) {
    if (!data.reporterName || !data.reporterName.trim()) {
      errors.reporterName = "Enter your full name";
    } else if (data.reporterName.trim().length < 2) {
      errors.reporterName = "Full name must be at least 2 characters";
    } else if (data.reporterName.trim().length > 150) {
      errors.reporterName = "Full name must be 150 characters or fewer";
    }

  }

  if (step === 9) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !data.email.trim()) {
      errors.email = "Enter your email address";
    } else if (!emailRegex.test(data.email.trim())) {
      errors.email = "Enter an email address in the correct format, like name@example.com";
    } else if (data.email.trim().length > 254) {
      errors.email = "Email address must be 254 characters or fewer";
    }

  }

  if (step === 10) {
    const phone = data.phone.trim();
    const phoneRegex = /^[\d\s+().-]{7,35}$/;
    const phoneDigits = phone.replace(/\D/g, "");
    if (!data.phone || !data.phone.trim()) {
      errors.phone = "Enter a telephone number";
    } else if (!phoneRegex.test(phone) || phoneDigits.length < 7) {
      errors.phone = "Enter a valid telephone number, like +1 (868) 123-4567";
    }
  }

  return errors;
}

/**
 * Validates all form steps before final review submission
 */
export function validateAll(data: IncidentReportData): ValidationErrors {
  return Array.from({ length: 10 }, (_, index) => index + 1)
    .reduce<ValidationErrors>((errors, step) => ({ ...errors, ...validateStep(step, data) }), {});
}

/**
 * Calculates a deterministic payload identity hash for idempotency.
 * If user alters any field, a new hash is generated.
 */
export function computePayloadIdentity(data: IncidentReportData): string {
  const norm = [
    data.incidentType.trim(),
    data.incidentTiming.trim(),
    data.incidentDetails.trim(),
    data.affectedSystems.trim(),
    data.impact.trim(),
    data.evidenceAvailable,
    data.evidenceNotes.trim(),
    data.reporterType,
    data.reporterType === "organisation" ? data.organisation.trim() : "",
    data.reporterType === "organisation" ? data.sector.trim() : "",
    data.reporterName.trim(),
    data.email.trim().toLowerCase(),
    data.phone.trim(),
  ].join("|");

  // Simple string hash for browser keying
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  return `idempotency-${Math.abs(hash).toString(16)}`;
}

let cachedCsrfToken: string | null = null;

/**
 * Retrieves a fresh CSRF token from the backend
 */
export async function getCsrfToken(forceFresh = false): Promise<string> {
  if (cachedCsrfToken && !forceFresh) return cachedCsrfToken;
  try {
    const res = await fetch("/api/incident-report/csrf", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) {
      throw new Error(`CSRF acquisition failed: ${res.status}`);
    }
    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return data.csrfToken;
  } catch (err) {
    console.error("[Incident Reporting] CSRF acquisition error:", err);
    throw err;
  }
}

/**
 * Submits the completed incident report to the same-origin Express API
 */
export async function submitIncidentReport(
  data: IncidentReportData,
  honeypot = "",
  providedToken?: string
): Promise<SubmissionResponse> {
  try {
    let token = providedToken || cachedCsrfToken;
    if (!token) {
      token = await getCsrfToken();
    }

    const idempotencyKey = computePayloadIdentity(data);

    const payload = {
      incidentType: data.incidentType.trim(),
      incidentTiming: data.incidentTiming.trim(),
      incidentDetails: data.incidentDetails.trim(),
      affectedSystems: data.affectedSystems.trim(),
      impact: data.impact.trim(),
      evidenceAvailable: data.evidenceAvailable === "yes" ? "yes" : "no",
      evidenceNotes: data.evidenceNotes.trim(),
      reporterType: data.reporterType,
      organisation: data.reporterType === "organisation" ? data.organisation.trim() : "",
      sector: data.reporterType === "organisation" ? data.sector.trim() : "",
      reporterName: data.reporterName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      website: honeypot,
      idempotencyKey,
      _csrf: token || "",
    };

    const res = await fetch("/api/incident-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": token || "",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    // If CSRF expired or failed, retry once with a fresh token
    if (res.status === 403) {
      cachedCsrfToken = null;
      try {
        const freshToken = await getCsrfToken(true);
        const retryPayload = { ...payload, _csrf: freshToken };
        const retryRes = await fetch("/api/incident-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": freshToken,
          },
          credentials: "same-origin",
          body: JSON.stringify(retryPayload),
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          return {
            success: false,
            error:
              retryData.error ||
              "Your session security token could not be verified. Please refresh the page and try again.",
          };
        }
        return retryData;
      } catch {
        return {
          success: false,
          error:
            "Your session security token could not be verified. Please refresh the page and try again.",
        };
      }
    }

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 429) {
        return {
          success: false,
          error:
            resData.error ||
            "Too many submissions are being processed right now. Please wait a moment and try again.",
        };
      }

      return {
        success: false,
        error:
          resData.error ||
          "We could not submit your report due to an unexpected problem. Please check your answers and try again.",
      };
    }

    return {
      success: true,
      reference: resData.reference,
      idempotentReplay: resData.idempotentReplay,
    };
  } catch (err: any) {
    console.error("[Incident Reporting] Network error during submission:", err);
    return {
      success: false,
      error:
        "Unable to connect to the incident reporting service. Please check your internet connection or contact the TT-CSIRT emergency hotline directly.",
    };
  }
}
