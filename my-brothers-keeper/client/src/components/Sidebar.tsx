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
} from "lucide-react";
import { APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Heart, label: "Needs", path: "/needs" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: ChefHat, label: "Meal Train", path: "/meal-train" },
  { icon: MessageSquare, label: "Family Updates", path: "/family-updates" },
  { icon: BookHeart, label: "Memory Wall", path: "/memory-wall" },
  { icon: Gift, label: "Gift Registry", path: "/gift-registry" },
  { icon: Users, label: "People", path: "/people" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = { onNavigate: undefined }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path: string) => {
    setLocation(path);
    onNavigate?.();
  };

  return (
    <aside className="w-[280px] min-h-screen bg-[linear-gradient(180deg,#0F6F67_0%,#1E9087_55%,#279F96_100%)] ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] px-5 pt-6 pb-5 flex flex-col rounded-[28px]">
      
      {/* Logo block */}
      <div className="relative flex flex-col items-center mb-8">
        {/* Soft teal halo behind the emblem */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-teal-300/25 blur-2xl -z-10"></div>

        {/* Emblem only - cross + hands + curved line */}
        <img
          src="/obk-emblem.png"
          alt="Our Brother's Keeper logo"
          className="w-14 h-14 drop-shadow-[0_0_22px_rgba(107,196,184,.45)]"
          loading="eager"
        />

        {/* Wordmark under logo - CSS small-caps with larger first letters */}
        <div className="mt-3 text-[#EAF4F3] text-center font-bold leading-tight tracking-[0.02em]">
          <div className="text-sm" style={{ fontVariant: 'small-caps' }}>
            <span className="text-base" style={{ fontVariant: 'normal' }}>O</span>ur{' '}
            <span className="text-base" style={{ fontVariant: 'normal' }}>B</span>rother's{' '}
            <span className="text-base" style={{ fontVariant: 'normal' }}>K</span>eeper
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                relative flex items-center gap-3 h-11 pl-[18px] rounded-xl w-full text-left
                transition-all duration-200
                ${isActive 
                  ? 'bg-[#B08CA7]/40 backdrop-blur-md border border-white/24 text-white hover:ring-4 hover:ring-[#B08CA7]/25' 
                  : 'text-white/90 hover:text-white hover:bg-white/5'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              `}
            >
              {/* Icon */}
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/90'}`} />
              
              {/* Label */}
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom user profile section */}
      <div className="mt-auto pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <Avatar className="h-9 w-9 border-2 border-white/30 shrink-0">
                <AvatarFallback className="text-xs font-medium bg-white/20 text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none text-white">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-white/70 truncate mt-1.5">
                  {user?.role || "supporter"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
