import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, HTMLAttributes } from "react";

export const glassStyles = {
  card: "backdrop-blur-[6px] bg-white/10 border border-white/20 rounded-2xl shadow-lg min-w-0",
  panel: "backdrop-blur-[6px] bg-white/10 border border-white/20 rounded-xl min-w-0",
  badge: "backdrop-blur-[6px] bg-white/20 border border-white/30 rounded-full px-3 py-1 text-xs font-medium break-words",
  button: {
    primary: "bg-[#B08CA7]/70 hover:bg-[#B08CA7]/85 text-white backdrop-blur-sm border border-white/30 transition-all hover:shadow-lg",
    secondary: "bg-white/20 hover:bg-white/30 text-foreground backdrop-blur-sm border border-white/30 transition-all",
    outline: "bg-transparent hover:bg-white/10 text-foreground backdrop-blur-sm border-2 border-white/40 transition-all",
  },
  input: "backdrop-blur-sm bg-white/30 border-white/40 text-foreground placeholder:text-foreground/50 focus:border-white/60 focus:ring-white/20",
  select: "backdrop-blur-sm bg-white/30 border-white/40 text-foreground focus:border-white/60 focus:ring-white/20",
  textarea: "backdrop-blur-sm bg-white/30 border-white/40 text-foreground placeholder:text-foreground/50 focus:border-white/60 focus:ring-white/20",
};

export const colors = {
  teal: {
    primary: "#2DB5A8",
    light: "#1fb5b0",
    dark: "#0fa9a7",
    text: "#0D5F5D",
  },
  mauve: {
    primary: "#B08CA7",
    hover: "rgba(176, 140, 167, 0.85)",
    active: "rgba(176, 140, 167, 0.7)",
  },
};

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassStyles.card, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassStyles.panel, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "teal" | "mauve";
}

export const GlassBadge = forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "text-foreground",
      teal: "bg-teal-500/20 text-foreground border-teal-400/40",
      mauve: "bg-[#B08CA7]/20 text-foreground border-[#B08CA7]/40",
    };

    return (
      <span
        ref={ref}
        className={cn(glassStyles.badge, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
GlassBadge.displayName = "GlassBadge";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, variant = "primary", disabled, ...props }, ref) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed";
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, glassStyles.button[variant], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";
