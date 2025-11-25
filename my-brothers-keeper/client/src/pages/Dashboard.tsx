import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Users, Heart, Calendar, Bell, MessageSquare, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { TourProvider } from "@/hooks/useTour";
import MemorialSlideshow from "@/components/MemorialSlideshow";
import MemorialQuote from "@/components/MemorialQuote";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: reminders } = trpc.reminder.list.useQuery();
  const { data: updates } = trpc.updates.list.useQuery();
  
  const { data: availableTours} = trpc.onboarding.listAvailableTours.useQuery(
    { scope: "household" },
    { enabled: !!user?.householdId }
  );
  
  const isAdminOrPrimary = user?.role === "admin" || user?.role === "primary";
  
  const householdTour = availableTours?.find(t => 
    isAdminOrPrimary ? t.slug === "household.setup.v1" : t.slug === "supporter.welcome.v1"
  );
  
  const shouldAutoStart = householdTour && (
    !householdTour.progress?.status || 
    householdTour.progress?.status === "not_started"
  );

  if (!household) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-foreground/80">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const openNeeds = needs?.filter((n) => n.status === "open") || [];
  
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.startAt);
    return eventDate >= now && eventDate <= oneWeekFromNow;
  }) || [];

  const upcomingReminders = reminders?.filter((r) => r.status === "queued") || [];

  const recentUpdates = updates?.slice(0, 3) || [];

  return (
    <DashboardLayout>
      {householdTour && (
        <TourProvider
          tourDbId={householdTour.id}
          tourSlug={householdTour.slug}
          autoStart={shouldAutoStart}
          continuous={true}
        />
      )}
      <div className="p-4 md:p-6 lg:p-8 w-full" data-tour="dashboard">
        
        {/* Family Name - Top Center */}
        <div className="flex flex-col items-center mb-8 space-y-3">
          <div 
            className="px-8 py-4 rounded-full"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            <h1 
              className="text-2xl sm:text-3xl lg:text-[36px] font-semibold tracking-wide text-center"
              style={{
                fontFamily: "'Cinzel', serif",
                color: '#0fa9a7',
                filter: 'drop-shadow(0 2px 4px rgba(15,169,167,0.3))'
              }}
            >
              {household.name.split(' ').map((word, idx) => (
                <span key={idx}>
                  {idx > 0 && ' '}
                  <span className="text-3xl sm:text-4xl lg:text-[48px]" style={{ color: '#1fb5b0' }}>
                    {word.charAt(0).toUpperCase()}
                  </span>
                  {word.slice(1).toLowerCase()}
                </span>
              ))}
            </h1>
          </div>

          {/* Memorial Subtitle */}
          {household.showMemorialSubtitle && household.memorialName && (
            <p 
              className="text-base sm:text-lg md:text-xl italic tracking-wide text-center px-4"
              style={{ 
                fontFamily: 'Georgia, serif',
                color: '#4d7c7a',
                textShadow: '0 1px 3px rgba(45, 181, 168, 0.15)',
                letterSpacing: '0.02em'
              }}
            >
              In Loving Memory of{' '}
              <span 
                className="font-semibold not-italic"
                style={{ 
                  color: '#2DB5A8',
                  textShadow: '0 1px 4px rgba(45, 181, 168, 0.25)'
                }}
              >
                {household.memorialName}
              </span>
              {(household.memorialBirthDate || household.memorialPassingDate) && (
                <span className="block mt-1 text-sm sm:text-base" style={{ color: '#5a8887' }}>
                  {household.memorialBirthDate && household.memorialPassingDate && (
                    <span>
                      {formatMemorialDate(household.memorialBirthDate)} - {formatMemorialDate(household.memorialPassingDate)}
                    </span>
                  )}
                  {household.memorialBirthDate && !household.memorialPassingDate && (
                    <span>Born {formatMemorialDate(household.memorialBirthDate)}</span>
                  )}
                  {!household.memorialBirthDate && household.memorialPassingDate && (
                    <span>Passed {formatMemorialDate(household.memorialPassingDate)}</span>
                  )}
                </span>
              )}
            </p>
          )}

          {/* Memorial Quote - Centered under dates */}
          {household.dashboardQuote && (
            <div className="mt-4 max-w-2xl mx-auto">
              <MemorialQuote 
                quote={household.dashboardQuote} 
                attribution={household.dashboardQuoteAttribution || undefined}
              />
            </div>
          )}
        </div>

        {/* AT-A-GLANCE HUB: 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 text-white" />}
            label="Supporters"
            count={activeUsers.length}
            href="/people"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-white" />}
            label="Open Needs"
            count={openNeeds.length}
            href="/needs"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-white" />}
            label="Events This Week"
            count={upcomingEvents.length}
            href="/calendar"
          />
          <StatCard
            icon={<Bell className="w-5 h-5 text-white" />}
            label="My Reminders"
            count={upcomingReminders.length}
            href="/reminders"
          />
        </div>

        {/* AT-A-GLANCE HUB: 2 Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Latest Family Updates */}
          <div 
            className="rounded-2xl p-6 flex flex-col"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Latest Family Updates</h2>
            </div>
            
            {recentUpdates.length === 0 ? (
              <p className="text-foreground/70 text-sm mb-4">No updates yet. Share a family update to keep everyone connected.</p>
            ) : (
              <div className="space-y-3 mb-4 flex-1">
                {recentUpdates.map((update) => (
                  <div 
                    key={update.id}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: getUpdateTypeColor(update.type),
                          color: 'white'
                        }}
                      >
                        {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                      </span>
                      <span className="text-xs text-foreground/60">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/85 line-clamp-2">{update.body}</p>
                  </div>
                ))}
              </div>
            )}
            
            <Link href="/family-updates">
              <button 
                className="w-full px-4 py-2 text-sm text-white font-medium rounded-lg transition-all hover:bg-[#1fa09e]"
                style={{ backgroundColor: '#2DB5A8' }}
              >
                View All Updates
              </button>
            </Link>
          </div>

          {/* Resources & Support */}
          <div 
            className="rounded-2xl p-6 flex flex-col"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#B08CA7' }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Resources & Support</h2>
            </div>
            
            <div className="flex-1 mb-4">
              <p className="text-foreground/85 mb-4 leading-relaxed">
                Faith-based grief guidance, community support, and helpful reminders for checking in on loved ones.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm" style={{ color: '#2DB5A8' }}>✓</span>
                  <p className="text-sm text-foreground/80">Guidance for those who are grieving</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm" style={{ color: '#2DB5A8' }}>✓</span>
                  <p className="text-sm text-foreground/80">Support tips for friends & family</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm" style={{ color: '#2DB5A8' }}>✓</span>
                  <p className="text-sm text-foreground/80">Reminder ideas for staying connected</p>
                </div>
              </div>
            </div>
            
            <Link href="/resources">
              <button 
                className="w-full px-4 py-2 text-sm text-white font-medium rounded-lg transition-all hover:bg-[#9A7890]"
                style={{ backgroundColor: '#B08CA7' }}
              >
                Explore Resources
              </button>
            </Link>
          </div>
        </div>

        {/* Memorial Photo Slideshow */}
        {household.dashboardPhotos && household.dashboardPhotos.length > 0 && (
          <div className="mt-6 max-w-3xl mx-auto">
            <MemorialSlideshow photos={household.dashboardPhotos} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, count, href }: { 
  icon: React.ReactNode; 
  label: string; 
  count: number; 
  href: string; 
}) {
  return (
    <Link href={href}>
      <div 
        className="rounded-xl p-5 cursor-pointer group hover:shadow-lg transition-all duration-300"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#2DB5A8' }}>
            {icon}
          </div>
          <p className="text-xs text-foreground/70 font-medium">{label}</p>
        </div>
        <p className="text-3xl font-bold text-foreground ml-11">{count}</p>
      </div>
    </Link>
  );
}

function formatMemorialDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function getUpdateTypeColor(type: string): string {
  switch (type) {
    case 'gratitude':
      return '#2DB5A8';
    case 'memory':
      return '#B08CA7';
    case 'milestone':
      return '#4a90e2';
    default:
      return '#6b7280';
  }
}
