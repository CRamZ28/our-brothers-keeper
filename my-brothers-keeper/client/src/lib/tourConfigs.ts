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
    name: "Primary User Guide",
    description: "Master privacy controls, access tiers, admin delegation, and dashboard customization",
    scope: "household",
    roleAccess: ["primary"],
    steps: [
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Welcome, Primary User!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "You have complete control of this household. Let's cover your 4 key powers:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Approve access tier requests"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Create groups & control privacy"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Delegate admin responsibilities"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Customize dashboard display")
          )
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="people-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "People Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "This is where you manage your supporter community and privacy controls."),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Approve/deny tier upgrade requests"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Create custom groups (e.g., 'Close Family')"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "View all supporters by tier level")
          )
        ),
        placement: "right",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Settings Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Two critical sections for household management:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Dashboard Display:"), " Choose what supporters see first"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Access Control:"), " Rename tier labels & delegate admins")
          )
        ),
        placement: "right",
      },
      {
        target: '[data-tour="dashboard-display-settings"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Dashboard Display Options"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Choose what appears at the top of your household page:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Single Photo or Photo Slideshow (3-5 images)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Memorial Quote"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Featured Memory (coming soon)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "None (clean layout)")
          )
        ),
        placement: "top",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Controls"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Every time you create content, you decide who has access to view it:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Everyone:"), " All supporters (any tier)"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Specific Groups:"), " Only selected groups"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Custom:"), " Hand-pick individual people")
          )
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Admin Delegation"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Sometimes managing everything can become overwhelming during tough times. That's why we've designed a co-managed admin system to lighten your load:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, "Admins can step in and share the workload"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "They can take over completely until you're ready"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, "You have full control to delegate responsibilities")
          )
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "You're All Set!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Quick reference for key locations:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px", listStyleType: "'• '" } },
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "People:"), " Tier requests & groups"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Settings:"), " Dashboard & admin delegation"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Privacy:"), " Available on every post"),
            React.createElement("li", { style: { paddingLeft: "8px" } }, React.createElement("strong", null, "Help (?)"), " icons throughout the app")
          )
        ),
        placement: "center",
      },
    ],
  },

  "supporter.welcome.v1": {
    id: "supporter.welcome.v1",
    name: "Community Member Guide",
    description: "Understand access tiers and how to request Friend or Family status for more visibility",
    scope: "household",
    roleAccess: ["supporter"],
    steps: [
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Welcome, Community Member!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "You're starting at the Community tier with basic access. Let's explore the tier system:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, React.createElement("strong", null, "Community (you):"), " See public content"),
            React.createElement("li", null, React.createElement("strong", null, "Friend:"), " See more private needs & events"),
            React.createElement("li", null, React.createElement("strong", null, "Family:"), " See nearly everything")
          )
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "How Tiers Work"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "The Primary user controls tier access to protect privacy:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Request upgrades when you're ready"),
            React.createElement("li", null, "Primary/Admin reviews and approves"),
            React.createElement("li", null, "You'll be notified of the decision")
          )
        ),
        placement: "center",
      },
      {
        target: '[data-tour="people-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "People Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "View the supporter community:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "See your current tier status"),
            React.createElement("li", null, "View other supporters"),
            React.createElement("li", null, "Understand the access hierarchy")
          )
        ),
        placement: "right",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Request Tier Upgrade"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Ready for more access?"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Go to Settings → Access Tier Request"),
            React.createElement("li", null, "Explain why you'd like more access"),
            React.createElement("li", null, "Primary/Admin will review your request")
          )
        ),
        placement: "right",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "What Unlocks With Upgrades"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Higher tiers give you access to:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Private needs & events"),
            React.createElement("li", null, "Personal family updates"),
            React.createElement("li", null, "More opportunities to help")
          )
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Start Helping Now!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Even as Community tier, you can:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Claim public needs"),
            React.createElement("li", null, "RSVP to events"),
            React.createElement("li", null, "Show your support")
          ),
          React.createElement("p", { style: { marginTop: "12px", fontSize: "14px", fontStyle: "italic" } }, "Your support means everything to this family!")
        ),
        placement: "center",
      },
    ],
  },

  "admin.guide.v1": {
    id: "admin.guide.v1",
    name: "Admin User Guide",
    description: "Learn to create content on behalf of primary, approve tier requests, and manage privacy",
    scope: "household",
    roleAccess: ["admin"],
    steps: [
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Welcome, Admin!"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "The Primary has trusted you to help manage this community. Your key responsibilities:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Create needs/events on their behalf"),
            React.createElement("li", null, "Approve access tier requests"),
            React.createElement("li", null, "Manage privacy controls")
          )
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="people-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "People Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Manage the supporter community:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Review tier upgrade requests"),
            React.createElement("li", null, "Approve/deny Community → Friend/Family"),
            React.createElement("li", null, "View groups created by Primary")
          )
        ),
        placement: "right",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Creating On Behalf"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "When you post content, it appears as from the household:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Posts show household name, not yours"),
            React.createElement("li", null, "You're helping the Primary communicate"),
            React.createElement("li", null, "All content types available to you")
          )
        ),
        placement: "center",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Controls"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Protect the family's privacy when creating content:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, React.createElement("strong", null, "Everyone:"), " All supporters can see"),
            React.createElement("li", null, React.createElement("strong", null, "Specific Groups:"), " Only selected groups"),
            React.createElement("li", null, React.createElement("strong", null, "Custom:"), " Hand-pick individuals")
          )
        ),
        placement: "center",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Settings Page"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "What you can and can't do here:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Manage your notification preferences"),
            React.createElement("li", null, "Dashboard customization is Primary-only"),
            React.createElement("li", null, "Primary can remove your admin role here")
          )
        ),
        placement: "right",
      },
      {
        target: "body",
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Your Impact"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "You're making a difference during a difficult time:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Lightening the load for the Primary"),
            React.createElement("li", null, "Helping coordinate community support"),
            React.createElement("li", null, "Primary retains final control")
          ),
          React.createElement("p", { style: { marginTop: "12px", fontSize: "14px", fontStyle: "italic" } }, "Thank you for stepping up!")
        ),
        placement: "center",
      },
    ],
  },

  "needs.board.v1": {
    id: "needs.board.v1",
    name: "Needs Board Tour",
    description: "Learn how to create and manage needs",
    scope: "feature",
    roleAccess: ["admin", "primary", "supporter"],
    steps: [
      {
        target: '[data-tour="create-need-button"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Create a Need"),
          React.createElement("p", { style: { marginBottom: "12px" } }, "Post what help you need and when:"),
          React.createElement("ul", { style: { margin: "0", paddingLeft: "20px" } },
            React.createElement("li", null, "Specify what you need"),
            React.createElement("li", null, "Set the date/time"),
            React.createElement("li", null, "Control who can see it")
          )
        ),
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="need-category"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Categories"),
          React.createElement("p", null, "Choose a category to help supporters find the right match: Meals, Rides, Errands, Childcare, etc.")
        ),
        placement: "right",
      },
      {
        target: '[data-tour="visibility-control"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Control"),
          React.createElement("p", null, "Choose who can see this need: Everyone, Specific Groups, or Custom selection.")
        ),
        placement: "right",
      },
      {
        target: '[data-tour="need-card"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Need Cards"),
          React.createElement("p", null, "Once posted, needs appear as cards. Supporters claim them, and you'll receive notifications.")
        ),
        placement: "top",
      },
    ],
  },

  "meal.train.v1": {
    id: "meal.train.v1",
    name: "Meal Train Tour",
    description: "Set up and manage meal coordination",
    scope: "feature",
    roleAccess: ["admin", "primary", "supporter"],
    steps: [
      {
        target: '[data-tour="meal-train-calendar"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Meal Train Calendar"),
          React.createElement("p", null, "This calendar shows all meal train dates. Days are color-coded to show availability.")
        ),
        placement: "top",
        disableBeacon: true,
      },
      {
        target: '[data-tour="meal-train-settings"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Configure Settings"),
          React.createElement("p", null, "Set up meal train: start date, days to avoid, dietary preferences, and delivery details.")
        ),
        placement: "left",
      },
      {
        target: '[data-tour="meal-signup"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Sign Up for Meals"),
          React.createElement("p", null, "Click any available date to sign up. View dietary preferences and delivery details.")
        ),
        placement: "top",
      },
      {
        target: '[data-tour="meal-visibility"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Control"),
          React.createElement("p", null, "Control who can see the meal train and delivery location.")
        ),
        placement: "right",
      },
    ],
  },

  "events.calendar.v1": {
    id: "events.calendar.v1",
    name: "Events Calendar Tour",
    description: "Schedule and coordinate events",
    scope: "feature",
    roleAccess: ["admin", "primary", "supporter"],
    steps: [
      {
        target: '[data-tour="create-event-button"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Create Events"),
          React.createElement("p", null, "Schedule gatherings, milestones, or important dates for your community.")
        ),
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="important-dates"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Important Dates"),
          React.createElement("p", null, "Admin/Primary only: Track recurring dates like birthdays and anniversaries.")
        ),
        placement: "right",
      },
      {
        target: '[data-tour="event-rsvp"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "RSVP System"),
          React.createElement("p", null, "Supporters can RSVP to help you plan attendance and coordinate details.")
        ),
        placement: "top",
      },
      {
        target: '[data-tour="event-visibility"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Privacy Control"),
          React.createElement("p", null, "Control who sees each event using visibility settings.")
        ),
        placement: "right",
      },
    ],
  },

  "gift.registry.v1": {
    id: "gift.registry.v1",
    name: "Gift Registry Tour",
    description: "Create and manage your wishlist",
    scope: "feature",
    roleAccess: ["admin", "primary", "supporter"],
    steps: [
      {
        target: '[data-tour="add-gift-button"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Add Gift Items"),
          React.createElement("p", null, "Add items your household needs or would appreciate from supporters.")
        ),
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="gift-priority"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Priority Levels"),
          React.createElement("p", null, "Set priority (Low, Normal, Urgent) to help supporters know what's most needed.")
        ),
        placement: "right",
      },
      {
        target: '[data-tour="gift-status"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Track Status"),
          React.createElement("p", null, "Track progress: Needed → Purchased → Received. Prevents duplicate purchases.")
        ),
        placement: "top",
      },
      {
        target: '[data-tour="gift-url"]',
        content: React.createElement("div", null,
          React.createElement("strong", { style: { fontSize: "16px", display: "block", marginBottom: "8px" } }, "Product Links"),
          React.createElement("p", null, "Add product URLs so supporters can easily find and purchase the exact item.")
        ),
        placement: "right",
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
