import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import People from "./pages/People";
import Needs from "./pages/Needs";
import Calendar from "./pages/Calendar";
import FamilyUpdates from "./pages/FamilyUpdates";
import Settings from "./pages/Settings";
import AcceptInvite from "./pages/AcceptInvite";
import AdminTools from "./pages/AdminTools";
import MealTrain from "./pages/MealTrain";
import MemoryWall from "./pages/MemoryWall";
import GiftRegistry from "./pages/GiftRegistry";
import Reminders from "./pages/Reminders";
import JoinHousehold from "./pages/JoinHousehold";
import SearchHousehold from "./pages/SearchHousehold";
import Contact from "./pages/Contact";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/search"} component={SearchHousehold} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/people"} component={People} />
      <Route path={"/needs"} component={Needs} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/family-updates"} component={FamilyUpdates} />
      <Route path={"/messages"}>
        <Redirect to="/family-updates" />
      </Route>
      <Route path={"/updates"}>
        <Redirect to="/family-updates" />
      </Route>
      <Route path={"/meal-train"} component={MealTrain} />
      <Route path={"/memory-wall"} component={MemoryWall} />
      <Route path={"/gift-registry"} component={GiftRegistry} />
      <Route path={"/reminders"} component={Reminders} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/invite/:token"} component={AcceptInvite} />
      <Route path={"/admin"} component={AdminTools} />
      <Route path={"/404"} component={NotFound} />
      {/* Public household join page - must be near end to avoid matching other routes */}
      <Route path={"/:slug"} component={JoinHousehold} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
