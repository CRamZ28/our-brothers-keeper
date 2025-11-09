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
    <div className="min-h-screen bg-gradient-to-br from-[#0D7C7A] via-[#0E8986] to-[#0F9692] relative overflow-hidden">
      {/* Layer 1: Decorative circular orbs in background */}
      <div className="absolute top-[15%] right-[20%] w-[350px] h-[350px] bg-teal-400/15 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[10%] w-[450px] h-[450px] bg-emerald-400/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[50%] right-[8%] w-[250px] h-[250px] bg-cyan-300/12 blur-[110px] rounded-full pointer-events-none"></div>

      {/* Layer 2: Glass Container - 40px margins from viewport edges */}
      <div className="min-h-screen p-[40px]">
        <div 
          className="mx-auto max-w-7xl h-[calc(100vh-80px)] rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] overflow-hidden flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          
          {/* Mobile header - INSIDE glass container */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-white/25 shrink-0 bg-gradient-to-r from-teal-600/60 to-teal-500/60">
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
              <SheetContent 
                side="left" 
                className="p-0 w-80 border border-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop layout - INSIDE glass container */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Layer 3: Sidebar - slightly more opaque */}
            <div 
              className="hidden lg:flex flex-col w-64 border-r border-white/30 shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <Sidebar />
            </div>

            {/* Layer 4: Main Content - more transparent to show teal background */}
            <main 
              className="flex-1 overflow-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
