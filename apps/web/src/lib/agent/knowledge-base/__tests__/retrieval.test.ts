import { describe, expect, it } from "vitest";
import { KNOWLEDGE_BASE } from "../content";
import { formatChunksForPrompt, retrieveRelevantChunks } from "../retrieval";

describe("retrieveRelevantChunks", () => {
  it("always includes the core identity and contact chunks", () => {
    const results = retrieveRelevantChunks("what's the weather today");
    const ids = results.map((chunk) => chunk.id);
    expect(ids).toContain("identity-core");
    expect(ids).toContain("identity-voice-throughlines");
    expect(ids).toContain("contact-ctas");
  });

  it("surfaces the fAIshion role for an agentic-systems question", () => {
    const results = retrieveRelevantChunks(
      "what's your experience with agentic systems",
    );
    const ids = results.map((chunk) => chunk.id);
    expect(ids).toContain("experience-faishion");
  });

  it("surfaces ELDA.AI for a Claude/hackathon question", () => {
    const results = retrieveRelevantChunks("tell me about the Cal Hacks project");
    const ids = results.map((chunk) => chunk.id);
    expect(ids).toContain("project-elda-ai");
  });

  it("surfaces education chunk for a schooling question", () => {
    const results = retrieveRelevantChunks("where did you go to school");
    const ids = results.map((chunk) => chunk.id);
    expect(ids).toContain("credentials-education");
  });

  it("surfaces the FleetPanda role for a current-job question", () => {
    const results = retrieveRelevantChunks("what do you do at your current job");
    const ids = results.map((chunk) => chunk.id);
    expect(ids).toContain("experience-fleetpanda");
  });

  it("caps results at the requested limit plus always-include chunks", () => {
    const always = KNOWLEDGE_BASE.filter((chunk) => chunk.alwaysInclude).length;
    const results = retrieveRelevantChunks("project experience work", { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(always + 2);
  });

  it("returns only always-include chunks for a query with no matches", () => {
    const results = retrieveRelevantChunks("xyzzyplughabracadabra");
    expect(results.every((chunk) => chunk.alwaysInclude)).toBe(true);
  });
});

describe("formatChunksForPrompt", () => {
  it("renders a readable fallback when there are no chunks", () => {
    expect(formatChunksForPrompt([])).toMatch(/no specific matching background/i);
  });

  it("renders chunk titles and text", () => {
    const rendered = formatChunksForPrompt(retrieveRelevantChunks("Dr. Birkhe"));
    expect(rendered).toContain("###");
  });
});
