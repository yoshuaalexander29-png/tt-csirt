import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { CharacterCount } from "govuk-frontend";
import { GcdsDateInput } from "@gcds-core/components-react";
import { Details } from "@/components/gcds/Details";
import { Button } from "@/components/gcds/Button";
import styles from "./ReportIncidentPage.module.css";
import {
  IncidentReportData,
  INITIAL_REPORT_DATA,
  ALLOWED_INCIDENT_TYPES,
  ALLOWED_SECTORS,
  ValidationErrors,
  validateStep,
  validateAll,
  submitIncidentReport,
  getCsrfToken,
} from "@/services/incidentReporting";

type UncertainAnswers = {
  timing: boolean;
  incidentDetails: boolean;
  affectedSystems: boolean;
  impact: boolean;
};

type IncidentDateParts = {
  day: string;
  month: string;
  year: string;
  time: string;
};

const INITIAL_INCIDENT_DATE: IncidentDateParts = {
  day: "",
  month: "",
  year: "",
  time: "",
};

function formatIncidentTiming(parts: IncidentDateParts) {
  const date = parts.day && parts.month && parts.year
    ? `${parts.day.padStart(2, "0")}/${parts.month.padStart(2, "0")}/${parts.year}`
    : [parts.day, parts.month, parts.year].filter(Boolean).join("/");
  return [date, parts.time.trim()].filter(Boolean).join(" ");
}

function getIncidentDateError(parts: IncidentDateParts) {
  const { day, month, year } = parts;
  if (!day || !month || !year || !/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return "Enter a complete date in year, month, day order, for example 2026-03-31, or select 'I don't know when it happened or was first detected'";
  }

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const date = new Date(0);
  date.setUTCFullYear(yearNumber, monthNumber - 1, dayNumber);
  date.setUTCHours(0, 0, 0, 0);

  if (
    yearNumber < 1 ||
    date.getUTCFullYear() !== yearNumber ||
    date.getUTCMonth() !== monthNumber - 1 ||
    date.getUTCDate() !== dayNumber
  ) {
    return "Enter a real date";
  }

  return "";
}

const INITIAL_UNCERTAIN_ANSWERS: UncertainAnswers = {
  timing: false,
  incidentDetails: false,
  affectedSystems: false,
  impact: false,
};

const incidentReportDraft = {
  hasStarted: false,
  currentStep: 1,
  formData: INITIAL_REPORT_DATA,
  incidentDate: INITIAL_INCIDENT_DATE,
  uncertainAnswers: INITIAL_UNCERTAIN_ANSWERS,
  submittedReference: null as string | null,
};

const initializedCharacterCounts = new WeakMap<HTMLElement, Element>();

function pushReportingStep(step: number) {
  window.history.pushState(
    { ...(window.history.state || {}), incidentReportingStep: step },
    "",
    window.location.href
  );
}

function alignReportingViewportAnchor() {
  const breadcrumbs = document.querySelector<HTMLElement>(".app-breadcrumb-bar gcds-breadcrumbs");
  if (!breadcrumbs) return;

  const targetTop = 45;
  const currentTop = breadcrumbs.getBoundingClientRect().top;
  const delta = currentTop - targetTop;

  if (Math.abs(delta) > 1) {
    window.scrollTo({
      top: Math.max(0, window.scrollY + delta),
      behavior: "instant",
    });
  }
}

function IncidentReportingSupport() {
  return (
    <section className="incident-reporting-support" aria-labelledby="urgent-report-help-heading">
      <h2 className="govuk-heading-m" id="urgent-report-help-heading">Need urgent assistance?</h2>
      <p className="govuk-body">
        For urgent help with an active incident, call TT-CSIRT:
      </p>
      <p className="govuk-body">
        <strong>Emergency hotline:</strong>{" "}
        <a href="tel:+18686257937" className="govuk-link">+1 (868) 625-7937</a>
      </p>
      <p className="govuk-body govuk-!-margin-bottom-0">
        <strong>Secondary hotline:</strong>{" "}
        <a href="tel:+18682998827" className="govuk-link">+1 (868) 299-8827</a>
      </p>
    </section>
  );
}

interface ReportIncidentPageProps {
  onNavigate: (path: string) => void;
}

