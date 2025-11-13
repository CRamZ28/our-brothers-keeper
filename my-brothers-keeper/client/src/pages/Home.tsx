import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Calendar, Users, MessageCircle, UtensilsCrossed, Gift, Image as ImageIcon, Shield, CheckCircle2, UserCog, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
        <div className="animate-pulse" style={{ color: '#B08CA7' }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{ backgroundImage: 'url(/waves-bg.png)' }}
      >
        {/* Decorative circular orbs in background - add depth on top of waves */}
        <div className="fixed top-[10%] right-[15%] w-[600px] h-[600px] bg-cyan-300/40 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[15%] left-[5%] w-[700px] h-[700px] bg-emerald-300/35 blur-[180px] rounded-full pointer-events-none"></div>
        <div className="fixed top-[45%] right-[5%] w-[400px] h-[400px] bg-teal-200/45 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          {/* Header with Glass Container */}
          <header className="px-10 py-6">
            <div 
              className="max-w-7xl mx-auto rounded-3xl px-8 py-4"
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src="/obk-emblem.png" 
                    alt={APP_TITLE} 
                    className="h-16 w-16"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(45, 181, 168, 0.6))'
                    }}
                  />
                  <div 
                    className="font-bold leading-tight"
                    style={{ 
                      fontFamily: "'Cinzel', serif",
                      color: '#ffffff',
                      fontSize: '20px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>O</span>
                    <span style={{ fontSize: '20px' }}>UR </span>
                    <span style={{ fontSize: '28px' }}>B</span>
                    <span style={{ fontSize: '20px' }}>ROTHER'S </span>
                    <span style={{ fontSize: '28px' }}>K</span>
                    <span style={{ fontSize: '20px' }}>EEPER</span>
                  </div>
                </div>
                <Button 
                  onClick={() => (window.location.href = "/api/login")}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ 
                    background: '#B08CA7',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 px-10">
            <div className="max-w-7xl mx-auto space-y-16 py-12">
              {/* Hero Content */}
              <div className="text-center space-y-8">
                <div 
                  className="space-y-6 rounded-3xl p-8 md:p-12"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {/* Biblical Scripture */}
                  <p 
                    className="text-4xl md:text-5xl lg:text-6xl font-normal mb-4 leading-relaxed" 
                    style={{ 
                      fontFamily: "'Pinyon Script', cursive",
                      color: '#ffffff',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    "Carry each other's burdens, and in this way you will fulfill the law of Christ"
                  </p>
                  <p 
                    className="text-xl font-medium"
                    style={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    — Galatians 6:2
                  </p>
                  <p 
                    className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed pt-6"
                    style={{ 
                      color: '#000000',
                      textShadow: 'none'
                    }}
                  >
                    A compassionate platform that helps families and communities provide sustained,
                    meaningful support to those who have lost a loved one.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => (window.location.href = "/api/login")}
                    className="text-lg px-10 py-6 shadow-2xl transition-all duration-300 hover:scale-105"
                    style={{ 
                      background: '#B08CA7',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>

              {/* Why OBK Section */}
              <div 
                className="rounded-3xl p-8 md:p-12"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <h2 
                  className="text-3xl md:text-4xl font-bold text-center mb-8"
                  style={{ 
                    fontFamily: "'Cinzel', serif",
                    color: '#B08CA7',
                    filter: 'drop-shadow(0 0 8px rgba(176,140,167,0.7))',
                    letterSpacing: '0.05em'
                  }}
                >
                  <span style={{ fontSize: '48px' }}>W</span>
                  <span style={{ fontSize: '36px' }}>HY </span>
                  <span style={{ fontSize: '48px' }}>O</span>
                  <span style={{ fontSize: '36px' }}>UR </span>
                  <span style={{ fontSize: '48px' }}>B</span>
                  <span style={{ fontSize: '36px' }}>ROTHER'S </span>
                  <span style={{ fontSize: '48px' }}>K</span>
                  <span style={{ fontSize: '36px' }}>EEPER?</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center space-y-3">
                    <div 
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: '#2DB5A8' }}
                    >
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: '#ffffff' }}
                    >
                      Turn Words Into Action
                    </h3>
                    <p style={{ color: '#000000' }}>
                      When someone says "let me know if you need anything," they mean it. 
                      We make it easy for them to follow through with specific, helpful actions.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div 
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: '#2DB5A8' }}
                    >
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: '#ffffff' }}
                    >
                      Sustained Support
                    </h3>
                    <p style={{ color: '#000000' }}>
                      Grief doesn't end after the funeral. Our platform helps your community 
                      stay present through the weeks, months, and years ahead.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div 
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: '#B08CA7' }}
                    >
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: '#ffffff' }}
                    >
                      Privacy & Control
                    </h3>
                    <p style={{ color: '#000000' }}>
                      Share what you want, with who you want. Create custom groups and control 
                      visibility for every piece of information you share.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flexible Control Section */}
              <div 
                className="rounded-3xl p-8 md:p-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: '#B08CA7' }}
                      >
                        <UserCog className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <h2 
                        className="text-3xl md:text-4xl font-bold"
                        style={{ 
                          fontFamily: "'Cinzel', serif",
                          color: '#ffffff',
                          letterSpacing: '0.05em'
                        }}
                      >
                        You're in Control—Always
                      </h2>
                      <p 
                        className="text-lg leading-relaxed"
                        style={{ color: '#000000' }}
                      >
                        Every family is different. Some people want to manage everything themselves during grief. 
                        Others need to share the load. <span className="font-semibold">Our Brother's Keeper adapts to you.</span>
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                          <div>
                            <h4 className="font-bold" style={{ color: '#ffffff' }}>
                              Handle It Yourself
                            </h4>
                            <p className="text-sm" style={{ color: '#000000' }}>
                              As the primary person, you have complete control over every aspect 
                              of your support network if you prefer to manage it all.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#B08CA7' }} />
                          <div>
                            <h4 className="font-bold" style={{ color: '#ffffff' }}>
                              Delegate to Admins
                            </h4>
                            <p className="text-sm" style={{ color: '#000000' }}>
                              Designate trusted family members or friends as admins to help 
                              coordinate care, post updates, and manage the community.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p 
                        className="text-base pt-2"
                        style={{ color: '#000000' }}
                      >
                        Whatever feels right for your situation, OBK makes it easy. You decide 
                        how much help you want, and you can change it anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Features Section */}
              <div className="space-y-8">
                <h2 
                  className="text-3xl md:text-4xl font-bold text-center"
                  style={{ 
                    fontFamily: "'Cinzel', serif",
                    color: '#B08CA7',
                    filter: 'drop-shadow(0 0 8px rgba(176,140,167,0.7))',
                    letterSpacing: '0.05em'
                  }}
                >
                  <span style={{ fontSize: '48px' }}>E</span>
                  <span style={{ fontSize: '36px' }}>VERYTHING </span>
                  <span style={{ fontSize: '48px' }}>Y</span>
                  <span style={{ fontSize: '36px' }}>OU </span>
                  <span style={{ fontSize: '48px' }}>N</span>
                  <span style={{ fontSize: '36px' }}>EED</span>
                </h2>
                
                {/* Features Grid with Glassmorphism */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {/* Feature 1: Needs Board */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#2DB5A8' }}
                    >
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Needs Board
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Post specific needs like grocery shopping, lawn care, childcare, or errands. 
                      Supporters can claim tasks and mark them complete.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Claim and complete tasks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Set custom visibility per need</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Track who's helping with what</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 2: Shared Calendar */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#2DB5A8' }}
                    >
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Events Calendar
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Keep everyone informed about important dates, memorial services, court dates, 
                      and family gatherings. RSVP tracking included.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>RSVP for events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Control who sees each event</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Track recurring important dates</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 3: Meal Train */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#B08CA7' }}
                    >
                      <UtensilsCrossed className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Meal Train
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Coordinate meal delivery with a powerful scheduling system. Select specific days, 
                      set dietary preferences, and manage delivery details.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
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

                  {/* Feature 4: Family Updates */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#2DB5A8' }}
                    >
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Family Updates
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Share updates with your support network. Pin important announcements and 
                      attach photos or videos to bring everyone closer.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Pin important announcements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Upload photos and videos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Share memories and milestones</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 5: Memory Wall */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#B08CA7' }}
                    >
                      <ImageIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Memory Wall
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Create an interactive vision board of memories, stories, encouragement, and prayers. 
                      Drag and drop cards to arrange your own personal collage.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Share memories and photos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Interactive drag-and-drop layout</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Filter by memory type</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 6: Gift Registry */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#2DB5A8' }}
                    >
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      Gift Registry
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Create a wishlist for practical items you need. Track purchases and deliveries 
                      so supporters know exactly how to help.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Three-stage tracking system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Priority levels for items</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2DB5A8' }} />
                        <span>Prevent duplicate purchases</span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature 7: People & Groups */}
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#B08CA7' }}
                    >
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
                      People & Custom Groups
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: '#000000' }}>
                      Organize your support network into custom groups like "Inner Circle," "Church Friends," 
                      or "Work Colleagues" for targeted sharing.
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Create unlimited groups</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Invite supporters securely</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B08CA7' }} />
                        <span>Three-tier access system</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center space-y-6 py-8">
                <h2 
                  className="text-3xl md:text-4xl font-bold"
                  style={{ 
                    fontFamily: "'Cinzel', serif",
                    color: '#ffffff',
                    letterSpacing: '0.05em'
                  }}
                >
                  Ready to Build Your Support Network?
                </h2>
                <p 
                  className="text-xl max-w-2xl mx-auto"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Join families who are experiencing meaningful, sustained support during their most difficult times.
                </p>
                <Button
                  size="lg"
                  onClick={() => (window.location.href = "/api/login")}
                  className="text-lg px-10 py-6 shadow-2xl transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: '#B08CA7',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  Get Started Today
                </Button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="py-8 text-center" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <p className="text-sm">
              © 2025 Our Brother's Keeper. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // User is authenticated - redirect to dashboard
  if (household) {
    window.location.href = "/dashboard";
    return null;
  }

  // User is authenticated but has no household - redirect to onboarding
  window.location.href = "/onboarding";
  return null;
}
