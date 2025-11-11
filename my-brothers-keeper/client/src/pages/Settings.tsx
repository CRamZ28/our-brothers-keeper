import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bell, Home, User, LogOut, Mail, Users, Image, Quote } from "lucide-react";
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
  const [householdSlug, setHouseholdSlug] = useState("");
  const [autoPromoteEnabled, setAutoPromoteEnabled] = useState(false);
  const [autoPromoteHours, setAutoPromoteHours] = useState(48);

  const [dashboardDisplayType, setDashboardDisplayType] = useState<"none" | "photo" | "slideshow" | "quote" | "memory">("none");
  const [dashboardPhotos, setDashboardPhotos] = useState<string[]>([]);
  const [dashboardQuote, setDashboardQuote] = useState("");
  const [dashboardQuoteAttribution, setDashboardQuoteAttribution] = useState("");
  const [dashboardFeaturedMemoryId, setDashboardFeaturedMemoryId] = useState<number | null>(null);

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
      setHouseholdSlug(household.slug || "");
      setAutoPromoteEnabled(household.autoPromoteEnabled || false);
      setAutoPromoteHours(household.autoPromoteHours || 48);
      setDashboardDisplayType(household.dashboardDisplayType || "none");
      setDashboardPhotos(household.dashboardPhotos || []);
      setDashboardQuote(household.dashboardQuote || "");
      setDashboardQuoteAttribution(household.dashboardQuoteAttribution || "");
      setDashboardFeaturedMemoryId(household.dashboardFeaturedMemoryId || null);
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

  const updateAutoPromoteSettingsMutation = trpc.household.updateAutoPromoteSettings.useMutation({
    onSuccess: () => {
      toast.success("Auto-promotion settings updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update auto-promotion settings");
    },
  });

  const updateSlugMutation = trpc.household.updateSlug.useMutation({
    onSuccess: (data) => {
      toast.success("Household page URL updated!");
      setHouseholdSlug(data.slug);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update household page URL");
    },
  });

  const updateDashboardDisplayMutation = trpc.household.updateDashboardDisplay.useMutation({
    onSuccess: () => {
      toast.success("Dashboard display settings updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update dashboard display settings");
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

  const handleSaveAutoPromoteSettings = () => {
    if (autoPromoteHours < 1 || autoPromoteHours > 168) {
      toast.error("Hours must be between 1 and 168");
      return;
    }

    updateAutoPromoteSettingsMutation.mutate({
      autoPromoteEnabled,
      autoPromoteHours,
    });
  };

  const handleSaveSlug = () => {
    const slugValue = householdSlug.trim().toLowerCase();

    if (!slugValue) {
      toast.error("Page URL is required");
      return;
    }

    if (slugValue.length < 3) {
      toast.error("Page URL must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slugValue)) {
      toast.error("Page URL can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    updateSlugMutation.mutate({ slug: slugValue });
  };

  const handleSaveDashboardDisplay = () => {
    // Validate based on display type
    if (dashboardDisplayType === "slideshow") {
      if (dashboardPhotos.length < 3 || dashboardPhotos.length > 5) {
        toast.error("Slideshow requires 3-5 photo URLs");
        return;
      }
    }

    if (dashboardDisplayType === "quote" && !dashboardQuote.trim()) {
      toast.error("Quote text is required");
      return;
    }

    if (dashboardDisplayType === "memory" && !dashboardFeaturedMemoryId) {
      toast.error("Please select a memory to feature");
      return;
    }

    // Build payload based on display type
    updateDashboardDisplayMutation.mutate({
      displayType: dashboardDisplayType,
      photos: dashboardDisplayType === "slideshow" ? dashboardPhotos : undefined,
      quote: dashboardDisplayType === "quote" ? dashboardQuote : undefined,
      quoteAttribution: dashboardDisplayType === "quote" ? dashboardQuoteAttribution : undefined,
      featuredMemoryId: dashboardDisplayType === "memory" && dashboardFeaturedMemoryId ? dashboardFeaturedMemoryId : undefined,
    });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  return (
    <DashboardLayout>
      <GlassPageLayout title="Settings">
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
              <CardContent className="space-y-6">
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

                <div className="border-t pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="householdSlug">Public Join Page URL</Label>
                    <p className="text-sm text-muted-foreground">
                      This is the link people use to join your household (e.g., www.obkapp.com/<strong>{householdSlug || "your-family"}</strong>)
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">
                          www.obkapp.com/
                        </span>
                        <Input
                          id="householdSlug"
                          placeholder="your-family-name"
                          value={householdSlug}
                          onChange={(e) => setHouseholdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only lowercase letters, numbers, and hyphens allowed (min 3 characters)
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveSlug}
                    disabled={updateSlugMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {updateSlugMutation.isPending ? "Updating..." : "Update Page URL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Display Settings */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/90 backdrop-blur-md shadow-lg border-white/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-[#6BC4B8]" />
                  <CardTitle>Dashboard Display</CardTitle>
                </div>
                <CardDescription>
                  Customize what appears at the top of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={dashboardDisplayType}
                  onValueChange={(value: any) => {
                    setDashboardDisplayType(value);
                    // Clear dependent state when type changes
                    if (value !== "slideshow") setDashboardPhotos([]);
                    if (value !== "quote") {
                      setDashboardQuote("");
                      setDashboardQuoteAttribution("");
                    }
                    if (value !== "memory") setDashboardFeaturedMemoryId(null);
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="none" id="display-none" className="mt-1" />
                    <div>
                      <Label htmlFor="display-none" className="font-medium cursor-pointer">
                        None
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Hide this section entirely (grief-sensitive option)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="photo" id="display-photo" className="mt-1" />
                    <div>
                      <Label htmlFor="display-photo" className="font-medium cursor-pointer">
                        Single Photo
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Display the family photo from Household Settings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="slideshow" id="display-slideshow" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="display-slideshow" className="font-medium cursor-pointer">
                        Photo Slideshow
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Rotating collection of 3-5 photos (auto-rotates every 5 seconds)
                      </p>
                      {dashboardDisplayType === "slideshow" && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-sm">Photo URLs (3-5 required)</Label>
                          {[0, 1, 2, 3, 4].map((index) => (
                            <Input
                              key={index}
                              placeholder={`Photo ${index + 1} URL${index >= 3 ? " (optional)" : ""}`}
                              value={dashboardPhotos[index] || ""}
                              onChange={(e) => {
                                const newPhotos = [...dashboardPhotos];
                                if (e.target.value) {
                                  newPhotos[index] = e.target.value;
                                } else {
                                  newPhotos.splice(index, 1);
                                }
                                setDashboardPhotos(newPhotos.filter(Boolean));
                              }}
                              className="text-sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="quote" id="display-quote" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="display-quote" className="font-medium cursor-pointer">
                        Memorial Quote
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Display a Bible verse, quote, or meaningful message
                      </p>
                      {dashboardDisplayType === "quote" && (
                        <div className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Quote Text *</Label>
                            <Textarea
                              placeholder="Enter your quote or verse..."
                              value={dashboardQuote}
                              onChange={(e) => setDashboardQuote(e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Attribution (Optional)</Label>
                            <Input
                              placeholder="e.g., Psalm 23:4"
                              value={dashboardQuoteAttribution}
                              onChange={(e) => setDashboardQuoteAttribution(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="memory" id="display-memory" className="mt-1" />
                    <div>
                      <Label htmlFor="display-memory" className="font-medium cursor-pointer">
                        Featured Memory
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Display a selected memory from your Memory Wall (Coming soon)
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <Button
                  onClick={handleSaveDashboardDisplay}
                  disabled={updateDashboardDisplayMutation.isPending}
                  className="w-full bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
                >
                  {updateDashboardDisplayMutation.isPending ? "Saving..." : "Save Dashboard Display"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Access Tier Auto-Promotion Settings */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/90 backdrop-blur-md shadow-lg border-white/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-foreground/60" />
                  <CardTitle>Access Tier Auto-Promotion</CardTitle>
                </div>
                <CardDescription>
                  Automatically promote users to higher access tiers based on time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-[#6BC4B8]/5 to-[#B08CA7]/5">
                  <div className="space-y-1">
                    <Label htmlFor="autoPromoteEnabled" className="font-semibold text-base">
                      Enable Auto-Promotion
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically promote active users to higher access tiers
                    </p>
                  </div>
                  <Switch
                    id="autoPromoteEnabled"
                    checked={autoPromoteEnabled}
                    onCheckedChange={setAutoPromoteEnabled}
                    className="data-[state=checked]:bg-[#B08CA7]"
                  />
                </div>

                {/* Hours Input */}
                {autoPromoteEnabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-[#B08CA7]/30">
                    <Label htmlFor="autoPromoteHours" className="font-medium">
                      Promotion Delay (hours)
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      How long to wait before auto-promoting users (1-168 hours)
                    </p>
                    <Input
                      id="autoPromoteHours"
                      type="number"
                      min={1}
                      max={168}
                      value={autoPromoteHours}
                      onChange={(e) => setAutoPromoteHours(parseInt(e.target.value) || 48)}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: 48 hours (2 days) • Max: 168 hours (7 days)
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSaveAutoPromoteSettings}
                  disabled={updateAutoPromoteSettingsMutation.isPending}
                  className="w-full bg-[#B08CA7] hover:bg-[#9F7B96] text-white"
                >
                  {updateAutoPromoteSettingsMutation.isPending ? "Saving..." : "Save Auto-Promotion Settings"}
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
                  className="w-full"
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
      </GlassPageLayout>
    </DashboardLayout>
  );
}
