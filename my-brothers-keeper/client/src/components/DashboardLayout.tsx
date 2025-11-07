import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Calendar, Heart, Home, LogOut, MessageCircle, Settings, Users, Sparkles, ChefHat, Gift, BookHeart } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
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

const SIDEBAR_WIDTH = 240;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-16 w-16 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${SIDEBAR_WIDTH}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
};

function DashboardLayoutContent({
  children,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r-0"
        style={{
          backgroundColor: '#6BC4B8',
        }}
      >
        <SidebarHeader className="h-auto py-8 justify-center border-b-0">
          <div className="flex flex-col items-center gap-4 px-4">
            <img
              src={APP_LOGO}
              className="h-16 w-16 rounded-xl object-cover shadow-lg"
              alt="Logo"
            />
            {!isCollapsed && (
              <h1 className="text-white font-bold text-lg text-center leading-tight">
                {APP_TITLE}
              </h1>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-3 pt-4">
          <SidebarMenu className="gap-1">
            {menuItems.map(item => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className={`h-11 transition-all font-medium text-white/90 hover:text-white hover:bg-white/10 ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : ""
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t-0 mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <Avatar className="h-9 w-9 border-2 border-white/30 shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-white/20 text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
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
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white px-2 backdrop-blur sticky top-0 z-40 border-gray-200">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground font-semibold">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
