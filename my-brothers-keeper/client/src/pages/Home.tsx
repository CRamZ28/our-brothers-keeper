import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Shield, Clock, Settings, Users, ArrowRight } from "lucide-react";

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
      {/* Darker overlay for improved readability (60-70% opacity) */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.65), rgba(6, 78, 59, 0.45))'
        }}
      ></div>

      {/* Subtle decorative orbs for depth */}
      <div className="fixed top-[10%] right-[15%] w-[500px] h-[500px] bg-teal-300/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[15%] left-[10%] w-[600px] h-[600px] bg-cyan-200/15 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Large Fixed Watermark Logo - Stays with background on scroll */}
      <div 
        className="fixed top-1/2 left-1/2 pointer-events-none"
        style={{
          transform: 'translate(-50%, -50%)',
          opacity: 0.12,
          zIndex: 1
        }}
      >
        <img 
          src="/obk-emblem.png" 
          alt="" 
          className="w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] lg:w-[900px] lg:h-[900px]"
        />
      </div>

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
          <div className="max-w-5xl mx-auto">
            {/* Hero Content - Single Column, Centered */}
            <div className="relative text-center space-y-8 mb-24 md:mb-32">
              <h2 
                className="relative text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Cinzel', serif", zIndex: 10 }}
              >
                A Place Where Compassion
                <span className="text-[#2DB5A8] block mt-3">Becomes Action</span>
              </h2>
              <div className="relative space-y-6 max-w-3xl mx-auto" style={{ zIndex: 10 }}>
                <p 
                  className="text-xl md:text-2xl text-white leading-relaxed"
                  style={{ lineHeight: 1.6 }}
                >
                  Compassion, organized into support that truly lasts.
                  <br />
                  People want to help—they just need direction.
                </p>
                <p 
                  className="text-xl md:text-2xl text-white leading-relaxed"
                  style={{ lineHeight: 1.6 }}
                >
                  OBK turns care into something simple, structured, and sustainable so grieving families feel supported through every stage of loss.
                </p>
              </div>
              <div className="relative pt-4" style={{ zIndex: 10 }}>
                <Button 
                  onClick={() => (window.location.href = "/api/login")}
                  size="lg"
                  className="bg-[#2DB5A8] hover:bg-[#25a89a] text-white font-semibold px-12 py-7 text-xl shadow-2xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Why Our Brother's Keeper - Three Differentiators */}
            <div className="mb-24 md:mb-32">
              <h3 
                className="text-5xl md:text-6xl font-bold text-center mb-6"
                style={{ 
                  fontFamily: "'Cinzel', serif", 
                  color: '#E5D5E1',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                Why Our Brother's Keeper
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8 md:gap-10 mt-16">
                {/* Differentiator 1: Turn Words Into Action */}
                <div 
                  className="rounded-3xl p-10 space-y-5 animate-fade-in-up"
                  style={{
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    animationDelay: '0.1s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-2">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                    Turn Words Into Action
                  </h4>
                  <p className="text-lg text-white/95 font-medium">
                    Transform "Let me know if you need anything" into real help.
                  </p>
                  <ul className="space-y-3 text-white/90 text-base">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Give helpers specific, actionable tasks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Match support to your actual needs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Turn kind words into meaningful action</span>
                    </li>
                  </ul>
                </div>

                {/* Differentiator 2: Sustained Support */}
                <div 
                  className="rounded-3xl p-10 space-y-5 animate-fade-in-up"
                  style={{
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    animationDelay: '0.2s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-16 h-16 flex items-center justify-center mb-2">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                    Sustained Support
                  </h4>
                  <p className="text-lg text-white/95 font-medium">
                    Grief doesn't follow a timeline—and neither does our support.
                  </p>
                  <ul className="space-y-3 text-white/90 text-base">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#B08CA7]">•</span>
                      <span>Community stays present weeks, months, years later</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#B08CA7]">•</span>
                      <span>Coordinate help beyond the first few weeks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#B08CA7]">•</span>
                      <span>Build lasting support that matches the healing journey</span>
                    </li>
                  </ul>
                </div>

                {/* Differentiator 3: Privacy & Control */}
                <div 
                  className="rounded-3xl p-10 space-y-5 animate-fade-in-up"
                  style={{
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    animationDelay: '0.3s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-2">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                    Privacy & Control
                  </h4>
                  <p className="text-lg text-white/95 font-medium">
                    Share only what you want, with exactly who you choose.
                  </p>
                  <ul className="space-y-3 text-white/90 text-base">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Create custom supporter groups</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Control visibility for every post and update</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-[#2DB5A8]">•</span>
                      <span>Keep full control of your family's space</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* You're in Control - Always */}
            <div className="mb-24 md:mb-32">
              <h3 
                className="text-4xl md:text-5xl font-bold text-white text-center mb-6"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                You're in Control—Always
              </h3>
              <p className="text-xl text-white/90 text-center mb-12 max-w-3xl mx-auto" style={{ lineHeight: 1.6 }}>
                Every family grieves differently. Some prefer to manage everything themselves, while others need to share responsibilities. Our Brother's Keeper adapts to what feels right for you.
              </p>

              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {/* Handle It Yourself */}
                <div 
                  className="rounded-3xl p-10 space-y-4"
                  style={{
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                    Handle It Yourself
                  </h4>
                  <p className="text-lg text-white/90 leading-relaxed" style={{ lineHeight: 1.6 }}>
                    Stay in full control of your support network. Manage every update, task, and group at your own pace.
                  </p>
                </div>

                {/* Delegate to Admins */}
                <div 
                  className="rounded-3xl p-10 space-y-4"
                  style={{
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-16 h-16 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                    Delegate to Admins
                  </h4>
                  <p className="text-lg text-white/90 leading-relaxed" style={{ lineHeight: 1.6 }}>
                    Invite trusted family members or friends to help coordinate care, post updates, or manage your community's activity.
                  </p>
                </div>
              </div>

              <p className="text-lg text-white/80 text-center mt-10 italic">
                However you choose to heal, OBK supports your way. You decide how much help you want—and can adjust it anytime.
              </p>
            </div>

            {/* Final CTA */}
            <div className="text-center space-y-8">
              <h3 
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Ready to Get Started?
              </h3>
              <p className="text-xl text-white/90 max-w-3xl mx-auto" style={{ lineHeight: 1.6 }}>
                Create your family support network today and bring your community together.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => (window.location.href = "/api/login")}
                  size="lg"
                  className="bg-[#2DB5A8] hover:bg-[#25a89a] text-white font-semibold px-12 py-7 text-xl shadow-2xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer with Scripture */}
        <footer className="px-6 md:px-10 py-12 mt-16">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <p 
              className="text-xl md:text-2xl italic text-white font-light"
              style={{ fontFamily: "Georgia, serif" }}
            >
              "Carry each other's burdens, and in this way you will fulfill the law of Christ"
            </p>
            <p className="text-base text-white/70 font-medium">— Galatians 6:2</p>
            <div className="pt-6 border-t border-white/10 mt-8">
              <p className="text-white/60 text-sm">
                © 2025 Our Brother's Keeper. Supporting families through difficult times.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
