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
      {/* Lighter overlay for airy, calming feel */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(45, 181, 168, 0.08))'
        }}
      ></div>

      {/* Subtle decorative orbs for depth with warmer tones */}
      <div className="fixed top-[10%] right-[15%] w-[500px] h-[500px] bg-teal-200/25 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[15%] left-[10%] w-[600px] h-[600px] bg-cyan-100/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="fixed top-[40%] left-[20%] w-[400px] h-[400px] bg-purple-100/15 blur-[100px] rounded-full pointer-events-none"></div>

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
        {/* Header - Sticky glassmorphic card */}
        <header className="sticky top-0 px-6 md:px-10 py-4 z-50">
          <div 
            className="max-w-7xl mx-auto rounded-3xl px-6 py-4 flex items-center justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="flex items-center gap-3">
              <img 
                src="/obk-emblem.png" 
                alt={APP_TITLE} 
                className="h-10 w-10 md:h-12 md:w-12"
              />
              <h1 
                className="text-lg md:text-xl font-bold tracking-wide"
                style={{ 
                  fontFamily: "'Cinzel', serif",
                  color: '#1a5a56',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                }}
              >
                Our Brother's Keeper
              </h1>
            </div>
            <Button 
              onClick={() => (window.location.href = "/api/login")}
              className="bg-[#6d4a65] hover:bg-[#5d3a55] text-white font-semibold px-5 py-2 shadow-lg"
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
                className="relative text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                style={{ 
                  fontFamily: "'Cinzel', serif", 
                  zIndex: 10,
                  color: '#1a5a56',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                A Place Where Compassion
                <span className="text-[#2DB5A8] block mt-3" style={{ textShadow: '0 2px 4px rgba(255, 255, 255, 0.6)' }}>Becomes Action</span>
              </h2>
              <div className="relative space-y-6 max-w-3xl mx-auto" style={{ zIndex: 10 }}>
                <p 
                  className="text-xl md:text-2xl leading-relaxed"
                  style={{ 
                    lineHeight: 1.6,
                    color: '#1e5a56',
                    textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)'
                  }}
                >
                  Compassion, organized into support that truly lasts.
                  <br />
                  People want to help—they just need direction.
                </p>
                <p 
                  className="text-xl md:text-2xl leading-relaxed"
                  style={{ 
                    lineHeight: 1.6,
                    color: '#1e5a56',
                    textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)'
                  }}
                >
                  OBK turns care into something simple, structured, and sustainable so grieving families feel supported through every stage of loss.
                </p>
              </div>
              <div className="relative pt-4" style={{ zIndex: 10 }}>
                <Button 
                  onClick={() => (window.location.href = "/api/login")}
                  size="lg"
                  className="bg-[#146b61] hover:bg-[#0f5b52] text-white font-semibold px-12 py-7 text-xl shadow-2xl"
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
                  color: '#7d5a75',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                Why Our Brother's Keeper
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8 md:gap-10 mt-16">
                {/* Differentiator 1: Turn Words Into Action */}
                <div 
                  className="rounded-3xl p-10 space-y-5 animate-fade-in-up"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    animationDelay: '0.1s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-2">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Turn Words Into Action
                  </h4>
                  <p className="text-lg font-medium" style={{ color: '#2a6a66' }}>
                    Transform "Let me know if you need anything" into real help.
                  </p>
                  <ul className="space-y-3 text-base" style={{ color: '#2a6a66' }}>
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
                    background: 'rgba(245, 235, 245, 0.4)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(176, 140, 167, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    animationDelay: '0.2s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-16 h-16 flex items-center justify-center mb-2">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#7d5a75' }}>
                    Sustained Support
                  </h4>
                  <p className="text-lg font-medium" style={{ color: '#8d6a85' }}>
                    Grief doesn't follow a timeline—and neither does our support.
                  </p>
                  <ul className="space-y-3 text-base" style={{ color: '#8d6a85' }}>
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
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    animationDelay: '0.3s',
                    animationFillMode: 'both'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-2">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Privacy & Control
                  </h4>
                  <p className="text-lg font-medium" style={{ color: '#2a6a66' }}>
                    Share only what you want, with exactly who you choose.
                  </p>
                  <ul className="space-y-3 text-base" style={{ color: '#2a6a66' }}>
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
                className="text-4xl md:text-5xl font-bold text-center mb-6"
                style={{ 
                  fontFamily: "'Cinzel', serif",
                  color: '#1a5a56',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                You're in Control—Always
              </h3>
              <p className="text-xl text-center mb-12 max-w-3xl mx-auto" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                Every family grieves differently. Some prefer to manage everything themselves, while others need to share responsibilities. Our Brother's Keeper adapts to what feels right for you.
              </p>

              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {/* Handle It Yourself */}
                <div 
                  className="rounded-3xl p-10 space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-16 h-16 flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Handle It Yourself
                  </h4>
                  <p className="text-lg leading-relaxed" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                    Stay in full control of your support network. Manage every update, task, and group at your own pace.
                  </p>
                </div>

                {/* Delegate to Admins */}
                <div 
                  className="rounded-3xl p-10 space-y-4"
                  style={{
                    background: 'rgba(245, 235, 245, 0.4)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(176, 140, 167, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-16 h-16 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#7d5a75' }}>
                    Delegate to Admins
                  </h4>
                  <p className="text-lg leading-relaxed" style={{ lineHeight: 1.6, color: '#8d6a85' }}>
                    Invite trusted family members or friends to help coordinate care, post updates, or manage your community's activity.
                  </p>
                </div>
              </div>

              <p className="text-lg text-center mt-10 italic" style={{ color: '#5a8884' }}>
                However you choose to heal, OBK supports your way. You decide how much help you want—and can adjust it anytime.
              </p>
            </div>

            {/* Final CTA */}
            <div className="text-center space-y-8">
              <h3 
                className="text-4xl md:text-5xl font-bold"
                style={{ 
                  fontFamily: "'Cinzel', serif",
                  color: '#1a5a56',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                Ready to Get Started?
              </h3>
              <p className="text-xl max-w-3xl mx-auto" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                Create your family support network today and bring your community together.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => (window.location.href = "/api/login")}
                  size="lg"
                  className="bg-[#146b61] hover:bg-[#0f5b52] text-white font-semibold px-12 py-7 text-xl shadow-2xl"
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
              className="text-xl md:text-2xl italic font-light"
              style={{ 
                fontFamily: "Georgia, serif",
                color: '#3a7a76',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
              }}
            >
              "Carry each other's burdens, and in this way you will fulfill the law of Christ"
            </p>
            <p className="text-base font-medium" style={{ color: '#5a8884' }}>— Galatians 6:2</p>
            <div className="pt-6 mt-8" style={{ borderTop: '1px solid rgba(90, 136, 132, 0.3)' }}>
              <p className="text-sm" style={{ color: '#6a9894' }}>
                © 2025 Our Brother's Keeper. Supporting families through difficult times.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
