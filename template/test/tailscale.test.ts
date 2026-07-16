import { describe, expect, it } from "vitest";
import {
  mergeOrigins,
  normalizeLocalTarget,
  normalizeTailnetUrl,
  tailnetUrlFromStatus,
} from "../scripts/tailscale.js";

describe("Tailscale tooling", () => {
  it("derives the private HTTPS origin from Tailscale status", () => {
    expect(tailnetUrlFromStatus('{"Self":{"DNSName":"demo.tail123.ts.net."}}')).toBe(
      "https://demo.tail123.ts.net",
    );
  });

  it("accepts only exact HTTPS tailnet URLs", () => {
    expect(normalizeTailnetUrl("https://demo.tail123.ts.net/")).toBe("https://demo.tail123.ts.net");
    expect(() => normalizeTailnetUrl("http://demo.tail123.ts.net")).toThrow(/exact HTTPS origin/);
    expect(() => normalizeTailnetUrl("https://demo.tail123.ts.net/private")).toThrow(/exact HTTPS origin/);
  });

  it("restricts Serve targets to loopback services", () => {
    expect(normalizeLocalTarget("http://127.0.0.1:5173/")).toBe("http://127.0.0.1:5173");
    expect(() => normalizeLocalTarget("http://example.com:5173")).toThrow(/must point to an HTTP service/);
  });

  it("merges trusted origins without duplicates", () => {
    expect(
      mergeOrigins("https://demo.tail123.ts.net", "http://localhost:5173, https://demo.tail123.ts.net"),
    ).toBe("https://demo.tail123.ts.net,http://localhost:5173");
  });
});
