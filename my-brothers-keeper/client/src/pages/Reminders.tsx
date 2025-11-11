import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { GlassCard } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

  const deleteMutation = trpc.reminder.delete.useMutation({
    onSuccess: () => {
      toast.success("Reminder cancelled");
      utils.reminder.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel reminder");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to cancel this reminder?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatTriggerTime = (triggerAt: string) => {
    const date = new Date(triggerAt);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  const needReminders = reminders?.filter((r: any) => r.targetType === "need") || [];
  const eventReminders = reminders?.filter((r: any) => r.targetType === "event") || [];

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Reminders"
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
              {needReminders.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Need Reminders</h2>
                  <div className="space-y-2">
                    {needReminders.map((reminder: any) => (
                      <GlassCard key={reminder.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Bell className="w-4 h-4 text-primary" />
                              <h3 className="font-medium">
                                {reminder.targetTitle || "Untitled Need"}
                              </h3>
                              {reminder.status === "sent" && (
                                <Badge variant="secondary" className="text-xs">
                                  Sent
                                </Badge>
                              )}
                              {reminder.status === "failed" && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {reminder.status === "cancelled" && (
                                <Badge variant="outline" className="text-xs">
                                  Cancelled
                                </Badge>
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
                          {reminder.status !== "sent" && (
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
                            <div className="flex items-center gap-2 mb-2">
                              <Bell className="w-4 h-4 text-primary" />
                              <h3 className="font-medium">
                                {reminder.targetTitle || "Untitled Event"}
                              </h3>
                              {reminder.status === "sent" && (
                                <Badge variant="secondary" className="text-xs">
                                  Sent
                                </Badge>
                              )}
                              {reminder.status === "failed" && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {reminder.status === "cancelled" && (
                                <Badge variant="outline" className="text-xs">
                                  Cancelled
                                </Badge>
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
                          {reminder.status !== "sent" && (
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
    </DashboardLayout>
  );
}
