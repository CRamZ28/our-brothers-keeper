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
          <p className="text-white/80">Loading...</p>
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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Hero Section - Family Name */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-wide">
            {household.name}
          </h1>
          <p className="text-white/80 text-sm">
            Supporting the family through community care and connection
          </p>
        </div>

        {/* Three Action Cards - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Supporters */}
          <div className="bg-white/30 backdrop-blur-lg border-2 border-white/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-teal-900">Supporters</h2>
              <div className="w-10 h-10 rounded-full bg-[#B08CA7]/60 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl font-bold text-teal-900">{activeUsers.length}</div>
              <div className="text-teal-700 text-sm mt-1">Total Supporters</div>
            </div>

            <div className="space-y-3">
              <Link href="/people?action=invite">
                <button className="w-full py-3 px-4 bg-gradient-to-b from-[#B08CA7] to-[#8D6B85] rounded-full text-white font-medium shadow-md hover:brightness-110 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Invite Someone</span>
                  </div>
                </button>
              </Link>
              <Link href="/people">
                <button className="w-full py-3 px-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-full text-teal-900 font-medium hover:bg-white/50 transition-all duration-200">
                  View All Supporters
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Open Needs */}
          <div className="bg-white/30 backdrop-blur-lg border-2 border-white/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-teal-900">Open Needs</h2>
              <div className="w-10 h-10 rounded-full bg-[#B08CA7]/60 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl font-bold text-teal-900">{openNeeds.length}</div>
              <div className="text-teal-700 text-sm mt-1">Active Requests</div>
            </div>

            <div className="space-y-2">
              {openNeeds.length === 0 ? (
                <div className="text-center py-4 text-teal-600 text-sm">
                  No open needs right now
                </div>
              ) : (
                openNeeds.slice(0, 2).map((need) => (
                  <div 
                    key={need.id} 
                    className="px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl"
                  >
                    <div className="text-teal-900 font-medium text-sm truncate">
                      {need.title}
                    </div>
                    {need.description && (
                      <div className="text-teal-700 text-xs mt-1 truncate">
                        {need.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <Link href="/needs">
              <button className="w-full py-3 px-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-full text-teal-900 font-medium hover:bg-white/50 transition-all duration-200">
                View All Needs
              </button>
            </Link>
          </div>

          {/* Card 3: Upcoming Events */}
          <div className="bg-white/30 backdrop-blur-lg border-2 border-white/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-teal-900">Upcoming Events</h2>
              <div className="w-10 h-10 rounded-full bg-[#B08CA7]/60 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl font-bold text-teal-900">{upcomingEvents.length}</div>
              <div className="text-teal-700 text-sm mt-1">Events This Week</div>
            </div>

            <div className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-4 text-teal-600 text-sm">
                  No events this week
                </div>
              ) : (
                upcomingEvents.slice(0, 2).map((event) => {
                  const eventDate = new Date(event.startAt);
                  return (
                    <div 
                      key={event.id} 
                      className="px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl"
                    >
                      <div className="text-teal-900 font-medium text-sm truncate">
                        {event.title}
                      </div>
                      <div className="text-teal-700 text-xs mt-1">
                        {eventDate.toLocaleDateString("en-US", { 
                          weekday: "short", 
                          month: "short", 
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link href="/calendar">
              <button className="w-full py-3 px-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-full text-teal-900 font-medium hover:bg-white/50 transition-all duration-200">
                See Full Calendar
              </button>
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
