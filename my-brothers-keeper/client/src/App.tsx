import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import People from "./pages/People";
import Needs from "./pages/Needs";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import AcceptInvite from "./pages/AcceptInvite";
import AdminTools from "./pages/AdminTools";
import Updates from "./pages/Updates";
import MealTrain from "./pages/MealTrain";
import MemoryWall from "./pages/MemoryWall";
import GiftRegistry from "./pages/GiftRegistry";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/people"} component={People} />
      <Route path={"/needs"} component={Needs} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/meal-train"} component={MealTrain} />
      <Route path={"/memory-wall"} component={MemoryWall} />
      <Route path={"/gift-registry"} component={GiftRegistry} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/invite/:token"} component={AcceptInvite} />
      <Route path={"/admin"} component={AdminTools} />
      <Route path={"/updates"} component={Updates} />
      <Route path={"/404"} component={NotFound} />
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
