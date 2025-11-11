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
    name: "Household Setup",
    description: "Complete setup for your household including settings, people, and first features",
    scope: "household",
    roleAccess: ["admin", "primary"],
    steps: [
      {
        target: "body",
        content: "Welcome to Our Brother's Keeper! Let's get you started with a quick tour of the essential features.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="dashboard"]',
        content: "This is your Dashboard - the heart of your support community. Here you'll see an overview of open needs, upcoming events, and your supporters.",
        placement: "bottom",
      },
      {
        target: '[data-tour="settings-nav"]',
        content: "Click Settings to customize your household information, notification preferences, and dashboard display.",
        placement: "right",
      },
      {
        target: '[data-tour="people-nav"]',
        content: "The People page lets you manage your supporters, create groups for easy organization, and handle access tier requests.",
        placement: "right",
      },
      {
        target: '[data-tour="needs-nav"]',
        content: "The Needs Board is where you can post specific ways your community can help - meals, rides, errands, and more.",
        placement: "right",
      },
      {
        target: "body",
        content: "You're all set! Take your time exploring. You can always access help icons throughout the app or replay this tour from Settings.",
        placement: "center",
      },
    ],
  },

  "supporter.welcome.v1": {
    id: "supporter.welcome.v1",
    name: "Supporter Welcome",
    description: "Get started as a supporter and learn how to help",
    scope: "household",
    roleAccess: ["supporter"],
    steps: [
      {
        target: "body",
        content: "Welcome! Thank you for joining this support community. Let's show you how you can help.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="dashboard"]',
        content: "Your Dashboard shows open needs and upcoming events you can help with.",
        placement: "bottom",
      },
      {
        target: '[data-tour="needs-nav"]',
        content: "Browse the Needs Board to find ways to help - you can claim needs that match your availability.",
        placement: "right",
      },
      {
        target: '[data-tour="events-nav"]',
        content: "Check Events to see gatherings and important dates. RSVP to let the family know you'll be there.",
        placement: "right",
      },
      {
        target: '[data-tour="meal-train-nav"]',
        content: "The Meal Train lets you sign up to provide meals on specific days.",
        placement: "right",
      },
      {
        target: "body",
        content: "That's it! Your support means the world. Look for help icons (?) throughout the app for feature-specific guidance.",
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
