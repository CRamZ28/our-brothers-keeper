import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, Users, ChefHat, MessageCircle, Bell, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: recentActivity } = trpc.household.getRecentActivity.useQuery();

  if (!household) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";
  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const pendingUsers = users?.filter((u) => u.status === "pending") || [];
  
  const openNeeds = needs?.filter((n) => n.status === "open") || [];
  const completedNeeds = needs?.filter((n) => n.status === "completed") || [];
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= sevenDaysFromNow;
  }) || [];

  const totalNeeds = needs?.length || 0;
  const completionRate = totalNeeds > 0 ? Math.round((completedNeeds.length / totalNeeds) * 100) : 0;

  return (
    <DashboardLayout>
      {/* Teal/White/Silver gradient background - smooth and clean */}
      <div className="min-h-screen bg-gradient-to-br from-white via-[#6BC4B8]/20 to-gray-100">
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Pending Approvals - if any */}
            {isPrimaryOrAdmin && pendingUsers.length > 0 && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B08CA7]/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-[#B08CA7]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {pendingUsers.length} pending {pendingUsers.length === 1 ? "approval" : "approvals"}
                      </p>
                      <p className="text-sm text-gray-600">Review supporter requests</p>
                    </div>
                  </div>
                  <Link href="/people">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-md font-semibold rounded-full px-6">
                      Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Hero Card - Family Name (like "Total balance" card in image) */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl">
              <div className="text-center">
                {household.photoUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={household.photoUrl} 
                      alt={household.name}
                      className="w-20 h-20 rounded-full object-cover shadow-lg"
                    />
                  </div>
                )}
                
                <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] bg-clip-text text-transparent">
                  {household.name}
                </h1>
                
                {household.description && (
                  <p className="text-gray-700 text-sm md:text-base mb-4 max-w-xl mx-auto">
                    {household.description}
                  </p>
                )}
                
                {/* Small stat circles (like the card circles in image) */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Link href="/people">
                    <div className="w-24 h-24 rounded-full bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:bg-white/80 transition-all shadow-md">
                      <div className="text-2xl font-bold text-gray-900">{activeUsers.length}</div>
                      <div className="text-xs text-gray-600">Supporters</div>
                    </div>
                  </Link>
                  
                  <Link href="/needs">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6BC4B8]/30 to-[#6BC4B8]/50 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:from-[#6BC4B8]/40 hover:to-[#6BC4B8]/60 transition-all shadow-md">
                      <div className="text-2xl font-bold text-white">{openNeeds.length}</div>
                      <div className="text-xs text-white/90">Open</div>
                    </div>
                  </Link>
                  
                  <Link href="/calendar">
                    <div className="w-24 h-24 rounded-full bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:bg-white/80 transition-all shadow-md">
                      <div className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</div>
                      <div className="text-xs text-gray-600">Events</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Grid of cards - varying opacity and tints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Community Progress Card - with gradient tint like "Financial health" */}
              <div className="bg-gradient-to-br from-[#B08CA7]/30 to-[#B08CA7]/20 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Community Progress</h3>
                  <TrendingUp className="w-5 h-5 text-[#B08CA7]" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{completionRate}%</div>
                <p className="text-sm text-gray-600 mb-4">Tasks completed since start</p>
                <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions - semi-transparent */}
              <div className="bg-white/30 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { href: "/needs", icon: Heart, label: "Needs", color: "#6BC4B8" },
                    { href: "/meal-train", icon: ChefHat, label: "Meals", color: "#6BC4B8" },
                    { href: "/calendar", icon: Calendar, label: "Events", color: "#B08CA7" },
                    { href: "/messages", icon: MessageCircle, label: "Messages", color: "#B08CA7" },
                  ].map((action) => (
                    <Link key={action.href} href={action.href}>
                      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/70 transition-all cursor-pointer text-center shadow-sm">
                        <action.icon className="w-6 h-6 mx-auto mb-2" style={{ color: action.color }} />
                        <div className="text-sm font-medium text-gray-900">{action.label}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity - like "Upcoming payments" list */}
            <div className="bg-white/30 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                {recentActivity && recentActivity.length > 5 && (
                  <button className="text-sm text-gray-600 hover:text-gray-900">View All</button>
                )}
              </div>

              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.slice(0, 5).map((activity) => {
                    const date = new Date(activity.createdAt);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const timeStr = isToday
                      ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    let actionText = "";
                    let iconBg = "#6BC4B8";
                    
                    switch (activity.action) {
                      case "need_created": actionText = "posted a need"; break;
                      case "need_claimed": actionText = "claimed a need"; break;
                      case "need_completed": actionText = "completed a need"; break;
                      case "event_created": actionText = "created an event"; break;
                      case "event_rsvp": actionText = "RSVP'd to event"; iconBg = "#B08CA7"; break;
                      case "announcement_created": actionText = "posted update"; iconBg = "#B08CA7"; break;
                      case "user_joined": actionText = "joined"; break;
                      default: actionText = activity.action.replace(/_/g, " ");
                    }

                    return (
                      <div key={activity.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 hover:bg-white/60 transition-all">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: iconBg }}
                          >
                            {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.actorName || "Someone"}
                            </p>
                            <p className="text-xs text-gray-600">{actionText}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
