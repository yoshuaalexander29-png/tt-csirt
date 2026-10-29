import React, { useEffect, useRef } from 'react';
import type { ValidationError } from '@ttcsirt/canonical-types';

interface Props {
  errors: ValidationError[];
  onErrorClick?: (field: string, targetAnchor: string) => void;
}

export const GdsErrorSummary: React.FC<Props> = ({ errors, onErrorClick }) => {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0 && summaryRef.current) {
      summaryRef.current.focus();
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="govuk-error-summary"
      data-module="govuk-error-summary"
    >
      <h2 id="error-summary-title" className="govuk-error-summary__title">
        There is a problem
      </h2>
      <div className="govuk-error-summary__body">
        <ul className="govuk-list govuk-error-summary__list">
          {errors.map((err, idx) => {
            const targetAnchor = `field-${err.field.replace(/\./g, '-').replace(/\[/g, '-').replace(/\]/g, '')}`;
            return (
              <li key={idx}>
                <a
                  href={`#${targetAnchor}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onErrorClick) {
                      onErrorClick(err.field, targetAnchor);
                    } else {
                      const el = document.getElementById(targetAnchor);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                    }
                  }}
                >
                  {err.message}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
