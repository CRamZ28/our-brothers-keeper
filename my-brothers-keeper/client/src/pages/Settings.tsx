import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { UserAvatar } from "@/components/UserAvatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Bell, Home, User, LogOut, Mail, Users, Image, Quote, Upload, HelpCircle, Play, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTour } from "@/hooks/useTour";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: household } = trpc.household.getMy.useQuery(undefined, {
    enabled: !!user?.householdId,
  });
  const { data: notificationPrefs, refetch: refetchPrefs } = trpc.notification.getPreferences.useQuery(
    undefined,
    { enabled: !!user?.householdId }
  );
  
  const { data: availableTours, refetch: refetchTours } = trpc.onboarding.listAvailableTours.useQuery(
    undefined,
    { enabled: !!user?.householdId }
  );
  const resetTourMutation = trpc.onboarding.resetTour.useMutation({
    onSuccess: () => {
      toast.success("Tour reset! Redirecting to start the tour...");
      refetchTours();
    },
  });

  const [householdName, setHouseholdName] = useState("");
  const [householdSlug, setHouseholdSlug] = useState("");
  const [autoPromoteEnabled, setAutoPromoteEnabled] = useState(false);
  const [autoPromoteHours, setAutoPromoteHours] = useState(48);

  const [showMemorialSubtitle, setShowMemorialSubtitle] = useState(false);
  const [memorialName, setMemorialName] = useState("");
  const [memorialBirthDate, setMemorialBirthDate] = useState("");
  const [memorialPassingDate, setMemorialPassingDate] = useState("");
  const [customDashboardMessage, setCustomDashboardMessage] = useState("");

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

  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [householdPhotoUrl, setHouseholdPhotoUrl] = useState("");
  const [uploadingDashboardPhoto, setUploadingDashboardPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardPhotoInputRef = useRef<HTMLInputElement>(null);
  const slideshowPhotoInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (household) {
      setHouseholdName(household.name);
      setHouseholdSlug(household.slug || "");
      setAutoPromoteEnabled(household.autoPromoteEnabled || false);
      setAutoPromoteHours(household.autoPromoteHours || 48);
      setShowMemorialSubtitle(household.showMemorialSubtitle || false);
      setMemorialName(household.memorialName || "");
      setMemorialBirthDate(household.memorialBirthDate || "");
      setMemorialPassingDate(household.memorialPassingDate || "");
      setCustomDashboardMessage(household.customDashboardMessage || "");
      setDashboardDisplayType(household.dashboardDisplayType || "none");
      setHouseholdPhotoUrl(household.photoUrl || "");
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
      utils.household.getMy.invalidate();
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

  const updateDashboardDisplayMutation = trpc.household.updateDashboardDisplay.useMutation({
    onSuccess: () => {
      toast.success("Dashboard display settings updated!");
      utils.household.getMy.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update dashboard display settings");
    },
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile picture updated successfully!");
      setProfileImageUrl("");
      window.location.reload(); // Reload to update the auth context
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile picture");
    },
  });

  const handleSaveHousehold = () => {
    if (!householdName.trim()) {
      toast.error("Household name is required");
      return;
    }

    if (showMemorialSubtitle && !memorialName.trim()) {
      toast.error("Memorial name is required when showing memorial subtitle");
      return;
    }

    if (customDashboardMessage.length > 500) {
      toast.error("Custom dashboard message cannot exceed 500 characters");
      return;
    }

    updateHouseholdMutation.mutate({
      name: householdName,
      showMemorialSubtitle,
      memorialName,
      memorialBirthDate,
      memorialPassingDate,
      customDashboardMessage,
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

  const handleSaveDashboardDisplay = () => {
    // Validate based on display type
    if (dashboardDisplayType === "photo" && !householdPhotoUrl) {
      toast.error("Please upload a photo first");
      return;
    }

    if (dashboardDisplayType === "slideshow") {
      if (dashboardPhotos.length < 3 || dashboardPhotos.length > 5) {
        toast.error("Slideshow requires 3-5 photos");
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
      photoUrl: dashboardDisplayType === "photo" ? householdPhotoUrl : undefined,
      photos: dashboardDisplayType === "slideshow" ? dashboardPhotos : undefined,
      quote: dashboardDisplayType === "quote" ? dashboardQuote : undefined,
      quoteAttribution: dashboardDisplayType === "quote" ? dashboardQuoteAttribution : undefined,
      featuredMemoryId: dashboardDisplayType === "memory" && dashboardFeaturedMemoryId ? dashboardFeaturedMemoryId : undefined,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      // Update profile with new image URL
      updateProfileMutation.mutate({ profileImageUrl: data.url });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };

  const handleDashboardPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingDashboardPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Upload failed:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload successful, URL:", data.url);
      setHouseholdPhotoUrl(data.url);
      
      // Automatically save the photo to the database
      updateDashboardDisplayMutation.mutate({
        displayType: "photo",
        photoUrl: data.url,
      });
      
      toast.success("Dashboard photo uploaded successfully!");
      setUploadingDashboardPhoto(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
      setUploadingDashboardPhoto(false);
    }
  };

  const handleSlideshowPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingDashboardPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      // Update the specific index in the photos array
      const newPhotos = [...dashboardPhotos];
      newPhotos[index] = data.url;
      setDashboardPhotos(newPhotos);
      
      toast.success(`Photo ${index + 1} uploaded successfully!`);
      setUploadingDashboardPhoto(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
      setUploadingDashboardPhoto(false);
    }
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  return (
    <DashboardLayout>
      <GlassPageLayout 
        title={
          <span style={{ 
            fontFamily: "'Cinzel', serif",
            fontWeight: '600',
            letterSpacing: '0.05em',
            color: '#B08CA7',
            filter: 'drop-shadow(0 0 8px rgba(176,140,167,0.7))'
          }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">S</span>
            <span>ETTINGS</span>
          </span>
        }
      >
        {/* Household Settings */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
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

                <div className="border-t pt-6 space-y-3">
                  <div className="space-y-2">
                    <Label>Public Join Page URL</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Share this link with friends and family so they can join your support circle
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 min-w-0">
                      <code className="flex-1 text-sm font-mono text-gray-700 break-all overflow-hidden min-w-0">
                        www.obkapp.com/{householdSlug || "your-family"}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://www.obkapp.com/${householdSlug}`);
                          toast.success("URL copied to clipboard!");
                        }}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      This URL is permanent and cannot be changed. If you need to change it, please{" "}
                      <a href="/contact" className="text-[#6BC4B8] underline hover:text-[#5AB3A8]">
                        contact support
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Personalization */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-tour="dashboard-personalization-settings">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#6BC4B8]" />
                  <CardTitle>Dashboard Personalization</CardTitle>
                </div>
                <CardDescription>
                  Customize how your dashboard appears to all supporters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Memorial Subtitle Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Memorial Subtitle (Optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showMemorialSubtitle"
                        checked={showMemorialSubtitle}
                        onCheckedChange={(checked) => setShowMemorialSubtitle(checked as boolean)}
                      />
                      <Label htmlFor="showMemorialSubtitle" className="font-normal cursor-pointer">
                        Show memorial subtitle on dashboard
                      </Label>
                    </div>
                  </div>

                  {showMemorialSubtitle && (
                    <div className="space-y-4 pl-6 border-l-2 border-[#6BC4B8]/30">
                      <div className="space-y-2">
                        <Label htmlFor="memorialName">Memorial Name *</Label>
                        <Input
                          id="memorialName"
                          placeholder="Name of loved one"
                          value={memorialName}
                          onChange={(e) => setMemorialName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="memorialBirthDate">Birth Date</Label>
                          <Input
                            id="memorialBirthDate"
                            type="date"
                            value={memorialBirthDate}
                            onChange={(e) => setMemorialBirthDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="memorialPassingDate">Passing Date</Label>
                          <Input
                            id="memorialPassingDate"
                            type="date"
                            value={memorialPassingDate}
                            onChange={(e) => setMemorialPassingDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    This appears below your family name. Some families find comfort in seeing this, while others prefer not to. Choose what feels right for you.
                  </p>
                </div>

                {/* Custom Welcome Message Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="customDashboardMessage" className="text-base font-semibold">
                      Custom Welcome Message
                    </Label>
                    <Textarea
                      id="customDashboardMessage"
                      placeholder="Share a message, update, or encouragement that will appear in the Recent Updates section..."
                      value={customDashboardMessage}
                      onChange={(e) => setCustomDashboardMessage(e.target.value)}
                      rows={4}
                      className={customDashboardMessage.length > 500 ? "border-red-500" : ""}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        This message appears in your Recent Updates card when no recent announcements or family updates exist. You can update this anytime.
                      </p>
                      <span className={`text-sm ${customDashboardMessage.length > 500 ? "text-red-500" : "text-muted-foreground"}`}>
                        {customDashboardMessage.length} / 500 characters
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveHousehold}
                  disabled={updateHouseholdMutation.isPending}
                  className="w-full bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
                >
                  {updateHouseholdMutation.isPending ? "Saving..." : "Save Personalization"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Display Settings */}
          {isPrimaryOrAdmin && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-tour="dashboard-display-settings">
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
                  data-tour="dashboard-display-options"
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
                    <div className="flex-1">
                      <Label htmlFor="display-photo" className="font-medium cursor-pointer">
                        Single Photo
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a family photo to display on your dashboard
                      </p>
                      {dashboardDisplayType === "photo" && (
                        <div className="space-y-3 mt-3">
                          <input
                            ref={dashboardPhotoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleDashboardPhotoUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              onClick={() => dashboardPhotoInputRef.current?.click()}
                              disabled={uploadingDashboardPhoto}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              {uploadingDashboardPhoto ? "Uploading..." : "Upload Photo"}
                            </Button>
                            {householdPhotoUrl && (
                              <span className="text-xs text-muted-foreground">Photo uploaded ✓</span>
                            )}
                          </div>
                          {householdPhotoUrl && (
                            <img 
                              src={householdPhotoUrl} 
                              alt="Dashboard preview" 
                              className="w-40 h-24 object-cover rounded-lg border"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <RadioGroupItem value="slideshow" id="display-slideshow" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="display-slideshow" className="font-medium cursor-pointer">
                        Photo Slideshow
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload 3-5 photos that will auto-rotate every 5 seconds
                      </p>
                      {dashboardDisplayType === "slideshow" && (
                        <div className="space-y-3 mt-3">
                          <Label className="text-sm">Upload Photos (3-5 required)</Label>
                          {[0, 1, 2, 3, 4].map((index) => (
                            <div key={index} className="space-y-2">
                              <input
                                ref={(el) => {
                                  if (el) slideshowPhotoInputRefs.current[index] = el;
                                }}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSlideshowPhotoUpload(e, index)}
                                className="hidden"
                              />
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  onClick={() => slideshowPhotoInputRefs.current[index]?.click()}
                                  disabled={uploadingDashboardPhoto}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  {uploadingDashboardPhoto ? "Uploading..." : `Upload Photo ${index + 1}${index >= 3 ? " (optional)" : ""}`}
                                </Button>
                                {dashboardPhotos[index] && (
                                  <span className="text-xs text-muted-foreground">Uploaded ✓</span>
                                )}
                              </div>
                              {dashboardPhotos[index] && (
                                <img 
                                  src={dashboardPhotos[index]} 
                                  alt={`Slideshow photo ${index + 1}`} 
                                  className="w-32 h-20 object-cover rounded-lg border"
                                />
                              )}
                            </div>
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

          {/* Email Notification Preferences */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
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

          {/* Guided Tours */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#6BC4B8]" />
                <CardTitle>Guided Tours</CardTitle>
              </div>
              <CardDescription>Learn how to use features with interactive walkthroughs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableTours && availableTours.length > 0 ? (
                availableTours.map((tour) => {
                  const isCompleted = tour.progress?.status === "completed";
                  const isDismissed = tour.progress?.status === "dismissed";
                  const inProgress = tour.progress?.status === "in_progress";
                  
                  return (
                    <div 
                      key={tour.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-white/5"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tour.name}</p>
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {isDismissed && (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          {inProgress && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tour.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-[#2DB5A8] text-[#2DB5A8] bg-[#2DB5A8]/5 hover:bg-[#2DB5A8]/15 hover:border-[#2DB5A8] font-semibold ml-4"
                        onClick={async () => {
                          if (isCompleted || isDismissed || inProgress) {
                            await resetTourMutation.mutateAsync({ tourId: tour.id });
                          }
                          window.location.href = tour.slug.includes("household.setup") || tour.slug.includes("supporter.welcome")
                            ? "/dashboard"
                            : tour.slug.includes("needs")
                            ? "/needs"
                            : tour.slug.includes("meal")
                            ? "/meal-train"
                            : tour.slug.includes("event")
                            ? "/calendar"
                            : tour.slug.includes("gift")
                            ? "/gift-registry"
                            : "/dashboard";
                        }}
                        disabled={resetTourMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {isCompleted || isDismissed ? "Replay" : inProgress ? "Resume" : "Start"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No tours available for your role.</p>
              )}
            </CardContent>
          </Card>

          {/* User Profile */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#6BC4B8]" />
                <CardTitle>Your Profile</CardTitle>
              </div>
              <CardDescription>Your account information and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-white/5">
                <UserAvatar user={user || undefined} size="xl" className="shrink-0" />
                <div className="flex-1 min-w-0 max-w-full">
                  <Label className="font-medium">Profile Picture</Label>
                  <p className="text-sm text-muted-foreground break-words">Upload your photo to personalize your profile</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="border-2 border-[#2DB5A8] text-[#2DB5A8] bg-[#2DB5A8]/5 hover:bg-[#2DB5A8]/15 hover:border-[#2DB5A8] font-semibold shrink-0 w-full sm:w-auto"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              
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
                  className="w-full hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
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
