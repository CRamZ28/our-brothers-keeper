import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { UserAvatar } from "@/components/UserAvatar";
import { Calendar, Heart, Users, ChefHat, Plus, Check } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: mealTrain } = trpc.mealTrain.get.useQuery();

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
  const activeUsers = users?.filter((u) => u.status === "active").slice(0, 6) || [];
  
  const openNeeds = needs?.filter((n) => n.status === "open").slice(0, 3) || [];
  
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    return eventDate >= new Date();
  }).slice(0, 5) || [];

  const hasMealTrain = mealTrain && mealTrain.enabled;

  return (
    <DashboardLayout>
      {/* Large outer glassmorphism container */}
      <div className="min-h-screen bg-gradient-to-br from-[#14B8A6] via-[#6BC4B8] to-[#8DD3CB] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            
            {/* Page Title */}
            <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
              Dashboard
            </h1>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Supporters Widget */}
              <Link href="/people">
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:bg-white/70 transition-all cursor-pointer group border border-white/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Supporters</h3>
                    <div className="w-8 h-8 rounded-full bg-[#B08CA7] flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Circular avatar arrangement */}
                  <div className="relative h-32 flex items-center justify-center">
                    {activeUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">No supporters yet</p>
                    ) : (
                      <div className="relative w-full h-full">
                        {activeUsers.slice(0, 6).map((supporter, index) => {
                          const angle = (index * 360) / Math.min(activeUsers.length, 6);
                          const radius = 45;
                          const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                          const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
                          
                          return (
                            <div
                              key={supporter.id}
                              className="absolute top-1/2 left-1/2 transition-transform group-hover:scale-110"
                              style={{
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                              }}
                            >
                              <UserAvatar user={supporter} size="md" />
                            </div>
                          );
                        })}
                        {activeUsers.length > 6 && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-10 h-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              +{activeUsers.length - 6}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">{activeUsers.length} active supporters</p>
                  </div>
                </div>
              </Link>

              {/* Open Needs Widget */}
              <Link href="/needs">
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:bg-white/70 transition-all cursor-pointer border border-white/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Open Needs</h3>
                    <div className="w-8 h-8 rounded-full bg-[#B08CA7] flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {openNeeds.length === 0 ? (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-sm text-gray-500">No open needs</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openNeeds.map((need) => (
                        <div key={need.id} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {need.status === "completed" && <Check className="w-3 h-3 text-[#14B8A6]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{need.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600 text-center">
                      {openNeeds.length} open {openNeeds.length === 1 ? "need" : "needs"}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Upcoming Events Widget */}
              <Link href="/calendar">
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:bg-white/70 transition-all cursor-pointer border border-white/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
                    <div className="w-8 h-8 rounded-full bg-[#14B8A6] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {upcomingEvents.length === 0 ? (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-sm text-gray-500">No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.slice(0, 4).map((event) => {
                        const eventDate = new Date(event.startAt);
                        return (
                          <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/40">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#6BC4B8] flex flex-col items-center justify-center text-white flex-shrink-0">
                              <div className="text-xs font-medium">{eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</div>
                              <div className="text-lg font-bold leading-none">{eventDate.getDate()}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                              <p className="text-xs text-gray-600">{eventDate.toLocaleDateString("en-US", { weekday: "short" })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600 text-center">
                      {upcomingEvents.length} upcoming {upcomingEvents.length === 1 ? "event" : "events"}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Meal Train Widget */}
              <Link href="/meal-train">
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:bg-white/70 transition-all cursor-pointer border border-white/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Meal Train</h3>
                    <div className="w-8 h-8 rounded-full bg-[#14B8A6] flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {!hasMealTrain ? (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-sm text-gray-500">No active meal train</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-white/40">
                        <p className="text-sm font-medium text-gray-800 mb-2">Meal Train Active</p>
                        {mealTrain.availabilityStartDate && mealTrain.availabilityEndDate && (
                          <p className="text-xs text-gray-600">
                            {new Date(mealTrain.availabilityStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(mealTrain.availabilityEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                      
                      {mealTrain.location && (
                        <div className="p-3 rounded-lg bg-gradient-to-br from-[#14B8A6]/20 to-[#14B8A6]/10">
                          <p className="text-xs text-gray-600">📍 {mealTrain.location}</p>
                        </div>
                      )}
                      
                      {mealTrain.favoriteMeals && (
                        <div className="p-3 rounded-lg bg-white/40">
                          <p className="text-xs font-medium text-gray-700 mb-1">Favorites</p>
                          <p className="text-xs text-gray-600">{mealTrain.favoriteMeals}</p>
                        </div>
                      )}
                      
                      {mealTrain.allergies && (
                        <div className="p-3 rounded-lg bg-red-50">
                          <p className="text-xs font-medium text-red-700 mb-1">Allergies</p>
                          <p className="text-xs text-red-600">{mealTrain.allergies}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600 text-center">
                      {hasMealTrain ? "Active meal train" : "No meal train"}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Quick Actions Widget */}
              {isPrimaryOrAdmin && (
                <div className="bg-gradient-to-br from-[#B08CA7]/40 to-[#B08CA7]/30 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-lg font-semibold text-white mb-4 drop-shadow">Get Support Now</h3>
                  
                  <div className="space-y-2">
                    <Link href="/needs">
                      <Button className="w-full bg-white/90 hover:bg-white text-[#B08CA7] font-semibold shadow-md rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Post a Need
                      </Button>
                    </Link>
                    
                    <Link href="/calendar">
                      <Button className="w-full bg-white/90 hover:bg-white text-[#14B8A6] font-semibold shadow-md rounded-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </Link>
                    
                    <Link href="/meal-train">
                      <Button className="w-full bg-white/90 hover:bg-white text-[#14B8A6] font-semibold shadow-md rounded-full">
                        <ChefHat className="w-4 h-4 mr-2" />
                        Start Meal Train
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Community Stats Widget */}
              <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Community Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Supporters</span>
                    <span className="text-lg font-bold text-[#14B8A6]">{users?.filter(u => u.status === "active").length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Needs Completed</span>
                    <span className="text-lg font-bold text-[#14B8A6]">{needs?.filter(n => n.status === "completed").length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <span className="text-lg font-bold text-[#14B8A6]">{events?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Meal Train</span>
                    <span className="text-lg font-bold text-[#14B8A6]">{hasMealTrain ? 1 : 0}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
