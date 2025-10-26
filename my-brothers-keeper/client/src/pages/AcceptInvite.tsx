import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  // Get token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token");
    setToken(inviteToken);
  }, []);

  const { data: invite, isLoading: loadingInvite } = trpc.invite.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptMutation = trpc.invite.accept.useMutation({
    onSuccess: () => {
      toast.success("Welcome! You've joined the household.");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invite");
    },
  });

  const handleAccept = () => {
    if (!token) {
      toast.error("Invalid invite link");
      return;
    }
    acceptMutation.mutate({ token });
  };

  // Loading state
  if (!token || loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired invite
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired. Please contact the person who sent it to
              you.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already used invite
  if (invite.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Invite Already Used</CardTitle>
            <CardDescription>
              This invite has already been accepted. If you're having trouble accessing the
              household, please contact an admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite - show acceptance UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription className="text-base mt-2">
            {invite.inviterName} has invited you to join their support network on {APP_TITLE}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Household Info */}
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Household</div>
            <div className="font-semibold">{invite.householdName}</div>
            {invite.role && (
              <>
                <div className="text-sm text-muted-foreground mt-3">Your Role</div>
                <div className="font-medium capitalize">{invite.role}</div>
              </>
            )}
          </div>

          {/* Personal Message */}
          {invite.message && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Personal Message</div>
              <div className="bg-accent/30 rounded-lg p-4 text-sm italic border-l-4 border-primary">
                "{invite.message}"
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isAuthenticated ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  You'll need to sign in to accept this invite
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In to Accept
                </Button>
              </>
            ) : invite.email && user?.email !== invite.email ? (
              <>
                <p className="text-sm text-red-600 text-center">
                  This invite was sent to {invite.email}, but you're signed in as {user?.email}.
                  Please sign in with the correct account.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In with Different Account
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invite"
                )}
              </Button>
            )}
          </div>

          {/* About My Brother's Keeper */}
          <div className="pt-4 border-t text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {APP_TITLE} helps communities coordinate support during difficult times. Your network
              can share needs, organize events, and stay connected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

