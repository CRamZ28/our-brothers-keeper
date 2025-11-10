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
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-50 to-white relative overflow-hidden">
      {/* Decorative circular orbs in background - matching the image */}
      <div className="absolute top-[10%] right-[15%] w-[300px] h-[300px] bg-white/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[15%] left-[5%] w-[500px] h-[500px] bg-teal-100/40 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[45%] right-[5%] w-[200px] h-[200px] bg-white/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Glass Container - 40px margins from viewport edges */}
      <div className="min-h-screen p-[40px]">
        <div 
          className="mx-auto max-w-7xl h-[calc(100vh-80px)] rounded-3xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(31,38,135,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}
        >
          
          {/* Mobile header - INSIDE glass container */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-white/25 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-10 w-10"
              />
              <h1 className="font-semibold text-lg text-teal-900">{APP_TITLE}</h1>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-teal-900 hover:bg-white/20">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-80"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop layout - INSIDE glass container */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* LIGHT FROSTED SIDEBAR - very light, almost white glass */}
            <div 
              className="hidden lg:flex flex-col w-64 shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <Sidebar />
            </div>

            {/* Main Content - transparent to show teal background */}
            <main 
              className="flex-1 overflow-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
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
