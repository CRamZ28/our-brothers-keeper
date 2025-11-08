import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Calendar, Users, MessageCircle, UtensilsCrossed, Bell, Shield, CheckCircle2, UserCog, ArrowRight } from "lucide-react";
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
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />

        <div className="relative z-10">
          {/* Header with glassmorphism */}
          <header className="container py-6">
            <div className="flex items-center justify-between backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3">
                <img 
                  src="/obk-symbol.png" 
                  alt={APP_TITLE} 
                  className="h-12 w-12 drop-shadow-[0_0_16px_rgba(107,196,184,.5)]" 
                />
                <div className="font-bold text-gray-800 dark:text-white leading-tight">
                  <div className="text-base" style={{ fontVariant: 'small-caps' }}>
                    <span className="text-lg" style={{ fontVariant: 'normal' }}>O</span>ur{' '}
                    <span className="text-lg" style={{ fontVariant: 'normal' }}>B</span>rother's{' '}
                    <span className="text-lg" style={{ fontVariant: 'normal' }}>K</span>eeper
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => (window.location.href = "/api/login")}
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(to right, #6BC4B8, #B08CA7)' }}
              >
                Sign In
              </Button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 container">
            <div className="max-w-6xl mx-auto space-y-20 py-12">
              {/* Hero Content */}
              <div className="text-center space-y-8">
                <div className="space-y-6">
                  {/* Enhanced Quote with better typography */}
                  <p className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" style={{ fontFamily: 'Pinyon Script, cursive' }}>
                    "Carry each other's burdens, and in this way you will fulfill the law of Christ"
                  </p>
                  <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                    — Galatians 6:2
                  </p>
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed pt-6">
                    A compassionate platform that helps families and communities provide sustained,
                    meaningful support to those who have lost a loved one.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => (window.location.href = "/api/login")}
                    className="text-lg px-10 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                    style={{ background: 'linear-gradient(to right, #6BC4B8, #B08CA7)' }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>

              {/* Why OBK Section */}
              <div className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 md:p-12 border border-white/20 shadow-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ background: 'linear-gradient(to right, #6BC4B8, #B08CA7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Why Our Brother's Keeper?
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #6BC4B8)' }}>
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Turn Words Into Action</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      When someone says "let me know if you need anything," they mean it. 
                      We make it easy for them to follow through with specific, helpful actions.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #B08CA7)' }}>
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Sustained Support</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Grief doesn't end after the funeral. Our platform helps your community 
                      stay present through the weeks, months, and years ahead.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #B08CA7, #B08CA7)' }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Privacy & Control</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Share what you want, with who you want. Create custom groups and control 
                      visibility for every piece of information you share.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flexible Control Section */}
              <div className="backdrop-blur-lg rounded-2xl p-8 md:p-10 border border-white/20 shadow-xl" style={{ background: 'linear-gradient(to right, rgba(107, 196, 184, 0.15), rgba(176, 140, 167, 0.15))' }}>
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #B08CA7)' }}>
                        <UserCog className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                        You're in Control—Always
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Every family is different. Some people want to manage everything themselves during grief. 
                        Others need to share the load. <span className="font-semibold text-gray-700 dark:text-gray-300">Our Brother's Keeper adapts to you.</span>
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">Handle It Yourself</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              As the primary person, you have complete control over every aspect 
                              of your support network if you prefer to manage it all.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#B08CA7' }} />
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">Delegate to Admins</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Designate trusted family members or friends as admins to help 
                              coordinate care, post updates, and manage the community.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-base text-gray-600 dark:text-gray-400 pt-2">
                        Whatever feels right for your situation, OBK makes it easy. You decide 
                        how much help you want, and you can change it anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Features Section */}
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center" style={{ background: 'linear-gradient(to right, #6BC4B8, #B08CA7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Everything You Need to Coordinate Care
                </h2>
                
                {/* Features Grid with Glassmorphism */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {/* Feature 1: Needs Board */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #6BC4B8)' }}>
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Needs Board</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Post specific needs like grocery shopping, lawn care, childcare, or errands. 
                      Supporters can claim tasks and mark them complete.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Claim and complete tasks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Set custom visibility per need</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Track who's helping with what</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 2: Shared Calendar */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #B08CA7)' }}>
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Shared Calendar</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Keep everyone informed about important dates, memorial services, court dates, 
                      and family gatherings. RSVP tracking included.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>RSVP for events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Control who sees each event</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Add location and details</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 3: Meal Train */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #B08CA7, #B08CA7)' }}>
                      <UtensilsCrossed className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Meal Train</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Coordinate meal delivery with a powerful scheduling system. Select specific days, 
                      set dietary preferences, and manage delivery details.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Select available days for meals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Dietary preferences & allergies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Private delivery instructions</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 4: Messages & Announcements */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #6BC4B8)' }}>
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Messages & Announcements</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Share updates with your support network. Pin important announcements and 
                      attach photos or videos to bring everyone closer.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Pin important updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Upload photos and videos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Private or group messaging</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 5: Updates */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #B08CA7, #B08CA7)' }}>
                      <Bell className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Progress Updates</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Share how you're doing, milestones reached, or just let people know you're thinking of them. 
                      Your supporters want to stay connected.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Share life updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Celebrate small victories</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Keep supporters engaged</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 6: People & Groups */}
                  <div className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #B08CA7)' }}>
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">People & Custom Groups</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      Organize your support network into custom groups like "Inner Circle," "Church Friends," 
                      or "Work Colleagues" for targeted sharing.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Create unlimited groups</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Invite supporters securely</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6BC4B8' }} />
                        <span>Manage roles & permissions</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Notifications Section */}
              <div className="backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl" style={{ background: 'linear-gradient(to right, rgba(107, 196, 184, 0.15), rgba(176, 140, 167, 0.15))' }}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #6BC4B8, #B08CA7)' }}>
                      <Bell className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                      Smart Email Notifications (Optional)
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Stay informed without being overwhelmed. All notifications are opt-in and customizable. 
                      Choose exactly what you want to be notified about—from new needs to upcoming events, 
                      meal signups, messages, and more. You're always in control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center space-y-6 py-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                  Ready to Build Your Support Network?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Join families who are transforming "let me know if you need anything" 
                  into lasting, meaningful support.
                </p>
                <Button
                  size="lg"
                  onClick={() => (window.location.href = "/api/login")}
                  className="text-lg px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #6BC4B8, #B08CA7)' }}
                >
                  Start Your Journey
                </Button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="container py-6 backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border-t border-white/20">
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
