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
import { Check, Mail, MoreVertical, Phone, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function People() {
  const { user } = useAuth();
  const { data: household } = trpc.household.getMy.useQuery();
  const { data: users, refetch: refetchUsers } = trpc.user.listInHousehold.useQuery();
  const { data: groups } = trpc.group.list.useQuery();
  const { data: pendingInvites, refetch: refetchInvites } = trpc.invite.listPending.useQuery();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "supporter">("supporter");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const createInviteMutation = trpc.invite.create.useMutation({
    onSuccess: (data) => {
      toast.success("Invite sent successfully!");
      if (data.enhancedMessage) {
        toast.info(`AI-enhanced message: "${data.enhancedMessage}"`);
      }
      setInviteDialogOpen(false);
      resetInviteForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invite");
    },
  });

  const updateUserStatusMutation = trpc.user.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const resendInviteMutation = trpc.invite.resend.useMutation({
    onSuccess: () => {
      toast.success("Invite resent successfully!");
      refetchInvites();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invite");
    },
  });

  const revokeInviteMutation = trpc.invite.revoke.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      refetchInvites();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invite");
    },
  });

  const resetInviteForm = () => {
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("supporter");
    setInviteRelationship("");
    setInviteMessage("");
  };

  const handleSendInvite = () => {
    if (!inviteEmail && !invitePhone) {
      toast.error("Please provide either an email or phone number");
      return;
    }

    createInviteMutation.mutate({
      email: inviteEmail || undefined,
      phone: invitePhone || undefined,
      role: inviteRole,
      relationship: inviteRelationship || undefined,
      personalMessage: inviteMessage || undefined,
    });
  };

  const handleApproveUser = (userId: number) => {
    updateUserStatusMutation.mutate({ userId, status: "active" });
  };

  const handleBlockUser = (userId: number) => {
    updateUserStatusMutation.mutate({ userId, status: "blocked" });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";
  const canManageUsers =
    user?.role === "primary" || (user?.role === "admin" && household?.delegateAdminApprovals);

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const pendingUsers = users?.filter((u) => u.status === "pending") || [];
  const blockedUsers = users?.filter((u) => u.status === "blocked") || [];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">People</h1>
            <p className="text-muted-foreground mt-2">
              Manage your support network • {activeUsers.length} active members
            </p>
          </div>
          {isPrimaryOrAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Someone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Invite a Supporter</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your support network. They'll need to be approved
                    before gaining access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supporter">Supporter</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Admins can help manage events and needs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship (optional)</Label>
                    <Input
                      id="relationship"
                      placeholder="e.g., close friend, church member, family"
                      value={inviteRelationship}
                      onChange={(e) => setInviteRelationship(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a personal note to the invitation..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will help enhance your message to make it warm and welcoming
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    disabled={createInviteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite} disabled={createInviteMutation.isPending}>
                    {createInviteMutation.isPending ? "Sending..." : "Send Invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Pending Approvals */}
        {canManageUsers && pendingUsers.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} waiting for
                your approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {pendingUser.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{pendingUser.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {pendingUser.email} • {pendingUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveUser(pendingUser.id)}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBlockUser(pendingUser.id)}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {canManageUsers && pendingInvites && pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
              <CardDescription>
                {pendingInvites.length} {pendingInvites.length === 1 ? "invite" : "invites"} waiting
                to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingInvites.map((invite) => {
                const expiresAt = new Date(invite.expiresAt);
                const isExpired = expiresAt < new Date();
                const daysUntilExpiry = Math.ceil(
                  (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {invite.invitedEmail || invite.invitedPhone || "Unknown"}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{invite.invitedRole}</span>
                        <span>•</span>
                        {isExpired ? (
                          <span className="text-red-600">Expired</span>
                        ) : (
                          <span>
                            Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => resendInviteMutation.mutate({ inviteId: invite.id })}
                          disabled={resendInviteMutation.isPending}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => revokeInviteMutation.mutate({ inviteId: invite.id })}
                          disabled={revokeInviteMutation.isPending}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Revoke Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Active Members */}
        <Card>
          <CardHeader>
            <CardTitle>Active Members</CardTitle>
            <CardDescription>People in your support network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active members yet. Start by inviting people to join your network.
                </p>
              ) : (
                activeUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {member.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || "Unknown"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {member.role}
                      </span>
                      {canManageUsers && member.id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleBlockUser(member.id)}
                              className="text-destructive"
                            >
                              Block User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Groups Section */}
        {groups && groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
              <CardDescription>Organize your network into visibility groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div key={group.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

