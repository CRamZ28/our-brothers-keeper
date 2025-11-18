import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass";
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
    <div className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/waves-bg.png')" }}>
      {/* Decorative blur orbs */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-cyan-400/40 blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="fixed w-[700px] h-[700px] rounded-full bg-emerald-400/35 blur-[120px] top-1/3 right-0 pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-teal-400/45 blur-[120px] bottom-0 left-1/4 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <GlassCard className="max-w-2xl w-full p-8">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to {APP_TITLE}</h1>
            <p className="text-base text-gray-600">
              Let's set up a support network for a family in need.
            </p>
            <div className="pt-2">
              <Button
                variant="link"
                onClick={() => setLocation("/search")}
                className="text-sm text-gray-600 hover:text-[#2DB5A8] p-0 h-auto"
              >
                Looking for an existing family page? Search here
              </Button>
            </div>
          </div>
          <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4 p-4 border border-white/30 rounded-lg bg-white/10">
              <Label className="text-base font-medium text-gray-900">Who are you?</Label>
              <RadioGroup value={setupRole} onValueChange={(v) => setSetupRole(v as any)}>
                <Label htmlFor="role-primary" className="cursor-pointer block">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                    <RadioGroupItem value="primary" id="role-primary" className="shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">
                        I'm the person who needs support (Primary)
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        You'll have full control over your support network and all settings.
                      </p>
                    </div>
                  </div>
                </Label>
                <Label htmlFor="role-admin" className="cursor-pointer block">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                    <RadioGroupItem value="admin" id="role-admin" className="shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">
                        I'm setting this up for someone else (Admin)
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        You'll help manage the network on behalf of the primary person. They'll be
                        invited to join and will retain ultimate control.
                      </p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Household Name */}
            <div className="space-y-2">
              <Label htmlFor="householdName" className="text-gray-900">Household Name</Label>
              <Input
                id="householdName"
                placeholder="e.g., The Smith Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
              />
              <p className="text-sm text-gray-600">
                This is how the support network will be identified
              </p>
            </div>

            {/* Primary Person Details (only shown for Admin setup) */}
            {setupRole === "admin" && (
              <div className="space-y-4 p-4 border border-white/30 rounded-lg bg-white/10">
                <h3 className="font-medium text-sm text-gray-900">Primary Person Details</h3>
                <p className="text-sm text-gray-600">
                  We'll send them an invitation to join and take control of their network.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="primaryName" className="text-gray-900">Their Full Name</Label>
                  <Input
                    id="primaryName"
                    placeholder="e.g., Sarah Smith"
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    required={setupRole === "admin"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryEmail" className="text-gray-900">Their Email Address</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    placeholder="sarah@example.com"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    required={setupRole === "admin"}
                  />
                  <p className="text-sm text-gray-600">
                    They'll receive an invitation to claim their Primary role
                  </p>
                </div>
              </div>
            )}

            {/* Additional Admins */}
            <div className="space-y-4 p-4 border border-white/30 rounded-lg bg-white/10">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Additional Admins (optional)</Label>
                <p className="text-sm text-gray-600">
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
                      className="flex items-center justify-between p-3 bg-white/20 rounded-lg border border-white/30"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">{admin.name}</p>
                        <p className="text-xs text-gray-600">{admin.email}</p>
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
              <div className="space-y-4 p-4 border border-white/30 rounded-lg bg-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="delegateApprovals" className="text-base font-medium text-gray-900">
                      Delegate Admin Approvals
                    </Label>
                    <p className="text-sm text-gray-600">
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
            <div className="p-4 border border-white/30 rounded-lg bg-white/10 space-y-2">
              <h3 className="font-medium text-sm text-gray-900">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
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
              className="w-full bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white"
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
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

