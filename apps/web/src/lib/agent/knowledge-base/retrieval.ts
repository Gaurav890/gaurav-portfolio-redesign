// Simple keyword/section-relevance retrieval over KNOWLEDGE_BASE (T-033).
//
// Deliberately not embeddings/a vector DB: this task's brief is explicit
// that a personal-portfolio-scale knowledge base (a few dozen short chunks)
// doesn't warrant that infrastructure — "keep it as simple as correctness
// allows." Keyword overlap scoring is easy to reason about, easy to test
// deterministically (no embedding-model nondeterminism), and cheap (no
// extra API call before the main LLM call even happens).

import { KNOWLEDGE_BASE } from "./content";
import type { KnowledgeChunk } from "./types";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "being", "to", "of", "in", "on", "at", "for", "with", "about",
  "as", "by", "from", "you", "your", "i", "me", "my", "what", "who",
  "whom", "which", "that", "this", "it", "do", "does", "did", "have",
  "has", "had", "can", "could", "will", "would", "should", "tell", "me",
  "please", "so", "just", "really", "like", "know", "some", "any",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk): number {
  if (queryTokens.length === 0) return 0;

  const titleTokens = new Set(tokenize(chunk.title));
  const keywordTokens = new Set(
    chunk.keywords.flatMap((keyword) => tokenize(keyword)),
  );
  const textTokens = tokenize(chunk.text);
  const textTokenCounts = new Map<string, number>();
  for (const token of textTokens) {
    textTokenCounts.set(token, (textTokenCounts.get(token) ?? 0) + 1);
  }

  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5;
    if (keywordTokens.has(token)) score += 4;
    const textHits = textTokenCounts.get(token) ?? 0;
    score += Math.min(textHits, 3) * 1.5; // diminishing returns per repeat
  }
  return score;
}

export interface RetrievalOptions {
  /** Max number of query-relevant chunks to return, beyond always-included ones. */
  limit?: number;
  /** Minimum score for a chunk to count as "relevant" to the query. */
  minScore?: number;
}

const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SCORE = 3;

/**
 * Retrieves the knowledge-base chunks most relevant to a visitor's query,
 * always including the small set of "always include" chunks (core
 * identity + contact CTAs) so the agent never loses its grounding anchor
 * even on an off-topic or adversarial turn — those chunks are what let the
 * guardrail-approved deflection still sound like Gaurav and still be able
 * to redirect to a contact action.
 */
export function retrieveRelevantChunks(
  query: string,
  options: RetrievalOptions = {},
): KnowledgeChunk[] {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  const queryTokens = tokenize(query);

  const always = KNOWLEDGE_BASE.filter((chunk) => chunk.alwaysInclude);
  const alwaysIds = new Set(always.map((chunk) => chunk.id));

  const scored = KNOWLEDGE_BASE.filter((chunk) => !alwaysIds.has(chunk.id))
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);

  return [...always, ...scored];
}

/** Renders retrieved chunks into a single context block for the system prompt. */
export function formatChunksForPrompt(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return "(No specific matching background found for this question.)";
  return chunks
    .map((chunk) => `### ${chunk.title}\n${chunk.text}`)
    .join("\n\n");
}
