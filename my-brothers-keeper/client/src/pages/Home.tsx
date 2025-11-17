import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Shield, Clock, Settings, Users, ArrowRight, ClipboardList, Calendar, UtensilsCrossed, Megaphone, Image, Gift, UserCircle, Check } from "lucide-react";

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
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url(/waves-bg.png)', position: 'relative' }}
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

      {/* Header - Fixed at top, always visible above all content */}
      <header 
        className="fixed top-0 left-0 right-0 px-6 md:px-10 py-4"
        style={{
          zIndex: 99999,
        }}
      >
          <div 
            className="max-w-7xl mx-auto rounded-3xl px-6 py-4 flex items-center justify-between"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header content - no z-index needed, parent handles stacking */}
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

        {/* Main content - padding-top prevents overlap with fixed header */}
        <div className="pt-28">
        {/* Hero Section */}
        <main className="px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            {/* Hero Content - Single Column, Centered */}
            <div className="relative text-center space-y-10 mb-24 md:mb-32">
              <h2 
                className="relative text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                style={{ 
                  fontFamily: "'Cinzel', serif",
                  color: '#1a5a56',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                A Place Where Compassion
                <span className="text-[#2DB5A8] block mt-3" style={{ textShadow: '0 2px 4px rgba(255, 255, 255, 0.6)' }}>Becomes Action</span>
              </h2>
              
              <div 
                className="max-w-2xl mx-auto rounded-3xl p-8 md:p-10"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.94))',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                }}
              >
                <p 
                  className="text-xl md:text-2xl font-semibold mb-8"
                  style={{ 
                    lineHeight: 1.5,
                    color: '#1a5a56',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Turn compassion into organized, lasting support for grieving families
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2DB5A8] flex items-center justify-center mt-1">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base md:text-lg font-medium" style={{ color: '#2a6a66', lineHeight: 1.6 }}>
                      <strong style={{ color: '#1a5a56' }}>Structure every offer of help</strong> — Give helpers specific tasks they can actually complete
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#B08CA7] flex items-center justify-center mt-1">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base md:text-lg font-medium" style={{ color: '#7d5a75', lineHeight: 1.6 }}>
                      <strong>Support that lasts</strong> — Keep your community engaged for weeks, months, or years
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2DB5A8] flex items-center justify-center mt-1">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base md:text-lg font-medium" style={{ color: '#2a6a66', lineHeight: 1.6 }}>
                      <strong style={{ color: '#1a5a56' }}>Privacy you control</strong> — Share only what you want, with exactly who you choose
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
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
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
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

            {/* Everything You Need - Features Section */}
            <div className="mb-24 md:mb-32">
              <h3 
                className="text-4xl md:text-5xl font-bold text-center mb-4"
                style={{ 
                  fontFamily: "'Cinzel', serif",
                  color: '#1a5a56',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
                }}
              >
                Everything You Need, All in One Place
              </h3>

              <div className="grid md:grid-cols-2 gap-8 md:gap-10 mt-16">
                {/* Needs Board */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Needs Board
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                    Turn compassion into action. Post specific needs—meals, childcare, errands, lawn care—and supporters can claim and complete tasks with ease.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#2a6a66' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Claim and complete tasks</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Set custom visibility per need</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Track who's helping with what</span>
                    </li>
                  </ul>
                </div>

                {/* Events Calendar */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(245, 235, 245, 0.4)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(176, 140, 167, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-14 h-14 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#7d5a75' }}>
                    Events Calendar
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#8d6a85' }}>
                    Keep your circle informed about what matters most—memorial services, court dates, birthdays, or family gatherings. Includes RSVP tracking and reminders.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#8d6a85' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>RSVP for events</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Control who sees each event</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Track recurring important dates</span>
                    </li>
                  </ul>
                </div>

                {/* Meal Train */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center">
                    <UtensilsCrossed className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Meal Train
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                    Coordinate meal deliveries seamlessly. Choose available dates, list dietary preferences, and include private delivery details.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#2a6a66' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Schedule meals with ease</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Set dietary preferences & allergies</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Manage delivery instructions privately</span>
                    </li>
                  </ul>
                </div>

                {/* Family Updates */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(245, 235, 245, 0.4)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(176, 140, 167, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-14 h-14 flex items-center justify-center">
                    <Megaphone className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#7d5a75' }}>
                    Family Updates
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#8d6a85' }}>
                    Keep everyone connected with updates, photos, and milestones. Pin important announcements to ensure no one misses what matters most.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#8d6a85' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Pin important announcements</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Upload photos & videos</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Share memories and moments</span>
                    </li>
                  </ul>
                </div>

                {/* Memory Wall */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center">
                    <Image className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    Memory Wall
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                    Celebrate a life beautifully. Build an interactive collage of photos, stories, prayers, and memories. Every shared post keeps their spirit alive.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#2a6a66' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Share memories and encouragement</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Drag-and-drop interactive layout</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Filter by memory type</span>
                    </li>
                  </ul>
                </div>

                {/* Gift Registry */}
                <div 
                  className="rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(245, 235, 245, 0.4)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(176, 140, 167, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#B08CA7] w-14 h-14 flex items-center justify-center">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#7d5a75' }}>
                    Gift Registry
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#8d6a85' }}>
                    Create a wishlist for practical needs—whether it's household items, school supplies, or memorial gifts. Supporters can purchase directly and track deliveries.
                  </p>
                  <ul className="space-y-2 text-base pt-2" style={{ color: '#8d6a85' }}>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Three-stage tracking system</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Priority levels for items</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#B08CA7] flex-shrink-0" />
                      <span>Prevent duplicate purchases</span>
                    </li>
                  </ul>
                </div>

                {/* People & Custom Groups */}
                <div 
                  className="rounded-3xl p-8 space-y-4 md:col-span-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="rounded-xl bg-[#2DB5A8] w-14 h-14 flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                    People & Custom Groups
                  </h4>
                  <p className="text-base leading-relaxed" style={{ lineHeight: 1.6, color: '#2a6a66' }}>
                    Organize your community into custom groups—"Inner Circle," "Church Friends," "Work Family"—for personalized updates and controlled sharing.
                  </p>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8 text-base pt-2" style={{ color: '#2a6a66' }}>
                    <div className="flex items-start md:justify-start flex-1">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Create unlimited groups</span>
                    </div>
                    <div className="flex items-start md:justify-center flex-1">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Invite securely</span>
                    </div>
                    <div className="flex items-start md:justify-end flex-1">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-[#2DB5A8] flex-shrink-0" />
                      <span>Three-tier access system</span>
                    </div>
                  </div>
                </div>
              </div>
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
