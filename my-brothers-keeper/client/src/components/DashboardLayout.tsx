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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: 'url(/waves-bg.png)' }}
    >
      {/* Decorative circular orbs in background - add depth on top of waves */}
      <div className="absolute top-[10%] right-[15%] w-[600px] h-[600px] bg-cyan-300/40 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[15%] left-[5%] w-[700px] h-[700px] bg-emerald-300/35 blur-[180px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[45%] right-[5%] w-[400px] h-[400px] bg-teal-200/45 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Glass Container - reduced margins for more screen space */}
      <div className="min-h-screen p-4 md:p-6">
        <div 
          className="mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] rounded-3xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(31,38,135,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(255, 255, 255, 0.25)'
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
              <h1 className="font-semibold text-lg text-foreground">{APP_TITLE}</h1>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/20">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-80 flex flex-col h-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.65), rgba(192, 192, 192, 0.55))',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop layout - INSIDE glass container */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* WHITE TO SILVER GRADIENT FROSTED SIDEBAR */}
            <div 
              className="hidden lg:flex flex-col w-64 shrink-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.65), rgba(192, 192, 192, 0.55))',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderRight: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Sidebar />
            </div>

            {/* Main Content - transparent to show wave background */}
            <main 
              className="flex-1 overflow-auto min-w-0"
              style={{
                background: 'rgba(255, 255, 255, 0)'
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
