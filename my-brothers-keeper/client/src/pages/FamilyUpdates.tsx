import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, Image as ImageIcon, MessageSquare, Pin, Plus, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

type PostType = "announcement" | "general" | "gratitude" | "memory" | "milestone";

interface UnifiedPost {
  id: string;
  type: PostType;
  title: string;
  body: string;
  authorName?: string;
  authorId?: string;
  createdAt: Date;
  pinned?: boolean;
  mediaUrls?: string[];
  photoUrls?: string[];
  isAnnouncement: boolean;
  originalId: number;
}

export default function FamilyUpdates() {
  const { user } = useAuth();
  const { data: announcements, refetch: refetchAnnouncements } = trpc.messages.listAnnouncements.useQuery();
  const { data: updates, refetch: refetchUpdates } = trpc.updates.list.useQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const createUpdateMutation = trpc.updates.create.useMutation({
    onSuccess: () => {
      toast.success("Update posted!");
      setCreateDialogOpen(false);
      resetCreateForm();
      refetchUpdates();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to post update");
    },
  });

  const deleteAnnouncementMutation = trpc.messages.deleteAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      refetchAnnouncements();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  const deleteUpdateMutation = trpc.updates.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      refetchUpdates();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  const resetCreateForm = () => {
    setPostType("announcement");
    setTitle("");
    setBody("");
    setPinned(false);
    setMediaFiles([]);
    setMediaPreviewUrls([]);
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type.includes('pdf') || file.type.includes('document');
      return isImage || isVideo || isDocument;
    });

    if (validFiles.length !== files.length) {
      toast.error("Only image, video, and document files are allowed");
    }

    const newPreviewUrls = validFiles.map((file) => 
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );
    setMediaPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setMediaFiles((prev) => [...prev, ...validFiles]);
  };

  const removeMedia = (index: number) => {
    if (mediaPreviewUrls[index]) {
      URL.revokeObjectURL(mediaPreviewUrls[index]);
    }
    setMediaPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    setUploading(true);
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

      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some files');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both a title and message");
      return;
    }

    const uploadedUrls = await uploadMediaFiles();

    if (postType === "announcement") {
      createAnnouncementMutation.mutate({
        title,
        body,
        pinned,
        mediaUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });
    } else {
      createUpdateMutation.mutate({
        type: postType,
        title,
        body,
        photoUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });
    }
  };

  const handleDeletePost = (post: UnifiedPost) => {
    if (confirm("Are you sure you want to delete this post?")) {
      if (post.isAnnouncement) {
        deleteAnnouncementMutation.mutate({ id: post.originalId });
      } else {
        deleteUpdateMutation.mutate({ updateId: post.originalId });
      }
    }
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  const unifiedPosts: UnifiedPost[] = [
    ...(announcements || []).map((a) => ({
      id: `announcement-${a.id}`,
      type: "announcement" as PostType,
      title: a.title,
      body: a.body,
      createdAt: new Date(a.createdAt),
      pinned: a.pinned,
      mediaUrls: a.mediaUrls || undefined,
      isAnnouncement: true,
      originalId: a.id,
    })),
    ...(updates || []).map((u: any) => ({
      id: `update-${u.id}`,
      type: u.type as PostType,
      title: u.title,
      body: u.body,
      authorName: u.authorName,
      authorId: u.authorId,
      createdAt: new Date(u.createdAt),
      photoUrls: u.photoUrls || undefined,
      isAnnouncement: false,
      originalId: u.id,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const pinnedPosts = unifiedPosts.filter((p) => p.pinned);
  const regularPosts = unifiedPosts.filter((p) => !p.pinned);

  const postTypeConfig = {
    announcement: {
      label: "Announcement",
      icon: Pin,
      color: "text-foreground",
      bgColor: "bg-white/30",
      placeholder: "Share important information with everyone...",
    },
    general: {
      label: "General Update",
      icon: MessageSquare,
      color: "text-foreground",
      bgColor: "bg-white/30",
      placeholder: "Share what's on your mind...",
    },
    gratitude: {
      label: "Gratitude",
      icon: Heart,
      color: "text-foreground",
      bgColor: "bg-white/30",
      placeholder: "Express your thanks...",
    },
    memory: {
      label: "Memory",
      icon: ImageIcon,
      color: "text-foreground",
      bgColor: "bg-white/30",
      placeholder: "Share a special memory...",
    },
    milestone: {
      label: "Milestone",
      icon: MessageSquare,
      color: "text-foreground",
      bgColor: "bg-white/30",
      placeholder: "Mark an important moment...",
    },
  };

  const renderPost = (post: UnifiedPost) => {
    const config = postTypeConfig[post.type];
    const Icon = config.icon;
    const canDelete = isPrimaryOrAdmin || (post.authorId && post.authorId === user?.id);
    const mediaItems = post.mediaUrls || post.photoUrls || [];

    return (
      <Card 
        key={post.id} 
        className={post.pinned ? "border-primary/50 bg-primary/5" : "card-elevated hover-lift"}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {post.pinned && <Pin className="w-4 h-4 text-primary" />}
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {post.authorName && `${post.authorName} • `}
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePost(post)}
                disabled={deleteAnnouncementMutation.isPending || deleteUpdateMutation.isPending}
              >
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {mediaItems.length > 0 && (
            <div
              className={`grid gap-3 ${
                mediaItems.length === 1
                  ? "grid-cols-1"
                  : mediaItems.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {mediaItems.map((url: string, index: number) => {
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
                        alt={`Media ${index + 1}`}
                        className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, "_blank")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Family Updates"
        actions={
          isPrimaryOrAdmin ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Share an Update</DialogTitle>
                    <DialogDescription>
                      Post announcements, updates, gratitude, memories, or milestones
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Post Type</Label>
                      <Select
                        value={postType}
                        onValueChange={(value: PostType) => setPostType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(postTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className={`w-4 h-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder={`e.g., ${
                          postType === "announcement"
                            ? "Important Family Update"
                            : postType === "gratitude"
                            ? "Thank you for the meals"
                            : postType === "memory"
                            ? "Remembering our favorite vacation"
                            : postType === "milestone"
                            ? "Six months since we said goodbye"
                            : "Feeling grateful today"
                        }`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea
                        placeholder={postTypeConfig[postType].placeholder}
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Media (optional)</Label>
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photos, videos, or documents
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Images, videos, PDFs supported
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>

                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              {file.type.startsWith('image/') && mediaPreviewUrls[index] ? (
                                <img
                                  src={mediaPreviewUrls[index]}
                                  alt={file.name}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-500 px-2 truncate">
                                      {file.name}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() => removeMedia(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {postType === "announcement" && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="pinned" className="font-medium">
                            Pin to Top
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Keep this announcement at the top of the timeline
                          </p>
                        </div>
                        <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
                      </div>
                    )}

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        💙 Share as much or as little as you'd like. Your support network is here
                        for you.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={uploading || createAnnouncementMutation.isPending || createUpdateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={uploading || createAnnouncementMutation.isPending || createUpdateMutation.isPending}
                    >
                      {uploading
                        ? "Uploading..."
                        : createAnnouncementMutation.isPending || createUpdateMutation.isPending
                        ? "Posting..."
                        : "Post Update"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : undefined
        }
      >
        {pinnedPosts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Pin className="w-5 h-5" />
                Pinned
              </h2>
              <div className="space-y-3">
                {pinnedPosts.map(renderPost)}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {pinnedPosts.length > 0 && (
              <h2 className="text-lg font-semibold">Recent Updates</h2>
            )}
            {regularPosts.length === 0 && pinnedPosts.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isPrimaryOrAdmin
                      ? "Share your first update with your support network"
                      : "Updates from the family will appear here"}
                  </p>
                  {isPrimaryOrAdmin && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Update
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {regularPosts.map(renderPost)}
              </div>
            )}
          </div>
      </GlassPageLayout>
    </DashboardLayout>
  );
}
