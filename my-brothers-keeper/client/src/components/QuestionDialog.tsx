import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface QuestionDialogProps {
  context?: "need" | "event" | "meal_train" | "gift_registry" | "general";
  contextId?: number;
  defaultSubject?: string;
  trigger?: React.ReactNode;
}

export function QuestionDialog({ 
  context, 
  contextId, 
  defaultSubject = "",
  trigger 
}: QuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");

  const sendQuestionMutation = trpc.messages.sendQuestion.useMutation();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    try {
      await sendQuestionMutation.mutateAsync({
        subject: subject.trim(),
        message: message.trim(),
        context,
        contextId,
      });

      toast.success("Your question has been sent to the family's admins");
      setSubject(defaultSubject);
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send question");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask a Question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask a Question</DialogTitle>
          <DialogDescription>
            Send a message to the family's admins and primary contact. They'll receive a notification and can respond to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your question"
              disabled={sendQuestionMutation.isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question or message here..."
              rows={6}
              className="resize-none"
              disabled={sendQuestionMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={sendQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sendQuestionMutation.isPending}
              className="bg-[#14B8A6] hover:bg-[#0F9688] text-white shadow-lg font-bold"
            >
              {sendQuestionMutation.isPending ? "Sending..." : "Send Question"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
