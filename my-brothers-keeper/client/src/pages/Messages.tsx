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
import { Image, MessageSquare, Pin, Plus, Upload, X } from "lucide-react";
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

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
    setMediaFiles([]);
    setMediaUrls([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== files.length) {
      toast.error("Only image and video files are allowed");
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    setUploadingMedia(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of mediaFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      setMediaUrls(uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some files');
      return [];
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Upload media files first if any
    const uploadedUrls = await uploadMediaFiles();

    createAnnouncementMutation.mutate({
      title,
      body,
      pinned,
      mediaUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 noise-texture relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        
        <div className="relative p-8 space-y-8 z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
            <h1>Messages</h1>
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
                  <div className="space-y-2">
                    <Label>Photos & Videos</Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <p className="text-xs text-gray-500 ml-2">{file.name}</p>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeMediaFile(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    disabled={createAnnouncementMutation.isPending || uploadingMedia}
                  >
                    {uploadingMedia ? "Uploading..." : createAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
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
                    {announcement.mediaUrls && announcement.mediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {announcement.mediaUrls.map((url: string, index: number) => {
                          const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                          return (
                            <div key={index} className="rounded-lg overflow-hidden">
                              {isVideo ? (
                                <video
                                  src={url}
                                  controls
                                  className="w-full h-auto"
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-auto object-cover"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
            <Card className="card-elevated-lg bg-white/90 backdrop-blur-md">
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
                <Card key={announcement.id} className="card-elevated hover-lift">
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
                    {announcement.mediaUrls && announcement.mediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {announcement.mediaUrls.map((url: string, index: number) => {
                          const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                          return (
                            <div key={index} className="rounded-lg overflow-hidden">
                              {isVideo ? (
                                <video
                                  src={url}
                                  controls
                                  className="w-full h-auto"
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-auto object-cover"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

