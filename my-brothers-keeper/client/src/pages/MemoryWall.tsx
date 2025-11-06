import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, MessageSquare, BookOpen, Sparkles, Image, Plus, X, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const typeConfig = {
  memory: {
    label: "Memory",
    icon: Heart,
    color: "#14B8A6", // Vibrant teal
    bgColor: "bg-teal-100",
    borderColor: "border-teal-400",
    iconBgColor: "bg-teal-200",
    textColor: "text-teal-700",
  },
  story: {
    label: "Story",
    icon: BookOpen,
    color: "#3B82F6", // Vibrant blue
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
    iconBgColor: "bg-blue-200",
    textColor: "text-blue-700",
  },
  encouragement: {
    label: "Encouragement",
    icon: Sparkles,
    color: "#F59E0B", // Vibrant amber
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
    iconBgColor: "bg-amber-200",
    textColor: "text-amber-800",
  },
  prayer: {
    label: "Prayer/Verse",
    icon: MessageSquare,
    color: "#EC4899", // Vibrant pink
    bgColor: "bg-pink-100",
    borderColor: "border-pink-400",
    iconBgColor: "bg-pink-200",
    textColor: "text-pink-700",
  },
  picture: {
    label: "Picture",
    icon: Image,
    color: "#8B5CF6", // Vibrant purple
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
    iconBgColor: "bg-purple-200",
    textColor: "text-purple-700",
  },
};

// Seeded random number generator for consistent placement
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate deterministic collage layout for a card
const getCollageLayout = (entryId: number, index: number) => {
  const seed = entryId + index * 1000;
  
  // Random position (0-100%)
  const top = seededRandom(seed) * 80 + 5; // 5-85% to avoid edges
  const left = seededRandom(seed + 1) * 80 + 5; // 5-85% to avoid edges
  
  // Random rotation (-18° to +18°)
  const rotation = seededRandom(seed + 2) * 36 - 18;
  
  // Random size (multiple tiers) - using vw for responsiveness
  const sizeRand = seededRandom(seed + 3);
  let sizeClass = 'w-[280px] max-w-[85vw]'; // Responsive width
  
  if (sizeRand < 0.15) {
    // Tiny (15%)
    sizeClass = 'w-[200px] max-w-[60vw]';
  } else if (sizeRand < 0.4) {
    // Small (25%)
    sizeClass = 'w-[240px] max-w-[70vw]';
  } else if (sizeRand < 0.75) {
    // Medium (35%)
    sizeClass = 'w-[280px] max-w-[85vw]';
  } else if (sizeRand < 0.92) {
    // Large (17%)
    sizeClass = 'w-[340px] max-w-[90vw]';
  } else {
    // Extra large (8%)
    sizeClass = 'w-[400px] max-w-[95vw]';
  }
  
  // Random z-index for layering (but boost on hover/focus)
  const zIndex = Math.floor(seededRandom(seed + 4) * 50) + 1;
  
  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    sizeClass,
    zIndex,
  };
};

type EntryType = keyof typeof typeConfig;

