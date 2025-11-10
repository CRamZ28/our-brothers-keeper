import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QuestionDialog } from "@/components/QuestionDialog";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, ExternalLink, Gift, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "text-white",
    bgColor: "bg-[#B08CA7]/30",
    borderColor: "border-[#B08CA7]/40",
  },
  normal: {
    label: "Normal",
    color: "text-foreground",
    bgColor: "bg-white/30",
    borderColor: "border-white/40",
  },
  low: {
    label: "Low",
    color: "text-foreground/70",
    bgColor: "bg-white/20",
    borderColor: "border-white/30",
  },
};

export default function GiftRegistry() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "urgent">("normal");
  const [notes, setNotes] = useState("");

  const { data: items, refetch } = trpc.giftRegistry.list.useQuery();
  const createMutation = trpc.giftRegistry.create.useMutation();
  const updateMutation = trpc.giftRegistry.update.useMutation();
  const deleteMutation = trpc.giftRegistry.delete.useMutation();
  const markPurchasedMutation = trpc.giftRegistry.markPurchased.useMutation();
  const markReceivedMutation = trpc.giftRegistry.markReceived.useMutation();

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";

  const resetForm = () => {
    setName("");
    setDescription("");
    setUrl("");
    setImageFile(null);
    setPrice("");
    setPriority("normal");
    setNotes("");
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setUrl(item.url || "");
    setImageFile(null);
    setPrice(item.price || "");
    setPriority(item.priority);
    setNotes(item.notes || "");
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else if (file) {
      toast.error("Only image files are allowed");
    }
  };

  const uploadImageFile = async (): Promise<string | undefined> => {
    if (!imageFile) return undefined;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${imageFile.name}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      // Upload image if present
      const uploadedImageUrl = await uploadImageFile();

      if (editingItem) {
        await updateMutation.mutateAsync({
          itemId: editingItem.id,
          name,
          description: description.trim() || undefined,
          url: url.trim() || undefined,
          imageUrl: uploadedImageUrl || editingItem.imageUrl || undefined,
          price: price.trim() || undefined,
          priority,
          notes: notes.trim() || undefined,
        });
        toast.success("Item updated!");
      } else {
        await createMutation.mutateAsync({
          name,
          description: description.trim() || undefined,
          url: url.trim() || undefined,
          imageUrl: uploadedImageUrl || undefined,
          price: price.trim() || undefined,
          priority,
          notes: notes.trim() || undefined,
        });
        toast.success("Item added to registry!");
      }

      resetForm();
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save item");
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Are you sure you want to remove this item from the registry?")) return;

    try {
      await deleteMutation.mutateAsync({ itemId });
      toast.success("Item removed");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleMarkPurchased = async (itemId: number) => {
    try {
      await markPurchasedMutation.mutateAsync({ itemId });
      toast.success("Marked as purchased! Thank you!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as purchased");
    }
  };

  const handleMarkReceived = async (itemId: number) => {
    try {
      await markReceivedMutation.mutateAsync({ itemId });
      toast.success("Marked as received!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as received");
    }
  };

  const neededItems = items?.filter((i) => i.status === "needed") || [];
  const purchasedItems = items?.filter((i) => i.status === "purchased") || [];
  const receivedItems = items?.filter((i) => i.status === "received") || [];

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Gift Registry"
        actions={
          isPrimaryOrAdmin ? (
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-[#6BC4B8] hover:bg-[#6BC4B8]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Item" : "Add to Registry"}</DialogTitle>
                    <DialogDescription>
                      Add items the family needs or would appreciate
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Item Name *</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Grocery gift card, Lawn care service"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Additional details or preferences..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Price (Optional)</label>
                        <Input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="$25"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Priority</label>
                        <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(priorityConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Product URL (Optional)</label>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Product Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                      />
                      {imageFile && (
                        <div className="mt-3 relative group inline-block">
                          <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(imageFile)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setImageFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {editingItem?.imageUrl && !imageFile && (
                        <div className="mt-3">
                          <img
                            src={editingItem.imageUrl}
                            alt="Current"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">Current image</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Special instructions or delivery details..."
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending || uploadingImage}
                        className="bg-[#6BC4B8] hover:bg-[#6BC4B8]/90 text-white shadow-md font-semibold"
                      >
                        {uploadingImage 
                          ? "Uploading..."
                          : (createMutation.isPending || updateMutation.isPending)
                          ? "Saving..."
                          : editingItem
                          ? "Update Item"
                          : "Add to Registry"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : undefined
        }
      >
        {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-[#14B8A6]">Coming Soon:</span> Add items by pasting product links from Amazon, Target, and more – we'll automatically fill in the details for you!
            </p>
          </div>

          {/* Needed Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#6BC4B8]" />
              Needed Items ({neededItems.length})
            </h2>

            {neededItems.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-8 text-center">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items in the registry yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {neededItems.map((item) => {
                  const priorityStyle = priorityConfig[item.priority as keyof typeof priorityConfig];

                  return (
                    <Card key={item.id} className="border border-gray-200 bg-white hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{item.name}</CardTitle>
                            {item.price && (
                              <p className="text-sm text-[#6BC4B8] font-semibold mt-1">{item.price}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bgColor} ${priorityStyle.color} shrink-0`}>
                            {priorityStyle.label}
                          </span>
                        </div>
                        {item.description && (
                          <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}

                        {item.notes && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                            <p className="text-xs text-amber-800">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {item.notes}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            {item.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => window.open(item.url!, "_blank")}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="flex-1 bg-[#6BC4B8] hover:bg-[#6BC4B8]/90 text-white"
                              onClick={() => handleMarkPurchased(item.id)}
                            >
                              <ShoppingBag className="w-4 h-4 mr-1" />
                              Mark Purchased
                            </Button>
                          </div>
                          <QuestionDialog
                            context="gift_registry"
                            contextId={item.id}
                            defaultSubject={`Question about: ${item.name}`}
                            trigger={
                              <Button variant="outline" size="sm" className="w-full">
                                Ask a Question
                              </Button>
                            }
                          />
                        </div>

                        {isPrimaryOrAdmin && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openEditDialog(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-foreground/60" />
                Purchased ({purchasedItems.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedItems.map((item) => (
                  <Card key={item.id} className="border border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>
                        Purchased by {item.purchaserName || "Someone"}
                      </CardDescription>
                    </CardHeader>
                    {isPrimaryOrAdmin && (
                      <CardContent>
                        <Button
                          size="sm"
                          style={{
                            backgroundColor: '#B08CA7',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A7890'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B08CA7'}
                          className="w-full text-white"
                          onClick={() => handleMarkReceived(item.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark as Received
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Received Items */}
          {receivedItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground/60" />
                Received ({receivedItems.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receivedItems.map((item) => (
                  <Card key={item.id} className="border border-white/40 bg-white/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-foreground">{item.name}</CardTitle>
                      <CardDescription className="text-foreground/70">
                        ✓ Received from {item.purchaserName || "Someone"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
      </GlassPageLayout>
    </DashboardLayout>
  );
}
