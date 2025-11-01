import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, MessageCircle, Users, ChefHat, Sparkles, ArrowRight } from "lucide-react";
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

  // Calculate completion percentage for visual interest
  const totalNeeds = needs?.length || 0;
  const completedNeeds = needs?.filter((n) => n.status === "completed").length || 0;
  const completionRate = totalNeeds > 0 ? Math.round((completedNeeds / totalNeeds) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background noise-texture relative">
        <div className="radial-glow absolute inset-0 pointer-events-none" />
        
        <div className="relative p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Hero Welcome Card with Gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-blue-500 to-blue-600 p-8 text-white shadow-lg">
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">Good {getGreeting()}</p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {user?.name?.split(" ")[0] || "there"}
                  </h1>
                  <p className="text-white/90 text-sm">
                    {household.name} • {user?.role}
                  </p>
                </div>
                <div className="hidden md:block w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-4xl">👋</span>
                </div>
              </div>
              
              {completionRate > 0 && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Community Progress</span>
                    <span className="text-sm font-bold">{completionRate}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
          </div>

          {/* Pending Approvals Alert */}
          {isPrimaryOrAdmin && pendingUsers.length > 0 && (
            <Card className="card-elevated-lg relative border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden rounded-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Pending Approvals
                </CardTitle>
                <CardDescription className="text-amber-700">
                  {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for
                  approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/people">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                    Review Pending Users
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid with Gradient Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Active Supporters Card */}
            <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{activeUsers.length}</div>
                    <div className="text-xs text-white/80">Supporters</div>
                  </div>
                </div>
                <p className="text-sm text-white/90">Active in your network</p>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>

            {/* Open Needs Card */}
            <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{openNeeds.length}</div>
                    <div className="text-xs text-white/80">Open Needs</div>
                  </div>
                </div>
                <p className="text-sm text-white/90">Waiting to be claimed</p>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>

            {/* Upcoming Events Card */}
            <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{upcomingEvents.length}</div>
                    <div className="text-xs text-white/80">Events</div>
                  </div>
                </div>
                <p className="text-sm text-white/90">In the next 7 days</p>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>
          </div>

          {/* Quick Actions with Colorful Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/needs">
                <Card className="relative overflow-hidden rounded-2xl border-0 bg-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base">Needs Board</CardTitle>
                    <CardDescription className="text-sm">
                      View or post help requests
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/calendar">
                <Card className="relative overflow-hidden rounded-2xl border-0 bg-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base">Calendar</CardTitle>
                    <CardDescription className="text-sm">See upcoming events</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/meal-train">
                <Card className="relative overflow-hidden rounded-2xl border-0 bg-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base">Meal Train</CardTitle>
                    <CardDescription className="text-sm">Coordinate meal deliveries</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/messages">
                <Card className="relative overflow-hidden rounded-2xl border-0 bg-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base">Messages</CardTitle>
                    <CardDescription className="text-sm">Connect with supporters</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity with Better Visual Design */}
          <Card className="card-elevated-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Stay updated on what's happening</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p>No recent activity to show</p>
                <p className="text-sm mt-1">Activity will appear here as your community grows</p>
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
                  let gradientClass = "from-teal-400 to-blue-500";
                  
                  switch (activity.action) {
                    case "need_created":
                      actionText = "posted a new need";
                      gradientClass = "from-rose-400 to-pink-500";
                      break;
                    case "need_claimed":
                      actionText = "claimed a need";
                      gradientClass = "from-amber-400 to-orange-500";
                      break;
                    case "need_completed":
                      actionText = "completed a need";
                      gradientClass = "from-emerald-400 to-teal-500";
                      break;
                    case "event_created":
                      actionText = "created an event";
                      gradientClass = "from-blue-400 to-cyan-500";
                      break;
                    case "event_rsvp":
                      actionText = "RSVP'd to an event";
                      gradientClass = "from-violet-400 to-purple-500";
                      break;
                    case "announcement_created":
                      actionText = "posted an announcement";
                      gradientClass = "from-indigo-400 to-blue-500";
                      break;
                    case "user_joined":
                      actionText = "joined the household";
                      gradientClass = "from-teal-400 to-emerald-500";
                      break;
                    default:
                      actionText = activity.action.replace(/_/g, " ");
                  }

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0 text-white font-semibold shadow-sm`}>
                        {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.actorName || "Someone"}</span>{" "}
                          <span className="text-muted-foreground">{actionText}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{timeStr}</p>
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
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
