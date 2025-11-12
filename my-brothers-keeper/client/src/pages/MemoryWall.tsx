import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { Button } from "@/components/ui/button";
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
import { Heart, MessageSquare, BookOpen, Sparkles, Plus, X, ZoomIn } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DndContext, useDraggable, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const typeConfig = {
  memory: {
    label: "Memory",
    icon: Heart,
    color: "#2DB5A8",
    gradientFrom: "rgba(45, 181, 168, 0.15)",
    gradientTo: "rgba(45, 181, 168, 0.05)",
  },
  story: {
    label: "Story",
    icon: BookOpen,
    color: "#3B82F6",
    gradientFrom: "rgba(59, 130, 246, 0.15)",
    gradientTo: "rgba(59, 130, 246, 0.05)",
  },
  encouragement: {
    label: "Encouragement",
    icon: Sparkles,
    color: "#F59E0B",
    gradientFrom: "rgba(245, 158, 11, 0.15)",
    gradientTo: "rgba(245, 158, 11, 0.05)",
  },
  prayer: {
    label: "Prayer/Verse",
    icon: MessageSquare,
    color: "#B08CA7",
    gradientFrom: "rgba(176, 140, 167, 0.15)",
    gradientTo: "rgba(176, 140, 167, 0.05)",
  },
};

type EntryType = keyof typeof typeConfig;

// Helper: Generate deterministic rotation for a memory ID
function getRotationForId(id: number): number {
  const rotations = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  return rotations[id % rotations.length];
}

// Helper: Generate deterministic initial position for new cards (staggered grid)
function getInitialPosition(index: number): { x: number; y: number } {
  const cols = 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const cardWidth = 320;
  const cardHeight = 400;
  const gap = 40;
  
  return {
    x: 50 + col * (cardWidth + gap),
    y: 50 + row * (cardHeight + gap),
  };
}

interface CardPosition {
  memoryId: number;
  x: number;
  y: number;
  rotation: number;
}

interface VisionBoardCardProps {
  entry: any;
  position: CardPosition;
  config: any;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onImageClick: (images: string[], index: number) => void;
}

