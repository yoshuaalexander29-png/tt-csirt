/**
 * @fileoverview @ttcsirt/canonical-types
 * Authoritative Canonical Domain Contracts, AST Definitions, and Schemas for TT-CSIRT.
 *
 * Strict Architectural Invariant:
 * Pure TypeScript domain contracts with zero runtime or platform dependencies.
 * Usable across Node.js runtime and client applications.
 */

// Domain Taxonomy & Classifications
export * from "./taxonomy.ts";

// Content Abstract Syntax Tree (AST)
export * from "./content.ts";

// Vulnerability, CVSS & Product Ranges
export * from "./vulnerability.ts";

// Controlled Media Assets
export * from "./media.ts";

// Publication, Reference & Workflow Metadata
export * from "./publication.ts";

// Immutable Versions & Snapshots
export * from "./version.ts";

// Append-Only Audit Ledger
export * from "./audit.ts";

// Validation Gate Results & Errors
export * from "./validation.ts";

// Authoritative Advisory Contracts (Internal & Public)
export * from "./advisory.ts";

// Discovery, Index & Syndication
export * from "./discovery.ts";
