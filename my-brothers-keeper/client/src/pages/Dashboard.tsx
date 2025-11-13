import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Heart, Calendar, Quote as QuoteIcon, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { TourProvider } from "@/hooks/useTour";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: needs } = trpc.needs.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: userClaims } = trpc.needs.listUserClaims.useQuery();
  const { data: userMealSignups } = trpc.mealTrain.listUserSignups.useQuery();
  
  const { data: availableTours } = trpc.onboarding.listAvailableTours.useQuery(
    { scope: "household" },
    { enabled: !!user?.householdId }
  );
  
  const isAdminOrPrimary = user?.role === "admin" || user?.role === "primary";
  const isSupporter = user?.role === "supporter";
  
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

  const totalCommitments = (userClaims?.length || 0) + (userMealSignups?.length || 0);

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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto" data-tour="dashboard">
        
        {/* Top Section - Centered Family Name & Photo */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          {/* Family Name Pill */}
          <div 
            className="px-10 py-5 rounded-full"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <h1 
              className="text-2xl sm:text-3xl lg:text-[36px] font-semibold tracking-wide text-center overflow-hidden px-2"
              style={{
                fontFamily: "'Cinzel', serif",
                color: '#0fa9a7',
                filter: 'drop-shadow(0 0 8px rgba(15,169,167,0.7))'
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

          {/* Dashboard Display - Conditional Rendering */}
          <DashboardDisplay household={household} />
        </div>

        {/* Four Square Cards Grid - 2x2 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Supporters */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Supporters</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{activeUsers.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              <Link href="/people?invite=true">
                <div 
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Users className="w-8 h-8 text-foreground/60 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Invite friends & family</p>
                  <p className="text-xs text-foreground/70 mt-1">Build your support network</p>
                </div>
              </Link>
            </div>

            {/* Button at bottom */}
            <Link href="/people">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View All
              </button>
            </Link>
          </div>

          {/* Card 2: Open Needs */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Open Needs</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{openNeeds.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {openNeeds.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-foreground/70 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No open needs
                </div>
              ) : (
                openNeeds.slice(0, 2).map((need) => (
                  <NeedCard key={need.id} need={need} />
                ))
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/needs">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View All
              </button>
            </Link>
          </div>

          {/* Card 3: Upcoming Events */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{upcomingEvents.length}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {upcomingEvents.length === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-foreground/70 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No events this week
                </div>
              ) : (
                upcomingEvents.slice(0, 2).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/calendar">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View Calendar
              </button>
            </Link>
          </div>

          {/* Card 4: My Commitments */}
          <div 
            className="rounded-2xl p-6 flex flex-col group hover:shadow-lg transition-all duration-300"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#2DB5A8' }}>
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">My Commitments</h2>
            </div>

            {/* Large number with teal accent bar */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">{totalCommitments}</div>
              <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #2DB5A8, #4DD0C4)' }}></div>
            </div>

            {/* Preview items */}
            <div className="flex-1 space-y-3 mb-6">
              {totalCommitments === 0 ? (
                <div 
                  className="p-3 rounded-lg text-center text-sm text-foreground/70 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  No active commitments
                </div>
              ) : (
                <>
                  {userClaims?.slice(0, 2).map((need) => (
                    <CommitmentCard key={`need-${need.id}`} item={need} type="need" />
                  ))}
                  {userMealSignups?.slice(0, 2 - (userClaims?.length || 0)).map((signup) => (
                    <CommitmentCard key={`meal-${signup.id}`} item={signup} type="meal" />
                  ))}
                </>
              )}
            </div>

            {/* Button at bottom */}
            <Link href="/needs">
              <button 
                className="w-full py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#B08CA7',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
              >
                View All
              </button>
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

// Dashboard Display Components
function DashboardDisplay({ household }: { household: any }) {
  const displayType = household.dashboardDisplayType || "none";
  
  if (displayType === "none") return null;
  
  return (
    <div 
      className="w-full max-w-2xl rounded-2xl overflow-hidden flex items-center justify-center"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 0 0 2px rgba(176, 140, 167, 0.4), 0 0 20px rgba(176, 140, 167, 0.5), 0 0 40px rgba(176, 140, 167, 0.3), 0 12px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        aspectRatio: '16 / 9',
        minHeight: '300px'
      }}
    >
      {displayType === "photo" && <SinglePhoto photoUrl={household.photoUrl} />}
      {displayType === "slideshow" && <PhotoSlideshow photos={household.dashboardPhotos || []} />}
      {displayType === "quote" && (
        <QuoteBlock 
          quote={household.dashboardQuote} 
          attribution={household.dashboardQuoteAttribution} 
        />
      )}
      {displayType === "memory" && <FeaturedMemory memoryId={household.dashboardFeaturedMemoryId} />}
    </div>
  );
}

function SinglePhoto({ photoUrl }: { photoUrl?: string | null }) {
  if (!photoUrl) {
    return (
      <p className="text-foreground/70 text-sm italic px-6 text-center">
        No family photo uploaded. Add one in Settings → Household Settings.
      </p>
    );
  }
  
  return (
    <img 
      src={photoUrl} 
      alt="Family" 
      className="w-full h-full object-cover"
    />
  );
}

function PhotoSlideshow({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset state when photos array changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
  }, [photos]);
  
  useEffect(() => {
    // Don't rotate if fewer than 2 photos
    if (!photos || photos.length < 2) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setIsTransitioning(false);
      }, 300); // Match transition duration
    }, 5000); // Rotate every 5 seconds
    
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [photos]);
  
  if (!photos || photos.length === 0) {
    return (
      <p className="text-foreground/70 text-sm italic px-6 text-center">
        No slideshow photos configured. Add 3-5 photos in Settings → Dashboard Display.
      </p>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      <img 
        src={photos[currentIndex]} 
        alt={`Slideshow ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isTransitioning ? 0.3 : 1 }}
      />
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {photos.map((_, idx) => (
            <div 
              key={idx}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: idx === currentIndex ? '#2DB5A8' : 'rgba(255, 255, 255, 0.5)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteBlock({ quote, attribution }: { quote?: string | null; attribution?: string | null }) {
  if (!quote) {
    return (
      <p className="text-foreground/70 text-sm italic px-6 text-center">
        No memorial quote configured. Add one in Settings → Dashboard Display.
      </p>
    );
  }
  
  return (
    <div className="px-8 py-6 text-center max-w-xl">
      <QuoteIcon className="w-8 h-8 text-[#2DB5A8] mx-auto mb-4 opacity-60" />
      <p className="text-foreground text-lg italic leading-relaxed mb-3">
        "{quote}"
      </p>
      {attribution && (
        <p className="text-foreground/70 text-sm font-medium">
          — {attribution}
        </p>
      )}
    </div>
  );
}

function FeaturedMemory({ memoryId }: { memoryId?: number | null }) {
  // TODO: Integrate with Memory Wall to fetch and display the selected memory
  // For now, show a placeholder message
  return (
    <p className="text-foreground/70 text-sm italic px-6 text-center">
      Featured memory display coming soon. This will show a selected memory from your Memory Wall.
    </p>
  );
}

function NeedCard({ need }: { need: any }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const claimCount = need.claimCount || 0;
  const capacity = need.capacity;
  const hasCapacity = capacity !== null && capacity !== undefined;
  
  return (
    <div 
      className="p-3 rounded-lg transition-all duration-300 overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.3)',
        maxHeight: isHovered ? '300px' : '80px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground overflow-hidden line-clamp-2 flex-1">
          {need.title}
        </p>
        {hasCapacity && (
          <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{
            background: claimCount >= capacity ? '#B08CA7' : '#2DB5A8',
            color: 'white'
          }}>
            {claimCount} of {capacity}
          </div>
        )}
      </div>
      
      {isHovered && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {need.details && (
            <div>
              <p className="text-xs font-medium text-foreground/80 mb-1">Details:</p>
              <p className="text-xs text-foreground/70 line-clamp-3">{need.details}</p>
            </div>
          )}
          {need.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/80">Category:</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: 'rgba(45, 181, 168, 0.2)',
                color: '#2DB5A8'
              }}>
                {need.category}
              </span>
            </div>
          )}
          {need.priority && need.priority !== 'normal' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/80">Priority:</span>
              <span className="text-xs px-2 py-0.5 rounded capitalize" style={{
                background: need.priority === 'urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                color: need.priority === 'urgent' ? '#ef4444' : '#f59e0b'
              }}>
                {need.priority}
              </span>
            </div>
          )}
          {need.dueAt && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/80">Due:</span>
              <span className="text-xs text-foreground/70">
                {new Date(need.dueAt).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const eventDate = new Date(event.startAt);
  const eventEndDate = event.endAt ? new Date(event.endAt) : null;

  return (
    <div 
      className="p-3 rounded-lg transition-all duration-300 overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.3)',
        maxHeight: isHovered ? '250px' : '70px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground overflow-hidden line-clamp-2 flex-1">
          {event.title}
        </p>
      </div>
      <p className="text-xs text-foreground/70 mt-1">
        {eventDate.toLocaleDateString("en-US", { 
          weekday: "short", 
          month: "short", 
          day: "numeric"
        })}
      </p>
      
      {isHovered && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground/80">Time:</span>
            <span className="text-xs text-foreground/70">
              {eventDate.toLocaleTimeString("en-US", { 
                hour: "numeric", 
                minute: "2-digit",
                hour12: true
              })}
              {eventEndDate && ` - ${eventEndDate.toLocaleTimeString("en-US", { 
                hour: "numeric", 
                minute: "2-digit",
                hour12: true
              })}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/80">Location:</span>
              <span className="text-xs text-foreground/70 line-clamp-1">{event.location}</span>
            </div>
          )}
          {event.description && (
            <div>
              <p className="text-xs font-medium text-foreground/80 mb-1">Details:</p>
              <p className="text-xs text-foreground/70 line-clamp-2">{event.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommitmentCard({ item, type }: { item: any; type: 'need' | 'meal' }) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (type === 'need') {
    return (
      <div 
        className="p-3 rounded-lg transition-all duration-300 overflow-hidden cursor-pointer"
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          maxHeight: isHovered ? '200px' : '70px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground overflow-hidden line-clamp-2">
              {item.title}
            </p>
          </div>
          <div className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium" style={{
            background: 'rgba(45, 181, 168, 0.2)',
            color: '#2DB5A8'
          }}>
            Need
          </div>
        </div>
        
        {isHovered && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {item.category && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground/80">Category:</span>
                <span className="text-xs text-foreground/70 capitalize">{item.category}</span>
              </div>
            )}
            {item.dueAt && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground/80">Due:</span>
                <span className="text-xs text-foreground/70">
                  {new Date(item.dueAt).toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className="p-3 rounded-lg transition-all duration-300 overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.3)',
        maxHeight: isHovered ? '200px' : '70px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground overflow-hidden line-clamp-2">
            Meal Delivery
          </p>
        </div>
        <div className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium" style={{
          background: 'rgba(176, 140, 167, 0.2)',
          color: '#B08CA7'
        }}>
          Meal
        </div>
      </div>
      
      {isHovered && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground/80">Date:</span>
            <span className="text-xs text-foreground/70">
              {new Date(item.date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
          {item.note && (
            <div>
              <p className="text-xs font-medium text-foreground/80 mb-1">Note:</p>
              <p className="text-xs text-foreground/70 line-clamp-2">{item.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
