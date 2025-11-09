import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex min-h-screen bg-[radial-gradient(1200px_800px_at_20%_30%,#1FB6A6_0%,#0F6F67_60%,#0B5C55_100%)] relative overflow-hidden">
      {/* Ambient glow bubbles - global background */}
      <div className="absolute -left-20 top-32 w-[400px] h-[400px] bg-teal-200/25 blur-[160px] rounded-full pointer-events-none"></div>
      <div className="absolute right-0 bottom-32 w-[320px] h-[320px] bg-white/20 blur-[180px] rounded-full pointer-events-none"></div>
      
      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_rgba(0,0,0,0.3)_100%)] pointer-events-none"></div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-3">
          <img
            src={APP_LOGO}
            alt={APP_TITLE}
            className="h-10 w-10"
          />
          <h1 className="font-semibold text-lg text-white">{APP_TITLE}</h1>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-transparent border-0">
            <div className="p-4 h-full">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block p-4 relative z-10">
        <Sidebar />
      </div>

      {/* Main content - transparent glass container */}
      <main className="flex-1 overflow-auto lg:ml-0 pt-16 lg:pt-0 relative z-10">
        {children}
      </main>
    </div>
  );
}
