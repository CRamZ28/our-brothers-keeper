import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

export default function Contact() {
  const { user } = useAuth();
  const [requestType, setRequestType] = useState<"url_change" | "bug_report" | "feature_request" | "general">("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendMessageMutation = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setRequestType("general");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please enter a message (at least 10 characters)");
      return;
    }

    sendMessageMutation.mutate({
      requestType,
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return (
    <DashboardLayout>
      <GlassPageLayout
        title={
          <span>
            <span style={{ fontSize: "48px", color: "#1fb5b0" }}>C</span>
            <span>ONTACT </span>
            <span style={{ fontSize: "48px", color: "#1fb5b0" }}>S</span>
            <span>UPPORT</span>
          </span>
        }
      >
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#6BC4B8]" />
                <CardTitle>Get in Touch</CardTitle>
              </div>
              <CardDescription>
                Have a question, need help, or want to request a change? Send us a message and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="requestType">Request Type</Label>
                  <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
                    <SelectTrigger id="requestType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Support</SelectItem>
                      <SelectItem value="url_change">URL Change Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the type of request to help us route your message appropriately
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your request"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide details about your request..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} characters (minimum 10 required)
                  </p>
                </div>

                {requestType === "url_change" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> URL changes affect all existing links and invitations. Please provide your current URL and desired new URL in your message.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Your contact info:</strong> {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll reply to this email address
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="w-full bg-[#6BC4B8] hover:bg-[#5AB3A8] text-white"
                >
                  {sendMessageMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </GlassPageLayout>
    </DashboardLayout>
  );
}
