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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
        {/* Header */}
        <header className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-10 h-10 rounded" />}
              <span className="text-xl font-semibold">{APP_TITLE}</span>
            </div>
            <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 container flex items-center">
          <div className="max-w-4xl mx-auto text-center space-y-8 py-20">
            <div className="space-y-4">
              <p className="text-2xl italic text-muted-foreground mb-2">
                "Carry each other's burdens, and in this way you will fulfill the law of Christ"
              </p>
              <p className="text-lg text-muted-foreground">
                — Galatians 6:2
              </p>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A compassionate platform that helps families and communities provide sustained,
                meaningful support to those who have lost a loved one.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => (window.location.href = getLoginUrl())}
                className="text-lg px-8"
              >
                Get Started
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-16 text-left">
              <Card>
                <CardHeader>
                  <Heart className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Needs Board</CardTitle>
                  <CardDescription>
                    Transform vague offers of help into concrete actions. Supporters can claim
                    meals, rides, errands, and more.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Shared Calendar</CardTitle>
                  <CardDescription>
                    Keep everyone informed about important events and milestones. Support doesn't
                    fade when the community stays connected.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Privacy First</CardTitle>
                  <CardDescription>
                    You control who sees what. Create custom groups and set visibility for every
                    item you share.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageCircle className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Gentle Reminders</CardTitle>
                  <CardDescription>
                    Automated touchpoints help supporters stay present over time, without
                    overwhelming anyone.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container py-6 border-t">
          <p className="text-center text-sm text-muted-foreground">
            Built with compassion for families in their time of need.
          </p>
        </footer>
      </div>
    );
  }

  // Authenticated but no household - redirect to onboarding
  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome to {APP_TITLE}</CardTitle>
            <CardDescription>Let's set up your support network</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding">
              <Button className="w-full">Get Started</Button>
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

