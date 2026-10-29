import type { ReactNode } from "react";
import { GcdsButton } from "@gcds-core/components-react";

type ButtonRole = "start" | "primary" | "secondary" | "danger";
interface ButtonProps {
  children: ReactNode;
  role?: ButtonRole;
  className?: string;
  href?: string;
  id?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  type?: "button" | "submit" | "reset" | "link";
  disabled?: boolean;
  onClick?: (event: CustomEvent<string | void>) => void;
}

/** Thin adapter; navigation remains link-based through the component's href API. */
export function Button({ children, role = "primary", className, href, id, ariaLabel, ariaPressed, type, disabled, onClick }: ButtonProps) {
  return <GcdsButton buttonRole={role} className={className} href={href} buttonId={id} id={id} aria-label={ariaLabel} aria-pressed={ariaPressed} type={type} disabled={disabled} onGcdsClick={onClick}>{children}</GcdsButton>;
}
