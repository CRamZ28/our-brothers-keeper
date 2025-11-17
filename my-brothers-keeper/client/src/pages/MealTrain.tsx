import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealTrainDayScheduler } from "@/components/MealTrainDayScheduler";
import { QuestionDialog } from "@/components/QuestionDialog";
import { VisibilitySelect, visibilityToBackend, backendToVisibility } from "@/components/VisibilitySelect";
import type { VisibilityOption } from "@/const";
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
  const [daySignupsDialogOpen, setDaySignupsDialogOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [todayMealsDialogOpen, setTodayMealsDialogOpen] = useState(false);

  const { data: mealTrain, refetch: refetchMealTrain } = trpc.mealTrain.get.useQuery();
  const { data: signups = [], refetch: refetchSignups } = trpc.mealTrain.listSignups.useQuery();
  const { data: configuredDays = [] } = trpc.mealTrain.getDays.useQuery(
    { mealTrainId: mealTrain?.id || 0 },
    { enabled: !!mealTrain?.id }
  );

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
    onError: (error) => {
      console.error("Volunteer error:", error);
      alert(error.message || "Failed to sign up for meal delivery. Please try again.");
    },
  });

  const handleVolunteer = (date: Date, notes: string) => {
    volunteerMutation.mutate({
      deliveryDate: date,
      notes,
    });
  };

  // Check if a date has capacity available and is configured
  const getDateCapacityInfo = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dateSignups = signupsByDate[dateKey]?.filter(s => s.status !== "cancelled") || [];
    const capacity = mealTrain?.dailyCapacity || 1;
    const remaining = capacity - dateSignups.length;
    const isConfigured = configuredDays.some(
      (day: { date: string; isAvailable: boolean }) => 
        format(new Date(day.date), "yyyy-MM-dd") === dateKey && day.isAvailable
    );
    return {
      signups: dateSignups,
      capacity,
      remaining,
      isFull: remaining <= 0,
      isAvailable: remaining > 0 && isConfigured,
      isConfigured,
    };
  };

  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const openDaySignupsDialog = (date: Date) => {
    setSelectedDayDate(date);
    setDaySignupsDialogOpen(true);
  };

  const openVolunteerDialogWithDate = (date: Date) => {
    setSelectedDate(date);
    setDaySignupsDialogOpen(false);
    setShowVolunteerDialog(true);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setTodayMealsDialogOpen(true);
  };

  const getTodaysMeals = () => {
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");
    return signupsByDate[todayKey]?.filter(s => s.status !== "cancelled") || [];
  };

  if (!mealTrain || !mealTrain.enabled) {
    return (
      <DashboardLayout>
        <GlassPageLayout title="Meal Train">
          <div className="max-w-2xl mx-auto">
            <GlassCard>
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
            </GlassCard>
          </div>
        </GlassPageLayout>
      </DashboardLayout>
    );
  }

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
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">M</span>
            <span>EAL</span>
            {' '}
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">T</span>
            <span>RAIN</span>
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecipientInfo(true)}
            >
              Recipient Info
            </Button>
            {isPrimaryOrAdmin && (
              <MealTrainConfigDialog
                mealTrain={mealTrain}
                onSave={() => refetchMealTrain()}
                trigger={
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                }
              />
            )}
            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("calendar")}
                className={view === "calendar" 
                  ? "bg-[#B08CA7] text-white hover:bg-[#9a7a91]" 
                  : "hover:bg-white/20"
                }
              >
                <CalendarIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Calendar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("list")}
                className={view === "list" 
                  ? "bg-[#B08CA7] text-white hover:bg-[#9a7a91]" 
                  : "hover:bg-white/20"
                }
              >
                <List className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">List</span>
              </Button>
            </div>
          </div>
        }
      >
        <p className="text-muted-foreground mb-6">Volunteer to provide a meal.</p>
        <div className="space-y-6">
          {/* Calendar View */}
          {view === "calendar" && (
            <GlassCard>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-3">
                    <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                  </div>
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
                    const userHasSignedUp = capacityInfo.signups.some(s => s.userId === user?.id);

                    return (
                      <div
                        key={format(date, "yyyy-MM-dd")}
                        className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover-lift transition-all bg-muted/30 ${
                          isPast ? "opacity-50 grayscale" : ""
                        }`}
                        onClick={() => openDaySignupsDialog(date)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isPast ? "text-gray-500" : ""}`}>{format(date, "d")}</div>
                        <div className="space-y-1">
                          {capacityInfo.isAvailable && !isPast ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs border-white text-white font-medium"
                              style={{ background: userHasSignedUp ? 'rgba(45, 181, 168, 0.7)' : 'rgba(176, 140, 167, 0.7)' }}
                            >
                              {capacityInfo.capacity > 1
                                ? `${capacityInfo.remaining} of ${capacityInfo.capacity} left`
                                : "Available"}
                            </Badge>
                          ) : capacityInfo.isFull ? (
                            <div>
                              <Badge 
                                className={`text-xs mb-1 font-medium ${
                                  isPast 
                                    ? "bg-gray-400 text-white" 
                                    : "text-white"
                                }`}
                                style={isPast ? undefined : {
                                  background: userHasSignedUp ? 'rgba(45, 181, 168, 0.7)' : 'rgba(176, 140, 167, 0.7)'
                                }}
                              >
                                {capacityInfo.capacity > 1 ? "Full" : "Filled"}
                              </Badge>
                              {capacityInfo.signups.slice(0, 3).map((s) => (
                                <p 
                                  key={s.id} 
                                  className={`text-xs truncate font-medium ${
                                    isPast ? "text-gray-500" : "text-white"
                                  }`}
                                >
                                  {s.userName}
                                </p>
                              ))}
                              {capacityInfo.signups.length > 3 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDaySignupsDialog(date);
                                  }}
                                  className={`text-xs hover:underline font-medium ${
                                    isPast ? "text-gray-500" : "text-white"
                                  }`}
                                >
                                  +{capacityInfo.signups.length - 2} more
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </GlassCard>
          )}

          {/* List View */}
          {view === "list" && (
            <GlassCard>
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
                    <GlassCard key={signup.id} className="card-elevated">
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
                    </GlassCard>
                  ))
                )}
              </CardContent>
            </GlassCard>
          )}

          {/* Today's Meals Dialog */}
          <Dialog open={todayMealsDialogOpen} onOpenChange={setTodayMealsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  Today's Meal Deliveries
                </DialogTitle>
                <DialogDescription>
                  {getTodaysMeals().length === 0 ? (
                    "No meal deliveries scheduled for today"
                  ) : (
                    `${getTodaysMeals().length} meal${getTodaysMeals().length !== 1 ? 's' : ''} scheduled today`
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {getTodaysMeals().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                    <p>No meal deliveries scheduled for today</p>
                  </div>
                ) : (
                  getTodaysMeals().map(signup => (
                    <GlassCard key={signup.id} className="card-elevated accent-bar-teal">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{signup.userName}</span>
                              <Badge variant={signup.status === "completed" ? "default" : "secondary"}>
                                {signup.status}
                              </Badge>
                            </div>
                            {signup.notes && (
                              <p className="text-sm text-muted-foreground">{signup.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </GlassCard>
                  ))
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTodayMealsDialogOpen(false);
                    setShowRecipientInfo(true);
                  }}
                >
                  View Recipient Info
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Day Signups Dialog */}
          <Dialog open={daySignupsDialogOpen} onOpenChange={setDaySignupsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  {selectedDayDate && format(selectedDayDate, "EEEE, MMMM d, yyyy")}
                </DialogTitle>
                <DialogDescription>
                  {selectedDayDate && (() => {
                    const capacityInfo = getDateCapacityInfo(selectedDayDate);
                    const isPast = selectedDayDate < new Date() && !isSameDay(selectedDayDate, new Date());
                    return capacityInfo.signups.length === 0
                      ? "No meal deliveries scheduled"
                      : `${capacityInfo.signups.length} of ${capacityInfo.capacity} spots filled`;
                  })()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {selectedDayDate && (() => {
                  const capacityInfo = getDateCapacityInfo(selectedDayDate);
                  const isPast = selectedDayDate < new Date() && !isSameDay(selectedDayDate, new Date());
                  
                  if (capacityInfo.signups.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <ChefHat className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                        <p>No meal deliveries scheduled for this day</p>
                      </div>
                    );
                  }
                  
                  return capacityInfo.signups.map(signup => (
                    <GlassCard key={signup.id} className="card-elevated accent-bar-teal">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{signup.userName}</span>
                              <Badge variant={signup.status === "completed" ? "default" : "secondary"}>
                                {signup.status}
                              </Badge>
                            </div>
                            {signup.notes && (
                              <p className="text-sm text-muted-foreground">{signup.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </GlassCard>
                  ));
                })()}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setDaySignupsDialogOpen(false);
                      setShowRecipientInfo(true);
                    }}
                  >
                    View Recipient Info
                  </Button>
                  {selectedDayDate && (() => {
                    const capacityInfo = getDateCapacityInfo(selectedDayDate);
                    const isPast = selectedDayDate < new Date() && !isSameDay(selectedDayDate, new Date());
                    return capacityInfo.isAvailable && !isPast && (
                      <Button 
                        size="sm"
                        onClick={() => openVolunteerDialogWithDate(selectedDayDate)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Volunteer for This Day
                      </Button>
                    );
                  })()}
                </div>
                <QuestionDialog
                  context="meal_train"
                  contextId={mealTrain?.id || 0}
                  defaultSubject="Question about meal train"
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Ask a Question
                    </Button>
                  }
                />
              </div>
            </DialogContent>
          </Dialog>

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
                isLoading={volunteerMutation.isPending}
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
      </GlassPageLayout>
    </DashboardLayout>
  );
}

// Volunteer Form Component
function VolunteerForm({
  date,
  onSubmit,
  onCancel,
  isLoading,
}: {
  date: Date | undefined;
  onSubmit: (notes: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What are you planning to bring? Any special preparation?"
          rows={3}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={() => onSubmit(notes)}
          disabled={isLoading}
          className="bg-[#2DB5A8] hover:bg-[#28a89c] text-white"
        >
          {isLoading ? "Submitting..." : "Volunteer"}
        </Button>
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
            <AlertCircle className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Allergies</p>
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
  const [visibilityOption, setVisibilityOption] = useState<VisibilityOption>("everyone");
  const [visibilityGroupIds, setVisibilityGroupIds] = useState<string[]>([]);
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);
  const [includeCommunityTier, setIncludeCommunityTier] = useState(mealTrain?.includeCommunityTier ?? false);
  const [enabled, setEnabled] = useState(mealTrain?.enabled ?? true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [daysAheadOpen, setDaysAheadOpen] = useState(30);

  const { data: groups = [] } = trpc.group.list.useQuery();
  const { data: existingDays = [] } = trpc.mealTrain.getDays.useQuery(
    { mealTrainId: mealTrain?.id || 0 },
    { enabled: !!mealTrain?.id }
  );

  useEffect(() => {
    if (open) {
      if (mealTrain?.id) {
        const visibility = backendToVisibility(
          mealTrain.visibilityScope || "all_supporters",
          mealTrain.visibilityGroupIds || [],
          mealTrain.customUserIds || []
        );
        setVisibilityOption(visibility.option);
        setVisibilityGroupIds(visibility.groupIds);
        setCustomUserIds(visibility.customUserIds);
        setDaysAheadOpen(mealTrain.daysAheadOpen || 30);
        setIncludeCommunityTier(mealTrain.includeCommunityTier ?? false);
        if (existingDays.length > 0) {
          const dates = existingDays.map((day: any) => new Date(day.date));
          setSelectedDates(dates);
        }
      } else {
        setVisibilityOption("everyone");
        setVisibilityGroupIds([]);
        setCustomUserIds([]);
        setIncludeCommunityTier(false);
      }
    }
  }, [open, mealTrain, existingDays]);

  const upsertMutation = trpc.mealTrain.upsert.useMutation({
    onSuccess: () => {
      onSave();
      setOpen(false);
    },
  });

  const handleSave = () => {
    if (visibilityOption === "groups" && visibilityGroupIds.length === 0) {
      alert("Please select at least one group for visibility");
      return;
    }

    if (visibilityOption === "custom" && customUserIds.length === 0) {
      alert("Please select at least one person for visibility");
      return;
    }

    const visibilityData = visibilityToBackend(visibilityOption, visibilityGroupIds, customUserIds);

    upsertMutation.mutate({
      location,
      peopleCount: peopleCount ? parseInt(peopleCount) : undefined,
      dailyCapacity,
      favoriteMeals,
      allergies,
      dislikes,
      specialInstructions,
      visibilityScope: visibilityData.visibilityScope as any,
      visibilityGroupIds: visibilityData.visibilityGroupIds,
      customUserIds: visibilityData.customUserIds,
      includeCommunityTier,
      enabled,
      daysAheadOpen,
      selectedDates: selectedDates.map(d => d.toISOString().split('T')[0]),
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
          <VisibilitySelect
            value={visibilityOption}
            onChange={setVisibilityOption}
            groupIds={visibilityGroupIds}
            onGroupIdsChange={setVisibilityGroupIds}
            customUserIds={customUserIds}
            onCustomUserIdsChange={setCustomUserIds}
            label="Who Can See This Meal Train"
            description="Control who can see and volunteer for this meal train"
          />

          <div>
            <Label htmlFor="location">Drop-Off Location</Label>
            <Textarea
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, Anytown, USA 12345"
              rows={2}
            />
            <p className="text-xs text-gray-600 mt-1">
              Anyone who can see the meal train will see the address
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
            <p className="text-xs text-gray-600 mt-1">
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
            <p className="text-xs text-gray-600 mt-1">
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

          <div>
            <Label>Available Days for Meals</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select which days you would like to receive meals
            </p>
            <MealTrainDayScheduler
              selectedDates={selectedDates}
              onChange={setSelectedDates}
              daysAheadOpen={daysAheadOpen}
              onDaysAheadChange={setDaysAheadOpen}
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
