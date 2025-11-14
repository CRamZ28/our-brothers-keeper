import { Step } from "react-joyride";
import React from "react";

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  scope: "household" | "feature" | "help";
  roleAccess: string[];
}

export const TOUR_CONFIGS: Record<string, TourConfig> = {
  "household.setup.v1": {
    id: "household.setup.v1",
    name: "Household Setup",
    description: "Complete setup for your household including settings, people, and first features",
    scope: "household",
    roleAccess: ["primary"],
    steps: [
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Welcome to Our Brother's Keeper"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "You have complete control of your household. This quick tour will show you:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Dashboard personalization"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Managing your supporter community"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Privacy controls"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Admin delegation options")
          )
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="settings-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Settings Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "This is your control center for household customization:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Dashboard Personalization:"), " Customize what supporters see"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Display Area:"), " Add photos, quotes, or memories"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Access Control:"), " Delegate admin roles")
          )
        ),
        placement: "right",
      },
      {
        target: '[data-tour="dashboard-personalization-settings"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Dashboard Personalization"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Customize your dashboard with:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Memorial Subtitle:"), " Optional 'In Loving Memory of...' display with dates"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Custom Message:"), " Personal welcome message (500 characters)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Both are completely optional - use what feels right for your family")
          ),
          React.createElement("p", { style: { marginTop: "12px", fontSize: "14px", fontStyle: "italic", color: "#6b7280" } }, "Your custom message appears in the 'Recent Updates' card when no announcements are available.")
        ),
        placement: "top",
      },
      {
        target: '[data-tour="dashboard-display-settings"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Dashboard Display Area"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Choose what appears at the top of your dashboard:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Single Photo or Photo Slideshow (3-5 images)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Memorial Quote"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Featured Memory from the Memory Wall"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "None (clean, minimal layout)")
          )
        ),
        placement: "top",
      },
      {
        target: '[data-tour="people-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "People Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Manage your supporter community:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Review and approve tier upgrade requests"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Create custom groups (e.g., 'Close Family', 'Church Friends')"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "View all supporters organized by access level"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Anyone can invite new supporters")
          )
        ),
        placement: "right",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Controls"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Every time you create content (needs, events, updates), you decide who sees it:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Everyone:"), " All supporters (any tier)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Specific Groups:"), " Only your selected groups"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Custom:"), " Hand-pick individual people")
          )
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Admin Delegation"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Managing everything during difficult times can be overwhelming. You can delegate responsibilities:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Admins can create content on your behalf"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "They can approve access requests"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "You retain full control and can remove admin access anytime")
          ),
          React.createElement("p", { style: { marginTop: "12px", fontSize: "14px", fontStyle: "italic", color: "#6b7280" } }, "Configure admin delegation in Settings → Access Control")
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "You're All Set!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Quick reference for key features:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Dashboard:"), " Recent Updates card shows latest announcements"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Settings:"), " Personalize dashboard & delegate admins"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "People:"), " Manage groups & tier requests"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Help (?)"), " icons throughout the app")
          )
        ),
        placement: "center",
      },
    ],
  },
};

export const getTourById = (tourId: string): TourConfig | undefined => {
  return TOUR_CONFIGS[tourId];
};

export const getToursByScope = (scope: "household" | "feature" | "help"): TourConfig[] => {
  return Object.values(TOUR_CONFIGS).filter((tour) => tour.scope === scope);
};
