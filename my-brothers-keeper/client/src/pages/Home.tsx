import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Calendar, Users, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: household, isLoading: householdLoading } = trpc.household.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Show loading state
  if (loading || householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Gradient Background with organic shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950" />
        
        {/* Subtle animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000" />

        <div className="relative z-10">
          {/* Header with glassmorphism */}
          <header className="container py-6">
            <div className="flex items-center justify-between backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-10 h-10 rounded-lg shadow-md" />}
                <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 bg-clip-text text-transparent">{APP_TITLE}</span>
              </div>
              <Button 
                onClick={() => (window.location.href = getLoginUrl())}
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 container flex items-center">
            <div className="max-w-4xl mx-auto text-center space-y-12 py-20">
              <div className="space-y-6">
                {/* Enhanced Quote with better typography */}
                <p className="text-3xl md:text-4xl lg:text-5xl italic font-light text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  "Carry each other's burdens, and in this way you will fulfill the law of Christ"
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                  — Galatians 6:2
                </p>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed pt-4">
                  A compassionate platform that helps families and communities provide sustained,
                  meaningful support to those who have lost a loved one.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="text-lg px-10 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                >
                  Get Started
                </Button>
              </div>

              {/* Features Grid with Glassmorphism */}
              <div className="grid md:grid-cols-2 gap-6 mt-20 text-left">
                {/* Feature 1: Needs Board */}
                <div className="group backdrop-blur-lg bg-white/40 dark:bg-gray-900/40 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-900/60 cursor-pointer">
                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Needs Board</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Transform vague offers of help into concrete actions. Supporters can claim
                    meals, rides, errands, and more.
                  </p>
                </div>

                {/* Feature 2: Shared Calendar */}
                <div className="group backdrop-blur-lg bg-white/40 dark:bg-gray-900/40 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-900/60 cursor-pointer">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Shared Calendar</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Keep everyone informed about important events and milestones. Support doesn't
                    fade when the community stays connected.
                  </p>
                </div>

                {/* Feature 3: Privacy First */}
                <div className="group backdrop-blur-lg bg-white/40 dark:bg-gray-900/40 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-900/60 cursor-pointer">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Privacy First</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    You control who sees what. Create custom groups and set visibility for every
                    item you share.
                  </p>
                </div>

                {/* Feature 4: Gentle Reminders */}
                <div className="group backdrop-blur-lg bg-white/40 dark:bg-gray-900/40 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-900/60 cursor-pointer">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Gentle Reminders</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Automated touchpoints help supporters stay present over time, without
                    overwhelming anyone.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="container py-6 backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-t border-white/20">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Built with compassion for families in their time of need.
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // Authenticated but no household - redirect to onboarding
  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950">
        <Card className="max-w-md w-full backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 shadow-2xl border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to {APP_TITLE}</CardTitle>
            <CardDescription className="text-base">Let's set up your support network</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding">
              <Button className="w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated with household - redirect to dashboard
  window.location.href = "/dashboard";
  return null;
}
