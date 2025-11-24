import { useLocation } from "wouter";
import {
  Home,
  Heart,
  Calendar,
  ChefHat,
  MessageSquare,
  BookHeart,
  Gift,
  Users,
  Settings,
  LogOut,
  Bell,
  MessageCircle,
  Mail,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

const navigationItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard", tourId: "dashboard" },
  { icon: Heart, label: "Needs", path: "/needs", tourId: "needs-nav" },
  { icon: Calendar, label: "Events", path: "/calendar", tourId: "events-nav" },
  { icon: ChefHat, label: "Meal Train", path: "/meal-train", tourId: "meal-train-nav" },
  { icon: MessageSquare, label: "Family Updates", path: "/family-updates", tourId: "updates-nav" },
  { icon: BookHeart, label: "Memory Wall", path: "/memory-wall", tourId: "memory-wall-nav" },
  { icon: Gift, label: "Gift Registry", path: "/gift-registry", tourId: "gift-registry-nav" },
  { icon: Bell, label: "Reminders", path: "/reminders", tourId: "reminders-nav" },
  { icon: Users, label: "People", path: "/people", tourId: "people-nav" },
  { icon: BookOpen, label: "Resources", path: "/resources", tourId: "resources-nav" },
  { icon: Settings, label: "Settings", path: "/settings", tourId: "settings-nav" },
  { icon: Mail, label: "Contact Support", path: "/contact", tourId: "contact-nav" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = { onNavigate: undefined }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  const isAdminOrPrimary = user?.role === "admin" || user?.role === "primary";
  
  // Get unread question count for admins/primary
  const { data: unreadCount } = trpc.messages.getUnreadQuestionCount.useQuery(
    undefined,
    { enabled: isAdminOrPrimary, refetchInterval: 30000 }
  );

  const handleNavigate = (path: string) => {
    setLocation(path);
    onNavigate?.();
  };

  return (
    <div className="h-full px-5 pb-5 flex flex-col">
      
      {/* Logo - displayed directly on sidebar */}
      <div className="flex justify-center pt-0 pb-2 mb-4 shrink-0">
        <img
          src="/obk-emblem.png"
          alt="Our Brother's Keeper logo"
          className="h-64 w-auto max-w-full"
          loading="eager"
        />
      </div>

      {/* Navigation list - scrollable */}
      <nav className="space-y-1 -mt-12 flex-1 overflow-y-auto overflow-x-hidden">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              data-tour={item.tourId}
              className={`
                relative flex items-center gap-3 h-11 pl-4 pr-4 rounded-xl w-full text-left
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'text-white shadow-[0_4px_15px_rgba(176,140,167,0.3)]' 
                  : 'text-foreground hover:bg-white/40 hover:translate-x-1 active:bg-white/50 focus:bg-white/40'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50
              `}
              style={isActive ? {
                background: 'rgba(176, 140, 167, 0.7)'
              } : undefined}
            >
              {/* Icon */}
              <Icon className="w-[18px] h-[18px] transition-all duration-200" />
              
              {/* Label */}
              <span className="text-[14px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Questions link - only for admins/primary */}
        {isAdminOrPrimary && (
          <button
            onClick={() => handleNavigate("/questions")}
            className={`
              relative flex items-center gap-3 h-11 pl-4 pr-4 rounded-xl w-full text-left
              transition-all duration-200 ease-in-out
              ${location === "/questions"
                ? 'text-white shadow-[0_4px_15px_rgba(176,140,167,0.3)]' 
                : 'text-foreground hover:bg-white/40 hover:translate-x-1 active:bg-white/50 focus:bg-white/40'
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50
            `}
            style={location === "/questions" ? {
              background: 'rgba(176, 140, 167, 0.7)'
            } : undefined}
          >
            {/* Icon */}
            <MessageCircle className="w-[18px] h-[18px] transition-all duration-200" />
            
            {/* Label */}
            <span className="text-[14px] font-medium">
              Questions{unreadCount && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </span>
          </button>
        )}
      </nav>

      {/* Bottom user profile section */}
      <div className="mt-auto pt-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/50 transition-all duration-200 ease-in-out w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-foreground"
              style={{
                background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.35) 0%, rgba(155, 127, 184, 0.28) 100%)'
              }}
            >
              <Avatar className="h-9 w-9 border-2 border-white/40 shrink-0">
                <AvatarFallback 
                  className="text-xs font-medium text-foreground"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none">
                  {user?.name || "-"}
                </p>
                {(user?.role === "admin" || user?.role === "primary") ? (
                  <span 
                    className="inline-block text-xs font-semibold px-2 py-0.5 rounded mt-1.5 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                      boxShadow: '0 1px 3px rgba(20, 184, 166, 0.4)'
                    }}
                  >
                    {user.role}
                  </span>
                ) : (
                  <p className="text-xs truncate mt-1.5 opacity-70">
                    {user?.role || "supporter"}
                  </p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive !focus:bg-teal-50 !hover:bg-teal-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
