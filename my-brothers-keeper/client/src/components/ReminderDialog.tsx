import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface ReminderDialogProps {
  targetType: "need" | "event";
  targetId: number;
  trigger?: React.ReactNode;
}

const REMINDER_OPTIONS = [
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
  { label: "3 days before", value: 4320 },
  { label: "1 week before", value: 10080 },
];

export function ReminderDialog({
  targetType,
  targetId,
  trigger,
}: ReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedOffset, setSelectedOffset] = useState<number>(1440);

  const utils = trpc.useUtils();
  const { data: reminders, isLoading } = trpc.reminder.listByTarget.useQuery(
    { targetType, targetId },
    { enabled: open }
  );

  const createMutation = trpc.reminder.create.useMutation({
    onSuccess: () => {
      toast.success("Reminder created");
      utils.reminder.listByTarget.invalidate({ targetType, targetId });
      utils.reminder.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create reminder");
    },
  });

  const deleteMutation = trpc.reminder.delete.useMutation({
    onSuccess: () => {
      toast.success("Reminder cancelled");
      utils.reminder.listByTarget.invalidate({ targetType, targetId });
      utils.reminder.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel reminder");
    },
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        targetType,
        targetId,
        reminderOffsetMinutes: selectedOffset,
      });
    } catch (error) {
      // Error handled by onError
    }
  };

  const handleDelete = async (reminderId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: reminderId });
    } catch (error) {
      // Error handled by onError
    }
  };

  const formatReminderTime = (offsetMinutes: number) => {
    const option = REMINDER_OPTIONS.find((opt) => opt.value === offsetMinutes);
    return option?.label || `${offsetMinutes} minutes before`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Reminders
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Reminders</DialogTitle>
          <DialogDescription>
            Set up email reminders so you don't forget about this{" "}
            {targetType === "need" ? "need" : "event"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Create New Reminder</label>
            <div className="flex gap-2">
              <Select
                value={selectedOffset.toString()}
                onValueChange={(value) => setSelectedOffset(Number(value))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                Add
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading reminders...
            </div>
          ) : reminders && reminders.length > 0 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Reminders</label>
              <div className="space-y-2">
                {reminders.map((reminder: any) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatReminderTime(reminder.reminderOffsetMinutes)}
                      </span>
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
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                          Failed
                        </span>
                      )}
                      {reminder.status === "cancelled" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                      disabled={
                        deleteMutation.isPending || reminder.status !== "queued"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              No reminders set. Create one above!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