const VisionBoardCard = ({ entry, position, config, canDelete, onDelete, onImageClick }: VisionBoardCardProps) => {
  const Icon = config.icon;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `memory-${entry.id}`,
    data: { memoryId: entry.id, position },
  });

  const style = {
    left: position.x,
    top: position.y,
    transform: CSS.Transform.toString(transform) + ` rotate(${position.rotation}deg)`,
    zIndex: isDragging ? 1000 : 1,
    width: '320px',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="absolute transition-opacity duration-200"
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className="rounded-2xl p-5 shadow-2xl border-2"
        style={{
          background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
          backdropFilter: 'blur(20px)',
          borderColor: `${config.color}40`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.2), 0 0 10px ${config.color}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: config.color }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-red-100"
              style={{ color: '#EF4444' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Images */}
        {entry.imageUrls && entry.imageUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {entry.imageUrls.map((url: string, i: number) => (
              <div key={i} className="relative group/image">
                <img
                  src={url}
                  alt={`Memory ${i + 1}`}
                  className="w-full rounded-lg object-cover aspect-square cursor-pointer"
                  onClick={() => onImageClick(entry.imageUrls, i)}
                />
                <div 
                  className="absolute inset-0 rounded-lg bg-black/0 group-hover/image:bg-black/20 transition-all flex items-center justify-center cursor-pointer"
                  onClick={() => onImageClick(entry.imageUrls, i)}
                >
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        ) : entry.imageUrl ? (
          <div className="mb-4 relative group/image">
            <img
              src={entry.imageUrl}
              alt="Memory"
              className="w-full rounded-xl object-cover cursor-pointer"
              style={{ maxHeight: '300px' }}
              onClick={() => onImageClick([entry.imageUrl], 0)}
            />
            <div 
              className="absolute inset-0 rounded-xl bg-black/0 group-hover/image:bg-black/20 transition-all flex items-center justify-center cursor-pointer"
              onClick={() => onImageClick([entry.imageUrl], 0)}
            >
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : null}

        {/* Content */}
        {entry.content && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
            {entry.content}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-300/30">
          <span className="font-medium">{entry.authorName || "Anonymous"}</span>
          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default function MemoryWall() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>("memory");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [positions, setPositions] = useState<Record<number, CardPosition>>({});

  const { data: entries, refetch } = trpc.memoryWall.list.useQuery(
    filter === "all" ? {} : { type: filter }
  );
  const { data: persistedPositions } = trpc.memoryWall.getPositions.useQuery();
  const createMutation = trpc.memoryWall.create.useMutation();
  const deleteMutation = trpc.memoryWall.delete.useMutation();
  const savePositionMutation = trpc.memoryWall.savePosition.useMutation();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      if (!content.trim() && imageFiles.length === 0) {
        toast.error("Please enter some content or add at least one image");
        return;
      }

      const uploadedUrls = await uploadImageFiles();

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

  // Merge persisted positions with deterministic defaults
  useEffect(() => {
    if (!entries) return;

    const newPositions: Record<number, CardPosition> = {};
    
    entries.forEach((entry, index) => {
      const persisted = persistedPositions?.find((p: any) => p.memoryId === entry.id);
      
      if (persisted) {
        newPositions[entry.id] = {
          memoryId: entry.id,
          x: persisted.x,
          y: persisted.y,
          rotation: persisted.rotation || getRotationForId(entry.id),
        };
      } else {
        const { x, y } = getInitialPosition(index);
        newPositions[entry.id] = {
          memoryId: entry.id,
          x,
          y,
          rotation: getRotationForId(entry.id),
        };
      }
    });

    setPositions(newPositions);
  }, [entries, persistedPositions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const memoryId = parseInt(active.id.toString().replace('memory-', ''));
    const currentPosition = positions[memoryId];
    
    if (!currentPosition) return;

    const newX = currentPosition.x + delta.x;
    const newY = currentPosition.y + delta.y;

    setPositions(prev => ({
      ...prev,
      [memoryId]: {
        ...prev[memoryId],
        x: newX,
        y: newY,
      },
    }));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePositionMutation.mutate(
        { memoryId, x: newX, y: newY, rotation: currentPosition.rotation },
        {
          onError: (error) => {
            console.error("Failed to save position:", error);
            toast.error("Failed to save card position");
          },
        }
      );
    }, 500);
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

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  return (
    <DashboardLayout>
      <GlassPageLayout 
        title="Memory Wall"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="px-4 py-2 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #2DB5A8, #4DD0C4)',
                }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add to Wall
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add to Memory Wall</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Share a memory, story, encouragement, prayer, or picture
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                  <Select value={selectedType} onValueChange={(v) => setSelectedType(v as EntryType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" style={{ color: config.color }} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Share your ${typeConfig[selectedType].label.toLowerCase()}...`}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Images (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer text-sm"
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

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDialogOpen(false)}
                    disabled={uploadingImages || createMutation.isPending}
                    className="px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || uploadingImages}
                    className="px-4 py-2 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #2DB5A8, #4DD0C4)',
                    }}
                  >
                    {uploadingImages ? "Uploading..." : createMutation.isPending ? "Adding..." : "Add to Wall"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <p className="text-gray-600 mb-6">Share memories, stories, encouragement, and prayers</p>
        
        {/* Glass Filter Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
            style={{
              background: filter === "all" 
                ? 'rgba(255, 255, 255, 0.4)' 
                : 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: filter === "all" 
                ? '2px solid rgba(45, 181, 168, 0.4)' 
                : '2px solid rgba(255, 255, 255, 0.2)',
              color: filter === "all" ? '#2DB5A8' : '#666',
              boxShadow: filter === "all" ? '0 4px 12px rgba(45, 181, 168, 0.15)' : 'none',
            }}
          >
            All
          </button>
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key as EntryType)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2"
                style={{
                  background: isActive 
                    ? 'rgba(255, 255, 255, 0.4)' 
                    : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isActive 
                    ? `2px solid ${config.color}40` 
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  color: isActive ? config.color : '#666',
                  boxShadow: isActive ? `0 4px 12px ${config.color}25` : 'none',
                }}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Vision Board Stage */}
        {!entries || entries.length === 0 ? (
          <div 
            className="rounded-2xl p-12 text-center"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No entries yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start sharing memories, stories, and encouragement
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div 
              className="relative overflow-auto rounded-2xl p-4"
              style={{
                minHeight: '800px',
                height: 'calc(100vh - 300px)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {entries.map((entry) => {
                const position = positions[entry.id];
                if (!position) return null;
                
                const config = typeConfig[entry.type as EntryType];
                const canDelete = entry.authorId === user?.id || isPrimaryOrAdmin;
                
                return (
                  <VisionBoardCard
                    key={entry.id}
                    entry={entry}
                    position={position}
                    config={config}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                    onImageClick={(images, index) => {
                      setLightboxImages(images);
                      setLightboxIndex(index);
                    }}
                  />
                );
              })}
            </div>
          </DndContext>
        )}
      </GlassPageLayout>

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setLightboxImages([])}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            onClick={() => setLightboxImages([])}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <>
              <button
                className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all z-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all z-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Image */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
