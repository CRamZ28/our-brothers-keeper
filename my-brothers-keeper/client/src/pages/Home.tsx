import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Calendar, UtensilsCrossed, MessageCircle, BookHeart, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: household, isLoading: householdLoading } = trpc.household.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Show loading state
  if (loading || householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="animate-pulse text-teal-600 text-lg">Loading...</div>
      </div>
    );
  }

  // If authenticated and has household, redirect to dashboard
  if (isAuthenticated && household) {
    window.location.href = "/dashboard";
    return null;
  }

  // If authenticated but no household, redirect to setup
  if (isAuthenticated && !household) {
    window.location.href = "/setup";
    return null;
  }

  // Not authenticated - show landing page
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: 'url(/waves-bg.png)' }}
    >
      {/* Subtle decorative orbs for depth */}
      <div className="fixed top-[10%] right-[15%] w-[500px] h-[500px] bg-teal-300/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[15%] left-[10%] w-[600px] h-[600px] bg-cyan-200/25 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 md:px-10 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/obk-emblem.png" 
                alt={APP_TITLE} 
                className="h-12 w-12 md:h-14 md:w-14"
              />
              <h1 
                className="text-xl md:text-2xl font-bold text-white tracking-wide"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Our Brother's Keeper
              </h1>
            </div>
            <Button 
              onClick={() => (window.location.href = "/api/login")}
              className="bg-[#B08CA7] hover:bg-[#9d7a94] text-white font-semibold px-6 shadow-lg"
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            {/* Hero Content - Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
              {/* Left Column - Value Proposition */}
              <div className="space-y-8">
                <h2 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Support Families Through
                  <span className="text-[#2DB5A8] block mt-2">Difficult Times</span>
                </h2>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                  A compassionate platform that helps families and communities provide sustained, 
                  meaningful support to those who have lost a loved one.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => (window.location.href = "/api/login")}
                    size="lg"
                    className="bg-[#2DB5A8] hover:bg-[#25a89a] text-white font-semibold px-8 py-6 text-lg shadow-xl"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={() => (window.location.href = "/api/login")}
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md font-semibold px-8 py-6 text-lg"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Right Column - Key Benefits */}
              <div 
                className="rounded-3xl p-8 md:p-10 space-y-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Cinzel', serif" }}>
                  Everything You Need
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: Heart, text: "Coordinate support with needs tracking" },
                    { icon: Calendar, text: "Schedule events and important dates" },
                    { icon: UtensilsCrossed, text: "Organize meal trains effortlessly" },
                    { icon: MessageCircle, text: "Share updates with your community" },
                    { icon: BookHeart, text: "Preserve memories together" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="rounded-lg bg-[#2DB5A8] p-2 mt-1">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-white/90 text-lg leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scripture Element - Subtle Supporting Role */}
            <div className="text-center mb-24">
              <p 
                className="text-2xl md:text-3xl italic text-white/80 mb-2"
                style={{ fontFamily: "'Pinyon Script', cursive" }}
              >
                "Carry each other's burdens, and in this way you will fulfill the law of Christ"
              </p>
              <p className="text-sm text-white/60">— Galatians 6:2</p>
            </div>

            {/* Feature Cards - Simplified to 5 Key Features */}
            <div>
              <h3 
                className="text-3xl md:text-4xl font-bold text-white text-center mb-4"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Powerful Features
              </h3>
              <p className="text-lg text-white/80 text-center mb-12 max-w-2xl mx-auto">
                Everything you need to organize community support in one beautiful platform
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Feature 1: Needs Board */}
                <div 
                  className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                    Needs Board
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Post specific needs and let supporters claim tasks. 
                    Track what's needed and who's helping.
                  </p>
                </div>

                {/* Feature 2: Events Calendar */}
                <div 
                  className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-14 h-14 flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                    Events Calendar
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Schedule memorial services, court dates, and family gatherings. 
                    Track RSVPs and important dates.
                  </p>
                </div>

                {/* Feature 3: Meal Train */}
                <div 
                  className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center mb-4">
                    <UtensilsCrossed className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                    Meal Train
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Coordinate meal delivery with scheduling, dietary preferences, 
                    and delivery instructions.
                  </p>
                </div>

                {/* Feature 4: Family Updates */}
                <div 
                  className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-14 h-14 flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                    Family Updates
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Share announcements, milestones, and gratitude. 
                    Keep your community informed and connected.
                  </p>
                </div>

                {/* Feature 5: Memory Wall */}
                <div 
                  className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center mb-4">
                    <BookHeart className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                    Memory Wall
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Create an interactive collage of memories, stories, and photos. 
                    Preserve precious moments together.
                  </p>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mt-24 space-y-6">
              <h3 
                className="text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Ready to Get Started?
              </h3>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Create your family support network today and bring your community together.
              </p>
              <Button 
                onClick={() => (window.location.href = "/api/login")}
                size="lg"
                className="bg-[#2DB5A8] hover:bg-[#25a89a] text-white font-semibold px-12 py-6 text-lg shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-10 py-8 mt-16">
          <div className="max-w-7xl mx-auto text-center text-white/60 text-sm">
            <p>© 2025 Our Brother's Keeper. Supporting families through difficult times.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
