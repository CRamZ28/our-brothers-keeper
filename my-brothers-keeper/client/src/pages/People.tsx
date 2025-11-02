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
import { Check, Mail, MoreVertical, Phone, UserPlus, X, Users, Pencil, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserSelector } from "@/components/UserSelector";
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
  const { data: groups, refetch: refetchGroups } = trpc.group.list.useQuery();
  const { data: pendingInvites, refetch: refetchInvites } = trpc.invite.listPending.useQuery();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "supporter">("supporter");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  // Group management states
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);

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

  // Group mutations
  const createGroupMutation = trpc.group.create.useMutation({
    onSuccess: () => {
      toast.success("Group created successfully!");
      setCreateGroupDialogOpen(false);
      resetGroupForm();
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const updateGroupMutation = trpc.group.update.useMutation({
    onSuccess: () => {
      toast.success("Group updated successfully!");
      setEditGroupDialogOpen(false);
      resetGroupForm();
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  const deleteGroupMutation = trpc.group.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      setDeleteGroupDialogOpen(false);
      setSelectedGroupId(null);
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  const addMemberMutation = trpc.group.addMember.useMutation({
    onSuccess: () => {
      toast.success("Member added to group!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  const removeMemberMutation = trpc.group.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from group!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const resetInviteForm = () => {
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("supporter");
    setInviteRelationship("");
    setInviteMessage("");
  };

  const resetGroupForm = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupMemberIds([]);
    setSelectedGroupId(null);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
    });
  };

  const openEditGroupDialog = (group: { id: number; name: string; description: string | null }) => {
    setSelectedGroupId(group.id);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setEditGroupDialogOpen(true);
  };

  const handleUpdateGroup = () => {
    if (!selectedGroupId) return;
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    updateGroupMutation.mutate({
      groupId: selectedGroupId,
      name: groupName,
      description: groupDescription,
    });
  };

  const { data: groupMembers, refetch: refetchGroupMembers } = trpc.group.getMembers.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId && manageMembersDialogOpen }
  );

  const openManageMembersDialog = async (groupId: number) => {
    setSelectedGroupId(groupId);
    setGroupMemberIds([]);
    setManageMembersDialogOpen(true);
  };

  const handleSaveGroupMembers = async () => {
    if (!selectedGroupId) return;

    const currentMemberIds = (groupMembers || []).map((m: any) => m.id);
    const newMemberIds = groupMemberIds;

    const toAdd = newMemberIds.filter((id: string) => !currentMemberIds.includes(id));
    const toRemove = currentMemberIds.filter((id: string) => !newMemberIds.includes(id));

    try {
      for (const userId of toAdd) {
        await addMemberMutation.mutateAsync({ groupId: selectedGroupId, userId });
      }
      for (const userId of toRemove) {
        await removeMemberMutation.mutateAsync({ groupId: selectedGroupId, userId });
      }

      toast.success("Group members updated!");
      setManageMembersDialogOpen(false);
      refetchGroupMembers();
      refetchGroups();
    } catch (error) {
      // Errors already handled by individual mutations
    }
  };

  const handleDeleteGroup = () => {
    if (!selectedGroupId) return;
    deleteGroupMutation.mutate({ groupId: selectedGroupId });
  };

  const openDeleteGroupDialog = (groupId: number) => {
    setSelectedGroupId(groupId);
    setDeleteGroupDialogOpen(true);
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

  const handleApproveUser = (userId: string) => {
    updateUserStatusMutation.mutate({ userId, status: "active" });
  };

  const handleBlockUser = (userId: string) => {
    updateUserStatusMutation.mutate({ userId, status: "blocked" });
  };

  const isPrimaryOrAdmin = user?.role === "primary" || user?.role === "admin";
  const canManageUsers =
    user?.role === "primary" || (user?.role === "admin" && household?.delegateAdminApprovals);

  const activeUsers = users?.filter((u) => u.status === "active") || [];
  const pendingUsers = users?.filter((u) => u.status === "pending") || [];
  const blockedUsers = users?.filter((u) => u.status === "blocked") || [];

  // Load existing group members when dialog opens
  useEffect(() => {
    if (manageMembersDialogOpen && groupMembers) {
      setGroupMemberIds(groupMembers.map((m: any) => m.id));
    }
  }, [manageMembersDialogOpen, groupMembers]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 noise-texture relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        
        <div className="relative p-8 space-y-8 z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1>People</h1>
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
          <Card className="border-primary/50 bg-white/90 backdrop-blur-md">
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

        {/* Groups Section - Only visible to Primary/Admin */}
        {isPrimaryOrAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Groups</CardTitle>
                  <CardDescription>Organize your network into visibility groups</CardDescription>
                </div>
                <Button onClick={() => setCreateGroupDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groups && groups.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors relative group/card">
                      <div className="pr-8">
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {group.memberCount || 0} {group.memberCount === 1 ? "member" : "members"}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openManageMembersDialog(group.id)}
                          title="Manage Members"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditGroupDialog(group)}
                          title="Edit Group"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteGroupDialog(group.id)}
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No groups yet. Create your first group to organize your support network.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Group Dialog */}
        <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a group to organize your support network
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Inner Circle, Church Friends"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description (optional)</Label>
                <Textarea
                  id="group-description"
                  placeholder="Brief description of this group..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateGroupDialogOpen(false)}
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

        {/* Edit Group Dialog */}
        <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update group name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group Name *</Label>
                <Input
                  id="edit-group-name"
                  placeholder="e.g., Inner Circle, Church Friends"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-group-description">Description (optional)</Label>
                <Textarea
                  id="edit-group-description"
                  placeholder="Brief description of this group..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditGroupDialogOpen(false)}
                disabled={updateGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} disabled={updateGroupMutation.isPending}>
                {updateGroupMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Members Dialog */}
        <Dialog open={manageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Group Members</DialogTitle>
              <DialogDescription>
                Add or remove people from this group
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <UserSelector
                selectedUserIds={groupMemberIds}
                onChange={setGroupMemberIds}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setManageMembersDialogOpen(false)}
                disabled={addMemberMutation.isPending || removeMemberMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveGroupMembers}
                disabled={addMemberMutation.isPending || removeMemberMutation.isPending}
              >
                {addMemberMutation.isPending || removeMemberMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Group Dialog */}
        <Dialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Group?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this group? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This group may be used in visibility settings for needs, events, or meal trains. 
                Deleting it will not delete those items, but their visibility settings may need to be updated.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteGroupDialogOpen(false)}
                disabled={deleteGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
              >
                {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}

