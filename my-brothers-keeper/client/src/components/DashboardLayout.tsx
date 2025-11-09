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
    <div className="min-h-screen bg-gradient-to-br from-[#5EDDD0] via-[#3FC9BB] to-[#2AB5A7] relative overflow-hidden">
      {/* Soft circular orbs in background */}
      <div className="absolute top-[10%] right-[15%] w-[300px] h-[300px] bg-white/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[15%] left-[10%] w-[400px] h-[400px] bg-teal-300/25 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[60%] right-[5%] w-[200px] h-[200px] bg-white/15 blur-[100px] rounded-full pointer-events-none"></div>

      {/* ONE BIG CLEAR GLASS CONTAINER - wraps everything */}
      <div className="min-h-screen p-4 lg:p-8">
        <div className="mx-auto max-w-7xl h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] bg-white/10 backdrop-blur-xl rounded-3xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden flex flex-col">
          
          {/* Mobile header - INSIDE glass container */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-white/20 shrink-0">
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
                <Button variant="ghost" size="icon" className="text-teal-900 hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 bg-white/20 backdrop-blur-md border-r border-white/20">
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop layout - INSIDE glass container */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* FROSTED SIDEBAR - inside the glass container */}
            <div className="hidden lg:flex flex-col w-64 bg-white/20 backdrop-blur-md border-r border-white/20 shrink-0">
              <Sidebar />
            </div>

            {/* CLEAR CONTENT AREA - inside the glass container */}
            <main className="flex-1 overflow-auto bg-white/5 backdrop-blur-sm">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
