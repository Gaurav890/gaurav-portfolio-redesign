import { describe, expect, it } from "vitest";
import { validateContactPayload } from "../validation";

describe("validateContactPayload", () => {
  it("accepts a well-formed payload and trims whitespace", () => {
    const result = validateContactPayload({
      name: "  Ada Lovelace  ",
      email: "  ada@example.com ",
      message: "  Let's talk about analytical engines.  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "Let's talk about analytical engines.",
        honeypotFilled: false,
      });
    }
  });

  it("rejects a missing name (AC-003: required fields)", () => {
    const result = validateContactPayload({ email: "a@b.com", message: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
    }
  });

  it("rejects an empty/whitespace-only message", () => {
    const result = validateContactPayload({ name: "Ada", email: "a@b.com", message: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "message")).toBe(true);
    }
  });

  it("rejects a malformed email (AC-003: email format)", () => {
    const result = validateContactPayload({ name: "Ada", email: "not-an-email", message: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "email")).toBe(true);
    }
  });

  it("rejects a non-object body", () => {
    const result = validateContactPayload("just a string");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("body");
    }
  });

  it("rejects a name over the max length", () => {
    const result = validateContactPayload({
      name: "a".repeat(201),
      email: "a@b.com",
      message: "hello",
    });
    expect(result.ok).toBe(false);
  });

  it("flags honeypotFilled when the hidden `website` field is non-empty", () => {
    const result = validateContactPayload({
      name: "Ada",
      email: "a@b.com",
      message: "hello",
      website: "https://spam.example",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.honeypotFilled).toBe(true);
    }
  });

  it("does not flag the honeypot when the field is absent or empty", () => {
    const withoutField = validateContactPayload({ name: "Ada", email: "a@b.com", message: "hello" });
    const withEmptyField = validateContactPayload({
      name: "Ada",
      email: "a@b.com",
      message: "hello",
      website: "",
    });
    expect(withoutField.ok && withoutField.value.honeypotFilled).toBe(false);
    expect(withEmptyField.ok && withEmptyField.value.honeypotFilled).toBe(false);
  });
});
