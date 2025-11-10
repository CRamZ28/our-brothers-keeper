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
          <p className="text-teal-900/80">Loading...</p>
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
            className="px-8 py-4 rounded-full"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <h1 className="text-2xl font-bold text-teal-900 uppercase tracking-wide">
              {household.name}
            </h1>
          </div>

          {/* Optional Family Photo Placeholder Pill */}
          <div 
            className="px-12 py-8 rounded-2xl"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <p className="text-teal-700 text-sm italic">Family photo placeholder</p>
          </div>
        </div>

        {/* Three Square Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Supporters */}
          <div 
            className="rounded-2xl p-6 flex flex-col"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Number at top */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-teal-900 mb-2">Supporters</h2>
              <div className="text-4xl font-bold text-teal-900">{activeUsers.length}</div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {activeUsers.slice(0, 2).map((supporter, idx) => (
                <div 
                  key={supporter.id}
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <p className="text-sm font-medium text-teal-900 truncate">{supporter.name}</p>
                  <p className="text-xs text-teal-700 capitalize">{supporter.role}</p>
                </div>
              ))}
              {activeUsers.length === 0 && (
                <div className="p-3 rounded-lg text-center text-sm text-teal-700 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No supporters yet
                </div>
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/people">
              <button className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
                View All
              </button>
            </Link>
          </div>

          {/* Card 2: Open Needs */}
          <div 
            className="rounded-2xl p-6 flex flex-col"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Number at top */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-teal-900 mb-2">Open Needs</h2>
              <div className="text-4xl font-bold text-teal-900">{openNeeds.length}</div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {openNeeds.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-teal-700 italic"
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
                    <p className="text-sm font-medium text-teal-900 truncate">{need.title}</p>
                    {need.description && (
                      <p className="text-xs text-teal-700 truncate mt-1">{need.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/needs">
              <button className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
                View All
              </button>
            </Link>
          </div>

          {/* Card 3: Upcoming Events */}
          <div 
            className="rounded-2xl p-6 flex flex-col"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Number at top */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-teal-900 mb-2">Upcoming Events</h2>
              <div className="text-4xl font-bold text-teal-900">{upcomingEvents.length}</div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {upcomingEvents.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-teal-700 italic"
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
                      <p className="text-sm font-medium text-teal-900 truncate">{event.title}</p>
                      <p className="text-xs text-teal-700 mt-1">
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
              <button className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
                View Calendar
              </button>
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
