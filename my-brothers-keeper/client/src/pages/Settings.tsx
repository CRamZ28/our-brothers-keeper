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
import { Bell, Home, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery(undefined, {
    enabled: !!user?.householdId,
  });
  const { data: notificationPrefs } = trpc.household.getNotificationPrefs.useQuery(undefined, {
    enabled: !!user?.id,
  });

  // Household settings
  const [householdName, setHouseholdName] = useState("");

  // Notification preferences
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [channelPush, setChannelPush] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<"immediate" | "daily" | "weekly">(
    "daily"
  );
  const [urgentNeedsAlerts, setUrgentNeedsAlerts] = useState(true);

  useEffect(() => {
    if (household) {
      setHouseholdName(household.name);
    }
  }, [household]);

  useEffect(() => {
    if (notificationPrefs) {
      setChannelEmail(notificationPrefs.channelEmail);
      setChannelSms(notificationPrefs.channelSms);
      setChannelPush(notificationPrefs.channelPush);
      setDigestFrequency(notificationPrefs.digestFrequency);
      setUrgentNeedsAlerts(notificationPrefs.urgentNeedsAlerts ?? true);
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

  const updateNotificationPrefsMutation = trpc.household.updateNotificationPrefs.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated!");
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
      channelEmail,
      channelSms,
      channelPush,
      digestFrequency,
      urgentNeedsAlerts,
    });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your household and notification preferences
          </p>
        </div>

        {/* Household Settings */}
        {isPrimaryOrAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" />
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
              >
                {updateHouseholdMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>
              Choose what updates you'd like to receive via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="font-medium">Notification Channels</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="channelEmail" className="font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="channelEmail"
                  checked={channelEmail}
                  onCheckedChange={setChannelEmail}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="channelSms" className="font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via text message (coming soon)
                  </p>
                </div>
                <Switch
                  id="channelSms"
                  checked={channelSms}
                  onCheckedChange={setChannelSms}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="channelPush" className="font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via browser notifications
                  </p>
                </div>
                <Switch
                  id="channelPush"
                  checked={channelPush}
                  onCheckedChange={setChannelPush}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="font-medium mb-3 block">Notification Frequency</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="digest"
                    value="immediate"
                    checked={digestFrequency === "immediate"}
                    onChange={() => setDigestFrequency("immediate")}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Immediate</div>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications as they happen
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="digest"
                    value="daily"
                    checked={digestFrequency === "daily"}
                    onChange={() => setDigestFrequency("daily")}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Daily Digest</div>
                    <div className="text-sm text-muted-foreground">
                      Receive a summary of activity once per day
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="digest"
                    value="weekly"
                    checked={digestFrequency === "weekly"}
                    onChange={() => setDigestFrequency("weekly")}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Weekly Digest</div>
                    <div className="text-sm text-muted-foreground">
                      Receive a summary of activity once per week
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Urgent Needs Alerts */}
            <div className="space-y-3">
              <Label className="text-base">Urgent Needs Alerts</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Notify me about unclaimed urgent needs</div>
                  <div className="text-sm text-muted-foreground">
                    Get alerts when needs are due within 24 hours and haven't been claimed
                  </div>
                </div>
                <Switch
                  checked={urgentNeedsAlerts}
                  onCheckedChange={setUrgentNeedsAlerts}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveNotifications}
              disabled={updateNotificationPrefsMutation.isPending}
            >
              {updateNotificationPrefsMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
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
                  window.location.href = '/api/logout';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

