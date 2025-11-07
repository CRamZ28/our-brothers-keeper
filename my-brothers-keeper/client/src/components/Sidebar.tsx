import { useLocation } from "wouter";
import {
  Home,
  Heart,
  Calendar,
  ChefHat,
  MessageCircle,
  Sparkles,
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
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Sparkles, label: "Updates", path: "/updates" },
  { icon: BookHeart, label: "Memory Wall", path: "/memory-wall" },
  { icon: Gift, label: "Gift Registry", path: "/gift-registry" },
  { icon: Users, label: "People", path: "/people" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path: string) => {
    setLocation(path);
    onNavigate?.();
  };

  return (
    <aside className="w-72 min-h-screen sticky top-0 rounded-[28px] bg-[linear-gradient(180deg,#0a6f66_0%,#1d8f86_45%,#2ea79d_100%)] shadow-[0_10px_40px_rgba(0,0,0,.25)] border border-white/10 relative overflow-hidden">
      {/* Subtle inner highlight & edge */}
      <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-[28px]">
        <div className="h-32 bg-gradient-to-b from-white/5 to-transparent rounded-t-[28px]" />
      </div>

      {/* Logo block */}
      <div className="flex flex-col items-center pt-8 pb-6 relative z-10">
        <img
          src={APP_LOGO}
          alt="Our Brother's Keeper"
          className="w-16 h-16 drop-shadow-[0_0_18px_rgba(107,196,184,.45)]"
        />
        <h1 className="text-white font-semibold leading-tight text-center mt-3">
          Our<br />Brother's<br />Keeper
        </h1>
      </div>

      {/* Navigation list */}
      <nav className="px-4 space-y-2 relative z-10">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <div key={item.path} className="relative">
              {/* Active pill background */}
              {isActive && (
                <div className="absolute inset-y-0 left-2 right-2 rounded-xl bg-white/12 backdrop-blur-md border border-white/20" />
              )}

              {/* Nav item */}
              <button
                onClick={() => handleNavigate(item.path)}
                className={`
                  relative flex items-center gap-3 px-4 py-2 rounded-xl w-full text-left
                  transition-all duration-200
                  ${isActive 
                    ? 'text-white hover:ring-8 hover:ring-[#B08CA7]/18' 
                    : 'text-white/90 hover:text-white'
                  }
                  hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(0,0,0,.18)]
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B08CA7]/25
                `}
              >
                {/* Icon chip */}
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Label */}
                <span className="text-base font-medium tracking-tight">
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom user profile section */}
      <div className="mt-auto px-4 pb-5 relative z-10">
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
