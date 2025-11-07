import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, Users, ChefHat, MessageCircle, Bell, ArrowRight, Sparkles } from "lucide-react";
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
      {/* Modern flowy gradient background */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient background with modern flow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#6BC4B8]/10 to-gray-100" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#6BC4B8]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-gray-200/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-[#B08CA7]/10 to-[#6BC4B8]/10 rounded-full blur-3xl" />

        <div className="relative z-10 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Pending Approvals Banner */}
            {isPrimaryOrAdmin && pendingUsers.length > 0 && (
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#B08CA7]/30 backdrop-blur-sm flex items-center justify-center">
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
                    <Button className="bg-[#B08CA7] hover:bg-[#9A7A91] text-white shadow-md font-semibold">
                      Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Family Name Hero - Centered & Prominent */}
            <div className="text-center py-8">
              {household.photoUrl && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={household.photoUrl} 
                    alt={household.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-xl ring-4 ring-white/50"
                  />
                </div>
              )}
              
              <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] bg-clip-text text-transparent">
                {household.name}
              </h1>
              
              {household.description && (
                <p className="text-gray-700 text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                  {household.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">
                  {user?.name?.split(" ")[0] || "You"}
                </span>
                <span className="text-gray-400">·</span>
                <span className="px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full text-gray-700 capitalize font-medium border border-white/30">
                  {user?.role}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">
                  {getGreeting()}
                </span>
              </div>
            </div>

            {/* Small Rectangular Stats - Transparent */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/people">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#6BC4B8]" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{activeUsers.length}</div>
                      <div className="text-xs text-gray-600">Supporters</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/needs">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-[#6BC4B8]" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{openNeeds.length}</div>
                      <div className="text-xs text-gray-600">Open Needs</div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/calendar">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#6BC4B8]" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</div>
                      <div className="text-xs text-gray-600">This Week</div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#B08CA7]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                    <div className="text-xs text-gray-600">Complete</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions - Transparent Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { href: "/needs", icon: Heart, label: "Needs Board", color: "#6BC4B8" },
                { href: "/meal-train", icon: ChefHat, label: "Meal Train", color: "#6BC4B8" },
                { href: "/calendar", icon: Calendar, label: "Calendar", color: "#6BC4B8" },
                { href: "/messages", icon: MessageCircle, label: "Messages", color: "#B08CA7" },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer text-center">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <action.icon className="w-7 h-7" style={{ color: action.color }} />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{action.label}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Activity Feed - Transparent */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#6BC4B8]/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5 text-[#6BC4B8]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>

              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/20">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No activity yet</p>
                  <p className="text-sm text-gray-500 mt-1">Updates will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => {
                    const date = new Date(activity.createdAt);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const timeStr = isToday
                      ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    let actionText = "";
                    let color = "#6BC4B8";
                    
                    switch (activity.action) {
                      case "need_created": actionText = "posted a need"; break;
                      case "need_claimed": actionText = "claimed a need"; break;
                      case "need_completed": actionText = "completed a need"; break;
                      case "event_created": actionText = "created an event"; break;
                      case "event_rsvp": actionText = "RSVP'd"; color = "#B08CA7"; break;
                      case "announcement_created": actionText = "posted an update"; color = "#B08CA7"; break;
                      case "user_joined": actionText = "joined"; break;
                      default: actionText = activity.action.replace(/_/g, " ");
                    }

                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">{activity.actorName || "Someone"}</span>{" "}
                            <span className="text-gray-600">{actionText}</span>
                          </p>
                          <p className="text-xs text-gray-500">{timeStr}</p>
                        </div>
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
