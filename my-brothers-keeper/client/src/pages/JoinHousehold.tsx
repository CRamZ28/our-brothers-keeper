import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Heart, Users, Globe, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function JoinHousehold() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<"family" | "friend" | "community">("community");
  const [isJoining, setIsJoining] = useState(false);

  // Get current user
  const { data: currentUser } = trpc.auth.me.useQuery();

  // Get household info by slug (public endpoint)
  const {
    data: household,
    isLoading,
    error,
  } = trpc.household.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Join household mutation
  const joinMutation = trpc.household.joinWithTier.useMutation({
    onSuccess: () => {
      toast.success("Welcome! You've joined the household.", {
        description:
          selectedTier !== "community"
            ? "Your tier upgrade request has been sent for approval."
            : "You now have Community access.",
      });
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to join household", {
        description: error.message,
      });
      setIsJoining(false);
    },
  });

  const handleJoin = async () => {
    if (!household || !currentUser) return;

    setIsJoining(true);
    joinMutation.mutate({
      householdId: household.id,
      requestedTier: selectedTier,
    });
  };

  const handleLoginRedirect = () => {
    // Redirect to login with the household slug as redirect parameter
    // After login, user will be redirected back to /:slug to complete join
    window.location.href = `/api/login?redirect=/${encodeURIComponent(slug || "")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/waves-bg.png')" }}>
        {/* Decorative blur orbs */}
        <div className="fixed w-[600px] h-[600px] rounded-full bg-cyan-400/40 blur-[120px] -top-32 -left-32 pointer-events-none" />
        <div className="fixed w-[700px] h-[700px] rounded-full bg-emerald-400/35 blur-[120px] top-1/3 right-0 pointer-events-none" />
        <div className="fixed w-[400px] h-[400px] rounded-full bg-teal-400/45 blur-[120px] bottom-0 left-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <GlassCard className="p-12 max-w-md text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#2DB5A8]" />
            <p className="mt-4 text-gray-600">Loading household...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/waves-bg.png')" }}>
        {/* Decorative blur orbs */}
        <div className="fixed w-[600px] h-[600px] rounded-full bg-cyan-400/40 blur-[120px] -top-32 -left-32 pointer-events-none" />
        <div className="fixed w-[700px] h-[700px] rounded-full bg-emerald-400/35 blur-[120px] top-1/3 right-0 pointer-events-none" />
        <div className="fixed w-[400px] h-[400px] rounded-full bg-teal-400/45 blur-[120px] bottom-0 left-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <GlassCard className="p-12 max-w-md text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Household Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the household you're looking for. Please check the link and try again.
            </p>
            <Button onClick={() => setLocation("/")} className="bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white">
              Go Home
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/waves-bg.png')" }}>
      {/* Decorative blur orbs */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-cyan-400/40 blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="fixed w-[700px] h-[700px] rounded-full bg-emerald-400/35 blur-[120px] top-1/3 right-0 pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-teal-400/45 blur-[120px] bottom-0 left-1/4 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <GlassCard className="p-12 max-w-2xl w-full">
          {/* Household Photo */}
          {household.photoUrl && (
            <div className="mb-6">
              <img
                src={household.photoUrl}
                alt={household.name}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white/30"
              />
            </div>
          )}

          {/* Household Name */}
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-3">
            {household.name}
          </h1>

          {/* Description */}
          {household.description && (
            <p className="text-gray-600 text-center mb-8 max-w-lg mx-auto">
              {household.description}
            </p>
          )}

          <div className="border-t border-white/30 pt-8 mb-8"></div>

          {!currentUser ? (
            // Not logged in - show login prompt
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join Our Support Network</h2>
              <p className="text-gray-600 mb-6">
                Sign in to join this household and provide support during this difficult time.
              </p>
              <Button
                onClick={handleLoginRedirect}
                size="lg"
                className="bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white"
              >
                Sign In to Join
              </Button>
            </div>
          ) : (
            // Logged in - show tier selection
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                How would you like to help?
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Choose your relationship to the family. You'll start with Community access and can request an upgrade.
              </p>

              <RadioGroup value={selectedTier} onValueChange={(value) => setSelectedTier(value as "family" | "friend" | "community")} className="space-y-4 mb-8">
                {/* Family Member */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                  <RadioGroupItem value="family" id="family" className="mt-1" />
                  <Label htmlFor="family" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-5 w-5 text-[#2DB5A8]" />
                      <span className="font-semibold text-gray-900">Family Member</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      I'm a close family member and want full access to support the family.
                    </p>
                  </Label>
                </div>

                {/* Friend */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                  <RadioGroupItem value="friend" id="friend" className="mt-1" />
                  <Label htmlFor="friend" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-5 w-5 text-[#2DB5A8]" />
                      <span className="font-semibold text-gray-900">Friend</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      I'm a close friend and want to actively support the family.
                    </p>
                  </Label>
                </div>

                {/* Community Member */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                  <RadioGroupItem value="community" id="community" className="mt-1" />
                  <Label htmlFor="community" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-5 w-5 text-[#2DB5A8]" />
                      <span className="font-semibold text-gray-900">Community Member</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      I'm part of the broader community and want to help where I can.
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              <Button
                onClick={handleJoin}
                disabled={isJoining}
                size="lg"
                className="w-full bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Household"
                )}
              </Button>

              {selectedTier !== "community" && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Your {selectedTier === "family" ? "Family" : "Friend"} tier request will be sent to the household admin for approval.
                </p>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
