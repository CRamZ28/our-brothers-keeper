import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { MessageCircle, Send, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminTools() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users } = trpc.user.listInHousehold.useQuery();
  const { data: adminGroups, refetch: refetchGroups } = trpc.adminGroup.list.useQuery();

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageRecipientType, setMessageRecipientType] = useState<"individual" | "group" | "all">("all");
  const [messageRecipientUserId, setMessageRecipientUserId] = useState<string | null>(null);
  const [messageRecipientGroupId, setMessageRecipientGroupId] = useState<number | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [includePrimary, setIncludePrimary] = useState(false);

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Redirect if not admin
  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const sendMessageMutation = trpc.adminMessage.send.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setMessageDialogOpen(false);
      resetMessageForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const createGroupMutation = trpc.adminGroup.create.useMutation({
    onSuccess: () => {
      toast.success("Group created successfully!");
      setGroupDialogOpen(false);
      resetGroupForm();
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const deleteGroupMutation = trpc.adminGroup.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted");
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  const resetMessageForm = () => {
    setMessageRecipientType("all");
    setMessageRecipientUserId(null);
    setMessageRecipientGroupId(null);
    setMessageSubject("");
    setMessageBody("");
    setIncludePrimary(false);
  };

  const resetGroupForm = () => {
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers([]);
  };

  const handleSendMessage = () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error("Please provide both subject and message");
      return;
    }

    if (messageRecipientType === "individual") {
      if (!messageRecipientUserId) {
        toast.error("Please select a supporter");
        return;
      }
      sendMessageMutation.mutate({
        recipientType: "individual",
        recipientUserId: messageRecipientUserId,
        subject: messageSubject,
        body: messageBody,
        includePrimary,
      });
    } else if (messageRecipientType === "group") {
      if (!messageRecipientGroupId) {
        toast.error("Please select a group");
        return;
      }
      sendMessageMutation.mutate({
        recipientType: "group",
        recipientGroupId: messageRecipientGroupId,
        subject: messageSubject,
        body: messageBody,
        includePrimary,
      });
    } else {
      sendMessageMutation.mutate({
        recipientType: "all",
        subject: messageSubject,
        body: messageBody,
        includePrimary,
      });
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Please provide a group name");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription || undefined,
      memberIds: selectedMembers,
    });
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const activeUsers = users?.filter((u) => u.status === "active" && u.role === "supporter") || [];
  const primaryUser = users?.find((u) => u.role === "primary");

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
          <p className="text-muted-foreground mt-2">
            Coordinate support for {household?.name} without overwhelming the primary person
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Send Message
              </CardTitle>
              <CardDescription>
                Communicate with supporters individually or in groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Compose Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Message to Supporters</DialogTitle>
                    <DialogDescription>
                      Coordinate support activities without involving the primary person
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Recipient Type */}
                    <div className="space-y-2">
                      <Label>Send To</Label>
                      <Select
                        value={messageRecipientType}
                        onValueChange={(value: "individual" | "group" | "all") => {
                          setMessageRecipientType(value);
                          setMessageRecipientUserId(null);
                          setMessageRecipientGroupId(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Supporters</SelectItem>
                          <SelectItem value="individual">Individual Supporter</SelectItem>
                          <SelectItem value="group">Custom Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Individual Selection */}
                    {messageRecipientType === "individual" && (
                      <div className="space-y-2">
                        <Label>Select Supporter</Label>
                        <Select
                          value={messageRecipientUserId || ""}
                          onValueChange={(value) => setMessageRecipientUserId(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a supporter..." />
                          </SelectTrigger>
                          <SelectContent>
                            {activeUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name || u.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Group Selection */}
                    {messageRecipientType === "group" && (
                      <div className="space-y-2">
                        <Label>Select Group</Label>
                        <Select
                          value={messageRecipientGroupId?.toString() || ""}
                          onValueChange={(value) => setMessageRecipientGroupId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {adminGroups?.map((g) => (
                              <SelectItem key={g.id} value={g.id.toString()}>
                                {g.name} ({g.memberCount} members)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Include Primary Checkbox */}
                    <div className="flex items-center space-x-2 p-3 bg-accent/50 rounded-lg">
                      <Checkbox
                        id="includePrimary"
                        checked={includePrimary}
                        onCheckedChange={(checked) => setIncludePrimary(checked as boolean)}
                      />
                      <Label htmlFor="includePrimary" className="cursor-pointer">
                        Include {primaryUser?.name || "primary person"} in this message
                      </Label>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="e.g., Meal train update for next week"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                    </div>

                    {/* Message Body */}
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        placeholder="Write your message here..."
                        rows={6}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setMessageDialogOpen(false)}
                      disabled={sendMessageMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Manage Groups
              </CardTitle>
              <CardDescription>Create custom groups for targeted communication</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Custom Group</DialogTitle>
                    <DialogDescription>
                      Organize supporters into groups for easier coordination
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Group Name</Label>
                      <Input
                        placeholder="e.g., Meal Train Team"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        placeholder="What is this group for?"
                        rows={2}
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Select Members</Label>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                        {activeUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No supporters available
                          </p>
                        ) : (
                          activeUsers.map((u) => (
                            <div key={u.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`member-${u.id}`}
                                checked={selectedMembers.includes(u.id)}
                                onCheckedChange={() => toggleMemberSelection(u.id)}
                              />
                              <Label htmlFor={`member-${u.id}`} className="cursor-pointer flex-1">
                                {u.name || u.email}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""}{" "}
                        selected
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setGroupDialogOpen(false)}
                      disabled={createGroupMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Existing Groups */}
        {adminGroups && adminGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Custom Groups</CardTitle>
              <CardDescription>Groups you've created for targeted communication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium overflow-hidden line-clamp-2">{group.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                        {group.description && ` • ${group.description}`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setMessageRecipientType("group");
                            setMessageRecipientGroupId(group.id);
                            setMessageDialogOpen(true);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteGroupMutation.mutate({ groupId: group.id })}
                          disabled={deleteGroupMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">About Admin Tools</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This page is only visible to admins. Use these tools to coordinate support activities
              without overwhelming the primary person.
            </p>
            <p>
              By default, messages sent here <strong>exclude the primary person</strong>. Check the
              "Include primary" box only when they need to be in the loop.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

