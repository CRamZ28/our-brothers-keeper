import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
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
import { useState } from "react";
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
  const [visibilityScope, setVisibilityScope] = useState<
    "private" | "all_supporters" | "group" | "role" | "custom"
  >("all_supporters");
  const [visibilityGroupId, setVisibilityGroupId] = useState<string>("");
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);

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
    setVisibilityScope("all_supporters");
    setVisibilityGroupId("");
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

    if (visibilityScope === "group" && !visibilityGroupId) {
      toast.error("Please select a group");
      return;
    }

    if (visibilityScope === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : undefined;

    createEventMutation.mutate({
      title,
      description,
      location,
      startAt,
      endAt,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope,
      visibilityGroupId: visibilityGroupId ? parseInt(visibilityGroupId) : undefined,
      customUserIds: visibilityScope === "custom" ? customUserIds : undefined,
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

    if (visibilityScope === "group" && !visibilityGroupId) {
      toast.error("Please select a group");
      return;
    }

    if (visibilityScope === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : undefined;

    updateEventMutation.mutate({
      id: editingEventId,
      title,
      description,
      location,
      startAt,
      endAt,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope,
      visibilityGroupId: visibilityGroupId ? parseInt(visibilityGroupId) : undefined,
      customUserIds: visibilityScope === "custom" ? customUserIds : undefined,
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
    setCapacity(event.capacity?.toString() || "");
    setVisibilityScope(event.visibilityScope || "all_supporters");
    setVisibilityGroupId(event.visibilityGroupId?.toString() || "");
    setCustomUserIds(event.customUserIds || []);
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 noise-texture relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        
        <div className="relative p-8 space-y-8 z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1>Calendar</h1>
              <p className="text-muted-foreground mt-2">
                Coordinate gatherings, memorials, and support activities
              </p>
            </div>
          <div className="flex items-center gap-3">
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
                      <Label htmlFor="visibility">Who Can See This</Label>
                      <Select value={visibilityScope} onValueChange={(v) => setVisibilityScope(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_supporters">All Supporters</SelectItem>
                          <SelectItem value="group">Specific Group (e.g., Immediate Family)</SelectItem>
                          <SelectItem value="role">By Role (Admin/Primary only)</SelectItem>
                          <SelectItem value="custom">Custom Group (Select Individuals)</SelectItem>
                          <SelectItem value="private">Private (Primary only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Control who can view and RSVP to this event
                      </p>
                    </div>
                    {visibilityScope === "custom" && (
                      <div className="space-y-2">
                        <Label>Select People</Label>
                        <UserSelector
                          selectedUserIds={customUserIds}
                          onChange={setCustomUserIds}
                        />
                        <p className="text-xs text-muted-foreground">
                          Choose specific people who can see this event
                        </p>
                      </div>
                    )}
                    {visibilityScope === "group" && (
                      <div className="space-y-2">
                        <Label htmlFor="group">Select Group</Label>
                        <Select value={visibilityGroupId} onValueChange={setVisibilityGroupId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups?.map((group: { id: number; name: string }) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
          </div>
        </div>

        {/* Calendar View */}
        {view === "calendar" && (
          <div className="space-y-4">
            {/* Month Navigation */}
            <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
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

                    return (
                      <div
                        key={idx}
                        className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover-lift transition-all ${
                          !isCurrentMonth ? "bg-muted/30" : "bg-background"
                        } ${isTodayDate ? "border-primary border-2" : ""}`}
                        onClick={() => openDayEventsDialog(day)}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            !isCurrentMonth ? "text-muted-foreground" : ""
                          } ${isTodayDate ? "text-primary font-bold" : ""}`}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
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
                          ))}
                          {dayEvents.length > 2 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayEventsDialog(day);
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              +{dayEvents.length - 2} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No upcoming events scheduled. Check back later!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const startDate = new Date(event.startAt);
                    const isTodayEvent = isToday(startDate);
                    const isTomorrow =
                      format(startDate, "yyyy-MM-dd") ===
                      format(addMonths(new Date(), 0).setDate(new Date().getDate() + 1), "yyyy-MM-dd");

                    return (
                      <Card key={event.id} className={`card-elevated hover-lift ${isTodayEvent ? "border-primary border-2 accent-bar-teal relative" : ""}`}>
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
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleRsvp(event.id, "going")}
                              disabled={
                                rsvpMutation.isPending ||
                                (event.capacity && event.goingCount >= event.capacity)
                              }
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {event.capacity && event.goingCount >= event.capacity ? "Full" : "Going"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRsvp(event.id, "maybe")}
                              disabled={rsvpMutation.isPending}
                            >
                              Maybe
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRsvp(event.id, "declined")}
                              disabled={rsvpMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Can't Go
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">No past events yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <Card key={event.id} className="opacity-75">
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
                    </Card>
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
                  <Card key={event.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
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
                  </Card>
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
                  <Card key={event.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
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
                  </Card>
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
                    <DialogTitle className="text-2xl">{event.title}</DialogTitle>
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
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {(user && (event.createdById === user.id || isPrimaryOrAdmin)) && (
                      <div className="flex gap-2 sm:mr-auto">
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
                          <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                          Delete
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        onClick={() => {
                          handleRsvp(event.id, "going");
                          setEventDetailOpen(false);
                        }}
                        disabled={
                          rsvpMutation.isPending ||
                          (event.capacity && event.goingCount >= event.capacity)
                        }
                        className="flex-1 sm:flex-initial whitespace-nowrap px-4"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {event.capacity && event.goingCount >= event.capacity ? "Full" : "I'm Going"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleRsvp(event.id, "maybe");
                          setEventDetailOpen(false);
                        }}
                        disabled={rsvpMutation.isPending}
                        className="flex-1 sm:flex-initial whitespace-nowrap px-4"
                      >
                        Maybe
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleRsvp(event.id, "declined");
                          setEventDetailOpen(false);
                        }}
                        disabled={rsvpMutation.isPending}
                        className="flex-1 sm:flex-initial whitespace-nowrap px-4"
                      >
                        <X className="w-4 h-4 mr-2 shrink-0" />
                        Can't Go
                      </Button>
                    </div>
                  </DialogFooter>
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
                <Label htmlFor="edit-visibility">Who Can See This</Label>
                <Select value={visibilityScope} onValueChange={(v) => setVisibilityScope(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_supporters">All Supporters</SelectItem>
                    <SelectItem value="group">Specific Group (e.g., Immediate Family)</SelectItem>
                    <SelectItem value="role">By Role (Admin/Primary only)</SelectItem>
                    <SelectItem value="custom">Custom Group (Select Individuals)</SelectItem>
                    <SelectItem value="private">Private (Primary only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Control who can view and RSVP to this event
                </p>
              </div>
              {visibilityScope === "custom" && (
                <div className="space-y-2">
                  <Label>Select People</Label>
                  <UserSelector
                    selectedUserIds={customUserIds}
                    onChange={setCustomUserIds}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose specific people who can see this event
                  </p>
                </div>
              )}
              {visibilityScope === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-group">Select Group</Label>
                  <Select value={visibilityGroupId} onValueChange={setVisibilityGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group: { id: number; name: string }) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
      </div>
      </div>
    </DashboardLayout>
  );
}

