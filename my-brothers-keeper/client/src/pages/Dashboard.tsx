import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { UserAvatar } from "@/components/UserAvatar";
import { Calendar as CalendarIcon, Plus, Check, Users2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: mealSignups } = trpc.mealTrain.listSignups.useQuery();

  if (!household) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = users?.filter((u) => u.status === "active").slice(0, 5) || [];
  const openNeeds = needs?.filter((n) => n.status === "open").slice(0, 3) || [];
  const upcomingEvents = events?.filter((e) => new Date(e.startAt) >= new Date()).slice(0, 4) || [];
  const upcomingMeals = mealSignups?.filter((s) => new Date(s.deliveryDate) >= new Date()).slice(0, 3) || [];

  return (
    <DashboardLayout>
      {/* Background with gradient orbs like mockup */}
      <div className="min-h-screen bg-gradient-to-br from-[#A8E6E1] via-[#C4F1E8] to-[#E8D5F2] relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#14B8A6]/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#B08CA7]/20 to-transparent rounded-full blur-3xl"></div>
        
        {/* Main container */}
        <div className="relative z-10 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Large glassmorphism container */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              
              {/* Dashboard Title */}
              <h1 className="text-3xl font-bold text-gray-700/80 mb-8">
                Dashboard
              </h1>

              {/* Widget Grid - 2 columns on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Supporters Widget */}
                <Link href="/people">
                  <div className="bg-gradient-to-br from-[#C4F1E8]/60 to-[#C4F1E8]/40 backdrop-blur-md rounded-3xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/50">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-700">Supporters</h3>
                      <div className="w-9 h-9 rounded-full bg-[#14B8A6] flex items-center justify-center shadow-sm">
                        <Users2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Circular avatar arrangement like mockup */}
                    <div className="relative h-40 flex items-center justify-center">
                      {activeUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">No supporters yet</p>
                      ) : (
                        <div className="relative w-full h-full">
                          {activeUsers.map((supporter, index) => {
                            const angle = (index * 360) / Math.min(activeUsers.length, 5);
                            const radius = 55;
                            const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                            const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
                            
                            return (
                              <div
                                key={supporter.id}
                                className="absolute top-1/2 left-1/2"
                                style={{
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                }}
                              >
                                <UserAvatar user={supporter} size="lg" />
                              </div>
                            );
                          })}
                          {/* Plus button in center */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-md border-2 border-[#14B8A6]/30">
                              <Plus className="w-5 h-5 text-[#14B8A6]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Open Needs Widget */}
                <Link href="/needs">
                  <div className="bg-gradient-to-br from-[#F8D5E8]/60 to-[#F8D5E8]/40 backdrop-blur-md rounded-3xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/50">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-700">Open Needs</h3>
                      <div className="w-9 h-9 rounded-full bg-[#B08CA7] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">{openNeeds.length}</span>
                      </div>
                    </div>
                    
                    {/* Needs list with checkboxes */}
                    <div className="space-y-3">
                      {openNeeds.length === 0 ? (
                        <div className="h-32 flex items-center justify-center">
                          <p className="text-sm text-gray-500">No open needs</p>
                        </div>
                      ) : (
                        openNeeds.map((need) => (
                          <div key={need.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/50">
                            <div className="w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {need.status === "completed" && <Check className="w-3 h-3 text-[#14B8A6]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{need.title}</p>
                              {need.description && (
                                <p className="text-xs text-gray-500 truncate">{need.description}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Link>

                {/* Upcoming Events Widget */}
                <Link href="/calendar">
                  <div className="bg-gradient-to-br from-[#E8D5F2]/60 to-[#E8D5F2]/40 backdrop-blur-md rounded-3xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/50">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-700">Upcoming Events</h3>
                      <div className="w-9 h-9 rounded-full bg-[#B08CA7] flex items-center justify-center shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Mini calendar grid */}
                    {upcomingEvents.length === 0 ? (
                      <div className="h-32 flex items-center justify-center">
                        <p className="text-sm text-gray-500">No upcoming events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => {
                          const eventDate = new Date(event.startAt);
                          const month = eventDate.toLocaleDateString("en-US", { month: "short" });
                          const day = eventDate.getDate();
                          
                          return (
                            <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#6BC4B8] flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm">
                                <div className="text-[10px] font-semibold leading-none">{month.toUpperCase()}</div>
                                <div className="text-xl font-bold leading-none mt-0.5">{day}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{event.title}</p>
                                <p className="text-xs text-gray-500">{eventDate.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Upcoming Meal Cares Widget */}
                <Link href="/meal-train">
                  <div className="bg-gradient-to-br from-[#C4F1E8]/60 to-[#C4F1E8]/40 backdrop-blur-md rounded-3xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/50">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-700">Upcoming Meal Cares</h3>
                      <div className="w-9 h-9 rounded-full bg-[#14B8A6] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">{upcomingMeals.length}</span>
                      </div>
                    </div>
                    
                    {/* Meal signup list */}
                    <div className="space-y-3">
                      {upcomingMeals.length === 0 ? (
                        <div className="h-32 flex items-center justify-center">
                          <p className="text-sm text-gray-500">No upcoming meals</p>
                        </div>
                      ) : (
                        upcomingMeals.map((signup) => {
                          const mealDate = new Date(signup.deliveryDate);
                          
                          return (
                            <div key={signup.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#14B8A6] flex items-center justify-center text-white text-sm font-semibold">
                                {signup.userName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700">{signup.userName || "Anonymous"}</p>
                                <p className="text-xs text-gray-500">{mealDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                              </div>
                              <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
