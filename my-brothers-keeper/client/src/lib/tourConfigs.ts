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
    description: "Learn how to manage your support network, control privacy, delegate to admins, and customize your dashboard",
    scope: "household",
    roleAccess: ["primary"],
    steps: [
      {
        target: "body",
        content: "Welcome! As the Primary User, you have full control over your support community. Let me show you the key features that give you privacy, flexibility, and control.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Settings is your control center. This is where you'll find Dashboard Customization (photos, quotes, slideshows), Access Tier Requests from supporters, and options to delegate control to Admins.",
        placement: "right",
      },
      {
        target: '[data-tour="people-nav"]',
        content: "The People page is crucial! Here you'll: 1) See access tier requests (Community → Friend or Family), 2) Create custom groups for organizing supporters, and 3) Manage who has access to what.",
        placement: "right",
      },
      {
        target: "body",
        content: "Understanding Access Tiers: Everyone starts as 'Community' (least access). They can request 'Friend' or 'Family' status for more visibility. You can rename these tiers to anything you want - they're just labels for organizing privacy levels.",
        placement: "center",
      },
      {
        target: "body",
        content: "Groups & Privacy: On the People page, you create custom groups (like 'Church Friends' or 'Close Family'). When you post Needs, Events, or Updates, you choose: 'Everyone', 'Specific Groups', or 'Custom people'. This gives you complete privacy control.",
        placement: "center",
      },
      {
        target: '[data-tour="dashboard"]',
        content: "Dashboard Customization: In Settings, you can choose what supporters see here - a family photo, rotating slideshow, inspirational quote, or nothing at all. It's your space to personalize.",
        placement: "bottom",
      },
      {
        target: "body",
        content: "Primary vs Admin: You can assign trusted supporters as 'Admins' to help create needs, events, and manage the community. Admins create content 'on your behalf' but you always have final control. Remove admin access anytime in Settings → Access Control.",
        placement: "center",
      },
      {
        target: "body",
        content: "You're in control! Remember: Access requests appear in Settings and People, Groups are created in People, and Privacy controls are on every Need/Event/Update you create. Questions? Look for (?) help icons throughout.",
        placement: "center",
      },
    ],
  },

  "supporter.welcome.v1": {
    id: "supporter.welcome.v1",
    name: "Community Member Guide",
    description: "Learn about access tiers and how to request Friend or Family status for more visibility",
    scope: "household",
    roleAccess: ["supporter"],
    steps: [
      {
        target: "body",
        content: "Welcome! You've joined as a 'Community' member - the default tier with basic access. Let me explain how you can gain more access to help this family.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "body",
        content: "Understanding Access Tiers: There are 3 levels - Community (you), Friend, and Family. Higher tiers see more content (private needs, events, updates). The family controls who gets upgraded for their privacy.",
        placement: "center",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "To request Friend or Family access, go to Settings → Access Tier Request. Explain why you'd like more access, and the Primary user or Admin will review your request.",
        placement: "right",
      },
      {
        target: '[data-tour="people-nav"]',
        content: "You can also see your tier status on the People page. Once approved for Friend or Family, you'll see more needs, events, and updates that were previously hidden.",
        placement: "right",
      },
      {
        target: '[data-tour="needs-nav"]',
        content: "As Community, you can already claim public needs. Higher tiers unlock private needs that the family shares only with trusted supporters.",
        placement: "right",
      },
      {
        target: "body",
        content: "That's it! Request a tier upgrade when you're ready. Until then, browse what's available and help where you can. Your support means everything!",
        placement: "center",
      },
    ],
  },

  "admin.guide.v1": {
    id: "admin.guide.v1",
    name: "Admin User Guide",
    description: "Learn how to create content on behalf of the primary user and manage the support community",
    scope: "household",
    roleAccess: ["admin"],
    steps: [
      {
        target: "body",
        content: "Welcome, Admin! The Primary user has trusted you to help manage this support community. You can create needs, events, and updates on behalf of the family.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Settings is where Access Tier Requests appear. You and the Primary user can both approve Community members requesting Friend or Family status.",
        placement: "right",
      },
      {
        target: '[data-tour="people-nav"]',
        content: "On the People page, you can: 1) Review access tier requests, 2) See custom groups the Primary created, and 3) Manage supporters. Groups help organize privacy when creating content.",
        placement: "right",
      },
      {
        target: "body",
        content: "Creating on Behalf: When you post a Need, Event, or Update, it appears as coming from the household - you're helping the Primary manage their community. They always have final control.",
        placement: "center",
      },
      {
        target: "body",
        content: "Privacy Controls: Just like Primary, you choose who sees each post: 'Everyone' (all supporters), 'Specific Groups' (custom groups), or 'Custom' (hand-pick individuals). Use these to protect the family's privacy.",
        placement: "center",
      },
      {
        target: '[data-tour="dashboard"]',
        content: "Dashboard settings are controlled by the Primary user. They can customize what appears here - photos, quotes, or nothing - in Settings.",
        placement: "bottom",
      },
      {
        target: "body",
        content: "Your role matters! You're helping lighten the load while the Primary adjusts. They can remove admin access anytime, but your support makes a real difference.",
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
