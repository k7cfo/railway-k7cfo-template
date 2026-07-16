import { describe, expect, it } from "vitest";
import { parseServerEnv } from "../src/env.js";

describe("environment validation", () => {
  it("reports variable names without values", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "", BETTER_AUTH_SECRET: "visible-secret" })).toThrow(
      /DATABASE_URL.*BETTER_AUTH_SECRET/,
    );
    try {
      parseServerEnv({ DATABASE_URL: "", BETTER_AUTH_SECRET: "visible-secret" });
    } catch (error) {
      expect(String(error)).not.toContain("visible-secret");
    }
  });

  it("normalizes an explicit trusted-origin allowlist", () => {
    const parsed = parseServerEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
      BETTER_AUTH_SECRET: "a-development-secret-that-is-long-enough",
      TRUSTED_ORIGINS: " https://demo.example.ts.net/,http://localhost:5173,https://demo.example.ts.net ",
    });
    expect(parsed.TRUSTED_ORIGINS).toEqual(["https://demo.example.ts.net", "http://localhost:5173"]);
  });

  it("rejects paths and non-HTTP values in trusted origins without echoing them", () => {
    const invalid = "https://demo.example.ts.net/private";
    try {
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
        BETTER_AUTH_SECRET: "a-development-secret-that-is-long-enough",
        TRUSTED_ORIGINS: invalid,
      });
      throw new Error("Expected trusted-origin validation to fail.");
    } catch (error) {
      expect(String(error)).toContain("TRUSTED_ORIGINS");
      expect(String(error)).not.toContain(invalid);
    }
  });

  it("accepts only a single HTTP header name for authentication rate limits", () => {
    const valid = parseServerEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
      BETTER_AUTH_SECRET: "a-development-secret-that-is-long-enough",
      AUTH_IP_HEADER: "x-forwarded-for",
    });
    expect(valid.AUTH_IP_HEADER).toBe("x-forwarded-for");
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
        BETTER_AUTH_SECRET: "a-development-secret-that-is-long-enough",
        AUTH_IP_HEADER: "x-real-ip,x-forwarded-for",
      }),
    ).toThrow(/AUTH_IP_HEADER/);
  });
});
