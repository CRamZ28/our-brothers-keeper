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
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Pending Approvals Alert */}
          {isPrimaryOrAdmin && pendingUsers.length > 0 && (
            <Card className="border border-[#B08CA7]/20 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#B08CA7]/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-[#B08CA7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">Pending Approvals</CardTitle>
                    <CardDescription>
                      {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for approval
                    </CardDescription>
                  </div>
                  <Link href="/people">
                    <Button className="bg-[#B08CA7] hover:bg-[#B08CA7]/90 text-white">
                      Review Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Family Showcase - Clean Hero Section */}
          <Card className="border border-[#6BC4B8]/20 bg-white shadow-sm">
            <CardContent className="p-6 md:p-10">
              {/* Optional Family Photo */}
              {household.photoUrl && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={household.photoUrl} 
                    alt={household.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-md border-2 border-[#6BC4B8]/20"
                  />
                </div>
              )}
              
              {/* Family Name - Large & Centered in Teal */}
              <h1 className="text-3xl md:text-5xl font-bold text-center mb-3 text-[#6BC4B8]">
                {household.name}
              </h1>
              
              {/* Optional Description */}
              {household.description && (
                <p className="text-center text-gray-600 text-sm md:text-base mb-4 max-w-2xl mx-auto">
                  {household.description}
                </p>
              )}
              
              {/* Mission Subtitle */}
              {!household.description && (
                <p className="text-center text-gray-600 text-sm mb-4">
                  Your community's rally point for coordinated support
                </p>
              )}
              
              {/* User Context - Subtle and Centered */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm mb-6">
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
              
              {/* Community Progress */}
              {completionRate > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#6BC4B8]" />
                      Community Momentum
                    </span>
                    <span className="text-base font-semibold text-[#6BC4B8]">
                      {completionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#6BC4B8] rounded-full transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/people">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#6BC4B8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold text-gray-800">{activeUsers.length}</div>
                      <div className="text-xs text-gray-600 truncate">Active Supporters</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/needs">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-[#6BC4B8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold text-gray-800">{openNeeds.length}</div>
                      <div className="text-xs text-gray-600 truncate">Open Needs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/calendar">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#6BC4B8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold text-gray-800">{upcomingEvents.length}</div>
                      <div className="text-xs text-gray-600 truncate">Upcoming Events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/needs">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center mb-3 group-hover:bg-[#6BC4B8]/15 transition-colors">
                    <Heart className="w-6 h-6 text-[#6BC4B8]" />
                  </div>
                  <CardTitle className="text-base">Needs Board</CardTitle>
                  <CardDescription className="text-xs">Help requests</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/meal-train">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center mb-3 group-hover:bg-[#6BC4B8]/15 transition-colors">
                    <ChefHat className="w-6 h-6 text-[#6BC4B8]" />
                  </div>
                  <CardTitle className="text-base">Meal Train</CardTitle>
                  <CardDescription className="text-xs">Meal coordination</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/calendar">
              <Card className="border border-gray-200 bg-white hover:border-[#6BC4B8]/30 hover:shadow-sm transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center mb-3 group-hover:bg-[#6BC4B8]/15 transition-colors">
                    <Calendar className="w-6 h-6 text-[#6BC4B8]" />
                  </div>
                  <CardTitle className="text-base">Calendar</CardTitle>
                  <CardDescription className="text-xs">Upcoming events</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/messages">
              <Card className="border border-gray-200 bg-white hover:border-[#B08CA7]/30 hover:shadow-sm transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#B08CA7]/10 flex items-center justify-center mb-3 group-hover:bg-[#B08CA7]/15 transition-colors">
                    <MessageCircle className="w-6 h-6 text-[#B08CA7]" />
                  </div>
                  <CardTitle className="text-base">Messages</CardTitle>
                  <CardDescription className="text-xs">Stay connected</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#6BC4B8]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#6BC4B8]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Stay updated on what's happening</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium">No recent activity</p>
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
                    let iconColor = "text-[#6BC4B8]";
                    let bgColor = "bg-[#6BC4B8]/10";
                    
                    switch (activity.action) {
                      case "need_created":
                        actionText = "posted a new need";
                        iconColor = "text-[#6BC4B8]";
                        bgColor = "bg-[#6BC4B8]/10";
                        break;
                      case "need_claimed":
                        actionText = "claimed a need";
                        iconColor = "text-[#6BC4B8]";
                        bgColor = "bg-[#6BC4B8]/10";
                        break;
                      case "need_completed":
                        actionText = "completed a need";
                        iconColor = "text-[#6BC4B8]";
                        bgColor = "bg-[#6BC4B8]/10";
                        break;
                      case "event_created":
                        actionText = "created an event";
                        iconColor = "text-[#6BC4B8]";
                        bgColor = "bg-[#6BC4B8]/10";
                        break;
                      case "event_rsvp":
                        actionText = "RSVP'd to an event";
                        iconColor = "text-[#B08CA7]";
                        bgColor = "bg-[#B08CA7]/10";
                        break;
                      case "announcement_created":
                        actionText = "posted an announcement";
                        iconColor = "text-[#B08CA7]";
                        bgColor = "bg-[#B08CA7]/10";
                        break;
                      case "user_joined":
                        actionText = "joined the household";
                        iconColor = "text-[#6BC4B8]";
                        bgColor = "bg-[#6BC4B8]/10";
                        break;
                      default:
                        actionText = activity.action.replace(/_/g, " ");
                    }

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                      >
                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 ${iconColor} font-semibold`}>
                          {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.actorName || "Someone"}</span>{" "}
                            <span className="text-muted-foreground">{actionText}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeStr}</p>
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
