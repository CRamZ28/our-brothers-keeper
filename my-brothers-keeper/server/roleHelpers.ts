export type Role = "primary" | "admin" | "supporter";

// Higher rank = more privilege. Used to prevent privilege escalation.
const ROLE_RANK: Record<Role, number> = {
  supporter: 1,
  admin: 2,
  primary: 3,
};

/**
 * Whether a user with `callerRole` may issue an invite that grants `targetRole`.
 *
 * A user may only invite at or below their own role. This blocks the privilege
 * escalation at the root of the household-takeover vulnerability: a `supporter`
 * (the role any self-joiner receives) must not be able to mint a `primary` or
 * `admin` invite and then accept it themselves.
 */
export function canInviteWithRole(
  callerRole: string | null | undefined,
  targetRole: string | null | undefined
): boolean {
  const caller = ROLE_RANK[(callerRole ?? "") as Role];
  const target = ROLE_RANK[(targetRole ?? "") as Role];
  if (!caller || !target) {
    return false; // unknown / missing role → deny
  }
  return target <= caller;
}
