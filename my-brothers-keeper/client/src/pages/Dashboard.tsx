import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Heart, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();

  if (!household) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-foreground/80">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const openNeeds = needs?.filter((n) => n.status === "open") || [];
  
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    return eventDate >= now && eventDate <= oneWeekFromNow;
  }) || [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        
        {/* Top Section - Centered Family Name & Photo */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          {/* Family Name Pill */}
          <div 
            className="px-10 py-5 rounded-full"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <h1 
              className="text-[36px] font-semibold tracking-wide"
              style={{
                fontFamily: "'Cinzel', serif",
                color: '#0fa9a7',
                filter: 'drop-shadow(0 0 8px rgba(15,169,167,0.7))'
              }}
            >
              {household.name.split(' ').map((word, idx) => (
                <span key={idx}>
                  {idx > 0 && ' '}
                  <span className="text-[48px]" style={{ color: '#1fb5b0' }}>
                    {word.charAt(0).toUpperCase()}
                  </span>
                  {word.slice(1).toLowerCase()}
                </span>
              ))}
            </h1>
          </div>

          {/* Optional Family Photo Placeholder - 16:9 */}
          <div 
            className="w-full max-w-2xl rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              aspectRatio: '16 / 9'
            }}
          >
            <p className="text-foreground/70 text-sm italic">Family photo placeholder</p>
          </div>
        </div>

        {/* Three Square Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Supporters */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Supporters</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{activeUsers.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              <div 
                className="p-4 rounded-lg text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.3)'
                }}
              >
                <Users className="w-8 h-8 text-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Invite friends & family</p>
                <p className="text-xs text-foreground/70 mt-1">Build your support network</p>
              </div>
            </div>

            {/* Buttons at bottom */}
            <div className="space-y-2">
              <Link href="/people?invite=true">
                <button 
                  className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#2DB5A8',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#26a399'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2DB5A8'}
                >
                  <Plus className="w-4 h-4" />
                  Invite Supporters
                </button>
              </Link>
              <Link href="/people">
                <button 
                  className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#B08CA7',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
                >
                  View All
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Open Needs */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Open Needs</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{openNeeds.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {openNeeds.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-foreground/70 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No open needs
                </div>
              ) : (
                openNeeds.slice(0, 2).map((need) => (
                  <div 
                    key={need.id}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{need.title}</p>
                    {need.description && (
                      <p className="text-xs text-foreground/70 truncate mt-1">{need.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/needs">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View All
              </button>
            </Link>
          </div>

          {/* Card 3: Upcoming Events */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{upcomingEvents.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {upcomingEvents.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-foreground/70 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No events this week
                </div>
              ) : (
                upcomingEvents.slice(0, 2).map((event) => {
                  const eventDate = new Date(event.startAt);
                  return (
                    <div 
                      key={event.id}
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-foreground/70 mt-1">
                        {eventDate.toLocaleDateString("en-US", { 
                          weekday: "short", 
                          month: "short", 
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/calendar">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View Calendar
              </button>
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
