import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, Trash2, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const REMINDER_LABELS: Record<number, string> = {
  15: "15 minutes before",
  30: "30 minutes before",
  60: "1 hour before",
  120: "2 hours before",
  1440: "1 day before",
  4320: "3 days before",
  10080: "1 week before",
};

export default function Reminders() {
  const { user } = useAuth();
  const { data: reminders, isLoading } = trpc.reminder.list.useQuery();
  const utils = trpc.useUtils();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const deleteMutation = trpc.reminder.delete.useMutation({
    onSuccess: () => {
      toast.success("Reminder cancelled");
      utils.reminder.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel reminder");
    },
  });

  const createPersonalMutation = trpc.reminder.createPersonal.useMutation({
    onSuccess: () => {
      toast.success("Reminder created successfully!");
      utils.reminder.list.invalidate();
      setCreateDialogOpen(false);
      setTitle("");
      setDescription("");
      setReminderDate("");
      setReminderTime("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create reminder");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to cancel this reminder?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreateReminder = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your reminder");
      return;
    }
    if (!reminderDate || !reminderTime) {
      toast.error("Please select a date and time");
      return;
    }

    const triggerAt = new Date(`${reminderDate}T${reminderTime}`);
    createPersonalMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      triggerAt: triggerAt.toISOString(),
    });
  };

  const formatTriggerTime = (triggerAt: string) => {
    const date = new Date(triggerAt);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  const needReminders = reminders?.filter((r: any) => r.targetType === "need") || [];
  const eventReminders = reminders?.filter((r: any) => r.targetType === "event") || [];
  const personalReminders = reminders?.filter((r: any) => r.targetType === "personal") || [];

  return (
    <DashboardLayout>
      <GlassPageLayout
        title={
          <span style={{ 
            fontFamily: "'Cinzel', serif",
            fontWeight: '600',
            letterSpacing: '0.05em',
            color: '#B08CA7',
            filter: 'drop-shadow(0 0 8px rgba(176,140,167,0.7))'
          }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">R</span>
            <span>EMINDERS</span>
          </span>
        }
        actions={
          <Button
            onClick={() => setCreateDialogOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #2DB5A8 0%, #14B8A6 100%)',
              color: 'white',
            }}
            className="shadow-lg hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Reminder
          </Button>
        }
      >
        <div className="space-y-6">
          {isLoading ? (
            <GlassCard>
              <div className="p-8 text-center text-muted-foreground">
                Loading reminders...
              </div>
            </GlassCard>
          ) : !reminders || reminders.length === 0 ? (
            <GlassCard>
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Reminders Set</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any reminders yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  To create a reminder, view a need or event and click the "Reminders" button.
                </p>
              </div>
            </GlassCard>
          ) : (
            <>
              {personalReminders.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Personal Reminders</h2>
                  <div className="space-y-2">
                    {personalReminders.map((reminder: any) => (
                      <GlassCard key={reminder.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Bell className="w-4 h-4 text-primary shrink-0" />
                              <h3 className="font-medium break-words">
                                {reminder.title}
                              </h3>
                              {reminder.status === "queued" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Scheduled
                                </span>
                              )}
                              {reminder.status === "sent" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                  Sent
                                </span>
                              )}
                              {reminder.status === "failed" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>{formatTriggerTime(reminder.triggerAt)}</span>
                              </div>
                              {reminder.description && (
                                <p className="text-sm mt-2 break-words">{reminder.description}</p>
                              )}
                            </div>
                          </div>
                          {reminder.status === "queued" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reminder.id)}
                              className="shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {needReminders.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Need Reminders</h2>
                  <div className="space-y-2">
                    {needReminders.map((reminder: any) => (
                      <GlassCard key={reminder.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Bell className="w-4 h-4 text-primary" />
                              <h3 className="font-medium">
                                {reminder.targetTitle || "Untitled Need"}
                              </h3>
                              {reminder.status === "queued" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Scheduled
                                </span>
                              )}
                              {reminder.status === "sent" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                  Sent
                                </span>
                              )}
                              {reminder.status === "failed" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                              {reminder.status === "cancelled" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Remind me {REMINDER_LABELS[reminder.reminderOffsetMinutes] || `${reminder.reminderOffsetMinutes} minutes before`}
                                </span>
                              </div>
                              <div className="text-xs">
                                {reminder.status === "queued" && reminder.triggerAt && (
                                  <span>
                                    Scheduled for {formatTriggerTime(reminder.triggerAt)}
                                  </span>
                                )}
                                {reminder.status === "sent" && reminder.sentAt && (
                                  <span>
                                    Sent on {formatTriggerTime(reminder.sentAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {reminder.status === "queued" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reminder.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {eventReminders.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Event Reminders</h2>
                  <div className="space-y-2">
                    {eventReminders.map((reminder: any) => (
                      <GlassCard key={reminder.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Bell className="w-4 h-4 text-primary" />
                              <h3 className="font-medium">
                                {reminder.targetTitle || "Untitled Event"}
                              </h3>
                              {reminder.status === "queued" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Scheduled
                                </span>
                              )}
                              {reminder.status === "sent" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                  Sent
                                </span>
                              )}
                              {reminder.status === "failed" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                              {reminder.status === "cancelled" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Remind me {REMINDER_LABELS[reminder.reminderOffsetMinutes] || `${reminder.reminderOffsetMinutes} minutes before`}
                                </span>
                              </div>
                              <div className="text-xs">
                                {reminder.status === "queued" && reminder.triggerAt && (
                                  <span>
                                    Scheduled for {formatTriggerTime(reminder.triggerAt)}
                                  </span>
                                )}
                                {reminder.status === "sent" && reminder.sentAt && (
                                  <span>
                                    Sent on {formatTriggerTime(reminder.sentAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {reminder.status === "queued" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reminder.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </GlassPageLayout>

      {/* Create Reminder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Personal Reminder</DialogTitle>
            <DialogDescription>
              Set a reminder for yourself to check in or take action.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Call to check in"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createPersonalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateReminder}
              disabled={createPersonalMutation.isPending}
              style={{
                background: 'linear-gradient(135deg, #2DB5A8 0%, #14B8A6 100%)',
                color: 'white',
              }}
            >
              {createPersonalMutation.isPending ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
