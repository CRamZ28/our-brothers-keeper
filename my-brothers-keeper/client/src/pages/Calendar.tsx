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

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : undefined;

    createEventMutation.mutate({
      title,
      description,
      location,
      startAt,
      endAt,
      capacity: capacity ? parseInt(capacity) : undefined,
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
  const today = () => setCurrentMonth(new Date());

  // List view logic
  const now = new Date();
  const upcomingEvents = events?.filter((e) => new Date(e.startAt) >= now) || [];
  const pastEvents = events?.filter((e) => new Date(e.startAt) < now) || [];
  upcomingEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-teal-950 dark:via-blue-950 dark:to-purple-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
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
            <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
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
                        className={`min-h-[100px] p-2 border rounded-lg ${
                          !isCurrentMonth ? "bg-muted/30" : "bg-background"
                        } ${isTodayDate ? "border-primary border-2" : ""}`}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            !isCurrentMonth ? "text-muted-foreground" : ""
                          } ${isTodayDate ? "text-primary font-bold" : ""}`}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                              title={event.title}
                              onClick={() => {
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
                <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
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
                      <Card key={event.id} className={`backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 ${isTodayEvent ? "border-primary border-2" : ""}`}>
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
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    {(user && (event.createdById === user.id || isPrimaryOrAdmin)) && (
                      <div className="flex gap-2 mr-auto">
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
                      className="w-full sm:w-auto"
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
                      className="w-full sm:w-auto"
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
                      className="w-full sm:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Can't Go
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </DashboardLayout>
  );
}

