import { describe, it, expect } from "vitest";
import { canInviteWithRole } from "../roleHelpers";

/**
 * Regression guard for the household-takeover vulnerability (C-1).
 *
 * The takeover chain hinged on a low-privilege member being able to issue a
 * `primary`/`admin` invite. `canInviteWithRole` is the gate that forbids
 * inviting anyone above your own role; these tests pin that contract.
 */
describe("canInviteWithRole — invite privilege-escalation guard (C-1)", () => {
  it("lets a supporter invite only supporters", () => {
    expect(canInviteWithRole("supporter", "supporter")).toBe(true);
    expect(canInviteWithRole("supporter", "admin")).toBe(false);
    expect(canInviteWithRole("supporter", "primary")).toBe(false);
  });

  it("lets an admin invite admins and supporters, but never primary", () => {
    expect(canInviteWithRole("admin", "supporter")).toBe(true);
    expect(canInviteWithRole("admin", "admin")).toBe(true);
    expect(canInviteWithRole("admin", "primary")).toBe(false);
  });

  it("lets a primary invite any role", () => {
    expect(canInviteWithRole("primary", "supporter")).toBe(true);
    expect(canInviteWithRole("primary", "admin")).toBe(true);
    expect(canInviteWithRole("primary", "primary")).toBe(true);
  });

  it("denies unknown or missing roles (defense-in-depth)", () => {
    expect(canInviteWithRole("hacker", "primary")).toBe(false);
    expect(canInviteWithRole("primary", "superadmin")).toBe(false);
    expect(canInviteWithRole(undefined, "primary")).toBe(false);
    expect(canInviteWithRole("user", "supporter")).toBe(false); // bare "user" is not a member role
  });
});
