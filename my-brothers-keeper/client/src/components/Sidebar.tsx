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
    <div className="h-full px-5 pt-6 pb-5 flex flex-col">
      
      {/* Logo block */}
      <div className="relative flex flex-col items-center mb-8">
        {/* Emblem */}
        <img
          src="/obk-emblem.png"
          alt="Our Brother's Keeper logo"
          className="w-[80px] h-[80px] mx-auto mt-4"
          loading="eager"
        />

        {/* Wordmark - small caps with larger first letters */}
        <div className="mt-2 text-[16px] font-semibold tracking-wide text-teal-800 text-center leading-tight">
          <div style={{ 
            fontVariant: 'small-caps'
          }}>
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>O</span>ur{' '}
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>B</span>rother's{' '}
            <span className="text-[18px]" style={{ fontVariant: 'normal' }}>K</span>eeper
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
                relative flex items-center gap-3 h-11 pl-[18px] pr-4 rounded-xl w-full text-left
                transition-all duration-300 ease-in-out
                ${isActive 
                  ? 'bg-[#B08CA7]/60 text-white shadow-[0_4px_15px_rgba(176,140,167,0.3)]' 
                  : 'text-teal-800 hover:bg-white/30 hover:translate-x-1'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40
              `}
            >
              {/* Icon */}
              <Icon 
                className={`w-[20px] h-[20px] transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-teal-700'
                }`} 
              />
              
              {/* Label */}
              <span className="text-[15px] font-medium">
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
            <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/30 transition-all duration-300 ease-in-out w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40">
              <Avatar className="h-9 w-9 border-2 border-teal-600/30 shrink-0">
                <AvatarFallback className="text-xs font-medium bg-white/40 text-teal-800">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none text-teal-800">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-teal-700 truncate mt-1.5">
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
    </div>
  );
}
