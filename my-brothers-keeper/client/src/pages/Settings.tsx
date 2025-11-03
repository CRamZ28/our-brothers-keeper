import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bell, Home, User, LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery(undefined, {
    enabled: !!user?.householdId,
  });
  const { data: notificationPrefs, refetch: refetchPrefs } = trpc.notification.getPreferences.useQuery(
    undefined,
    { enabled: !!user?.householdId }
  );

  const [householdName, setHouseholdName] = useState("");

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailNeedCreated, setEmailNeedCreated] = useState(false);
  const [emailNeedClaimed, setEmailNeedClaimed] = useState(false);
  const [emailNeedCompleted, setEmailNeedCompleted] = useState(false);
  const [emailEventCreated, setEmailEventCreated] = useState(false);
  const [emailEventRsvp, setEmailEventRsvp] = useState(false);
  const [emailMealTrainSignup, setEmailMealTrainSignup] = useState(false);
  const [emailMealTrainCancelled, setEmailMealTrainCancelled] = useState(false);
  const [emailNewMessage, setEmailNewMessage] = useState(false);
  const [emailNewAnnouncement, setEmailNewAnnouncement] = useState(false);
  const [emailNewUpdate, setEmailNewUpdate] = useState(false);

  useEffect(() => {
    if (household) {
      setHouseholdName(household.name);
    }
  }, [household]);

  useEffect(() => {
    if (notificationPrefs) {
      setEmailEnabled(notificationPrefs.emailEnabled);
      setEmailNeedCreated(notificationPrefs.emailNeedCreated);
      setEmailNeedClaimed(notificationPrefs.emailNeedClaimed);
      setEmailNeedCompleted(notificationPrefs.emailNeedCompleted);
      setEmailEventCreated(notificationPrefs.emailEventCreated);
      setEmailEventRsvp(notificationPrefs.emailEventRsvp);
      setEmailMealTrainSignup(notificationPrefs.emailMealTrainSignup);
      setEmailMealTrainCancelled(notificationPrefs.emailMealTrainCancelled);
      setEmailNewMessage(notificationPrefs.emailNewMessage);
      setEmailNewAnnouncement(notificationPrefs.emailNewAnnouncement);
      setEmailNewUpdate(notificationPrefs.emailNewUpdate);
    }
  }, [notificationPrefs]);

  const updateHouseholdMutation = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Household settings updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update household settings");
    },
  });

  const updateNotificationPrefsMutation = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved!");
      refetchPrefs();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update notification preferences");
    },
  });

  const handleSaveHousehold = () => {
    if (!householdName.trim()) {
      toast.error("Household name is required");
      return;
    }

    updateHouseholdMutation.mutate({
      name: householdName,
    });
  };

  const handleSaveNotifications = () => {
    updateNotificationPrefsMutation.mutate({
      emailEnabled,
      emailNeedCreated,
      emailNeedClaimed,
      emailNeedCompleted,
      emailEventCreated,
      emailEventRsvp,
      emailMealTrainSignup,
      emailMealTrainCancelled,
      emailNewMessage,
      emailNewAnnouncement,
      emailNewUpdate,
    });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        </div>

        <div className="relative p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6BC4B8] via-[#5A9FD4] to-[#B08CA7] bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your household and notification preferences
            </p>
          </div>

          {/* Household Settings */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/90 backdrop-blur-md shadow-lg border-white/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#6BC4B8]" />
                  <CardTitle>Household Settings</CardTitle>
                </div>
                <CardDescription>Update your household information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="householdName">Household Name *</Label>
                  <Input
                    id="householdName"
                    placeholder="e.g., The Smith Family"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSaveHousehold}
                  disabled={updateHouseholdMutation.isPending}
                  className="bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
                >
                  {updateHouseholdMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Email Notification Preferences */}
          <Card className="bg-white/90 backdrop-blur-md shadow-lg border-white/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#6BC4B8]" />
                <CardTitle>Email Notifications</CardTitle>
              </div>
              <CardDescription>
                Choose which updates you'd like to receive via email (opt-in)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Email Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-[#6BC4B8]/5 to-[#5A9FD4]/5">
                <div className="space-y-1">
                  <Label htmlFor="emailEnabled" className="font-semibold text-base">
                    Enable Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on to receive email notifications
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                  className="data-[state=checked]:bg-[#6BC4B8]"
                />
              </div>

              {emailEnabled && (
                <>
                  {/* Support Requests */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Support Requests</Label>
                    <div className="space-y-2 pl-4 border-l-2 border-[#6BC4B8]/30">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNeedCreated" className="font-medium">
                            New Support Request
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When a new support request is posted
                          </p>
                        </div>
                        <Switch
                          id="emailNeedCreated"
                          checked={emailNeedCreated}
                          onCheckedChange={setEmailNeedCreated}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNeedClaimed" className="font-medium">
                            Support Request Claimed
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When someone claims a support request
                          </p>
                        </div>
                        <Switch
                          id="emailNeedClaimed"
                          checked={emailNeedClaimed}
                          onCheckedChange={setEmailNeedClaimed}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNeedCompleted" className="font-medium">
                            Support Request Completed
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When a support request is marked as complete
                          </p>
                        </div>
                        <Switch
                          id="emailNeedCompleted"
                          checked={emailNeedCompleted}
                          onCheckedChange={setEmailNeedCompleted}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Events</Label>
                    <div className="space-y-2 pl-4 border-l-2 border-[#5A9FD4]/30">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailEventCreated" className="font-medium">
                            New Event
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When a new event is scheduled
                          </p>
                        </div>
                        <Switch
                          id="emailEventCreated"
                          checked={emailEventCreated}
                          onCheckedChange={setEmailEventCreated}
                          className="data-[state=checked]:bg-[#5A9FD4]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailEventRsvp" className="font-medium">
                            Event RSVP
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When someone RSVPs to an event
                          </p>
                        </div>
                        <Switch
                          id="emailEventRsvp"
                          checked={emailEventRsvp}
                          onCheckedChange={setEmailEventRsvp}
                          className="data-[state=checked]:bg-[#5A9FD4]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meal Train */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Meal Train</Label>
                    <div className="space-y-2 pl-4 border-l-2 border-[#B08CA7]/30">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailMealTrainSignup" className="font-medium">
                            Meal Train Signup
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When someone signs up to bring a meal
                          </p>
                        </div>
                        <Switch
                          id="emailMealTrainSignup"
                          checked={emailMealTrainSignup}
                          onCheckedChange={setEmailMealTrainSignup}
                          className="data-[state=checked]:bg-[#B08CA7]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailMealTrainCancelled" className="font-medium">
                            Meal Train Cancellation
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When someone cancels their meal signup
                          </p>
                        </div>
                        <Switch
                          id="emailMealTrainCancelled"
                          checked={emailMealTrainCancelled}
                          onCheckedChange={setEmailMealTrainCancelled}
                          className="data-[state=checked]:bg-[#B08CA7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communications */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Communications</Label>
                    <div className="space-y-2 pl-4 border-l-2 border-[#6BC4B8]/30">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNewMessage" className="font-medium">
                            New Message
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When you receive a new private message
                          </p>
                        </div>
                        <Switch
                          id="emailNewMessage"
                          checked={emailNewMessage}
                          onCheckedChange={setEmailNewMessage}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNewAnnouncement" className="font-medium">
                            New Announcement
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When a new announcement is posted
                          </p>
                        </div>
                        <Switch
                          id="emailNewAnnouncement"
                          checked={emailNewAnnouncement}
                          onCheckedChange={setEmailNewAnnouncement}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="emailNewUpdate" className="font-medium">
                            New Update
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            When the family shares a new update
                          </p>
                        </div>
                        <Switch
                          id="emailNewUpdate"
                          checked={emailNewUpdate}
                          onCheckedChange={setEmailNewUpdate}
                          className="data-[state=checked]:bg-[#6BC4B8]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleSaveNotifications}
                disabled={updateNotificationPrefsMutation.isPending}
                className="w-full bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
              >
                {updateNotificationPrefsMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* User Profile */}
          <Card className="bg-white/90 backdrop-blur-md shadow-lg border-white/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#6BC4B8]" />
                <CardTitle>Your Profile</CardTitle>
              </div>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{user?.name || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <p className="font-medium capitalize">{user?.role || "Not set"}</p>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    window.location.href = "/api/logout";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
