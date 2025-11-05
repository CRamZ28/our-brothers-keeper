import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, MessageCircle, Users, ChefHat, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
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
          <p className="text-muted-foreground">Loading household...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";
  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const pendingUsers = users?.filter((u) => u.status === "pending") || [];
  
  // Calculate stats
  const openNeeds = needs?.filter((n) => n.status === "open") || [];
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= sevenDaysFromNow;
  }) || [];

  // Calculate completion percentage
  const totalNeeds = needs?.length || 0;
  const completedNeeds = needs?.filter((n) => n.status === "completed").length || 0;
  const completionRate = totalNeeds > 0 ? Math.round((completedNeeds / totalNeeds) * 100) : 0;

  return (
    <DashboardLayout>
      {/* Glassmorphism Background with Gradient */}
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 noise-texture relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-4 md:p-8 space-y-6 max-w-7xl mx-auto z-10">
          {/* Pending Approvals Alert - Full Width with Mauve/Purple Accent */}
          {isPrimaryOrAdmin && pendingUsers.length > 0 && (
            <Card className="relative border-0 bg-white/90 backdrop-blur-md overflow-hidden rounded-3xl shadow-xl border border-purple-300/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-purple-900 text-xl">Pending Approvals</CardTitle>
                    <CardDescription className="text-purple-800 text-sm">
                      {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for approval
                    </CardDescription>
                  </div>
                  <Link href="/people">
                    <Button className="bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white font-bold px-8 py-6 text-lg shadow-2xl border-0">
                      Review Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Family Showcase - Centered Hero Section with Vibrant Gradients */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#6BC4B8]/20 via-blue-100/30 to-[#B08CA7]/20 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl p-8 md:p-12">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#6BC4B8]/30 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#B08CA7]/30 to-transparent rounded-full blur-2xl" />
            
            <div className="relative max-w-4xl mx-auto">
              {/* Optional Family Photo */}
              {household.photoUrl && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6BC4B8] to-[#B08CA7] rounded-2xl blur-md opacity-40" />
                    <img 
                      src={household.photoUrl} 
                      alt={household.name}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover shadow-xl border-4 border-white/80"
                    />
                  </div>
                </div>
              )}
              
              {/* Family Name - Large & Centered with Enhanced Gradient */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-4 bg-gradient-to-r from-[#6BC4B8] via-[#5A9FD4] to-[#B08CA7] bg-clip-text text-transparent drop-shadow-sm">
                {household.name}
              </h1>
              
              {/* Optional Description */}
              {household.description && (
                <p className="text-center text-gray-600 text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                  {household.description}
                </p>
              )}
              
              {/* Mission Subtitle */}
              {!household.description && (
                <p className="text-center text-gray-600 text-sm md:text-base mb-6">
                  Your community's rally point for coordinated support
                </p>
              )}
              
              {/* User Context - Subtle and Centered */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm mb-8">
                <span className="text-gray-500">
                  {user?.name?.split(" ")[0] || "You"}
                </span>
                <span className="text-gray-400">·</span>
                <span className="px-2 py-0.5 bg-[#B08CA7]/10 border border-[#B08CA7]/20 rounded text-gray-700 capitalize">
                  {user?.role}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">
                  {getGreeting()}
                </span>
              </div>
              
              {/* Community Progress - Full Width */}
              {completionRate > 0 && (
                <div className="bg-white/50 rounded-xl p-5 border border-white/60 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#6BC4B8]" />
                      Community Momentum
                    </span>
                    <span className="text-lg font-semibold bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] bg-clip-text text-transparent">
                      {completionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#6BC4B8] to-[#B08CA7] rounded-full transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats - Compact Pills */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/people">
              <div className="group bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-3 hover:bg-white/80 hover:border-[#6BC4B8]/30 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#6BC4B8]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activeUsers.length}</div>
                    <div className="text-xs text-gray-600">Active Supporters</div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/needs">
              <div className="group bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-3 hover:bg-white/80 hover:border-[#6BC4B8]/30 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-[#6BC4B8]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{openNeeds.length}</div>
                    <div className="text-xs text-gray-600">Open Needs</div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/calendar">
              <div className="group bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-3 hover:bg-white/80 hover:border-[#6BC4B8]/30 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-[#6BC4B8]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{upcomingEvents.length}</div>
                    <div className="text-xs text-gray-600">Upcoming Events</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Action Cards - Grid with TEAL gradients */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/needs">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/90 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Needs Board</CardTitle>
                  <CardDescription>Help requests</CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-100 rounded-tl-full opacity-50" />
              </Card>
            </Link>

            <Link href="/meal-train">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/90 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Meal Train</CardTitle>
                  <CardDescription>Meal coordination</CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-100 rounded-tl-full opacity-50" />
              </Card>
            </Link>

            <Link href="/calendar">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/90 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Calendar</CardTitle>
                  <CardDescription>Upcoming events</CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-100 rounded-tl-full opacity-50" />
              </Card>
            </Link>

            <Link href="/messages">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/90 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-300 to-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <CardDescription>Stay connected</CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-100 rounded-tl-full opacity-50" />
              </Card>
            </Link>
          </div>

          {/* Recent Activity - Full Width */}
          <Card className="rounded-3xl border-0 bg-white/90 backdrop-blur-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Stay updated on what's happening</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles className="w-10 h-10 text-teal-500" />
                  </div>
                  <p className="font-medium text-lg">No recent activity</p>
                  <p className="text-sm mt-2">Activity will appear here as your community grows</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const date = new Date(activity.createdAt);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const timeStr = isToday
                      ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    let actionText = "";
                    let gradientClass = "from-teal-400 to-teal-500";
                    
                    switch (activity.action) {
                      case "need_created":
                        actionText = "posted a new need";
                        gradientClass = "from-teal-400 to-teal-500";
                        break;
                      case "need_claimed":
                        actionText = "claimed a need";
                        gradientClass = "from-teal-500 to-teal-600";
                        break;
                      case "need_completed":
                        actionText = "completed a need";
                        gradientClass = "from-teal-400 to-teal-500";
                        break;
                      case "event_created":
                        actionText = "created an event";
                        gradientClass = "from-teal-400 to-teal-600";
                        break;
                      case "event_rsvp":
                        actionText = "RSVP'd to an event";
                        gradientClass = "from-purple-300 to-purple-400";
                        break;
                      case "announcement_created":
                        actionText = "posted an announcement";
                        gradientClass = "from-purple-300 to-purple-400";
                        break;
                      case "user_joined":
                        actionText = "joined the household";
                        gradientClass = "from-teal-500 to-teal-600";
                        break;
                      default:
                        actionText = activity.action.replace(/_/g, " ");
                    }

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-lg`}>
                          {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">
                            <span className="font-semibold text-base">{activity.actorName || "Someone"}</span>{" "}
                            <span className="text-muted-foreground">{actionText}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{timeStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
