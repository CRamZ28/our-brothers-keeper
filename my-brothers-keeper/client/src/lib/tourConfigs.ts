import { Step } from "react-joyride";

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
        content: "Welcome! As Primary, you control everything. Let's cover the 4 key powers: Access Tiers, Groups & Privacy, Admin Delegation, and Dashboard Customization.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="people-nav"]',
        content: "People page: Access Tier Requests appear here (when supporters request Friend or Family status). You approve or deny these requests. Create custom Groups here (like 'Close Family' or 'Church Friends') for organizing privacy.",
        placement: "right",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Settings page: Two critical sections here - Dashboard Display (customize what supporters see) and Access Control (rename tier labels like 'Community'/'Friend'/'Family' to whatever fits your situation, and delegate admin powers to trusted helpers).",
        placement: "right",
      },
      {
        target: '[data-tour="dashboard-display-settings"]',
        content: "Dashboard Display: Choose what appears at the top - None, Single Photo, Photo Slideshow (3-5 photos), Memorial Quote, or Featured Memory (coming soon). This is what supporters see first when they visit.",
        placement: "top",
      },
      {
        target: "body",
        content: "Privacy Controls Everywhere: When you create a Need, Event, or Update, you choose who sees it: 'Everyone' (all supporters), 'Specific Groups' (like 'Family' group), or 'Custom' (hand-pick individuals). Complete privacy control.",
        placement: "center",
      },
      {
        target: "body",
        content: "Admin Delegation: Assign trusted people as 'Admins' in Settings → Access Control. They can create needs/events on your behalf, but you stay in control. Remove admin access anytime if you're ready to take over fully.",
        placement: "center",
      },
      {
        target: "body",
        content: "You're set! Key locations: People page (tier requests & groups), Settings (dashboard & admin control), Privacy dropdowns (on every post). The (?) help icons explain details throughout the app.",
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
        content: "Welcome! You're a 'Community' member - the starting tier with basic access. Higher tiers (Friend, Family) see more private content. Let me show you how the system works and how to request an upgrade.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "body",
        content: "Access Tier System: Community (you) → sees public content. Friend → sees more private needs/events. Family → sees nearly everything. The Primary user controls who gets upgraded to protect the family's privacy.",
        placement: "center",
      },
      {
        target: '[data-tour="people-nav"]',
        content: "People page: Click here to see your current tier status and the household's supporter community. This page shows you where you stand in the access hierarchy.",
        placement: "right",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Settings page: To request Friend or Family tier, go to Settings → Access Tier Request. Explain why you'd like more access. The Primary or Admin will review and approve/deny.",
        placement: "right",
      },
      {
        target: "body",
        content: "What Changes When Upgraded: Higher tiers unlock private needs, events, and updates the family shares only with trusted supporters. You'll get notified when your request is approved.",
        placement: "center",
      },
      {
        target: "body",
        content: "Start helping now! As Community, you can still claim public needs and RSVP to events. Request a tier upgrade when you feel ready to be more involved. Your support means everything to this family!",
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
        content: "Welcome, Admin! The Primary has trusted you to help manage this community. You can create needs/events on their behalf, approve access requests, and use all privacy controls. Let's cover your key responsibilities.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="people-nav"]',
        content: "People page: Access Tier Requests appear here. You can approve Community members requesting Friend or Family status. You'll also see the Groups the Primary created for organizing privacy.",
        placement: "right",
      },
      {
        target: "body",
        content: "Creating on Behalf: When you post a Need, Event, or Update, it appears as coming from the household - not from you personally. You're helping the Primary share their needs with the community.",
        placement: "center",
      },
      {
        target: "body",
        content: "Privacy Controls: Every time you create content, choose visibility: 'Everyone' (all supporters), 'Specific Groups' (like 'Family' group), or 'Custom' (individual selection). Protect the family's privacy carefully.",
        placement: "center",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Settings: Dashboard customization is Primary-only, but you can manage your own notifications here. The Primary can remove your admin role in Settings → Access Control if they're ready to take over.",
        placement: "right",
      },
      {
        target: "body",
        content: "Your Impact: You're lightening the load during a difficult time. The Primary retains final control but your help managing the community is invaluable. Thank you for stepping up!",
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
        content: "Click here to create a new need. You can specify what help you need, when, and who can see it.",
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="need-category"]',
        content: "Choose a category like Meals, Rides, Errands, or Childcare to help supporters find the right match.",
        placement: "right",
      },
      {
        target: '[data-tour="visibility-control"]',
        content: "Control who can see this need: Everyone, Specific Groups, or Custom people selection.",
        placement: "right",
      },
      {
        target: '[data-tour="need-card"]',
        content: "Once posted, needs appear as cards. Supporters can claim them, and you'll receive notifications.",
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
        content: "This calendar shows all meal train dates. Days are color-coded to show availability.",
        placement: "top",
        disableBeacon: true,
      },
      {
        target: '[data-tour="meal-train-settings"]',
        content: "Configure meal train settings like start date, days to avoid, and dietary preferences.",
        placement: "left",
      },
      {
        target: '[data-tour="meal-signup"]',
        content: "Click any available date to sign up for providing a meal. You can see dietary preferences and delivery details.",
        placement: "top",
      },
      {
        target: '[data-tour="meal-visibility"]',
        content: "Control who can see the meal train and delivery location using visibility settings.",
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
        content: "Create events for gatherings, milestones, or important dates your community should know about.",
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="important-dates"]',
        content: "Important Dates feature (admin/primary only) lets you track recurring dates like birthdays and anniversaries.",
        placement: "right",
      },
      {
        target: '[data-tour="event-rsvp"]',
        content: "Supporters can RSVP to events, helping you plan attendance and coordinate details.",
        placement: "top",
      },
      {
        target: '[data-tour="event-visibility"]',
        content: "Like other features, you can control who sees each event using visibility settings.",
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
        content: "Add items to your gift registry - these are things your household needs or would appreciate.",
        placement: "bottom",
        disableBeacon: true,
      },
      {
        target: '[data-tour="gift-priority"]',
        content: "Set priority levels (Low, Normal, Urgent) to help supporters know what's most needed.",
        placement: "right",
      },
      {
        target: '[data-tour="gift-status"]',
        content: "Track gift status: Needed → Purchased → Received. This prevents duplicate purchases.",
        placement: "top",
      },
      {
        target: '[data-tour="gift-url"]',
        content: "Add product links so supporters can easily find and purchase the exact item.",
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
