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
});
