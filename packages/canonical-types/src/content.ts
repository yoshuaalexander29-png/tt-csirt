/**
 * @fileoverview Canonical Content Abstract Syntax Tree (AST)
 * Defines structured, semantic content nodes used within advisory sections.
 *
 * Strict Architectural Invariant:
 * Raw arbitrary HTML is strictly FORBIDDEN as a canonical content node type.
 * All content must be represented as typed, semantic AST nodes.
 */

/**
 * Rich inline formatting elements allowed within text blocks
 */
export type InlineNode =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "strong";
      text: string;
    }
  | {
      type: "emphasis";
      text: string;
    }
  | {
      type: "code";
      text: string;
    }
  | {
      type: "link";
      text: string;
      href: string;
      isExternal: boolean;
      title?: string;
    };

/**
 * Common base properties for all block-level AST content nodes
 */
export interface BaseContentNode {
  /** Deterministic identifier unique within the section */
  id: string;
}

/**
 * Standard semantic paragraph
 */
export interface ParagraphNode extends BaseContentNode {
  type: "paragraph";
  /** Fallback plain-text representation */
  text: string;
  /** Rich inline node sequence */
  inlines: InlineNode[];
}

/**
 * Subordinate section headings (H3 and H4 only; H1 is page title, H2 is section container)
 */
export interface SubheadingNode extends BaseContentNode {
  type: "subheading";
  level: 3 | 4;
  text: string;
}

/**
 * Single item in an ordered or unordered list
 */
export interface ListItemNode {
  id: string;
  text: string;
  inlines: InlineNode[];
}

/**
 * Structured list block (bulleted or numbered)
 */
export interface ListNode extends BaseContentNode {
  type: "list";
  ordered: boolean;
  items: ListItemNode[];
}

/**
 * Structured data table
 */
export interface TableNode extends BaseContentNode {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
  alignments?: Array<"left" | "center" | "right">;
}

/**
 * Security warning or advisory callout box
 */
export interface CalloutNode extends BaseContentNode {
  type: "callout";
  tone: "warning" | "advisory" | "important";
  title?: string;
  text: string;
  inlines: InlineNode[];
}

/**
 * Preformatted code block, terminal command, configuration snippet, or threat detection rule
 */
export interface CodeBlockNode extends BaseContentNode {
  type: "code";
  code: string;
  language?: "bash" | "powershell" | "yara" | "snort" | "json" | "python" | "xml" | "text";
  filename?: string;
}

/**
 * Explicit reference citation block
 */
export interface ReferenceListNode extends BaseContentNode {
  type: "references";
  referenceIds: string[];
}

/**
 * Discriminative union of all canonical block content nodes.
 * Notice: 'raw-html' is intentionally absent.
 */
export type CanonicalContentNode =
  | ParagraphNode
  | SubheadingNode
  | ListNode
  | TableNode
  | CalloutNode
  | CodeBlockNode
  | ReferenceListNode;

/**
 * Major section container (rendered with H2 heading in GOV.UK layout)
 */
export interface CanonicalAdvisorySection {
  id: string;
  title: string;
  level: 2;
  nodes: CanonicalContentNode[];
}

/**
 * Standard structured advisory section hierarchy
 */
export interface AdvisorySectionBundle {
  /** Executive technical summary */
  overview: CanonicalAdvisorySection;
  /** Operational and business security impact */
  impact: CanonicalAdvisorySection;
  /** In-depth vulnerability mechanics */
  technicalDetails?: CanonicalAdvisorySection;
  /** Indicators of Compromise and hunting guidance */
  detectionMethods?: CanonicalAdvisorySection;
  /** Immediate mitigation workarounds */
  immediateActions?: CanonicalAdvisorySection;
  /** Permanent remediation and patch guidance */
  remediation: CanonicalAdvisorySection;
  /** Any supplementary technical sections */
  customSections?: CanonicalAdvisorySection[];
}
