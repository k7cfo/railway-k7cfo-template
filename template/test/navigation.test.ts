import { describe, expect, it } from "vitest";
import { visibleNavigation, type NavigationContext } from "../web/src/config/navigation.js";

const base: NavigationContext = {
  role: "member",
  persona: "builder",
  features: { teams: true, support: true, admin: true, billing: true, ai: true, email: true, storage: true },
  workspaceKind: "team",
  mobile: false,
};
describe("persona-aware navigation", () => {
  it("adapts content without granting administrative access", () => {
    expect(visibleNavigation(base).some((item) => item.label === "Administration")).toBe(false);
    expect(
      visibleNavigation({ ...base, persona: "operator" }).some((item) => item.label === "Activity"),
    ).toBe(true);
    expect(visibleNavigation({ ...base, persona: "builder" }).some((item) => item.label === "Activity")).toBe(
      false,
    );
  });
});
