import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AdminInvite {
  id: string;
  name: string;
  email: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [setupRole, setSetupRole] = useState<"primary" | "admin">("primary");
  const [householdName, setHouseholdName] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [delegateApprovals, setDelegateApprovals] = useState(false);
  
  // Additional admins
  const [additionalAdmins, setAdditionalAdmins] = useState<AdminInvite[]>([]);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const createHouseholdMutation = trpc.household.create.useMutation({
    onSuccess: (data) => {
      if (data.needsPrimaryInvite) {
        const adminMsg =
          data.additionalAdminsCount > 0
            ? ` and ${data.additionalAdminsCount} admin${data.additionalAdminsCount > 1 ? "s" : ""}`
            : "";
        toast.success(
          `Household created! Invitations prepared for ${data.primaryEmail}${adminMsg}. Send them from the People page.`
        );
      } else {
        if (data.additionalAdminsCount > 0) {
          toast.success(
            `Household created! Invitations prepared for ${data.additionalAdminsCount} admin${data.additionalAdminsCount > 1 ? "s" : ""}. Send them from the People page.`
          );
        } else {
          toast.success("Household created successfully!");
        }
      }
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create household");
    },
  });

  const handleAddAdmin = () => {
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      toast.error("Please enter both name and email");
      return;
    }

    // Check for duplicate email
    if (additionalAdmins.some((a) => a.email === newAdminEmail)) {
      toast.error("This email is already added");
      return;
    }

    setAdditionalAdmins([
      ...additionalAdmins,
      {
        id: Date.now().toString(),
        name: newAdminName,
        email: newAdminEmail,
      },
    ]);
    setNewAdminName("");
    setNewAdminEmail("");
  };

  const handleRemoveAdmin = (id: string) => {
    setAdditionalAdmins(additionalAdmins.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) {
      toast.error("Please enter a household name");
      return;
    }

    if (setupRole === "admin") {
      if (!primaryName.trim()) {
        toast.error("Please enter the primary person's name");
        return;
      }
      if (!primaryEmail.trim()) {
        toast.error("Please enter the primary person's email");
        return;
      }
    }

    createHouseholdMutation.mutate({
      name: householdName,
      delegateAdminApprovals: delegateApprovals,
      setupRole,
      primaryName: setupRole === "admin" ? primaryName : undefined,
      primaryEmail: setupRole === "admin" ? primaryEmail : undefined,
      additionalAdmins: additionalAdmins.length > 0 ? additionalAdmins : undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Welcome to {APP_TITLE}</CardTitle>
          <CardDescription className="text-base">
            Let's set up a support network for a family in need.
          </CardDescription>
          <div className="pt-2">
            <Button
              variant="link"
              onClick={() => setLocation("/search")}
              className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
            >
              Looking for an existing family page? Search here
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4 p-4 border rounded-lg bg-accent/10">
              <Label className="text-base font-medium">Who are you?</Label>
              <RadioGroup value={setupRole} onValueChange={(v) => setSetupRole(v as any)}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="primary" id="role-primary" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="role-primary" className="font-medium cursor-pointer">
                      I'm the person who needs support (Primary)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      You'll have full control over your support network and all settings.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="admin" id="role-admin" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="role-admin" className="font-medium cursor-pointer">
                      I'm setting this up for someone else (Admin)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      You'll help manage the network on behalf of the primary person. They'll be
                      invited to join and will retain ultimate control.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Household Name */}
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                placeholder="e.g., The Smith Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                This is how the support network will be identified
              </p>
            </div>

            {/* Primary Person Details (only shown for Admin setup) */}
            {setupRole === "admin" && (
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <h3 className="font-medium text-sm">Primary Person Details</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send them an invitation to join and take control of their network.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="primaryName">Their Full Name</Label>
                  <Input
                    id="primaryName"
                    placeholder="e.g., Sarah Smith"
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    required={setupRole === "admin"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryEmail">Their Email Address</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    placeholder="sarah@example.com"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    required={setupRole === "admin"}
                  />
                  <p className="text-sm text-muted-foreground">
                    They'll receive an invitation to claim their Primary role
                  </p>
                </div>
              </div>
            )}

            {/* Additional Admins */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-base font-medium">Additional Admins (optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Invite other trusted people to help coordinate support. They'll receive invitations
                  to join as Admins.
                </p>
              </div>

              {/* List of added admins */}
              {additionalAdmins.length > 0 && (
                <div className="space-y-2">
                  {additionalAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add admin form */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAdmin}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </div>
            </div>

            {/* Delegation Option (only for Primary setup) */}
            {setupRole === "primary" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="delegateApprovals" className="text-base font-medium">
                      Delegate Admin Approvals
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow trusted Admins to approve new members and manage visibility settings on
                      your behalf. You can change this anytime and always retain override power.
                    </p>
                  </div>
                  <Switch
                    id="delegateApprovals"
                    checked={delegateApprovals}
                    onCheckedChange={setDelegateApprovals}
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 border border-primary/30 rounded-lg bg-primary/5 space-y-2">
              <h3 className="font-medium text-sm">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {setupRole === "primary" ? (
                  <>
                    <li>We'll create your household and three default groups</li>
                    <li>You can invite supporters via email or phone</li>
                    <li>You control what each person can see</li>
                    {additionalAdmins.length > 0 && (
                      <li>
                        {additionalAdmins.length} admin{additionalAdmins.length > 1 ? "s" : ""} will
                        receive invitations to help
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li>We'll create the household and send an invite to the primary person</li>
                    <li>You'll be able to start inviting supporters right away</li>
                    {additionalAdmins.length > 0 && (
                      <li>
                        {additionalAdmins.length} additional admin
                        {additionalAdmins.length > 1 ? "s" : ""} will receive invitations
                      </li>
                    )}
                    <li>The primary person can claim their account and take full control anytime</li>
                  </>
                )}
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createHouseholdMutation.isPending}
            >
              {createHouseholdMutation.isPending
                ? "Creating..."
                : setupRole === "primary"
                  ? "Create My Household"
                  : "Create Household & Send Invites"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

