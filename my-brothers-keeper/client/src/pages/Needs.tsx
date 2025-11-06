import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserSelector } from "@/components/UserSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionDialog } from "@/components/QuestionDialog";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  Baby,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Heart,
  Home,
  List,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryIcons: Record<string, typeof Utensils> = {
  meals: Utensils,
  rides: Truck,
  errands: ShoppingCart,
  childcare: Baby,
  household: Home,
  other: Heart,
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  normal: "bg-gray-100 text-gray-800 border-gray-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

export default function Needs() {
  const { user } = useAuth();
  const { data: needs, refetch: refetchNeeds } = trpc.needs.list.useQuery();
  const { data: groups } = trpc.group.list.useQuery();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNeedId, setEditingNeedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<
    "meals" | "rides" | "errands" | "childcare" | "household" | "other"
  >("meals");
  const [priority, setPriority] = useState<"low" | "normal" | "urgent">("normal");
  const [dueDate, setDueDate] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [visibilityScope, setVisibilityScope] = useState<
    "private" | "all_supporters" | "group" | "role" | "custom"
  >("all_supporters");
  const [visibilityGroupIds, setVisibilityGroupIds] = useState<string[]>([]);
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedNeedId, setSelectedNeedId] = useState<number | null>(null);
  const [claimNote, setClaimNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNeedDetails, setSelectedNeedDetails] = useState<any | null>(null);
  const [dayNeedsDialogOpen, setDayNeedsDialogOpen] = useState(false);
  const [selectedDayNeeds, setSelectedDayNeeds] = useState<typeof openNeeds>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [todayNeedsDialogOpen, setTodayNeedsDialogOpen] = useState(false);

  const createNeedMutation = trpc.needs.create.useMutation({
    onSuccess: () => {
      toast.success("Need created successfully!");
      setCreateDialogOpen(false);
      resetCreateForm();
      refetchNeeds();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create need");
    },
  });

  const claimNeedMutation = trpc.needs.claim.useMutation({
    onSuccess: () => {
      toast.success("Need claimed! Thank you for helping.");
      setClaimDialogOpen(false);
      setClaimNote("");
      refetchNeeds();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to claim need");
    },
  });

  const completeNeedMutation = trpc.needs.complete.useMutation({
    onSuccess: () => {
      toast.success("Need marked as completed!");
      setCompleteDialogOpen(false);
      setCompletionNote("");
      refetchNeeds();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete need");
    },
  });

  const updateNeedMutation = trpc.needs.update.useMutation({
    onSuccess: () => {
      toast.success("Need updated successfully!");
      setEditDialogOpen(false);
      setEditingNeedId(null);
      resetCreateForm();
      refetchNeeds();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update need");
    },
  });

  const deleteNeedMutation = trpc.needs.delete.useMutation({
    onSuccess: () => {
      toast.success("Need deleted successfully!");
      refetchNeeds();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete need");
    },
  });

  const resetCreateForm = () => {
    setTitle("");
    setDetails("");
    setCategory("meals");
    setPriority("normal");
    setDueDate("");
    setCapacity("");
    setVisibilityScope("all_supporters");
    setVisibilityGroupIds([]);
    setCustomUserIds([]);
  };

  const handleCreateNeed = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (visibilityScope === "group" && visibilityGroupIds.length === 0) {
      toast.error("Please select at least one group");
      return;
    }

    if (visibilityScope === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    createNeedMutation.mutate({
      title,
      details,
      category,
      priority,
      dueAt: dueDate ? new Date(dueDate) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope,
      visibilityGroupIds: visibilityGroupIds.length > 0 ? visibilityGroupIds.map(id => parseInt(id)) : undefined,
      customUserIds: visibilityScope === "custom" ? customUserIds : undefined,
    });
  };

  const handleUpdateNeed = () => {
    if (!editingNeedId) return;
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (visibilityScope === "group" && visibilityGroupIds.length === 0) {
      toast.error("Please select at least one group");
      return;
    }

    if (visibilityScope === "custom" && customUserIds.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    updateNeedMutation.mutate({
      id: editingNeedId,
      title,
      details,
      category,
      priority,
      dueAt: dueDate ? new Date(dueDate) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      visibilityScope,
      visibilityGroupIds: visibilityGroupIds.length > 0 ? visibilityGroupIds.map(id => parseInt(id)) : undefined,
      customUserIds: visibilityScope === "custom" ? customUserIds : undefined,
    });
  };

  const handleDeleteNeed = (needId: number) => {
    if (confirm("Are you sure you want to delete this need?")) {
      deleteNeedMutation.mutate({ id: needId });
    }
  };

  const openEditDialog = (need: any) => {
    setEditingNeedId(need.id);
    setTitle(need.title);
    setDetails(need.details || "");
    setCategory(need.category);
    setPriority(need.priority);
    setDueDate(need.dueAt ? new Date(need.dueAt).toISOString().split("T")[0] : "");
    setCapacity(need.capacity?.toString() || "");
    setVisibilityScope(need.visibilityScope || "all_supporters");
    setVisibilityGroupIds(need.visibilityGroupIds?.map((id: number) => id.toString()) || []);
    setCustomUserIds(need.customUserIds || []);
    setEditDialogOpen(true);
  };

  const formatDateWithDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const dateStr = date.toLocaleDateString();
    return `${dayName}, ${dateStr}`;
  };

  const openDetailsDialog = (need: any) => {
    setSelectedNeedDetails(need);
    setDetailsDialogOpen(true);
  };

  const openDayNeedsDialog = (date: Date, needs: typeof openNeeds) => {
    setSelectedDayDate(date);
    setSelectedDayNeeds(needs);
    setDayNeedsDialogOpen(true);
  };

  const openCreateNeedForDate = (date: Date) => {
    // Pre-fill the due date with the selected date
    const dateStr = date.toISOString().split("T")[0];
    setDueDate(dateStr);
    // Close the day dialog and open create dialog
    setDayNeedsDialogOpen(false);
    setCreateDialogOpen(true);
  };

  // Get needs due today
  const getTodaysNeeds = () => {
    const today = new Date();
    const todayKey = getDateKey(today);
    return openNeeds.filter(need => {
      if (!need.dueAt) return false;
      const needKey = getDateKey(new Date(need.dueAt));
      return needKey === todayKey;
    });
  };

  // Calendar utility functions
  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return getDateKey(date1) === getDateKey(date2);
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Generate all days to display (including leading/trailing days)
    const days: Date[] = [];
    
    // Add leading days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add trailing days from next month to complete the grid (up to 6 weeks)
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const dayOfWeek = date.getDay(); // 0 = Sunday
    
    // Start from Sunday of this week
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    
    // Add 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (calendarViewMode === 'month') {
      // Set to day 1 first to prevent month skipping (e.g., Jan 31 -> Feb would roll to Mar)
      newDate.setDate(1);
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setTodayNeedsDialogOpen(true);
  };

  const handleClaimNeed = () => {
    if (!selectedNeedId) return;

    claimNeedMutation.mutate({
      needId: selectedNeedId,
      note: claimNote || undefined,
    });
  };

  const openClaimDialog = (needId: number) => {
    setSelectedNeedId(needId);
    setClaimDialogOpen(true);
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  const openNeeds = (needs?.filter((n) => n.status === "open") || [])
    .sort((a, b) => {
      // Needs with due dates come first, sorted by nearest date
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (a.dueAt) return -1; // a has due date, b doesn't
      if (b.dueAt) return 1;  // b has due date, a doesn't
      return 0; // neither has due date
    });
  const claimedNeeds = needs?.filter((n) => n.status === "claimed") || [];
  const completedNeeds = needs?.filter((n) => n.status === "completed") || [];

  // Organize needs by date for calendar view
  const needsByDate = new Map<string, typeof openNeeds>();
  openNeeds.filter(n => n.dueAt).forEach(need => {
    const dateKey = getDateKey(new Date(need.dueAt!));
    if (!needsByDate.has(dateKey)) {
      needsByDate.set(dateKey, []);
    }
    needsByDate.get(dateKey)!.push(need);
  });

  const undatedNeeds = openNeeds.filter(n => !n.dueAt);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 noise-texture relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-4 md:p-8 space-y-4 md:space-y-6 z-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
            <h1>Needs Board</h1>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "" : "hover:bg-white/20"}
                >
                  <List className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">List</span>
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={viewMode === "calendar" ? "" : "hover:bg-white/20"}
                >
                  <CalendarDays className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Calendar</span>
                </Button>
              </div>
              {isPrimaryOrAdmin && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shrink-0">
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Add Need</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create a New Need</DialogTitle>
                  <DialogDescription>
                    Post a specific way supporters can help. Be clear about what you need and when.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Meal for Tuesday dinner"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="rides">Rides</SelectItem>
                        <SelectItem value="errands">Errands</SelectItem>
                        <SelectItem value="childcare">Childcare</SelectItem>
                        <SelectItem value="household">Household</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
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
                      Control who can see and respond to this need
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
                        Choose specific people who can see this need
                      </p>
                    </div>
                  )}
                  {visibilityScope === "group" && (
                    <div className="space-y-2">
                      <Label>Select Groups (you can select multiple)</Label>
                      <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
                        {groups && groups.length > 0 ? (
                          groups.map((group: { id: number; name: string }) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`group-${group.id}`}
                                checked={visibilityGroupIds.includes(group.id.toString())}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setVisibilityGroupIds([...visibilityGroupIds, group.id.toString()]);
                                  } else {
                                    setVisibilityGroupIds(visibilityGroupIds.filter(id => id !== group.id.toString()));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                                {group.name}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No groups available. Create groups in the People page.</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
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
                      Set how many people can claim this (e.g., "1" for grocery run, "3" for moving help). Leave empty for unlimited.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Details (optional)</Label>
                    <Textarea
                      id="details"
                      placeholder="Add any specific instructions or preferences..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={createNeedMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateNeed} 
                    disabled={createNeedMutation.isPending}
                    className="shadow-md font-semibold"
                  >
                    {createNeedMutation.isPending ? "Creating..." : "Create Need"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
            </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {openNeeds.length} open need{openNeeds.length !== 1 ? 's' : ''}
            </p>
          </div>

        {/* Edit Need Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Need</DialogTitle>
              <DialogDescription>
                Update the details for this need.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Meal for Tuesday dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="rides">Rides</SelectItem>
                    <SelectItem value="errands">Errands</SelectItem>
                    <SelectItem value="childcare">Childcare</SelectItem>
                    <SelectItem value="household">Household</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
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
                  Control who can see and respond to this need
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
                    Choose specific people who can see this need
                  </p>
                </div>
              )}
              {visibilityScope === "group" && (
                <div className="space-y-2">
                  <Label>Select Groups (you can select multiple)</Label>
                  <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
                    {groups && groups.length > 0 ? (
                      groups.map((group: { id: number; name: string }) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-group-${group.id}`}
                            checked={visibilityGroupIds.includes(group.id.toString())}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisibilityGroupIds([...visibilityGroupIds, group.id.toString()]);
                              } else {
                                setVisibilityGroupIds(visibilityGroupIds.filter(id => id !== group.id.toString()));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`edit-group-${group.id}`} className="text-sm cursor-pointer">
                            {group.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No groups available. Create groups in the People page.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date (optional)</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  Set how many people can claim this (e.g., "1" for grocery run, "3" for moving help). Leave empty for unlimited.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-details">Details (optional)</Label>
                <Textarea
                  id="edit-details"
                  placeholder="Add any specific instructions or preferences..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingNeedId(null);
                  resetCreateForm();
                }}
                disabled={updateNeedMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateNeed} 
                disabled={updateNeedMutation.isPending}
                className="shadow-md font-semibold"
              >
                {updateNeedMutation.isPending ? "Updating..." : "Update Need"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Claim Dialog */}
        <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim This Need</DialogTitle>
              <DialogDescription>
                Let the family know you'll take care of this. You can add a note with any questions
                or details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="claimNote">Note (optional)</Label>
                <Textarea
                  id="claimNote"
                  placeholder="e.g., I'll drop it off around 5pm"
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setClaimDialogOpen(false)}
                disabled={claimNeedMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleClaimNeed} 
                disabled={claimNeedMutation.isPending}
                className="shadow-md font-semibold"
              >
                {claimNeedMutation.isPending ? "Claiming..." : "Claim Need"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Calendar View */}
        {viewMode === "calendar" ? (
          <div className="space-y-4">
            {/* Calendar Navigation */}
            <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                      ←
                    </Button>
                    <h3 className="text-lg font-semibold min-w-[180px] text-center">
                      {calendarViewMode === 'month' 
                        ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                        : `Week of ${currentDate.toLocaleDateString()}`
                      }
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                      →
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                      <Button
                        variant={calendarViewMode === "month" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCalendarViewMode("month")}
                      >
                        Month
                      </Button>
                      <Button
                        variant={calendarViewMode === "week" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCalendarViewMode("week")}
                      >
                        Week
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {(calendarViewMode === 'month' ? getMonthDays(currentDate) : getWeekDays(currentDate)).map((day, idx) => {
                    const dateKey = getDateKey(day);
                    const dayNeeds = needsByDate.get(dateKey) || [];
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => openDayNeedsDialog(day, dayNeeds)}
                        className={`
                          min-h-[80px] md:min-h-[120px] p-1 md:p-2 rounded-lg border cursor-pointer
                          ${isCurrentMonth ? 'bg-white/50' : 'bg-gray-50/50'}
                          ${isToday ? 'border-primary border-2' : 'border-gray-200'}
                          hover:bg-white/70 hover-lift transition-all
                        `}
                      >
                        <div className={`text-xs md:text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayNeeds.slice(0, 2).map(need => {
                            const Icon = categoryIcons[need.category];
                            return (
                              <div
                                key={need.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailsDialog(need);
                                }}
                                className={`
                                  text-xs p-1 rounded cursor-pointer truncate
                                  ${priorityColors[need.priority]} 
                                  hover:shadow-md transition-shadow
                                `}
                                title={need.title}
                              >
                                <div className="flex items-center gap-1">
                                  <Icon className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{need.title}</span>
                                </div>
                              </div>
                            );
                          })}
                          {dayNeeds.length > 2 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayNeedsDialog(day, dayNeeds);
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              +{dayNeeds.length - 2} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Undated Needs Section */}
            {undatedNeeds.length > 0 && (
              <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Needs Without Due Dates ({undatedNeeds.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {undatedNeeds.map(need => {
                      const Icon = categoryIcons[need.category];
                      return (
                        <div
                          key={need.id}
                          onClick={() => openDetailsDialog(need)}
                          className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-white/70 cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{need.title}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className={`${priorityColors[need.priority]} text-xs`}>
                                {need.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* List View - Needs Tabs */
        <Tabs defaultValue="open" className="space-y-6">
          <TabsList>
            <TabsTrigger value="open">
              Open ({openNeeds.length})
            </TabsTrigger>
            <TabsTrigger value="claimed">
              Claimed ({claimedNeeds.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedNeeds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {openNeeds.length === 0 ? (
              <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No open needs at the moment. Check back later!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {openNeeds.map((need) => {
                  const Icon = categoryIcons[need.category];
                  return (
                    <Card key={need.id} className="card-elevated hover-lift accent-bar-teal relative">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg">{need.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={priorityColors[need.priority]}>
                                  {need.priority === "urgent" && (
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {need.priority}
                                </Badge>
                                <Badge variant="secondary">{need.category}</Badge>
                                {need.capacity && (
                                  <Badge variant="outline" className="gap-1">
                                    {need.claimCount || 0}/{need.capacity}
                                    {need.claimCount >= need.capacity && " (Filled)"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {(user && (need.createdById === user.id || isPrimaryOrAdmin)) && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(need)}
                                disabled={deleteNeedMutation.isPending}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNeed(need.id)}
                                disabled={deleteNeedMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      {(need.details || need.dueAt) && (
                        <CardContent className="space-y-2">
                          {need.details && (
                            <p className="text-sm text-muted-foreground">{need.details}</p>
                          )}
                          {need.dueAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              Due: {formatDateWithDayOfWeek(new Date(need.dueAt))}
                            </div>
                          )}
                        </CardContent>
                      )}
                      <CardFooter className="flex-col gap-2">
                        <Button
                          className="w-full"
                          onClick={() => openClaimDialog(need.id)}
                          disabled={
                            user?.role === "primary" ||
                            (need.capacity && need.claimCount >= need.capacity)
                          }
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {need.capacity && need.claimCount >= need.capacity
                            ? "Filled"
                            : "I Can Help"}
                        </Button>
                        <QuestionDialog
                          context="need"
                          contextId={need.id}
                          defaultSubject={`Question about: ${need.title}`}
                          trigger={
                            <Button variant="outline" size="sm" className="w-full">
                              Ask a Question
                            </Button>
                          }
                        />
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claimed" className="space-y-4">
            {claimedNeeds.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">No claimed needs yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {claimedNeeds.map((need) => {
                  const Icon = categoryIcons[need.category];
                  return (
                    <Card key={need.id} className="card-elevated hover-lift">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg">{need.title}</CardTitle>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Claimed
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  by <span className="font-medium text-foreground">{need.claimedByName || "Someone"}</span>
                                </span>
                                {need.dueAt && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(need.dueAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {(user && (need.createdById === user.id || isPrimaryOrAdmin)) && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(need)}
                                disabled={deleteNeedMutation.isPending}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNeed(need.id)}
                                disabled={deleteNeedMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      {need.details && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{need.details}</p>
                        </CardContent>
                      )}
                      <CardFooter>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedNeedId(need.id);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedNeeds.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">No completed needs yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completedNeeds.map((need) => {
                  const Icon = categoryIcons[need.category];
                  return (
                    <Card key={need.id} className="card-elevated opacity-75">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg line-through">{need.title}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline">
                                Completed
                              </Badge>
                              {need.completedAt && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(need.completedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}

        {/* Today's Needs Dialog */}
        <Dialog open={todayNeedsDialogOpen} onOpenChange={setTodayNeedsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Today's Needs
              </DialogTitle>
              <DialogDescription>
                {getTodaysNeeds().length === 0 ? (
                  "No needs due today"
                ) : (
                  `${getTodaysNeeds().length} need${getTodaysNeeds().length !== 1 ? 's' : ''} due today`
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {getTodaysNeeds().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                  <p>All caught up! No needs due today.</p>
                </div>
              ) : (
                getTodaysNeeds().map(need => {
                  const Icon = categoryIcons[need.category];
                  return (
                    <Card key={need.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
                      setTodayNeedsDialogOpen(false);
                      openDetailsDialog(need);
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{need.title}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className={priorityColors[need.priority]}>
                                {need.priority === "urgent" && (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {need.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{need.category}</Badge>
                              {need.capacity && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  {need.claimCount || 0}/{need.capacity}
                                  {need.claimCount >= need.capacity && " (Filled)"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {need.details && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{need.details}</p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTodayNeedsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Day Needs Dialog (show all needs for a specific day) */}
        <Dialog open={dayNeedsDialogOpen} onOpenChange={setDayNeedsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                {selectedDayDate && formatDateWithDayOfWeek(selectedDayDate)}
              </DialogTitle>
              <DialogDescription>
                {selectedDayNeeds.length} need{selectedDayNeeds.length !== 1 ? 's' : ''} on this day
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {selectedDayNeeds.map(need => {
                const Icon = categoryIcons[need.category];
                return (
                  <Card key={need.id} className="card-elevated hover-lift accent-bar-teal cursor-pointer" onClick={() => {
                    setDayNeedsDialogOpen(false);
                    openDetailsDialog(need);
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{need.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className={priorityColors[need.priority]}>
                              {need.priority === "urgent" && (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {need.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{need.category}</Badge>
                            {need.capacity && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                {need.claimCount || 0}/{need.capacity}
                                {need.claimCount >= need.capacity && " (Filled)"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {need.details && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{need.details}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="default" 
                onClick={() => selectedDayDate && openCreateNeedForDate(selectedDayDate)}
                className="flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Need
              </Button>
              <Button variant="outline" onClick={() => setDayNeedsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Need Details Dialog (for Calendar View) */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedNeedDetails && (() => {
                  const Icon = categoryIcons[selectedNeedDetails.category];
                  return <Icon className="w-5 h-5 text-primary" />;
                })()}
                {selectedNeedDetails?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedNeedDetails?.dueAt && (
                  <span className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4" />
                    Due: {formatDateWithDayOfWeek(new Date(selectedNeedDetails.dueAt))}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedNeedDetails && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={priorityColors[selectedNeedDetails.priority]}>
                      {selectedNeedDetails.priority === "urgent" && (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {selectedNeedDetails.priority}
                    </Badge>
                    <Badge variant="secondary">{selectedNeedDetails.category}</Badge>
                    {selectedNeedDetails.capacity && (
                      <Badge variant="outline" className="gap-1">
                        {selectedNeedDetails.claimCount || 0}/{selectedNeedDetails.capacity}
                        {selectedNeedDetails.claimCount >= selectedNeedDetails.capacity && " (Filled)"}
                      </Badge>
                    )}
                  </div>
                  {selectedNeedDetails.details && (
                    <div>
                      <Label className="text-sm font-semibold">Details</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedNeedDetails.details}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
              {selectedNeedDetails && (
                <>
                  {user && (selectedNeedDetails.createdById === user.id || isPrimaryOrAdmin) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDetailsDialogOpen(false);
                        openEditDialog(selectedNeedDetails);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      openClaimDialog(selectedNeedDetails.id);
                    }}
                    disabled={
                      user?.role === "primary" ||
                      (selectedNeedDetails.capacity && selectedNeedDetails.claimCount >= selectedNeedDetails.capacity)
                    }
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {selectedNeedDetails.capacity && selectedNeedDetails.claimCount >= selectedNeedDetails.capacity
                      ? "Filled"
                      : "I Can Help"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Need Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Completed</DialogTitle>
              <DialogDescription>
                Confirm that this need has been fulfilled
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="completion-note" className="mb-2 block">Completion Note (Optional)</Label>
                <Textarea
                  id="completion-note"
                  placeholder="e.g., Dropped off groceries at 5pm"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedNeedId) {
                    completeNeedMutation.mutate({
                      needId: selectedNeedId,
                      completionNote: completionNote || undefined,
                    });
                  }
                }}
                disabled={completeNeedMutation.isPending}
              >
                {completeNeedMutation.isPending ? "Completing..." : "Mark as Completed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </DashboardLayout>
  );
}