export default function MemoryWall() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>("memory");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { data: entries, refetch } = trpc.memoryWall.list.useQuery(
    filter === "all" ? {} : { type: filter }
  );
  const createMutation = trpc.memoryWall.create.useMutation();
  const deleteMutation = trpc.memoryWall.delete.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));

    if (validFiles.length !== files.length) {
      toast.error("Only image files are allowed");
    }

    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImageFiles = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
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
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedType === "picture") {
        if (imageFiles.length === 0) {
          toast.error("Please add at least one image");
          return;
        }
      } else {
        if (!content.trim()) {
          toast.error("Please enter some content");
          return;
        }
      }

      // Upload images first if any
      const uploadedUrls = await uploadImageFiles();

      if (selectedType === "picture" && uploadedUrls.length === 0) {
        toast.error("Failed to upload images");
        return;
      }

      await createMutation.mutateAsync({
        type: selectedType,
        content: content.trim() || undefined,
        imageUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : undefined,
        imageUrls: uploadedUrls.length > 1 ? uploadedUrls : undefined,
      });

      toast.success(`${typeConfig[selectedType].label} added to memory wall!`);
      setContent("");
      setImageFiles([]);
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to add entry");
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await deleteMutation.mutateAsync({ entryId });
      toast.success("Entry deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete entry");
    }
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Memory Wall</h1>
              <p className="text-gray-600 mt-1">Share memories, stories, encouragement, and prayers</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#6BC4B8] hover:bg-[#6BC4B8]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Wall
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add to Memory Wall</DialogTitle>
                  <DialogDescription>
                    Share a memory, story, encouragement, prayer, or picture
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as EntryType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedType !== "picture" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content</label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Share your ${typeConfig[selectedType].label.toLowerCase()}...`}
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Images {selectedType === "picture" ? "(Required)" : "(Optional)"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                    />
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImageFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploadingImages || createMutation.isPending}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || uploadingImages}
                      className="bg-[#6BC4B8] hover:bg-[#6BC4B8]/90 text-white"
                    >
                      {uploadingImages ? "Uploading..." : createMutation.isPending ? "Adding..." : "Add to Wall"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-gray-800" : ""}
            >
              All
            </Button>
            {Object.entries(typeConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = filter === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(key as EntryType)}
                  className={isActive ? "" : ""}
                  style={isActive ? { backgroundColor: config.color, color: "white" } : {}}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Collage Canvas */}
          {!entries || entries.length === 0 ? (
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No entries yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start sharing memories, stories, and encouragement
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative w-full overflow-auto rounded-xl bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ minHeight: '150vh' }}>
              {entries.map((entry, index) => {
                const config = typeConfig[entry.type as EntryType];
                const Icon = config.icon;
                const canDelete = entry.authorId === user?.id || isPrimaryOrAdmin;
                const layout = getCollageLayout(entry.id, index);

                // Add tape decoration randomly
                const hasTape = seededRandom(entry.id + 999) > 0.5;
                const tapeRotation = seededRandom(entry.id + 888) * 10 - 5;
                
                return (
                  <Card
                    key={entry.id}
                    tabIndex={0}
                    className={`absolute border-2 ${config.borderColor} ${config.bgColor} ${layout.sizeClass} transition-all duration-300 hover:shadow-2xl focus:shadow-2xl cursor-pointer group shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color.replace('#', '')}`}
                    style={{
                      top: layout.top,
                      left: layout.left,
                      transform: layout.transform,
                      zIndex: layout.zIndex,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = '100';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex = String(layout.zIndex);
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.zIndex = '100';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.zIndex = String(layout.zIndex);
                    }}
                  >
                    {/* Decorative Tape */}
                    {hasTape && (
                      <div 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-200/60 backdrop-blur-sm border-t border-b border-yellow-300/40 shadow-sm"
                        style={{ transform: `translateX(-50%) rotate(${tapeRotation}deg)` }}
                      />
                    )}
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full ${config.iconBgColor} flex items-center justify-center shadow-sm`}>
                              <Icon className={`w-5 h-5 ${config.textColor}`} />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${config.textColor}`}>
                                {config.label}
                              </div>
                              <div className="text-xs text-gray-600 font-medium">{entry.authorName}</div>
                            </div>
                          </div>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="h-7 w-7 p-0 hover:bg-red-100"
                            >
                              <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                            </Button>
                          )}
                        </div>

                        {entry.imageUrl && (
                          <img
                            src={entry.imageUrl}
                            alt="Memory"
                            className="w-full rounded-lg mb-3 object-cover shadow-md"
                            style={{ maxHeight: '300px' }}
                          />
                        )}

                        {entry.imageUrls && entry.imageUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {entry.imageUrls.map((url, i) => (
                              <img
                                key={i}
                              src={url}
                              alt={`Memory ${i + 1}`}
                              className="w-full rounded-lg object-cover aspect-square"
                            />
                          ))}
                        </div>
                      )}

                      {entry.content && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
