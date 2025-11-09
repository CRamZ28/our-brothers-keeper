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
          <p className="text-white/70">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const openNeeds = needs?.filter((n) => n.status === "open") || [];
  
  // Get upcoming events (this week)
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    return eventDate >= now && eventDate <= oneWeekFromNow;
  }) || [];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        
        {/* Hero Section - Family Name Pill */}
        <div className="flex justify-center">
          <div className="px-8 py-3 bg-white/14 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide text-center">
              {household.name}
            </h1>
          </div>
        </div>

        {/* Optional Picture Pill (placeholder for now) */}
        {household.photoUrl && (
          <div className="flex justify-center">
            <div className="px-6 py-2 bg-white/14 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
              <img 
                src={household.photoUrl} 
                alt={household.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Three Action Cards - Flex Row (wraps on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Supporters */}
          <div className="bg-white/14 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Supporters</h2>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Total Count */}
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-white">{activeUsers.length}</div>
              <div className="text-white/70 text-sm mt-1">Total Supporters</div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Link href="/people?action=invite">
                <button className="w-full py-3 px-4 bg-gradient-to-b from-[#B08CA7] to-[#8D6B85] rounded-full text-white font-medium shadow-[0_4px_12px_rgba(176,140,167,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Invite Someone</span>
                  </div>
                </button>
              </Link>
              <Link href="/people">
                <button className="w-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-200">
                  View All Supporters
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Open Needs */}
          <div className="bg-white/14 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Open Needs</h2>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Active Requests Count */}
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-white">{openNeeds.length}</div>
              <div className="text-white/70 text-sm mt-1">Active Requests</div>
            </div>

            {/* 2 Previews */}
            <div className="space-y-2">
              {openNeeds.length === 0 ? (
                <div className="text-center py-4 text-white/60 text-sm">
                  No open needs right now
                </div>
              ) : (
                openNeeds.slice(0, 2).map((need) => (
                  <div 
                    key={need.id} 
                    className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/25 rounded-xl"
                  >
                    <div className="text-white/90 font-medium text-sm truncate">
                      {need.title}
                    </div>
                    {need.description && (
                      <div className="text-white/60 text-xs mt-1 truncate">
                        {need.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Button */}
            <Link href="/needs">
              <button className="w-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-200">
                View All Needs
              </button>
            </Link>
          </div>

          {/* Card 3: Upcoming Events */}
          <div className="bg-white/14 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Events This Week Count */}
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-white">{upcomingEvents.length}</div>
              <div className="text-white/70 text-sm mt-1">Events This Week</div>
            </div>

            {/* 2 Previews */}
            <div className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-4 text-white/60 text-sm">
                  No events this week
                </div>
              ) : (
                upcomingEvents.slice(0, 2).map((event) => {
                  const eventDate = new Date(event.startAt);
                  return (
                    <div 
                      key={event.id} 
                      className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/25 rounded-xl"
                    >
                      <div className="text-white/90 font-medium text-sm truncate">
                        {event.title}
                      </div>
                      <div className="text-white/60 text-xs mt-1">
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

            {/* Button */}
            <Link href="/calendar">
              <button className="w-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-200">
                See Full Calendar
              </button>
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
