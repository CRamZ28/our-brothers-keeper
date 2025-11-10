export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Our Brother's Keeper";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/obk-logo-v2.png?v=2";

// Replit Auth endpoints
export const getLoginUrl = () => "/api/login";
export const getLogoutUrl = () => "/api/logout";

// Visibility audience presets (UI layer)
// These map to the existing backend visibility model:
// - Inner Circle → visibilityScope: "group" (inner_circle system group)
// - Friends → visibilityScope: "all_supporters" (family+friend tiers)
// - Church/Community Groups → visibilityScope: "group" (community system groups)
// - Custom → visibilityScope: "custom" (individual user selection)
export const VISIBILITY_PRESETS = [
  {
    value: "inner_circle" as const,
    label: "Inner Circle",
    description: "Share with your closest family and friends",
    backendScope: "group" as const,
  },
  {
    value: "friends" as const,
    label: "Friends",
    description: "Share with friend tier members",
    backendScope: "all_supporters" as const,
  },
  {
    value: "community_groups" as const,
    label: "Church/Community Groups",
    description: "Share with community group members",
    backendScope: "group" as const,
  },
  {
    value: "custom" as const,
    label: "Custom",
    description: "Select specific people individually",
    backendScope: "custom" as const,
  },
] as const;

export type VisibilityPreset = typeof VISIBILITY_PRESETS[number]["value"];
export type BackendVisibilityScope = "all_supporters" | "group" | "custom" | "role" | "private";

