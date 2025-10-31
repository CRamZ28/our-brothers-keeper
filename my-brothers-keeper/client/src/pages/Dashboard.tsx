import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, MessageCircle, Users } from "lucide-react";
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

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-8 space-y-8">
          {/* Welcome Header */}
          <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {household.name} • {user?.role}
          </p>
        </div>

        {/* Pending Approvals Alert */}
        {isPrimaryOrAdmin && pendingUsers.length > 0 && (
          <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-primary/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for
                approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/people">
                <Button>Review Pending Users</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Supporters</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                People in your support network
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Needs</CardTitle>
              <Heart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openNeeds.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Waiting to be claimed</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">In the next 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/needs">
              <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102 cursor-pointer">
                <CardHeader>
                  <Heart className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-base">Needs Board</CardTitle>
                  <CardDescription className="text-sm">
                    View or post help requests
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/calendar">
              <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102 cursor-pointer">
                <CardHeader>
                  <Calendar className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-base">Calendar</CardTitle>
                  <CardDescription className="text-sm">See upcoming events</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/messages">
              <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102 cursor-pointer">
                <CardHeader>
                  <MessageCircle className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-base">Messages</CardTitle>
                  <CardDescription className="text-sm">Connect with supporters</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/people">
              <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102 cursor-pointer">
                <CardHeader>
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-base">People</CardTitle>
                  <CardDescription className="text-sm">Manage your network</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Stay updated on what's happening</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No recent activity to show
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
                  switch (activity.action) {
                    case "need_created":
                      actionText = "posted a new need";
                      break;
                    case "need_claimed":
                      actionText = "claimed a need";
                      break;
                    case "need_completed":
                      actionText = "completed a need";
                      break;
                    case "event_created":
                      actionText = "created an event";
                      break;
                    case "event_rsvp":
                      actionText = "RSVP'd to an event";
                      break;
                    case "announcement_created":
                      actionText = "posted an announcement";
                      break;
                    case "user_joined":
                      actionText = "joined the household";
                      break;
                    default:
                      actionText = activity.action.replace(/_/g, " ");
                  }

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-xs font-medium text-primary">
                          {activity.actorName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.actorName || "Someone"}</span>{" "}
                          {actionText}
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

