import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user?: {
    id: string;
    name?: string | null;
    profileImageUrl?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

function getInitials(user?: UserAvatarProps["user"]): string {
  if (!user) return "?";
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.name) {
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  }
  
  return "?";
}

export function UserAvatar({ user, size = "md", className = "", showName = false }: UserAvatarProps) {
  const displayName = user?.name || (user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : null);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {user?.profileImageUrl && (
          <AvatarImage src={user.profileImageUrl} alt={displayName || "User"} />
        )}
        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white font-medium">
          {user ? getInitials(user) : <User className="w-1/2 h-1/2" />}
        </AvatarFallback>
      </Avatar>
      {showName && displayName && (
        <span className="text-sm font-medium text-gray-700">{displayName}</span>
      )}
    </div>
  );
}