export function ReportIncidentPage({ onNavigate }: ReportIncidentPageProps) {
  const [hasStarted, setHasStarted] = useState(incidentReportDraft.hasStarted);
  const [currentStep, setCurrentStep] = useState(incidentReportDraft.currentStep);
  const [formData, setFormData] = useState<IncidentReportData>(incidentReportDraft.formData);
  const [incidentDate, setIncidentDate] = useState<IncidentDateParts>(incidentReportDraft.incidentDate);
  const [uncertainAnswers, setUncertainAnswers] = useState<UncertainAnswers>(incidentReportDraft.uncertainAnswers);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(incidentReportDraft.submittedReference);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Anti-bot honeypot field
  const [honeypot, setHoneypot] = useState<string>("");

  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const formHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const incidentDateInputRef = useRef<React.ComponentRef<typeof GcdsDateInput> | null>(null);

  const effectiveFormData: IncidentReportData = {
    ...formData,
    incidentTiming: uncertainAnswers.timing ? "I don't know yet" : formData.incidentTiming,
    incidentDetails: uncertainAnswers.incidentDetails ? "I don't know" : formData.incidentDetails,
    affectedSystems: uncertainAnswers.affectedSystems ? "I don't know" : formData.affectedSystems,
    impact: uncertainAnswers.impact ? "I don't know the impact yet" : formData.impact,
  };

  const updateCurrentStep = (step: number) => {
    incidentReportDraft.currentStep = step;
    setCurrentStep(step);
  };

  const updateHasStarted = (started: boolean) => {
    incidentReportDraft.hasStarted = started;
    setHasStarted(started);
  };

  // Establish session security token on initial form mount (Step 1)
  useEffect(() => {
    let isMounted = true;
    getCsrfToken()
      .then((token) => {
        if (isMounted && token) {
          setSessionToken(token);
        }
      })
      .catch(() => {
        // Will seamlessly acquire on final submission if initial request fails
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure valid token is available when user reaches the review page.
  useEffect(() => {
    if (currentStep === 11 && !sessionToken) {
      let isMounted = true;
      getCsrfToken()
        .then((token) => {
          if (isMounted && token) {
            setSessionToken(token);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [currentStep, sessionToken]);

  // Keep the breadcrumb at its viewport anchor as validation content changes.
  useEffect(() => {
    if (Object.keys(errors).length > 0 && errorSummaryRef.current) {
      errorSummaryRef.current.focus({ preventScroll: true });
    }
  }, [errors, hasStarted, serverError]);



  useEffect(() => {
    void incidentDateInputRef.current?.validate();
  }, [errors.incidentTiming]);

  // Focus confirmation when submission finishes
  useEffect(() => {
    if (submittedReference && confirmationHeadingRef.current) {
      confirmationHeadingRef.current.focus();
      window.scrollTo(0, 0);
    }
  }, [submittedReference]);

  // Keep the reporting wizard's breadcrumb viewport anchor stable after each
  // step render and whenever validation content changes the layout above it.
  useLayoutEffect(() => {
    if (!hasStarted) return;
    alignReportingViewportAnchor();
  }, [currentStep, hasStarted, errors, serverError]);

  // Move keyboard focus to the new question without allowing focus to initiate
  // a second, browser-controlled scroll.
  useEffect(() => {
    if (!hasStarted || Object.keys(errors).length > 0 || serverError) return;
    formHeadingRef.current?.focus({ preventScroll: true });
  }, [currentStep, hasStarted]);

  useEffect(() => {
    const handleStepHistory = () => {
      const step = window.history.state?.incidentReportingStep;
      if (!Number.isInteger(step) || step < 0 || step > 11) return;
      updateCurrentStep(step === 0 ? 1 : step);
      updateHasStarted(step > 0);
    };

    if (!Number.isInteger(window.history.state?.incidentReportingStep)) {
      window.history.replaceState(
        { ...(window.history.state || {}), incidentReportingStep: 0 },
        "",
        window.location.href
      );
    }
    handleStepHistory();
    window.addEventListener("popstate", handleStepHistory);
    return () => window.removeEventListener("popstate", handleStepHistory);
  }, []);

  useEffect(() => {
    const countRoots = document.querySelectorAll<HTMLElement>(
      '.incident-reporting-service [data-module~="govuk-character-count"]'
    );
    countRoots.forEach((root) => {
      const textarea = root.querySelector(".govuk-js-character-count");
      if (textarea && initializedCharacterCounts.get(root) !== textarea) {
        new CharacterCount(root);
        initializedCharacterCounts.set(root, textarea);
      }
    });
  }, [hasStarted, currentStep, uncertainAnswers, formData.evidenceAvailable]);

  const handleChange = (
    field: keyof IncidentReportData,
    value: string
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      incidentReportDraft.formData = next;
      return next;
    });
    // Clear field-level error on edit
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const handleIncidentDateChange = (part: keyof IncidentDateParts, value: string) => {
    const maxLength = part === "year" ? 4 : part === "time" ? 100 : 2;
    const next = {
      ...incidentDate,
      [part]: part === "time" ? value.slice(0, maxLength) : value.replace(/\D/g, "").slice(0, maxLength),
    };
    incidentReportDraft.incidentDate = next;
    setIncidentDate(next);
    handleChange("incidentTiming", formatIncidentTiming(next));
  };

  const handleIncidentDateISO = (value: string) => {
    const [year = "", month = "", day = ""] = value.split("-");
    const next = { ...incidentDate, year, month, day };
    incidentReportDraft.incidentDate = next;
    setIncidentDate(next);
    handleChange("incidentTiming", formatIncidentTiming(next));
  };

  const handleUncertainAnswerChange = (field: keyof UncertainAnswers, checked: boolean) => {
    setUncertainAnswers((previous) => {
      const next = { ...previous, [field]: checked };
      incidentReportDraft.uncertainAnswers = next;
      return next;
    });
    const errorField = field === "timing" ? "incidentTiming" : field;
    setErrors((previous) => {
      const next = { ...previous };
      delete next[errorField];
      return next;
    });
  };

  const focusField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const stepErrors = validateStep(currentStep, effectiveFormData);
    if (currentStep === 2 && !uncertainAnswers.timing) {
      const dateError = getIncidentDateError(incidentDate);
      if (dateError) stepErrors.incidentTiming = dateError;
    }
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < 11) {
      pushReportingStep(currentStep + 1);
      updateCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setServerError(null);
    window.history.back();
  };

  const handleEditStep = (step: number, targetFieldId?: string) => {
    setErrors({});
    setServerError(null);
    pushReportingStep(step);
    updateCurrentStep(step);
    if (targetFieldId) {
      setTimeout(() => focusField(targetFieldId), 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    const allErrors = validateAll(effectiveFormData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Determine which step has errors and jump there
      const firstInvalidStep = Array.from({ length: 10 }, (_, index) => index + 1)
        .find((step) => Object.keys(validateStep(step, effectiveFormData)).length > 0);
      pushReportingStep(firstInvalidStep || 1);
      updateCurrentStep(firstInvalidStep || 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitIncidentReport(effectiveFormData, honeypot, sessionToken || undefined);
      if (result.success && result.reference) {
        incidentReportDraft.submittedReference = result.reference;
        setSubmittedReference(result.reference);
      } else {
        setServerError(
          result.error ||
            "Unable to submit incident report. Please check your answers and try again."
        );
      }
    } catch (err: any) {
      setServerError(
        "An unexpected network error occurred while submitting your report. Please try again or call the emergency hotline directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = async () => {
    if (!submittedReference) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(submittedReference);
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = submittedReference;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    } catch {
      // Ignored
    }
  };

  const handleResetForm = () => {
    incidentReportDraft.formData = INITIAL_REPORT_DATA;
    incidentReportDraft.incidentDate = INITIAL_INCIDENT_DATE;
    incidentReportDraft.uncertainAnswers = INITIAL_UNCERTAIN_ANSWERS;
    incidentReportDraft.submittedReference = null;
    incidentReportDraft.currentStep = 1;
    incidentReportDraft.hasStarted = false;
    setFormData(INITIAL_REPORT_DATA);
    setIncidentDate(INITIAL_INCIDENT_DATE);
    setUncertainAnswers(INITIAL_UNCERTAIN_ANSWERS);
    setSubmittedReference(null);
    setErrors({});
    setServerError(null);
    updateCurrentStep(1);
    updateHasStarted(false);
    // Refresh session security token for new submission
    getCsrfToken(true).then((tok) => setSessionToken(tok)).catch(() => {});
    window.scrollTo(0, 0);
  };

  if (!hasStarted && !submittedReference) {
    return (
      <div className="incident-reporting-service">
        <div id="incident-reporting-start-page" className={`govuk-grid-row ${styles.serviceEntry}`}>
          <div className="govuk-grid-column-two-thirds">
          <section className={styles.intro} aria-labelledby="incident-reporting-start-heading">
            <h1 className="govuk-heading-xl" id="incident-reporting-start-heading">
              Report a cyber security incident
            </h1>
            <p className="govuk-body-l">
              Use this service to report a suspected or confirmed cyber security incident to TT-CSIRT. You can report as an individual or on behalf of an organisation.
            </p>

            <Button
              type="button"
              role="primary"
              className="ttcsirt-primary-cta govuk-!-margin-bottom-5"
              id="start-incident-report-button"
              onClick={(event) => {
                window.history.replaceState(
                  { ...(window.history.state || {}), incidentReportingStep: 0 },
                  "",
                  window.location.href
                );
                pushReportingStep(1);
                updateCurrentStep(1);
                updateHasStarted(true);
              }}
            >
              <span className="ttcsirt-primary-cta__content">
                <span>Start now</span>
                <svg className="ttcsirt-primary-cta__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M2 1h5l8 9-8 9H2l8-9z" />
                </svg>
              </span>
            </Button>
            <p className="govuk-body govuk-!-margin-bottom-6">
              Read TT-CSIRT’s <a href="/privacy-policy" className="govuk-link" onClick={(event) => { event.preventDefault(); onNavigate("/privacy-policy"); }}>privacy policy and data protection information</a> to learn how information is handled.
            </p>
          </section>

          <div className={`govuk-!-margin-bottom-7 ${styles.urgentSupport}`}>
            <IncidentReportingSupport />
          </div>

          <div className="govuk-warning-text govuk-!-margin-bottom-7">
            <span className="govuk-warning-text__icon" aria-hidden="true">!</span>
            <strong className="govuk-warning-text__text">
              <span className="govuk-visually-hidden">Warning</span>
              If you think the device or network you are using may be compromised, use a different trusted device and connection to send this report.
            </strong>
          </div>

          <section className="govuk-!-margin-bottom-7" aria-labelledby="reporting-route-heading">
            <h2 className="govuk-heading-l" id="reporting-route-heading">
              Report cyber incidents and crimes to the right service
            </h2>
            <p className="govuk-body">
              TT-CSIRT handles cyber security incident reports. Reporting to TT-CSIRT does not make a police report.
            </p>
            <div className="govuk-grid-row">
              <section className={`govuk-grid-column-one-half ${styles.reportingRoute}`} aria-labelledby="ttcsirt-reporting-heading">
                <h3 className="govuk-heading-m" id="ttcsirt-reporting-heading">
                  Report cyber security incidents to TT-CSIRT
                </h3>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  Use this service to report suspicious cyber activity and incidents affecting systems, services or data. TT-CSIRT may provide or coordinate a cyber response where appropriate.
                </p>
              </section>
              <section className={`govuk-grid-column-one-half ${styles.reportingRoute}`} aria-labelledby="ttps-reporting-heading">
                <h3 className="govuk-heading-m" id="ttps-reporting-heading">
                  Report suspected crimes to TTPS
                </h3>
                <p className="govuk-body">
                  Report suspected fraud, theft, threats or other criminal conduct to the Trinidad and Tobago Police Service. If an incident involves both cyber activity and suspected crime, report it to both TT-CSIRT and TTPS.
                </p>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  <a href="https://www.ttps.gov.tt/report/" className="govuk-link">
                    Report an incident to the Trinidad and Tobago Police Service
                  </a>
                </p>
              </section>
            </div>
          </section>

          <section className="govuk-!-margin-bottom-7" aria-labelledby="incident-scope-heading">
            <h2 className="govuk-heading-l" id="incident-scope-heading">
              Which incidents this service covers
            </h2>
            <p className="govuk-body">
              Use the form to tell TT-CSIRT what happened, when you noticed it, which systems or information were affected, and the impact you know about.
            </p>
            <p className="govuk-body">
              Examples of incident types supported by the form include:
            </p>
            <ul id="incident-route-options" className="govuk-list govuk-list--bullet">
              <li>ransomware or other malware</li>
              <li>phishing or business email compromise</li>
              <li>unauthorised access or attempted intrusion</li>
              <li>data breach or system compromise</li>
              <li>denial-of-service activity or website defacement</li>
              <li>vulnerability exploitation or scanning</li>
              <li>another suspected cyber security incident</li>
            </ul>
            <p className="govuk-body">
              You will choose the closest incident type in the form. Read TT-CSIRT’s <a href="/guidance/ransomware-prevention-response" className="govuk-link" onClick={(event) => { event.preventDefault(); onNavigate("/guidance/ransomware-prevention-response"); }}>ransomware response guidance</a> or <a href="/guidance/phishing-scams" className="govuk-link" onClick={(event) => { event.preventDefault(); onNavigate("/guidance/phishing-scams"); }}>guidance on identifying and handling phishing scams</a> if you need help with either of those incidents.
            </p>
          </section>

          <section className="govuk-!-margin-bottom-7" aria-labelledby="what-to-prepare-heading">
            <h2 className="govuk-heading-l" id="what-to-prepare-heading">
              What to have ready before you report
            </h2>
            <p className="govuk-body">
              Having these details ready can help you complete the form:
            </p>
            <ul className="govuk-list govuk-list--bullet">
              <li>what happened and when you first noticed it</li>
              <li>the systems, services, accounts or information affected</li>
              <li>the known impact on your organisation or on people</li>
              <li>your contact details, and the organisation name and sector if you are reporting on its behalf</li>
              <li>whether you have relevant logs or other evidence</li>
            </ul>

            <div className="govuk-inset-text">
              You do not need every detail before you report. The form lets you say if the timing, incident details, affected systems or impact are not yet known.
            </div>

            <Details title="Technical information for security teams">
              <p className="govuk-body">
                If available, note relevant times and time zones, affected systems or services, logs, suspicious messages, indicators such as IP addresses or file hashes, and evidence you have preserved.
              </p>
              <p className="govuk-body govuk-!-margin-bottom-0">
                The form does not accept file uploads. You can describe the evidence you have. If TT-CSIRT needs files, it will explain how to send them securely.
              </p>
            </Details>
          </section>

          <section className="govuk-!-margin-bottom-7" aria-labelledby="what-happens-after-report-heading">
            <h2 className="govuk-heading-l" id="what-happens-after-report-heading">
              What happens after you report
            </h2>
            <ol className={`govuk-list ${styles.steps}`}>
              <li>
                <span className={styles.stepNumber} aria-hidden="true">01</span>
                <h3 className="govuk-heading-m">Submit your report</h3>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  Complete and send the online form.
                </p>
              </li>
              <li>
                <span className={styles.stepNumber} aria-hidden="true">02</span>
                <h3 className="govuk-heading-m">TT-CSIRT reviews the information</h3>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  A TT-CSIRT officer will review your report.
                </p>
              </li>
              <li>
                <span className={styles.stepNumber} aria-hidden="true">03</span>
                <h3 className="govuk-heading-m">We may contact you</h3>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  An officer may contact you by email or telephone if more information is needed.
                </p>
              </li>
              <li>
                <span className={styles.stepNumber} aria-hidden="true">04</span>
                <h3 className="govuk-heading-m">Keep your incident reference</h3>
                <p className="govuk-body govuk-!-margin-bottom-0">
                  The confirmation page gives you a reference number. Quote it if you contact TT-CSIRT about this incident.
                </p>
              </li>
            </ol>
          </section>

          <section className="govuk-!-margin-bottom-7" aria-labelledby="why-report-heading">
            <h2 className="govuk-heading-l" id="why-report-heading">
              Why your report matters
            </h2>
            <p className="govuk-body">
              Your report helps TT-CSIRT build a national picture of cyber security incidents reported to the team and consider whether follow-up or response coordination may be useful.
            </p>
          </section>

          </div>
        </div>
      </div>
    );
  }

  // SUCCESS / CONFIRMATION VIEW
  if (submittedReference) {
    return (
      <div className="incident-reporting-service">
          <div className="govuk-panel govuk-panel--confirmation govuk-!-margin-bottom-7" id="incident-confirmation-panel">
            <h1
              className="govuk-panel__title"
              id="confirmation-heading"
              ref={confirmationHeadingRef}
              tabIndex={-1}
            >
              Incident reported
            </h1>
            <div className="govuk-panel__body">
              Incident reference
              <br />
              <strong className="govuk-!-font-size-36" id="confirmation-reference-number" data-testid="incident-reference-number" style={{ letterSpacing: "1px", userSelect: "all" }}>
                {submittedReference}
              </strong>
            </div>
          </div>

          {/* Copy reference button */}
          <div className="govuk-!-margin-bottom-6">
            <Button
              type="button"
              role="secondary"
              id="copy-reference-button"
              ariaLabel={`Copy reference number ${submittedReference} to clipboard`}
              onClick={handleCopyReference}
            >
              {copiedNotification ? "Reference copied to clipboard" : "Copy reference number"}
            </Button>
            <div aria-live="polite" className="govuk-visually-hidden">
              {copiedNotification && `Reference number ${submittedReference} copied to clipboard`}
            </div>
          </div>

          <p className="govuk-body-l" id="confirmation-lead-text">
            Your report has been received by TT-CSIRT. Keep the reference number above and quote it if you contact us about this incident.
          </p>

          <h2 className="govuk-heading-m" id="what-happens-next-heading">
            What happens next
          </h2>
          <p className="govuk-body">
            A TT-CSIRT officer will review your report and may contact you using the email address or telephone number you provided.
          </p>
          <p className="govuk-body">
            If circumstances change, contact TT-CSIRT and quote your reference. For urgent assistance, use the phone numbers in the support information.
          </p>

          <div className="govuk-button-group govuk-!-margin-top-7">
            <Button
              type="button"
              role="secondary"
              id="print-confirmation-button"
              onClick={() => window.print()}
            >
              Print this confirmation
            </Button>
            <Button
              type="button"
              role="secondary"
              id="report-another-button"
              onClick={handleResetForm}
            >
              Submit another incident report
            </Button>
            <a
              href="/"
              className="govuk-link"
              id="return-home-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/");
              }}
            >
              Return to TT-CSIRT home
            </a>
          </div>
      </div>
    );
  }

  // Question-based intake form view
  return (
      <div className="incident-reporting-service">

        {/* Back Link */}
        <nav aria-label="Back navigation" className="govuk-!-margin-bottom-4">
          <a
            href="#back"
            className="govuk-back-link"
            id="form-back-button"
            onClick={(event) => {
              event.preventDefault();
              handleBack();
            }}
          >
            Back
          </a>
        </nav>

        {/* Step Indicator Header */}
        <p className="govuk-body-s incident-reporting-progress" id="step-caption" aria-live="polite">
          {currentStep < 11 ? `Step ${currentStep} of 10` : "Review your answers"}
        </p>

        {/* Global / Server Error Summary */}
        {(Object.keys(errors).length > 0 || serverError) && (
          <div
            className="govuk-error-summary"
            id="incident-error-summary"
            role="alert"
            aria-labelledby="error-summary-title"
            tabIndex={-1}
            ref={errorSummaryRef}
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              {serverError ? "We could not submit your report" : "Check the following answers"}
            </h2>
            <div className="govuk-error-summary__body">
              {serverError && (
                <p className="govuk-body govuk-!-margin-bottom-2" id="server-error-message">
                  {serverError}
                </p>
              )}
              {Object.keys(errors).length > 0 && (
                <ul className="govuk-list govuk-error-summary__list">
                  {Object.entries(errors).map(([key, msg]) => {
                    const fieldIdMap: Record<string, string> = {
                      incidentType: "incident-type",
                      incidentTiming: "incident-timing-day",
                      incidentDetails: "incident-details",
                      affectedSystems: "affected-systems",
                      impact: "impact",
                      evidenceAvailable: "evidence-available-yes",
                      evidenceNotes: "evidence-notes",
                      reporterType: "reporter-type-org",
                      organisation: "organisation",
                      sector: "sector",
                      reporterName: "reporter-name",
                      email: "email",
                      phone: "phone",
                    };
                    const targetId = fieldIdMap[key] || key;
                    return (
                      <li key={key}>
                        <a
                          href={`#${targetId}`}
                          className="govuk-link"
                          onClick={(e) => {
                            e.preventDefault();
                            focusField(targetId);
                          }}
                        >
                          {msg}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Main Service Heading */}
        {currentStep === 11 && (
          <h1 className="govuk-heading-l govuk-!-margin-bottom-4" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
            Check your answers before submitting your report
          </h1>
        )}

        {/* Honeypot field (hidden from genuine users and assistive tech) */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label htmlFor="website-trap">Leave this field blank</label>
          <input
            type="text"
            id="website-trap"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: INCIDENT INFORMATION */}
        {/* ========================================================================= */}
        {currentStep >= 1 && currentStep <= 3 && (
          <form onSubmit={handleContinue} noValidate>
            {/* Incident Type */}
            {currentStep === 1 && (
            <div
              className={`govuk-form-group ${errors.incidentType ? "govuk-form-group--error" : ""}`}
              id="group-incident-type"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="incident-type">
                  What type of incident are you reporting?
                </label>
              </h1>
              <div id="incident-type-hint" className="govuk-hint">
                Select the option that best describes what you observed. If you are unsure, select the closest category or "Other Cyber Security Incident".
              </div>
              {errors.incidentType && (
                <p id="incident-type-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.incidentType}
                </p>
              )}
              <select
                className={`govuk-select ${errors.incidentType ? "govuk-select--error" : ""}`}
                id="incident-type"
                name="incidentType"
                value={formData.incidentType}
                onChange={(e) => handleChange("incidentType", e.target.value)}
                aria-describedby={
                  errors.incidentType ? "incident-type-hint incident-type-error" : "incident-type-hint"
                }
              >
                <option value="">Select an incident type</option>
                {ALLOWED_INCIDENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            )}

            {/* When did it happen? */}
            {currentStep === 2 && (
            <div
              className={`govuk-form-group ${errors.incidentTiming ? "govuk-form-group--error" : ""}`}
              id="group-incident-timing"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <span className="govuk-label govuk-label--l">
                  When did the incident occur or when was it first detected?
                </span>
              </h1>
              <div id="incident-timing-hint" className="govuk-hint">
                Enter the date it occurred or was first detected. Add an approximate time and time zone below, if known.
              </div>
              <div className="govuk-checkboxes govuk-!-margin-bottom-4">
                <div className="govuk-checkboxes__item">
                  <input
                    className="govuk-checkboxes__input"
                    id="incident-timing-unknown"
                    type="checkbox"
                    checked={uncertainAnswers.timing}
                    onChange={(event) => handleUncertainAnswerChange("timing", event.target.checked)}
                  />
                  <label className="govuk-label govuk-checkboxes__label" htmlFor="incident-timing-unknown">
                    I don't know when it happened or was first detected
                  </label>
                </div>
              </div>
              {!uncertainAnswers.timing && (
                <>
                  <GcdsDateInput
                    ref={incidentDateInputRef}
                    id="incident-timing"
                    name="incident-date"
                    legend="Incident date"
                    format="iso"
                    hint="Enter the date in year, month, day order, for example 2026-03-31."
                    required={Boolean(errors.incidentTiming)}
                    validateOn="other"
                    value={incidentDate.year && incidentDate.month && incidentDate.day
                      ? `${incidentDate.year}-${incidentDate.month.padStart(2, "0")}-${incidentDate.day.padStart(2, "0")}`
                      : ""}
                    errorMessage={errors.incidentTiming || undefined}
                    onInput={(event) => handleIncidentDateISO((event.currentTarget as unknown as { value: string }).value)}
                  />
                  <div className="govuk-form-group govuk-!-margin-top-4">
                    <label className="govuk-label" htmlFor="incident-timing-time">
                      Approximate time and time zone, if known
                    </label>
                    <input
                      className="govuk-input govuk-!-width-one-half"
                      id="incident-timing-time"
                      name="incidentTiming-time"
                      type="text"
                      maxLength={100}
                      value={incidentDate.time}
                      onChange={(event) => handleIncidentDateChange("time", event.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            )}

            {/* What happened? (Incident details) */}
            {currentStep === 3 && (
            <div
              className={`govuk-form-group govuk-character-count ${errors.incidentDetails ? "govuk-form-group--error" : ""}`}
              id="group-incident-details"
              data-module="govuk-character-count"
              data-maxlength="5000"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="incident-details">
                  What happened?
                </label>
              </h1>
              <div id="incident-details-hint" className="govuk-hint">
                Describe what you saw and what you think may have happened. Do not enter passwords, banking credentials or payment card details.
              </div>
              {errors.incidentDetails && (
                <p id="incident-details-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.incidentDetails}
                </p>
              )}
              <div className="govuk-checkboxes govuk-!-margin-bottom-4">
                <div className="govuk-checkboxes__item">
                  <input
                    className="govuk-checkboxes__input"
                    id="incident-details-unknown"
                    type="checkbox"
                    checked={uncertainAnswers.incidentDetails}
                    onChange={(event) => handleUncertainAnswerChange("incidentDetails", event.target.checked)}
                  />
                  <label className="govuk-label govuk-checkboxes__label" htmlFor="incident-details-unknown">
                    I don't know
                  </label>
                </div>
              </div>
              <div hidden={uncertainAnswers.incidentDetails}>
              <textarea
                className={`govuk-textarea govuk-js-character-count ${errors.incidentDetails ? "govuk-textarea--error" : ""}`}
                id="incident-details"
                name="incidentDetails"
                rows={6}
                maxLength={5000}
                value={formData.incidentDetails}
                onChange={(e) => handleChange("incidentDetails", e.target.value)}
                aria-describedby={
                  errors.incidentDetails ? "incident-details-hint incident-details-error incident-details-info" : "incident-details-hint incident-details-info"
                }
              />
              <div className="govuk-hint govuk-character-count__message" id="incident-details-info">
                You can enter up to 5,000 characters
              </div>
              </div>
            </div>
            )}

            <div className="govuk-button-group govuk-!-margin-top-8">
              <Button
                type="submit"
                role="primary"
                id={`continue-button-step-${currentStep}`}
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: IMPACT AND EVIDENCE */}
        {/* ========================================================================= */}
        {currentStep >= 4 && currentStep <= 6 && (
          <form onSubmit={handleContinue} noValidate>
            {/* Affected systems */}
            {currentStep === 4 && (
            <div
              className={`govuk-form-group govuk-character-count ${errors.affectedSystems ? "govuk-form-group--error" : ""}`}
              id="group-affected-systems"
              data-module="govuk-character-count"
              data-maxlength="2000"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="affected-systems">
                  Which systems, services or equipment are affected or were affected?
                </label>
              </h1>
              <div id="affected-systems-hint" className="govuk-hint">
                For example, email, websites, workstations, servers or cloud services. Do not guess the full technical scope.
              </div>
              {errors.affectedSystems && (
                <p id="affected-systems-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.affectedSystems}
                </p>
              )}
              <div className="govuk-checkboxes govuk-!-margin-bottom-4">
                <div className="govuk-checkboxes__item">
                  <input
                    className="govuk-checkboxes__input"
                    id="affected-systems-unknown"
                    type="checkbox"
                    checked={uncertainAnswers.affectedSystems}
                    onChange={(event) => handleUncertainAnswerChange("affectedSystems", event.target.checked)}
                  />
                  <label className="govuk-label govuk-checkboxes__label" htmlFor="affected-systems-unknown">
                    I don't know
                  </label>
                </div>
              </div>
              <div hidden={uncertainAnswers.affectedSystems}>
              <textarea
                className={`govuk-textarea govuk-js-character-count ${errors.affectedSystems ? "govuk-textarea--error" : ""}`}
                id="affected-systems"
                name="affectedSystems"
                rows={4}
                maxLength={2000}
                value={formData.affectedSystems}
                onChange={(e) => handleChange("affectedSystems", e.target.value)}
                aria-describedby={
                  errors.affectedSystems ? "affected-systems-hint affected-systems-error affected-systems-info" : "affected-systems-hint affected-systems-info"
                }
              />
              <div className="govuk-hint govuk-character-count__message" id="affected-systems-info">
                You can enter up to 2,000 characters
              </div>
              </div>
            </div>
            )}

            {/* Impact */}
            {currentStep === 5 && (
            <div
              className={`govuk-form-group govuk-character-count ${errors.impact ? "govuk-form-group--error" : ""}`}
              id="group-impact"
              data-module="govuk-character-count"
              data-maxlength="3000"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="impact">
                  What impact has the incident had, or is it having, on your organisation, services or data?
                </label>
              </h1>
              <div id="impact-hint" className="govuk-hint">
                Describe what you know, such as service disruption, data loss or exposure. Do not guess if the impact is not yet clear.
              </div>
              {errors.impact && (
                <p id="impact-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.impact}
                </p>
              )}
              <div className="govuk-checkboxes govuk-!-margin-bottom-4">
                <div className="govuk-checkboxes__item">
                  <input
                    className="govuk-checkboxes__input"
                    id="impact-unknown"
                    type="checkbox"
                    checked={uncertainAnswers.impact}
                    onChange={(event) => handleUncertainAnswerChange("impact", event.target.checked)}
                  />
                  <label className="govuk-label govuk-checkboxes__label" htmlFor="impact-unknown">
                    I don't know the impact yet
                  </label>
                </div>
              </div>
              <div hidden={uncertainAnswers.impact}>
              <textarea
                className={`govuk-textarea govuk-js-character-count ${errors.impact ? "govuk-textarea--error" : ""}`}
                id="impact"
                name="impact"
                rows={4}
                maxLength={3000}
                value={formData.impact}
                onChange={(e) => handleChange("impact", e.target.value)}
                aria-describedby={
                  errors.impact ? "impact-hint impact-error impact-info" : "impact-hint impact-info"
                }
              />
              <div className="govuk-hint govuk-character-count__message" id="impact-info">
                You can enter up to 3,000 characters
              </div>
              </div>
            </div>
            )}

            {/* Evidence availability */}
            {currentStep === 6 && (
            <>
            <div
              className={`govuk-form-group ${errors.evidenceAvailable ? "govuk-form-group--error" : ""}`}
              id="group-evidence-available"
            >
              <fieldset
                className="govuk-fieldset"
                aria-describedby={
                  errors.evidenceAvailable
                    ? "evidence-available-hint evidence-available-error"
                    : "evidence-available-hint"
                }
              >
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--l">
                  <h1 className="govuk-fieldset__heading" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                    Do you have technical evidence or logs available?
                  </h1>
                </legend>
                <div id="evidence-available-hint" className="govuk-hint">
                  For example, firewall or server logs, phishing email headers or ransom notes. Do not upload files here. If needed, TT-CSIRT will explain how to submit evidence securely.
                </div>
                {errors.evidenceAvailable && (
                  <p id="evidence-available-error" className="govuk-error-message">
                    <span className="govuk-visually-hidden">Error:</span> {errors.evidenceAvailable}
                  </p>
                )}
                <div className="govuk-radios govuk-radios--inline" data-module="govuk-radios">
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="evidence-available-yes"
                      name="evidenceAvailable"
                      type="radio"
                      value="yes"
                      checked={formData.evidenceAvailable === "yes"}
                      onChange={() => handleChange("evidenceAvailable", "yes")}
                    />
                    <label className="govuk-label govuk-radios__label" htmlFor="evidence-available-yes">
                      Yes
                    </label>
                  </div>
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="evidence-available-no"
                      name="evidenceAvailable"
                      type="radio"
                      value="no"
                      checked={formData.evidenceAvailable === "no"}
                      onChange={() => handleChange("evidenceAvailable", "no")}
                    />
                    <label className="govuk-label govuk-radios__label" htmlFor="evidence-available-no">
                      No
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Evidence notes (conditional) */}
            {formData.evidenceAvailable === "yes" && (
              <div
                className={`govuk-form-group govuk-character-count ${errors.evidenceNotes ? "govuk-form-group--error" : ""}`}
                id="group-evidence-notes"
                data-module="govuk-character-count"
                data-maxlength="3000"
              >
                <label className="govuk-label govuk-label--m" htmlFor="evidence-notes">
                  Describe what evidence or logs you have preserved
                </label>
              <div id="evidence-notes-hint" className="govuk-hint">
                  Do not include passwords or other sensitive information. Do not attach files.
                </div>
                {errors.evidenceNotes && (
                  <p id="evidence-notes-error" className="govuk-error-message">
                    <span className="govuk-visually-hidden">Error:</span> {errors.evidenceNotes}
                  </p>
                )}
                <textarea
                  className={`govuk-textarea govuk-js-character-count ${errors.evidenceNotes ? "govuk-textarea--error" : ""}`}
                  id="evidence-notes"
                  name="evidenceNotes"
                  rows={4}
                  maxLength={3000}
                  value={formData.evidenceNotes}
                  onChange={(e) => handleChange("evidenceNotes", e.target.value)}
                  aria-describedby={
                    errors.evidenceNotes ? "evidence-notes-hint evidence-notes-error evidence-notes-info" : "evidence-notes-hint evidence-notes-info"
                  }
                />
                <div className="govuk-hint govuk-character-count__message" id="evidence-notes-info">
                  You can enter up to 3,000 characters
                </div>
              </div>
            )}
            </>
            )}

            <div className="govuk-button-group govuk-!-margin-top-8">
              <Button
                type="submit"
                role="primary"
                id={`continue-button-step-${currentStep}`}
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CONTACT DETAILS */}
        {/* ========================================================================= */}
        {currentStep >= 7 && currentStep <= 10 && (
          <form onSubmit={handleContinue} noValidate>
            {/* Reporter Type */}
            {currentStep === 7 && (
            <>
            <div
              className={`govuk-form-group ${errors.reporterType ? "govuk-form-group--error" : ""}`}
              id="group-reporter-type"
            >
              <fieldset
                className="govuk-fieldset"
                aria-describedby={
                  errors.reporterType ? "reporter-type-hint reporter-type-error" : "reporter-type-hint"
                }
              >
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--l">
                  <h1 className="govuk-fieldset__heading" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                    Are you reporting on behalf of an organisation or as an individual?
                  </h1>
                </legend>
                <div id="reporter-type-hint" className="govuk-hint">
                  Choose the option that describes you as the person making this report.
                </div>
                {errors.reporterType && (
                  <p id="reporter-type-error" className="govuk-error-message">
                    <span className="govuk-visually-hidden">Error:</span> {errors.reporterType}
                  </p>
                )}
                <div className="govuk-radios" data-module="govuk-radios">
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="reporter-type-org"
                      name="reporterType"
                      type="radio"
                      value="organisation"
                      checked={formData.reporterType === "organisation"}
                      onChange={() => handleChange("reporterType", "organisation")}
                    />
                    <label className="govuk-label govuk-radios__label" htmlFor="reporter-type-org">
                      I am reporting on behalf of an organisation
                    </label>
                  </div>
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="reporter-type-ind"
                      name="reporterType"
                      type="radio"
                      value="individual"
                      checked={formData.reporterType === "individual"}
                      onChange={() => handleChange("reporterType", "individual")}
                    />
                    <label className="govuk-label govuk-radios__label" htmlFor="reporter-type-ind">
                      I am reporting as an individual
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Organisation Name (if organisation) */}
            {formData.reporterType === "organisation" && (
              <div
                className={`govuk-form-group ${errors.organisation ? "govuk-form-group--error" : ""}`}
                id="group-organisation"
              >
                <label className="govuk-label govuk-label--m" htmlFor="organisation">
                  Organisation name
                </label>
                <div id="organisation-hint" className="govuk-hint">
                  Enter the registered commercial name, ministry, department, or statutory agency.
                </div>
                {errors.organisation && (
                  <p id="organisation-error" className="govuk-error-message">
                    <span className="govuk-visually-hidden">Error:</span> {errors.organisation}
                  </p>
                )}
                <input
                  className={`govuk-input ${errors.organisation ? "govuk-input--error" : ""}`}
                  id="organisation"
                  name="organisation"
                  type="text"
                  maxLength={200}
                  value={formData.organisation}
                  onChange={(e) => handleChange("organisation", e.target.value)}
                  aria-describedby={
                    errors.organisation ? "organisation-hint organisation-error" : "organisation-hint"
                  }
                />
              </div>
            )}

            {/* Sector (if organisation) */}
            {formData.reporterType === "organisation" && (
              <div
                className={`govuk-form-group ${errors.sector ? "govuk-form-group--error" : ""}`}
                id="group-sector"
              >
                <label className="govuk-label govuk-label--m" htmlFor="sector">
                  Which sector best describes the organisation?
                </label>
                <div id="sector-hint" className="govuk-hint">
                  Choose the closest option.
                </div>
                {errors.sector && (
                  <p id="sector-error" className="govuk-error-message">
                    <span className="govuk-visually-hidden">Error:</span> {errors.sector}
                  </p>
                )}
                <select
                  className={`govuk-select ${errors.sector ? "govuk-select--error" : ""}`}
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={(e) => handleChange("sector", e.target.value)}
                  aria-describedby={
                    errors.sector ? "sector-hint sector-error" : "sector-hint"
                  }
                >
                  <option value="">Select a sector</option>
                  {ALLOWED_SECTORS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}
            </>
            )}

            {/* Reporter Full Name */}
            {currentStep === 8 && (
            <div
              className={`govuk-form-group ${errors.reporterName ? "govuk-form-group--error" : ""}`}
              id="group-reporter-name"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="reporter-name">Your full name</label>
              </h1>
              <div id="reporter-name-hint" className="govuk-hint">
                TT-CSIRT may contact you about this report.
              </div>
              {errors.reporterName && (
                <p id="reporter-name-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.reporterName}
                </p>
              )}
              <input
                className={`govuk-input ${errors.reporterName ? "govuk-input--error" : ""}`}
                id="reporter-name"
                name="reporterName"
                type="text"
                autoComplete="name"
                maxLength={150}
                value={formData.reporterName}
                onChange={(e) => handleChange("reporterName", e.target.value)}
                aria-describedby={
                  errors.reporterName ? "reporter-name-hint reporter-name-error" : "reporter-name-hint"
                }
              />
            </div>
            )}

            {/* Email Address */}
            {currentStep === 9 && (
            <div
              className={`govuk-form-group ${errors.email ? "govuk-form-group--error" : ""}`}
              id="group-email"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="email">Your email address</label>
              </h1>
              <div id="email-hint" className="govuk-hint">
                We will use this address to confirm receipt and ask follow-up questions.
              </div>
              {errors.email && (
                <p id="email-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.email}
                </p>
              )}
              <input
                className={`govuk-input ${errors.email ? "govuk-input--error" : ""}`}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck="false"
                maxLength={254}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                aria-describedby={
                  errors.email ? "email-hint email-error" : "email-hint"
                }
              />
            </div>
            )}

            {/* Telephone Number */}
            {currentStep === 10 && (
            <div
              className={`govuk-form-group ${errors.phone ? "govuk-form-group--error" : ""}`}
              id="group-phone"
            >
              <h1 className="govuk-label-wrapper govuk-!-margin-bottom-3" id="incident-reporting-heading" ref={formHeadingRef} tabIndex={-1}>
                <label className="govuk-label govuk-label--l" htmlFor="phone">Your telephone number</label>
              </h1>
              <div id="phone-hint" className="govuk-hint">
                TT-CSIRT may call this number to clarify urgent details.
              </div>
              {errors.phone && (
                <p id="phone-error" className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {errors.phone}
                </p>
              )}
              <input
                className={`govuk-input govuk-input--width-20 ${errors.phone ? "govuk-input--error" : ""}`}
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={35}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                aria-describedby={
                  errors.phone ? "phone-hint phone-error" : "phone-hint"
                }
              />
            </div>
            )}

            <div className="govuk-button-group govuk-!-margin-top-8">
              <Button
                type="submit"
                role="primary"
                id={`continue-button-step-${currentStep}`}
              >
                {currentStep === 10 ? "Review your answers" : "Continue"}
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: REVIEW AND SUBMIT */}
        {/* ========================================================================= */}
        {currentStep === 11 && (
          <div>
            <p className="govuk-body govuk-!-margin-bottom-6">
              Your report has not been sent. Check the details below and use the Change links to correct an answer.
            </p>

            {/* SECTION 1: INCIDENT INFORMATION */}
            <h2 className="govuk-heading-m govuk-!-margin-top-6" id="summary-heading-incident">
              Incident information
            </h2>
            <dl className="govuk-summary-list govuk-!-margin-bottom-8" id="summary-list-incident">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Incident type</dt>
                <dd className="govuk-summary-list__value" id="review-value-incident-type">
                  {formData.incidentType || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#incident-type"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(1, "incident-type");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> incident type</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">When it occurred</dt>
                <dd className="govuk-summary-list__value" id="review-value-incident-timing">
                  {effectiveFormData.incidentTiming || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#incident-timing-day"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(2, "incident-timing-day");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> when incident occurred</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">What happened</dt>
                <dd className="govuk-summary-list__value ttcsirt-preserve-lines" id="review-value-incident-details">
                  {effectiveFormData.incidentDetails || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#incident-details"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(3, "incident-details");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> what happened</span>
                  </a>
                </dd>
              </div>
            </dl>

            {/* SECTION 2: IMPACT AND SYSTEMS */}
            <h2 className="govuk-heading-m" id="summary-heading-impact">
              Impact and systems
            </h2>
            <dl className="govuk-summary-list govuk-!-margin-bottom-8" id="summary-list-impact">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Affected systems</dt>
                <dd className="govuk-summary-list__value ttcsirt-preserve-lines" id="review-value-affected-systems">
                  {effectiveFormData.affectedSystems || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#affected-systems"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(4, "affected-systems");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> affected systems</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Operational impact</dt>
                <dd className="govuk-summary-list__value ttcsirt-preserve-lines" id="review-value-impact">
                  {effectiveFormData.impact || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#impact"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(5, "impact");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> operational impact</span>
                  </a>
                </dd>
              </div>
            </dl>

            {/* SECTION 3: EVIDENCE */}
            <h2 className="govuk-heading-m" id="summary-heading-evidence">
              Evidence information
            </h2>
            <dl className="govuk-summary-list govuk-!-margin-bottom-8" id="summary-list-evidence">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Evidence available</dt>
                <dd className="govuk-summary-list__value" id="review-value-evidence-available">
                  {formData.evidenceAvailable === "yes" ? "Yes" : "No"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#evidence-available-yes"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(6, "evidence-available-yes");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> evidence availability</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Evidence description</dt>
                <dd className="govuk-summary-list__value ttcsirt-preserve-lines" id="review-value-evidence-notes">
                  {formData.evidenceAvailable === "yes"
                    ? formData.evidenceNotes || "Notes not provided"
                    : "No digital artifacts or logs currently preserved"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  {formData.evidenceAvailable === "yes" && (
                    <a
                      className="govuk-link"
                      href="#evidence-notes"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditStep(6, "evidence-notes");
                      }}
                    >
                      Change<span className="govuk-visually-hidden"> evidence description</span>
                    </a>
                  )}
                </dd>
              </div>
            </dl>

            {/* SECTION 4: CONTACT DETAILS */}
            <h2 className="govuk-heading-m" id="summary-heading-contact">
              Reporter and contact details
            </h2>
            <dl className="govuk-summary-list govuk-!-margin-bottom-8" id="summary-list-contact">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Reporting capacity</dt>
                <dd className="govuk-summary-list__value" id="review-value-reporter-type">
                  {formData.reporterType === "organisation"
                    ? "Organisation or government agency"
                    : "Individual citizen"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#reporter-type-org"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(7, "reporter-type-org");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> reporting capacity</span>
                  </a>
                </dd>
              </div>

              {formData.reporterType === "organisation" && (
                <>
                  <div className="govuk-summary-list__row">
                    <dt className="govuk-summary-list__key">Organisation</dt>
                    <dd className="govuk-summary-list__value" id="review-value-organisation">
                      {formData.organisation || "Not specified"}
                    </dd>
                    <dd className="govuk-summary-list__actions">
                      <a
                        className="govuk-link"
                        href="#organisation"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditStep(7, "organisation");
                        }}
                      >
                      Change<span className="govuk-visually-hidden"> organisation</span>
                      </a>
                    </dd>
                  </div>

                  <div className="govuk-summary-list__row">
                    <dt className="govuk-summary-list__key">Sector</dt>
                    <dd className="govuk-summary-list__value" id="review-value-sector">
                      {formData.sector || "Not specified"}
                    </dd>
                    <dd className="govuk-summary-list__actions">
                      <a
                        className="govuk-link"
                        href="#sector"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditStep(7, "sector");
                        }}
                      >
                        Change<span className="govuk-visually-hidden"> sector</span>
                      </a>
                    </dd>
                  </div>
                </>
              )}

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Contact name</dt>
                <dd className="govuk-summary-list__value" id="review-value-reporter-name">
                  {formData.reporterName || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#reporter-name"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(8, "reporter-name");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> contact name</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Email address</dt>
                <dd className="govuk-summary-list__value" id="review-value-email">
                  {formData.email || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#email"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(9, "email");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> email address</span>
                  </a>
                </dd>
              </div>

              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Telephone</dt>
                <dd className="govuk-summary-list__value" id="review-value-phone">
                  {formData.phone || "Not specified"}
                </dd>
                <dd className="govuk-summary-list__actions">
                  <a
                    className="govuk-link"
                    href="#phone"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditStep(10, "phone");
                    }}
                  >
                    Change<span className="govuk-visually-hidden"> telephone</span>
                  </a>
                </dd>
              </div>
            </dl>

            {/* Declaration & Submission Area */}
            <p className="govuk-body govuk-!-margin-bottom-4">
              By submitting this report, you confirm that the details are accurate to the best of your knowledge.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="govuk-button-group govuk-!-margin-top-7">
                <Button
                  type="submit"
                  role="primary"
                  id="submit-report-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting incident report..." : "Submit incident report"}
                </Button>
              </div>
            </form>
          </div>
        )}
    </div>
  );
}
