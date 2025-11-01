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
      {/* Soft Pastel Gradient Background */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Pastel Teal/Blue Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100 -z-10" />
        <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-teal-100/30 to-transparent -z-10" />
        
        <div className="relative p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Pending Approvals Alert - Full Width */}
          {isPrimaryOrAdmin && pendingUsers.length > 0 && (
            <Card className="relative border-0 bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden rounded-3xl shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-xl">Pending Approvals</CardTitle>
                    <CardDescription className="text-white/90 text-sm">
                      {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for approval
                    </CardDescription>
                  </div>
                  <Link href="/people">
                    <Button className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 hover:from-teal-500 hover:via-cyan-500 hover:to-blue-600 text-white font-bold px-8 py-6 text-lg shadow-2xl border-0">
                      Review Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Main Grid - Varied Sizes */}
          <div className="grid md:grid-cols-12 gap-6">
            {/* Left Column - Hero Welcome (Larger) */}
            <div className="md:col-span-8 space-y-6">
              {/* Hero Welcome Card */}
              <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 border-0 shadow-2xl p-8 text-white">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-2 uppercase tracking-wide">
                        {getGreeting()}
                      </p>
                      <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                        Welcome back, {user?.name?.split(" ")[0] || "there"}!
                      </h1>
                      <p className="text-white/90 text-lg flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                          {household.name}
                        </span>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm capitalize">
                          {user?.role}
                        </span>
                      </p>
                    </div>
                    <div className="hidden md:flex w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm items-center justify-center shadow-xl transform rotate-6 hover:rotate-0 transition-transform">
                      <span className="text-5xl">👋</span>
                    </div>
                  </div>
                  
                  {completionRate > 0 && (
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Community Progress
                        </span>
                        <span className="text-2xl font-bold">{completionRate}%</span>
                      </div>
                      <div className="h-3 bg-white/20 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-white to-cyan-200 rounded-full transition-all duration-700 shadow-lg"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 3D Depth Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-600/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              {/* Quick Action Cards - Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/needs">
                  <Card className="relative overflow-hidden rounded-3xl border-0 bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">Needs Board</CardTitle>
                      <CardDescription>Help requests</CardDescription>
                    </CardHeader>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-100 rounded-tl-full opacity-50" />
                  </Card>
                </Link>

                <Link href="/meal-train">
                  <Card className="relative overflow-hidden rounded-3xl border-0 bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <ChefHat className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">Meal Train</CardTitle>
                      <CardDescription>Meal coordination</CardDescription>
                    </CardHeader>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-100 rounded-tl-full opacity-50" />
                  </Card>
                </Link>

                <Link href="/calendar">
                  <Card className="relative overflow-hidden rounded-3xl border-0 bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <Calendar className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">Calendar</CardTitle>
                      <CardDescription>Upcoming events</CardDescription>
                    </CardHeader>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-100 rounded-tl-full opacity-50" />
                  </Card>
                </Link>

                <Link href="/messages">
                  <Card className="relative overflow-hidden rounded-3xl border-0 bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>Stay connected</CardDescription>
                    </CardHeader>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-blue-100 rounded-tl-full opacity-50" />
                  </Card>
                </Link>
              </div>
            </div>

            {/* Right Column - Stats (Smaller) */}
            <div className="md:col-span-4 space-y-4">
              {/* Stats with Teal Gradient - Stacked */}
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold mb-1">{activeUsers.length}</div>
                  <div className="text-sm text-white/90 font-medium">Active Supporters</div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold mb-1">{openNeeds.length}</div>
                  <div className="text-sm text-white/90 font-medium">Open Needs</div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold mb-1">{upcomingEvents.length}</div>
                  <div className="text-sm text-white/90 font-medium">Upcoming Events</div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity - Full Width */}
          <Card className="rounded-3xl border-0 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
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
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
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
                    let gradientClass = "from-teal-400 to-cyan-500";
                    
                    switch (activity.action) {
                      case "need_created":
                        actionText = "posted a new need";
                        gradientClass = "from-teal-400 to-cyan-500";
                        break;
                      case "need_claimed":
                        actionText = "claimed a need";
                        gradientClass = "from-cyan-400 to-blue-500";
                        break;
                      case "need_completed":
                        actionText = "completed a need";
                        gradientClass = "from-teal-500 to-emerald-500";
                        break;
                      case "event_created":
                        actionText = "created an event";
                        gradientClass = "from-blue-400 to-cyan-500";
                        break;
                      case "event_rsvp":
                        actionText = "RSVP'd to an event";
                        gradientClass = "from-cyan-500 to-teal-500";
                        break;
                      case "announcement_created":
                        actionText = "posted an announcement";
                        gradientClass = "from-teal-400 to-blue-500";
                        break;
                      case "user_joined":
                        actionText = "joined the household";
                        gradientClass = "from-emerald-400 to-teal-500";
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
