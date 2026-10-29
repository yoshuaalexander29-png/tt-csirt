import type { ReactNode } from "react";

interface FilterSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export function FilterSelect({ id, name, label, value, onChange, disabled = false, children }: FilterSelectProps) {
  return (
    <div className="govuk-form-group filter-panel__field">
      <label className="govuk-label filter-panel__label" htmlFor={id}>{label}</label>
      <select className="govuk-select filter-panel__select" id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {children}
      </select>
    </div>
  );
}
