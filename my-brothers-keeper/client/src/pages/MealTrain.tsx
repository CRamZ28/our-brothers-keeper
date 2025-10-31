import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, List, MapPin, Users, ChefHat, AlertCircle, Settings, X } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";

export default function MealTrain() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showConfig, setShowConfig] = useState(false);
  const [showRecipientInfo, setShowRecipientInfo] = useState(false);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: mealTrain, refetch: refetchMealTrain } = trpc.mealTrain.get.useQuery();
  const { data: signups = [], refetch: refetchSignups } = trpc.mealTrain.listSignups.useQuery();

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  // Get signups grouped by date
  const signupsByDate = signups.reduce((acc, signup) => {
    const dateKey = format(new Date(signup.deliveryDate), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(signup);
    return acc;
  }, {} as Record<string, typeof signups>);

  // Volunteer mutation
  const volunteerMutation = trpc.mealTrain.volunteer.useMutation({
    onSuccess: () => {
      refetchSignups();
      setShowVolunteerDialog(false);
      setSelectedDate(undefined);
    },
  });

  const handleVolunteer = (date: Date, notes: string) => {
    volunteerMutation.mutate({
      deliveryDate: date,
      notes,
    });
  };

  // Check if a date has capacity available
  const getDateCapacityInfo = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dateSignups = signupsByDate[dateKey]?.filter(s => s.status !== "cancelled") || [];
    const capacity = mealTrain?.dailyCapacity || 1;
    const remaining = capacity - dateSignups.length;
    return {
      signups: dateSignups,
      capacity,
      remaining,
      isFull: remaining <= 0,
      isAvailable: remaining > 0,
    };
  };

  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (!mealTrain || !mealTrain.enabled) {
    return (
      <DashboardLayout>
        <div className="min-h-screen relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
          
          <div className="relative p-8">
            <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-6 h-6" />
                  Meal Train Not Configured
                </CardTitle>
                <CardDescription>
                  {isPrimaryOrAdmin
                    ? "Set up the meal train to help your community coordinate meal deliveries."
                    : "The meal train has not been set up yet. Please contact your household admin."}
                </CardDescription>
              </CardHeader>
              {isPrimaryOrAdmin && (
                <CardContent>
                  <MealTrainConfigDialog
                    mealTrain={mealTrain}
                    onSave={() => refetchMealTrain()}
                    trigger={
                      <Button>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Meal Train
                      </Button>
                    }
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ChefHat className="w-8 h-8" />
                Meal Calendar
              </h1>
              <p className="text-muted-foreground mt-1">Volunteer to provide a meal.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecipientInfo(true)}
                className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20"
              >
                Recipient Info
              </Button>
              {isPrimaryOrAdmin && (
                <MealTrainConfigDialog
                  mealTrain={mealTrain}
                  onSave={() => refetchMealTrain()}
                  trigger={
                    <Button variant="outline" size="sm" className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  }
                />
              )}
              <div className="flex backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 rounded-md">
                <Button
                  variant={view === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("calendar")}
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {view === "calendar" && (
            <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    Previous
                  </Button>
                  <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-semibold text-sm p-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {/* Days of month */}
                  {daysInMonth.map((date) => {
                    const capacityInfo = getDateCapacityInfo(date);
                    const isPast = date < new Date() && !isSameDay(date, new Date());

                    return (
                      <Card
                        key={format(date, "yyyy-MM-dd")}
                        className={`backdrop-blur-lg border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 ${
                          isPast ? "opacity-50" : ""
                        } ${capacityInfo.isAvailable && !isPast ? "hover:scale-105 cursor-pointer" : ""}`}
                        onClick={() => {
                          if (capacityInfo.isAvailable && !isPast) {
                            setSelectedDate(date);
                            setShowVolunteerDialog(true);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="text-sm font-medium mb-2">{format(date, "d")}</div>
                          {capacityInfo.isAvailable && !isPast ? (
                            <Badge variant="outline" className="text-xs">
                              {capacityInfo.capacity > 1
                                ? `${capacityInfo.remaining} of ${capacityInfo.capacity} left`
                                : "Available"}
                            </Badge>
                          ) : capacityInfo.isFull ? (
                            <div>
                              <Badge variant="default" className="text-xs mb-1">
                                {capacityInfo.capacity > 1 ? "Full" : "Filled"}
                              </Badge>
                              {capacityInfo.signups.slice(0, 2).map((s) => (
                                <p key={s.id} className="text-xs text-muted-foreground truncate">
                                  {s.userName}
                                </p>
                              ))}
                              {capacityInfo.signups.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{capacityInfo.signups.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* List View */}
          {view === "list" && (
            <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Meal Signups</CardTitle>
                <CardDescription>All scheduled meal deliveries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {signups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No meal deliveries scheduled yet</p>
                    <p className="text-sm mt-2">Be the first to volunteer!</p>
                  </div>
                ) : (
                  signups.map((signup) => (
                    <Card key={signup.id} className="backdrop-blur-lg bg-white/40 dark:bg-gray-800/40 border border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {format(new Date(signup.deliveryDate), "EEEE, MMMM d, yyyy")}
                              </span>
                              <Badge variant={signup.status === "completed" ? "default" : "secondary"}>
                                {signup.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{signup.userName}</span>
                            </div>
                            {signup.notes && (
                              <p className="text-sm mt-2 text-muted-foreground">{signup.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Volunteer Dialog */}
          <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Volunteer for Meal Delivery</DialogTitle>
                <DialogDescription>
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <VolunteerForm
                date={selectedDate}
                onSubmit={(notes) => selectedDate && handleVolunteer(selectedDate, notes)}
                onCancel={() => setShowVolunteerDialog(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Recipient Info Dialog */}
          <Dialog open={showRecipientInfo} onOpenChange={setShowRecipientInfo}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recipient Info</DialogTitle>
              </DialogHeader>
              <RecipientInfoView mealTrain={mealTrain} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Volunteer Form Component
function VolunteerForm({
  date,
  onSubmit,
  onCancel,
}: {
  date: Date | undefined;
  onSubmit: (notes: string) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What are you planning to bring? Any special preparation?"
          rows={3}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(notes)}>Volunteer</Button>
      </div>
    </div>
  );
}

// Recipient Info View Component
function RecipientInfoView({ mealTrain }: { mealTrain: any }) {
  return (
    <div className="space-y-4">
      {mealTrain.location && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Meal Drop-Off Location</p>
              <p className="text-sm whitespace-pre-line">{mealTrain.location}</p>
            </div>
          </div>
        </div>
      )}

      {mealTrain.peopleCount && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">People to Cook For</p>
              <p className="text-sm">{mealTrain.peopleCount} people</p>
            </div>
          </div>
        </div>
      )}

      {mealTrain.favoriteMeals && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ChefHat className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Favorite Meals or Restaurants</p>
              <p className="text-sm whitespace-pre-line">{mealTrain.favoriteMeals}</p>
            </div>
          </div>
        </div>
      )}

      {mealTrain.allergies && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">Allergies</p>
              <p className="text-sm whitespace-pre-line">{mealTrain.allergies}</p>
            </div>
          </div>
        </div>
      )}

      {mealTrain.dislikes && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Dislikes</p>
              <p className="text-sm whitespace-pre-line">{mealTrain.dislikes}</p>
            </div>
          </div>
        </div>
      )}

      {mealTrain.specialInstructions && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Special Instructions</p>
              <p className="text-sm whitespace-pre-line">{mealTrain.specialInstructions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Meal Train Configuration Dialog Component
function MealTrainConfigDialog({
  mealTrain,
  onSave,
  trigger,
}: {
  mealTrain: any;
  onSave: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(mealTrain?.location || "");
  const [peopleCount, setPeopleCount] = useState(mealTrain?.peopleCount || "");
  const [dailyCapacity, setDailyCapacity] = useState(mealTrain?.dailyCapacity || 1);
  const [favoriteMeals, setFavoriteMeals] = useState(mealTrain?.favoriteMeals || "");
  const [allergies, setAllergies] = useState(mealTrain?.allergies || "");
  const [dislikes, setDislikes] = useState(mealTrain?.dislikes || "");
  const [specialInstructions, setSpecialInstructions] = useState(mealTrain?.specialInstructions || "");
  const [addressVisibility, setAddressVisibility] = useState(
    mealTrain?.addressVisibilityScope || "all_supporters"
  );
  const [enabled, setEnabled] = useState(mealTrain?.enabled ?? true);

  const { data: groups = [] } = trpc.group.list.useQuery();

  const upsertMutation = trpc.mealTrain.upsert.useMutation({
    onSuccess: () => {
      onSave();
      setOpen(false);
    },
  });

  const handleSave = () => {
    upsertMutation.mutate({
      location,
      peopleCount: peopleCount ? parseInt(peopleCount) : undefined,
      dailyCapacity,
      favoriteMeals,
      allergies,
      dislikes,
      specialInstructions,
      addressVisibilityScope: addressVisibility as any,
      enabled,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meal Train Configuration</DialogTitle>
          <DialogDescription>
            Configure the meal train settings and privacy controls
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="location">Drop-Off Location</Label>
            <Textarea
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, Anytown, USA 12345"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="addressVisibility">Address Visibility</Label>
            <Select value={addressVisibility} onValueChange={setAddressVisibility}>
              <SelectTrigger id="addressVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_supporters">All Supporters</SelectItem>
                <SelectItem value="group">Specific Group</SelectItem>
                <SelectItem value="role">Admin/Primary Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Control who can see the delivery address
            </p>
          </div>

          <div>
            <Label htmlFor="peopleCount">Number of People to Cook For</Label>
            <Input
              id="peopleCount"
              type="number"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              placeholder="4"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many people should each meal serve?
            </p>
          </div>

          <div>
            <Label htmlFor="dailyCapacity">Daily Volunteer Capacity</Label>
            <Input
              id="dailyCapacity"
              type="number"
              min="1"
              max="10"
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(parseInt(e.target.value) || 1)}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of volunteers allowed per day (1-10)
            </p>
          </div>

          <div>
            <Label htmlFor="favoriteMeals">Favorite Meals or Restaurants</Label>
            <Textarea
              id="favoriteMeals"
              value={favoriteMeals}
              onChange={(e) => setFavoriteMeals(e.target.value)}
              placeholder="Pizza, Chinese food, Italian, etc."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Peanuts, shellfish, dairy, etc."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="dislikes">Dislikes</Label>
            <Textarea
              id="dislikes"
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="Foods the family doesn't enjoy"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Leave on front porch if no one is home, ring doorbell, etc."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enabled">Enable meal train</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
