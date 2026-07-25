// Shared types for the voice-agent knowledge base (T-033, FR-013).
//
// This module is the RAG-groundable source of truth for /api/agent/turn
// (T-032). Every fact in it traces back to versioned, human-authored repo
// content (about.tsx's source narrative in COPY.md, experience-data.ts,
// projects-data.ts, credentials-data.ts) — never crawled, never invented.
// See ADR-001 D8 (amended): "the KB is built only from versioned repo
// content Gaurav authored... so there's no untrusted-content-in-context
// vector here."

/** Coarse category used for retrieval weighting and prompt organization. */
export type KnowledgeSection =
  | "identity"
  | "about"
  | "experience"
  | "projects"
  | "credentials"
  | "contact";

export interface KnowledgeChunk {
  /** Stable id, useful for test assertions and debugging retrieval. */
  id: string;
  section: KnowledgeSection;
  /** Short human-readable title, also folded into the retrieval index. */
  title: string;
  /** Extra bag-of-words the retriever matches against, beyond title/text. */
  keywords: string[];
  /** The actual groundable content, in Gaurav's own words/facts only. */
  text: string;
  /**
   * Always-include chunks anchor every prompt regardless of query relevance
   * (e.g. core identity, contact CTAs for wrap-ups) so the agent never loses
   * its persona or its ability to redirect to a contact action.
   */
  alwaysInclude?: boolean;
}
