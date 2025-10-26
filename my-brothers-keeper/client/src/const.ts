export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Our Brother's Keeper";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Replit Auth endpoints
export const getLoginUrl = () => "/api/login";
export const getLogoutUrl = () => "/api/logout";

