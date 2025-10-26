import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  Baby,
  Calendar,
  Check,
  Heart,
  Home,
  Plus,
  ShoppingCart,
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
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<
    "meals" | "rides" | "errands" | "childcare" | "household" | "other"
  >("meals");
  const [priority, setPriority] = useState<"low" | "normal" | "urgent">("normal");
  const [dueDate, setDueDate] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [visibilityScope, setVisibilityScope] = useState<
    "private" | "all_supporters" | "group" | "role"
  >("all_supporters");
  const [visibilityGroupId, setVisibilityGroupId] = useState<string>("");

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedNeedId, setSelectedNeedId] = useState<number | null>(null);
  const [claimNote, setClaimNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");

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

  const resetCreateForm = () => {
    setTitle("");
    setDetails("");
    setCategory("meals");
    setPriority("normal");
    setDueDate("");
    setCapacity("");
    setVisibilityScope("all_supporters");
    setVisibilityGroupId("");
  };

  const handleCreateNeed = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (visibilityScope === "group" && !visibilityGroupId) {
      toast.error("Please select a group");
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
      visibilityGroupId: visibilityGroupId ? parseInt(visibilityGroupId) : undefined,
    });
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

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Needs Board</h1>
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
                        <SelectItem value="private">Private (Primary only)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Control who can see and respond to this need
                    </p>
                  </div>
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
                  <Button onClick={handleCreateNeed} disabled={createNeedMutation.isPending}>
                    {createNeedMutation.isPending ? "Creating..." : "Create Need"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          </div>
          <p className="text-sm text-muted-foreground">
            {openNeeds.length} open need{openNeeds.length !== 1 ? 's' : ''}
          </p>
        </div>

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
              <Button onClick={handleClaimNeed} disabled={claimNeedMutation.isPending}>
                {claimNeedMutation.isPending ? "Claiming..." : "Claim Need"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Needs Tabs */}
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
              <Card>
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
                    <Card key={need.id} className="hover:shadow-md transition-shadow">
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
                              Due: {new Date(need.dueAt).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                      )}
                      <CardFooter>
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
                    <Card key={need.id}>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
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
                    <Card key={need.id} className="opacity-75">
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
      </div>

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
    </DashboardLayout>
  );
}

