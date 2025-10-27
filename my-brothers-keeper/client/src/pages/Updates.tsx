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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, Image as ImageIcon, MessageSquare, Plus, X, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

type UpdateType = "general" | "gratitude" | "memory" | "milestone";

export default function Updates() {
  const { user } = useAuth();
  const { data: updates, refetch: refetchUpdates } = trpc.updates.list.useQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const deleteUpdateMutation = trpc.updates.delete.useMutation({
    onSuccess: () => {
      toast.success("Update deleted");
      refetchUpdates();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete update");
    },
  });

  const resetCreateForm = () => {
    setUpdateType("general");
    setTitle("");
    setBody("");
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.error("Only image files are allowed");
    }

    // Create preview URLs
    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setPhotos((prev) => [...prev, ...imageFiles]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateUpdate = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both a title and message");
      return;
    }

    setUploading(true);

    try {
      // Upload photos first if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);

        // Upload to server
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload photo");
        }

        const data = await response.json();
        photoUrls.push(data.url);
      }

      // Create update with photo URLs
      await createUpdateMutation.mutateAsync({
        type: updateType,
        title,
        body,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      });
    } catch (error: unknown) {
      toast.error("Failed to upload photos");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const canPost = user?.role === "primary" || user?.role === "admin";

  const updateTypeConfig = {
    general: {
      label: "General Update",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      placeholder: "Share what's on your mind...",
    },
    gratitude: {
      label: "Gratitude",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      placeholder: "Express your thanks...",
    },
    memory: {
      label: "Memory",
      icon: ImageIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      placeholder: "Share a special memory...",
    },
    milestone: {
      label: "Milestone",
      icon: MessageSquare,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      placeholder: "Mark an important moment...",
    },
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Updates</h1>
            <p className="text-muted-foreground mt-2">
              Share how you're doing with your support network
            </p>
          </div>
          {canPost && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Share an Update</DialogTitle>
                  <DialogDescription>
                    Let your support network know how you're doing
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Update Type */}
                  <div className="space-y-2">
                    <Label>Update Type</Label>
                    <Select
                      value={updateType}
                      onValueChange={(value: UpdateType) => setUpdateType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(updateTypeConfig).map(([key, config]) => (
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

                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder={`e.g., ${
                        updateType === "gratitude"
                          ? "Thank you for the meals"
                          : updateType === "memory"
                          ? "Remembering our favorite vacation"
                          : updateType === "milestone"
                          ? "Six months since we said goodbye"
                          : "Feeling grateful today"
                      }`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder={updateTypeConfig[updateType].placeholder}
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label>Photos (optional)</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload photos or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>

                    {/* Photo Previews */}
                    {photoPreviewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {photoPreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Helpful Note */}
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
                    disabled={uploading || createUpdateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUpdate}
                    disabled={uploading || createUpdateMutation.isPending}
                  >
                    {uploading
                      ? "Uploading photos..."
                      : createUpdateMutation.isPending
                      ? "Posting..."
                      : "Post Update"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Updates Feed */}
        <div className="space-y-4">
          {!updates || updates.length === 0 ? (
            <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
                <p className="text-muted-foreground mb-4">
                  {canPost
                    ? "Share your first update with your support network"
                    : "Updates from the family will appear here"}
                </p>
                {canPost && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Update
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            updates.map((update: any) => {
              const config = updateTypeConfig[update.type as UpdateType];
              const Icon = config.icon;
              const isAuthor = user?.id === update.authorId;

              return (
                <Card key={update.id} className="backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg">{update.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                          <CardDescription>
                            {update.authorName} •{" "}
                            {new Date(update.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      {isAuthor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUpdateMutation.mutate({ updateId: update.id })}
                          disabled={deleteUpdateMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{update.body}</p>

                    {/* Photos */}
                    {update.photoUrls && update.photoUrls.length > 0 && (
                      <div
                        className={`grid gap-3 ${
                          update.photoUrls.length === 1
                            ? "grid-cols-1"
                            : update.photoUrls.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-3"
                        }`}
                      >
                        {update.photoUrls.map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Update photo ${index + 1}`}
                            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, "_blank")}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

