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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Pin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Messages() {
  const { user } = useAuth();
  const { data: announcements, refetch: refetchAnnouncements } =
    trpc.messages.listAnnouncements.useQuery();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const createAnnouncementMutation = trpc.messages.createAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement posted!");
      setCreateDialogOpen(false);
      resetCreateForm();
      refetchAnnouncements();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post announcement");
    },
  });

  const deleteAnnouncementMutation = trpc.messages.deleteAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted");
      refetchAnnouncements();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete announcement");
    },
  });

  const resetCreateForm = () => {
    setTitle("");
    setBody("");
    setPinned(false);
  };

  const handleCreateAnnouncement = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    createAnnouncementMutation.mutate({
      title,
      body,
      pinned,
    });
  };

  const handleDeleteAnnouncement = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncementMutation.mutate({ id });
    }
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  // Separate pinned and regular announcements
  const pinnedAnnouncements = announcements?.filter((a) => a.pinned) || [];
  const regularAnnouncements = announcements?.filter((a) => !a.pinned) || [];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground mt-2">
              Updates and announcements from the family
            </p>
          </div>
          {isPrimaryOrAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Post an Announcement</DialogTitle>
                  <DialogDescription>
                    Share updates, gratitude, or important information with your support network.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Thank You for Your Support"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Message *</Label>
                    <Textarea
                      id="body"
                      placeholder="Write your message here..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="pinned" className="font-medium">
                        Pin to Top
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Keep this announcement at the top of the list
                      </p>
                    </div>
                    <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={createAnnouncementMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={createAnnouncementMutation.isPending}
                  >
                    {createAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Pin className="w-5 h-5" />
              Pinned
            </h2>
            <div className="space-y-3">
              {pinnedAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Pin className="w-4 h-4 text-primary" />
                          {announcement.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      {isPrimaryOrAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{announcement.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        <div className="space-y-4">
          {pinnedAnnouncements.length > 0 && (
            <h2 className="text-lg font-semibold">Recent Updates</h2>
          )}
          {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No announcements yet. Check back for updates from the family.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {regularAnnouncements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      {isPrimaryOrAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{announcement.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

