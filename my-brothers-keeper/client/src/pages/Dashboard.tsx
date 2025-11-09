import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { UserAvatar } from "@/components/UserAvatar";
import { Calendar as CalendarIcon, Plus, Check, Settings as SettingsIcon, MoreHorizontal } from "lucide-react";
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

  const activeUsers = users?.filter((u) => u.status === "active").slice(0, 4) || [];
  const openNeeds = needs?.filter((n) => n.status === "open").slice(0, 3) || [];
  const upcomingEvents = events?.filter((e) => new Date(e.startAt) >= new Date()).slice(0, 3) || [];
  const upcomingMeals = mealSignups?.filter((s) => new Date(s.deliveryDate) >= new Date()).slice(0, 3) || [];

  return (
    <DashboardLayout>
      {/* Global background: teal radial gradient */}
      <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_30%,#1FB6A6_0%,#0F6F67_60%,#0B5C55_100%)] relative overflow-hidden">
        {/* Background light blobs for depth */}
        <div className="absolute -left-32 top-24 h-[400px] w-[400px] bg-teal-300/30 blur-[160px] rounded-full"></div>
        <div className="absolute right-[-100px] bottom-32 h-[320px] w-[320px] bg-white/20 blur-[180px] rounded-full"></div>
        
        {/* Content Panel */}
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Large glass container with depth */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-[0_12px_60px_rgba(0,0,0,.25)] ring-1 ring-white/10 p-8">
              
              {/* Header area */}
              <div className="mb-8">
                <h1 className="text-[32px] font-bold text-white leading-tight tracking-wide mb-2">
                  Community Dashboard
                </h1>
                <p className="text-white/70 text-[15px] font-medium">
                  Supporting {household.name} through community care and connection
                </p>
              </div>

              {/* Tile grid (2 rows × 3 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Row 1, Col 1: Supporters */}
                <Link href="/people">
                  <div className="bg-white/12 backdrop-blur-xl border border-white/18 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] hover:bg-white/14 hover:shadow-[0_14px_44px_rgba(0,0,0,0.22)] transition-all duration-200 ease-in-out cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-[18px]">
                        Supporters
                      </h3>
                      <div className="w-9 h-9 rounded-full bg-[#B08CA7]/45 flex items-center justify-center">
                        <SettingsIcon className="w-[18px] h-[18px] text-white" />
                      </div>
                    </div>
                    
                    {/* Network mini-avatars */}
                    <div className="relative h-32 flex items-center justify-center">
                      {activeUsers.length === 0 ? (
                        <p className="text-white/65 text-[14px]">No supporters yet</p>
                      ) : (
                        <>
                          {activeUsers.map((supporter, index) => {
                            const angle = (index * 360) / Math.min(activeUsers.length, 4);
                            const radius = 50;
                            const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                            const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
                            
                            return (
                              <div
                                key={supporter.id}
                                className="absolute top-1/2 left-1/2 ring-2 ring-white/40 rounded-full"
                                style={{
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                }}
                              >
                                <UserAvatar user={supporter} size="lg" />
                              </div>
                            );
                          })}
                          {/* + button */}
                          <div className="absolute bottom-0 left-4">
                            <button className="w-10 h-10 rounded-full bg-[#B08CA7] text-white p-2 shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out flex items-center justify-center">
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Row 1, Col 2: Open Needs */}
                <Link href="/needs">
                  <div className="bg-white/12 backdrop-blur-xl border border-white/18 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] hover:bg-white/14 hover:shadow-[0_14px_44px_rgba(0,0,0,0.22)] transition-all duration-200 ease-in-out cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-[18px]">
                        Open Needs
                      </h3>
                      <div className="w-9 h-9 rounded-full bg-[#B08CA7]/45 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{openNeeds.length}</span>
                      </div>
                    </div>
                    
                    {/* Three rows with icons */}
                    <div className="space-y-2">
                      {openNeeds.length === 0 ? (
                        <div className="h-32 flex items-center justify-center">
                          <p className="text-white/65 text-[14px]">No open needs</p>
                        </div>
                      ) : (
                        openNeeds.map((need) => (
                          <div key={need.id} className="rounded-xl bg-white/10 border border-white/15 h-[54px] px-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#6BC4B8]/30 flex items-center justify-center text-white flex-shrink-0">
                              {need.title.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/85 text-[14px] truncate">{need.title}</p>
                            </div>
                            <Check className="w-5 h-5 text-white/70 flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Link>

                {/* Row 1, Col 3: New Transactions (wider) */}
                <div className="bg-white/12 backdrop-blur-xl border border-white/18 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] hover:bg-white/14 hover:shadow-[0_14px_44px_rgba(0,0,0,0.22)] transition-all duration-200 ease-in-out lg:row-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-[18px]">
                      New transactions
                    </h3>
                  </div>
                  
                  {/* Row of avatars with names */}
                  <div className="flex items-center gap-4 mb-6">
                    {activeUsers.slice(0, 3).map((supporter) => (
                      <div key={supporter.id} className="flex flex-col items-center gap-2">
                        <div className="ring-2 ring-white/40 rounded-full">
                          <UserAvatar user={supporter} size="md" />
                        </div>
                        <span className="text-white/65 text-[13px] truncate max-w-[60px]">
                          {supporter.name?.split(' ')[0] || 'User'}
                        </span>
                      </div>
                    ))}
                    {/* Floating circular plus */}
                    <div className="relative -ml-2">
                      <button className="w-9 h-9 rounded-full bg-[#B08CA7] text-white p-2 shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA button - mauve gradient */}
                  <Link href="/needs">
                    <button className="h-11 w-full rounded-full bg-[linear-gradient(180deg,#B08CA7_0%,#8D6B85_100%)] text-white font-medium tracking-wide shadow-[0_8px_20px_rgba(176,140,167,.45)] hover:brightness-110 transition-all duration-200 ease-in-out">
                      Get Support Now
                    </button>
                  </Link>
                </div>

                {/* Row 2, Col 1: Upcoming Events */}
                <Link href="/calendar">
                  <div className="bg-white/12 backdrop-blur-xl border border-white/18 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] hover:bg-white/14 hover:shadow-[0_14px_44px_rgba(0,0,0,0.22)] transition-all duration-200 ease-in-out cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-[18px]">
                        Upcoming Events
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#B08CA7]/50 flex items-center justify-center">
                          <CalendarIcon className="w-[18px] h-[18px] text-white" />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <SettingsIcon className="w-[18px] h-[18px] text-white/70" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini calendar preview */}
                    <div className="grid grid-cols-3 gap-2">
                      {upcomingEvents.length === 0 ? (
                        <div className="col-span-3 h-20 flex items-center justify-center">
                          <p className="text-white/65 text-[14px]">No upcoming events</p>
                        </div>
                      ) : (
                        upcomingEvents.map((event) => {
                          const eventDate = new Date(event.startAt);
                          return (
                            <div key={event.id} className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                              <div className="text-white/85 text-xs font-semibold">
                                {eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                              </div>
                              <div className="text-white text-2xl font-bold">
                                {eventDate.getDate()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Link>

                {/* Row 2, Col 2: Upcoming/Next Meals */}
                <Link href="/meal-train">
                  <div className="bg-white/12 backdrop-blur-xl border border-white/18 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] hover:bg-white/14 hover:shadow-[0_14px_44px_rgba(0,0,0,0.22)] transition-all duration-200 ease-in-out cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-[18px]">
                        Upcoming Meal Cares
                      </h3>
                      <div className="w-9 h-9 rounded-full bg-[#B08CA7]/45 flex items-center justify-center">
                        <MoreHorizontal className="w-[18px] h-[18px] text-white" />
                      </div>
                    </div>
                    
                    {/* Two short rows */}
                    <div className="space-y-3">
                      {upcomingMeals.length === 0 ? (
                        <div className="h-20 flex items-center justify-center">
                          <p className="text-white/65 text-[14px]">No upcoming meals</p>
                        </div>
                      ) : (
                        upcomingMeals.slice(0, 2).map((signup) => {
                          const mealDate = new Date(signup.deliveryDate);
                          return (
                            <div key={signup.id} className="rounded-xl bg-white/10 border border-white/15 px-3 py-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#6BC4B8] flex items-center justify-center text-white text-sm font-semibold">
                                {signup.userName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/85 text-[14px]">{signup.userName || "Anonymous"}</p>
                                <p className="text-white/65 text-[13px]">{mealDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-[#6BC4B8]"></div>
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
