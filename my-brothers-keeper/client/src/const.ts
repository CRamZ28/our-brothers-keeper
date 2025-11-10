export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Our Brother's Keeper";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/obk-logo-v2.png?v=2";

// Replit Auth endpoints
export const getLoginUrl = () => "/api/login";
export const getLogoutUrl = () => "/api/logout";

// Visibility options - simplified 3-option model
// Maps to existing backend visibility scopes:
// - Everyone → all_supporters (all family/friend/community tier members)
// - Specific Groups → group (select from household groups)
// - Custom → custom (individual user selection)
export const VISIBILITY_OPTIONS = [
  {
    value: "everyone" as const,
    label: "Everyone",
    description: "Share with all supporters",
    backendScope: "all_supporters" as const,
  },
  {
    value: "groups" as const,
    label: "Specific Groups",
    description: "Select specific groups to share with",
    backendScope: "group" as const,
  },
  {
    value: "custom" as const,
    label: "Custom",
    description: "Select specific people individually",
    backendScope: "custom" as const,
  },
] as const;

export type VisibilityOption = typeof VISIBILITY_OPTIONS[number]["value"];
export type BackendVisibilityScope = "all_supporters" | "group" | "custom" | "role" | "private";

