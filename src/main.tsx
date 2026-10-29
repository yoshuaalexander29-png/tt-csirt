
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@gcds-core/components-react/gcds.css";
import "./styles/govuk-foundation.scss";
import "./styles/index.css";
import { defineCustomElement as defineButton } from "@gcds-core/components/dist/components/gcds-button.js";
import { defineCustomElement as defineBreadcrumbs } from "@gcds-core/components/dist/components/gcds-breadcrumbs.js";
import { defineCustomElement as defineBreadcrumbsItem } from "@gcds-core/components/dist/components/gcds-breadcrumbs-item.js";
import { defineCustomElement as defineDetails } from "@gcds-core/components/dist/components/gcds-details.js";
import { defineCustomElement as defineDateInput } from "@gcds-core/components/dist/components/gcds-date-input.js";
import { defineCustomElement as defineIcon } from "@gcds-core/components/dist/components/gcds-icon.js";
import { defineCustomElement as defineLink } from "@gcds-core/components/dist/components/gcds-link.js";
import { defineCustomElement as defineNotice } from "@gcds-core/components/dist/components/gcds-notice.js";
import { defineCustomElement as defineSelect } from "@gcds-core/components/dist/components/gcds-select.js";
import { defineCustomElement as defineTable } from "@gcds-core/components/dist/components/gcds-table.js";

defineButton();
defineBreadcrumbs();
defineBreadcrumbsItem();
defineDetails();
defineDateInput();
defineIcon();
defineLink();
defineNotice();
defineSelect();
defineTable();

// Disable automatic browser scroll restoration for single page app navigation
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  try {
    window.history.scrollRestoration = "manual";
  } catch {
    // Graceful fallback
  }
}

createRoot(document.getElementById("root")!).render(<App />);
  
