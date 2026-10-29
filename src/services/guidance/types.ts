/**
 * Type Definitions for the TT-CSIRT Guidance Content System
 */

export type GuidanceAudience =
  | "individuals"
  | "organisations"
  | "government"
  | "technical";

export type GuidanceCategory =
  | "personal-cyber-safety"
  | "enterprise-defence"
  | "critical-infrastructure"
  | "technical-standards";

export interface GuidanceSourceLink {
  title: string;
  url: string;
  publisher: string;
  context: string;
}

export interface RelatedGuidanceLink {
  slug: string;
  title: string;
  description: string;
}

export interface GuidanceChecklistItem {
  task: string;
  detail: string;
  priority?: "immediate" | "high" | "standard";
}

export interface GuidanceSubsection {
  title: string;
  paragraphs?: string[];
  list?: string[];
  callout?: string;
}

export interface GuidanceSection {
  id: string;
  title: string;
  lead?: string;
  paragraphs?: string[];
  list?: string[];
  subsections?: GuidanceSubsection[];
}

export interface GuidanceSummary {
  slug: string;
  title: string;
  summary: string;
  audience: GuidanceAudience[];
  audienceLabel: string;
  category: GuidanceCategory;
  categoryLabel: string;
  readingTimeMinutes: number;
  primarySource: string;
  lastReviewed: string;
  isFeatured?: boolean;
  hasChecklist?: boolean;
}

export interface GuidanceArticle {
  slug: string;
  title: string;
  shortPurpose: string;
  audienceDescription: string;
  audiences: GuidanceAudience[];
  audienceLabel: string;
  category: GuidanceCategory;
  categoryLabel: string;
  lastReviewed: string;
  provenanceNote: string;
  keyActions: string[];
  sections: GuidanceSection[];
  checklist?: {
    title: string;
    description?: string;
    items: GuidanceChecklistItem[];
  };
  whenToReport: {
    text: string;
    emergencyPhone?: string;
    reportLinkText?: string;
    reportLinkHref?: string;
  };
  relatedGuidance: RelatedGuidanceLink[];
  sources: GuidanceSourceLink[];
}
