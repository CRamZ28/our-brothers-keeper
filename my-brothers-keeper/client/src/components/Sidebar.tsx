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
    <div className="h-full px-5 pb-5 flex flex-col">
      
      {/* Logo - displayed directly on sidebar */}
      <div className="flex justify-center pt-0 pb-2 mb-4">
        <img
          src="/obk-emblem.png"
          alt="Our Brother's Keeper logo"
          className="h-64 w-auto max-w-full"
          loading="eager"
        />
      </div>

      {/* Navigation list */}
      <nav className="space-y-1 -mt-12">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                relative flex items-center gap-3 h-11 pl-4 pr-4 rounded-xl w-full text-left
                transition-all duration-200 ease-in-out text-teal-700
                ${isActive 
                  ? 'shadow-[0_4px_15px_rgba(176,140,167,0.3)]' 
                  : 'hover:bg-white/40 hover:translate-x-1'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50
              `}
              style={isActive ? {
                background: 'rgba(176, 140, 167, 0.7)',
                color: '#0D5F5D'
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
      </nav>

      {/* Bottom user profile section */}
      <div className="mt-auto pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/40 transition-all duration-200 ease-in-out w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-teal-700"
            >
              <Avatar className="h-9 w-9 border-2 border-white/40 shrink-0">
                <AvatarFallback 
                  className="text-xs font-medium text-teal-800"
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
                <p className="text-xs truncate mt-1.5 opacity-70">
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
