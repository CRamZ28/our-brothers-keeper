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
    <aside className="w-[280px] min-h-screen bg-[linear-gradient(180deg,#0F6F67_0%,#1E9087_55%,#279F96_100%)] ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] px-5 pt-6 pb-5 flex flex-col rounded-[28px] relative overflow-hidden">
      
      {/* Inner light gradient at top */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Logo block */}
      <div className="relative flex flex-col items-center mb-8 z-10">
        {/* Soft teal halo behind the emblem */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-teal-300/30 blur-2xl -z-10"></div>

        {/* Emblem - larger and more prominent */}
        <img
          src="/obk-emblem.png"
          alt="Our Brother's Keeper logo"
          className="w-[72px] h-[72px] mx-auto mt-4 drop-shadow-[0_0_22px_rgba(107,196,184,.45)]"
          loading="eager"
        />

        {/* Wordmark - refined and balanced */}
        <div className="mt-3 text-[16px] leading-tight text-center">
          <div className="font-semibold tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" style={{ fontVariant: 'small-caps' }}>
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>O</span>ur{' '}
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>B</span>rother's{' '}
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>K</span>eeper
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="space-y-1 relative z-10">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                relative flex items-center gap-3 h-11 pl-[18px] rounded-xl w-full text-left
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-[#B08CA7]/40 backdrop-blur-md border border-white/20 shadow-[0_0_12px_rgba(176,140,167,0.4)] text-white' 
                  : 'text-white/90 hover:bg-white/10 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:text-white'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                ${isActive ? 'before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[4px] before:h-[24px] before:bg-[#B08CA7] before:rounded-full' : ''}
              `}
            >
              {/* Icon */}
              <Icon className={`w-[20px] h-[20px] ${isActive ? 'text-white' : 'text-white/90'}`} />
              
              {/* Label */}
              <span className="text-[15px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom user profile section */}
      <div className="mt-auto pt-4 relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/10 transition-all duration-200 ease-in-out w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
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
