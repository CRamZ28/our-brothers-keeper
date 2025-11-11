import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { GlassCard } from "@/components/ui/glass";
import { VisibilitySelect, visibilityToBackend, backendToVisibility } from "@/components/VisibilitySelect";
import type { VisibilityOption } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSelector } from "@/components/UserSelector";
import { QuestionDialog } from "@/components/QuestionDialog";
import { ReminderDialog } from "@/components/ReminderDialog";
import { trpc } from "@/lib/trpc";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
  List,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";

export default function Calendar() {
  const { user } = useAuth();
  const { data: events, refetch: refetchEvents } = trpc.events.list.useQuery();
  const { data: groups } = trpc.group.list.useQuery();

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [todayEventsDialogOpen, setTodayEventsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [eventType, setEventType] = useState<"regular" | "birthday" | "anniversary" | "milestone" | "holiday">("regular");
  const [recurring, setRecurring] = useState(false);
  const [associatedUserId, setAssociatedUserId] = useState<string>("");
  const [visibilityOption, setVisibilityOption] = useState<VisibilityOption>("everyone");
  const [visibilityGroupIds, setVisibilityGroupIds] = useState<string[]>([]);
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);

  // Clear associatedUserId and recurring when event type changes away from birthday/anniversary
  useEffect(() => {
    if (eventType !== "birthday" && eventType !== "anniversary") {
      setAssociatedUserId("");
      setRecurring(false);
    }
  }, [eventType]);

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully!");
      setCreateDialogOpen(false);
      resetCreateForm();
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event");
    },
  });

  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: () => {
      toast.success("RSVP updated!");
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update RSVP");
    },
  });

  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      setEditDialogOpen(false);
      setEditingEventId(null);
      resetCreateForm();
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setCapacity("");
    setEventType("regular");
    setRecurring(false);
    setAssociatedUserId("");
    setVisibilityOption("everyone");
    setVisibilityGroupIds([]);
    setCustomUserIds([]);
  };

  const handleCreateEvent = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (visibilityOption === "groups" && visibilityGroupIds.length === 0) {
      toast.error("Please select at least one group");
      return;
    }

    if (visibilityOption === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : undefined;

    const backendData = visibilityToBackend(visibilityOption, visibilityGroupIds, customUserIds);

    createEventMutation.mutate({
      title,
      description,
      location,
      startAt,
      endAt,
      eventType,
      recurring,
      associatedUserId: associatedUserId || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope: backendData.visibilityScope,
      visibilityGroupIds: backendData.visibilityGroupIds,
      customUserIds: backendData.customUserIds,
    });
  };

  const handleUpdateEvent = () => {
    if (!editingEventId) return;
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (visibilityOption === "groups" && visibilityGroupIds.length === 0) {
      toast.error("Please select at least one group");
      return;
    }

    if (visibilityOption === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : undefined;

    const backendData = visibilityToBackend(visibilityOption, visibilityGroupIds, customUserIds);

    updateEventMutation.mutate({
      id: editingEventId,
      title,
      description,
      location,
      startAt,
      endAt,
      eventType,
      recurring,
      associatedUserId: associatedUserId || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope: backendData.visibilityScope,
      visibilityGroupIds: backendData.visibilityGroupIds,
      customUserIds: backendData.customUserIds,
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ id: eventId });
      setEventDetailOpen(false);
    }
  };

  const openEditDialog = (event: any) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDescription(event.description || "");
    setLocation(event.location || "");
    const start = new Date(event.startAt);
    setStartDate(start.toISOString().split("T")[0]);
    setStartTime(start.toTimeString().slice(0, 5));
    if (event.endAt) {
      const end = new Date(event.endAt);
      setEndDate(end.toISOString().split("T")[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    } else {
      setEndDate("");
      setEndTime("");
    }
    
    const converted = backendToVisibility(
      event.visibilityScope || "all_supporters",
      event.visibilityGroupIds || [],
      event.customUserIds || []
    );
    setVisibilityOption(converted.option);
    setVisibilityGroupIds(converted.groupIds);
    setCustomUserIds(converted.customUserIds);
    setCapacity(event.capacity?.toString() || "");
    setEventType(event.eventType || "regular");
    setRecurring(event.recurring || false);
    setAssociatedUserId(event.associatedUserId || "");
    setEditDialogOpen(true);
    setEventDetailOpen(false);
  };

  const handleRsvp = (eventId: number, status: "going" | "declined" | "maybe") => {
    rsvpMutation.mutate({ eventId, status });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  // Calendar view logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events?.filter((event) => {
      const eventDate = new Date(event.startAt);
      return isSameDay(eventDate, day);
    }) || [];
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const today = () => {
    setCurrentMonth(new Date());
    setTodayEventsDialogOpen(true);
  };

  const openDayEventsDialog = (day: Date) => {
    setSelectedDayDate(day);
    setDayEventsDialogOpen(true);
  };

  const openCreateDialogWithDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setStartDate(dateStr);
    setDayEventsDialogOpen(false);
    setCreateDialogOpen(true);
  };

  const getTodaysEvents = () => {
    const today = new Date();
    return events?.filter(event => isSameDay(new Date(event.startAt), today)) || [];
  };

  // List view logic
  const now = new Date();
  const upcomingEvents = events?.filter((e) => new Date(e.startAt) >= now) || [];
  const pastEvents = events?.filter((e) => new Date(e.startAt) < now) || [];
  upcomingEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Events"
        actions={
          <>
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>

            {isPrimaryOrAdmin && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create a New Event</DialogTitle>
                    <DialogDescription>
                      Schedule a gathering, memorial service, or support activity.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Memorial Service"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add details about the event..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Community Church, 123 Main St"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity (optional)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set a limit for RSVPs (e.g., "Dinner for 6"). Leave empty for open attendance.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular Event</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="anniversary">Anniversary</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Important dates (birthdays, anniversaries, etc.) will appear prominently on the calendar
                      </p>
                    </div>
                    {(eventType === "birthday" || eventType === "anniversary") && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="recurring"
                            checked={recurring}
                            onChange={(e) => setRecurring(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="recurring" className="cursor-pointer">
                            Recurring (repeats yearly)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enable for birthdays and anniversaries to automatically repeat each year
                        </p>
                      </div>
                    )}
                    {(eventType === "birthday" || eventType === "anniversary") && (
                      <div className="space-y-2">
                        <Label>Associated Person (optional)</Label>
                        <UserSelector
                          selectedUserIds={associatedUserId ? [associatedUserId] : []}
                          onChange={(ids) => setAssociatedUserId(ids[0] || "")}
                        />
                        <p className="text-xs text-muted-foreground">
                          Link this date to a specific person (e.g., whose birthday it is)
                        </p>
                      </div>
                    )}
                    <VisibilitySelect
                      value={visibilityOption}
                      onChange={setVisibilityOption}
                      groupIds={visibilityGroupIds}
                      onGroupIdsChange={setVisibilityGroupIds}
                      customUserIds={customUserIds}
                      onCustomUserIdsChange={setCustomUserIds}
                      label="Who Can See This"
                      description="Control who can view and RSVP to this event"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date (optional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={createEventMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={createEventMutation.isPending}>
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      >
        {/* Calendar View */}
        {view === "calendar" && (
          <div className="space-y-4">
            {/* Month Navigation */}
            <GlassCard>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={previousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">
                      {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="sm" onClick={today}>
                      Today
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    const isPastDay = day < new Date() && !isToday(day);

                    return (
                      <div
                        key={idx}
                        className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover-lift transition-all bg-muted/30 ${
                          isTodayDate ? "border-primary border-2" : ""
                        } ${isPastDay ? "opacity-50 grayscale" : ""}`}
                        onClick={() => openDayEventsDialog(day)}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            !isCurrentMonth ? "text-muted-foreground" : ""
                          } ${isTodayDate ? "text-primary font-bold" : ""} ${isPastDay ? "text-gray-500" : ""}`}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const eventDate = new Date(event.startAt);
                            const isPastEvent = eventDate < new Date();
                            
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded truncate font-medium ${
                                  isPastEvent 
                                    ? "bg-gray-400/20 text-gray-600" 
                                    : "text-white"
                                }`}
                                style={isPastEvent ? undefined : {
                                  background: 'rgba(176, 140, 167, 0.7)'
                                }}
                                title={event.title}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event.id);
                                  setEventDetailOpen(true);
                                }}
                              >
                                {format(new Date(event.startAt), "h:mm a")} {event.title}
                                {event.capacity && (
                                  <span className="ml-1">
                                    ({event.goingCount}/{event.capacity})
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayEventsDialog(day);
                              }}
                              className="text-xs text-foreground hover:underline font-medium"
                            >
                              +{dayEvents.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </GlassCard>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <GlassCard>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No upcoming events scheduled. Check back later!
                    </p>
                  </CardContent>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const startDate = new Date(event.startAt);
                    const isTodayEvent = isToday(startDate);
                    const isTomorrow =
                      format(startDate, "yyyy-MM-dd") ===
                      format(addMonths(new Date(), 0).setDate(new Date().getDate() + 1), "yyyy-MM-dd");

                    return (
                      <GlassCard key={event.id} className={`card-elevated hover-lift ${isTodayEvent ? "border-primary border-2 accent-bar-teal relative" : ""}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-xl">{event.title}</CardTitle>
                                {isTodayEvent && (
                                  <Badge variant="default" className="bg-primary">
                                    Today
                                  </Badge>
                                )}
                                {isTomorrow && <Badge variant="secondary">Tomorrow</Badge>}
                                {event.capacity && (
                                  <Badge variant="outline" className="gap-1">
                                    <Users className="w-3 h-3" />
                                    {event.goingCount || 0}/{event.capacity}
                                    {event.goingCount >= event.capacity && " (Full)"}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>
                                    {startDate.toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                    {" at "}
                                    {startDate.toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        {event.description && (
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </CardContent>
                        )}
                        <CardContent className="pt-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleRsvp(event.id, "going")}
                              disabled={
                                rsvpMutation.isPending ||
                                (event.capacity && event.goingCount >= event.capacity) ||
                                (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)
                              }
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {event.capacity && event.goingCount >= event.capacity ? "Full" : 
                               (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin) ? "Past Event" : "Going"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRsvp(event.id, "maybe")}
                              disabled={rsvpMutation.isPending || (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)}
                            >
                              Maybe
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRsvp(event.id, "declined")}
                              disabled={rsvpMutation.isPending || (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Can't Go
                            </Button>
                          </div>
                          <QuestionDialog
                            context="event"
                            contextId={event.id}
                            defaultSubject={`Question about: ${event.title}`}
                            trigger={
                              <Button variant="outline" size="sm" className="w-full">
                                Ask a Question
                              </Button>
                            }
                          />
                        </CardContent>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastEvents.length === 0 ? (
                <GlassCard>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">No past events yet.</p>
                  </CardContent>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <GlassCard key={event.id} className="opacity-75">
                      <CardHeader>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>
                          {new Date(event.startAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </CardDescription>
                      </CardHeader>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Today's Events Dialog */}
        <Dialog open={todayEventsDialogOpen} onOpenChange={setTodayEventsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Today's Events
              </DialogTitle>
              <DialogDescription>
                {getTodaysEvents().length === 0 ? (
                  "No events scheduled for today"
                ) : (
                  `${getTodaysEvents().length} event${getTodaysEvents().length !== 1 ? 's' : ''} today`
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {getTodaysEvents().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                  <p>No events scheduled for today. Enjoy your day!</p>
                </div>
              ) : (
                getTodaysEvents().map(event => (
                  <GlassCard key={event.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
                    setTodayEventsDialogOpen(false);
                    setSelectedEvent(event.id);
                    setEventDetailOpen(true);
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {format(new Date(event.startAt), "h:mm a")}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location}
                              </div>
                            )}
                            {event.capacity && (
                              <Badge variant="outline" className="gap-1 text-xs mt-2">
                                <Users className="w-3 h-3" />
                                {event.goingCount || 0}/{event.capacity}
                                {event.goingCount >= event.capacity && " (Full)"}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {event.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      </CardContent>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTodayEventsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Day Events Dialog */}
        <Dialog open={dayEventsDialogOpen} onOpenChange={setDayEventsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                {selectedDayDate && format(selectedDayDate, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <DialogDescription>
                {selectedDayDate && getEventsForDay(selectedDayDate).length === 0 ? (
                  "No events on this day"
                ) : (
                  selectedDayDate && `${getEventsForDay(selectedDayDate).length} event${getEventsForDay(selectedDayDate).length !== 1 ? 's' : ''} on this day`
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {selectedDayDate && getEventsForDay(selectedDayDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                  <p>No events scheduled for this day</p>
                  {isPrimaryOrAdmin && (
                    <Button 
                      className="mt-4"
                      onClick={() => openCreateDialogWithDate(selectedDayDate)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                </div>
              ) : (
                selectedDayDate && getEventsForDay(selectedDayDate).map(event => (
                  <GlassCard key={event.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
                    setDayEventsDialogOpen(false);
                    setSelectedEvent(event.id);
                    setEventDetailOpen(true);
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {format(new Date(event.startAt), "h:mm a")}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location}
                              </div>
                            )}
                            {event.capacity && (
                              <Badge variant="outline" className="gap-1 text-xs mt-2">
                                <Users className="w-3 h-3" />
                                {event.goingCount || 0}/{event.capacity}
                                {event.goingCount >= event.capacity && " (Full)"}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {event.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      </CardContent>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
            <DialogFooter>
              {isPrimaryOrAdmin && selectedDayDate && (
                <Button 
                  onClick={() => openCreateDialogWithDate(selectedDayDate)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              )}
              <Button variant="outline" onClick={() => setDayEventsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Detail Dialog */}
        <Dialog open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
          <DialogContent className="max-w-2xl">
            {selectedEvent && events && (() => {
              const event = events.find(e => e.id === selectedEvent);
              if (!event) return null;
              
              const startDate = new Date(event.startAt);
              const isTodayEvent = isToday(startDate);
              const isTomorrow =
                format(startDate, "yyyy-MM-dd") ===
                format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                      <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                      {(user && (event.createdById === user.id || isPrimaryOrAdmin)) && (
                        <div className="flex gap-2 mr-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(event)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleteEventMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogHeader>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <CalendarIcon className="w-5 h-5" />
                      <span>
                        {startDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" at "}
                        {startDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {isTodayEvent && (
                        <Badge variant="default" className="bg-primary ml-2">
                          Today
                        </Badge>
                      )}
                      {isTomorrow && <Badge variant="secondary" className="ml-2">Tomorrow</Badge>}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-base text-muted-foreground">
                        <MapPin className="w-5 h-5" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2 text-base text-muted-foreground">
                        <Users className="w-5 h-5" />
                        <span>
                          {event.goingCount || 0} / {event.capacity} spots filled
                          {event.goingCount >= event.capacity && " (Full)"}
                        </span>
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <div className="py-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                      <Button
                        variant="default"
                        onClick={() => {
                          handleRsvp(event.id, "going");
                          setEventDetailOpen(false);
                        }}
                        disabled={
                          rsvpMutation.isPending ||
                          (event.capacity && event.goingCount >= event.capacity) ||
                          (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)
                        }
                        className="flex-1 whitespace-nowrap"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {event.capacity && event.goingCount >= event.capacity ? "Full" : 
                         (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin) ? "Past Event" : "I'm Going"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleRsvp(event.id, "maybe");
                          setEventDetailOpen(false);
                        }}
                        disabled={rsvpMutation.isPending || (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)}
                        className="flex-1 whitespace-nowrap"
                      >
                        Maybe
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleRsvp(event.id, "declined");
                          setEventDetailOpen(false);
                        }}
                        disabled={rsvpMutation.isPending || (event.startAt && new Date(event.startAt) < new Date() && !isPrimaryOrAdmin)}
                        className="flex-1 whitespace-nowrap"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Can't Go
                      </Button>
                    </DialogFooter>
                    <ReminderDialog targetType="event" targetId={event.id} />
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update event details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Memorial Service"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Add details about the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location (optional)</Label>
                <Input
                  id="edit-location"
                  placeholder="e.g., Community Church, 123 Main St"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity (optional)</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set a limit for RSVPs (e.g., "Dinner for 6"). Leave empty for open attendance.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-eventType">Event Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Event</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Important dates (birthdays, anniversaries, etc.) will appear prominently on the calendar
                </p>
              </div>
              {(eventType === "birthday" || eventType === "anniversary") && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-recurring"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-recurring" className="cursor-pointer">
                      Recurring (repeats yearly)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable for birthdays and anniversaries to automatically repeat each year
                  </p>
                </div>
              )}
              {(eventType === "birthday" || eventType === "anniversary") && (
                <div className="space-y-2">
                  <Label>Associated Person (optional)</Label>
                  <UserSelector
                    selectedUserIds={associatedUserId ? [associatedUserId] : []}
                    onChange={(ids) => setAssociatedUserId(ids[0] || "")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link this date to a specific person (e.g., whose birthday it is)
                  </p>
                </div>
              )}
              <VisibilitySelect
                value={visibilityOption}
                onChange={setVisibilityOption}
                groupIds={visibilityGroupIds}
                onGroupIdsChange={setVisibilityGroupIds}
                customUserIds={customUserIds}
                onCustomUserIdsChange={setCustomUserIds}
                label="Who Can See This"
                description="Control who can view and RSVP to this event"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date (optional)</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateEventMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateEvent} disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GlassPageLayout>
    </DashboardLayout>
  );
}

