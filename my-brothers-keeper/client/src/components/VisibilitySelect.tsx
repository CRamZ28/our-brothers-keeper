import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VISIBILITY_PRESETS, type VisibilityPreset, type BackendVisibilityScope } from "@/const";
import { UserSelector } from "./UserSelector";
import { trpc } from "@/lib/trpc";

interface VisibilitySelectProps {
  value: VisibilityPreset;
  onChange: (value: VisibilityPreset) => void;
  groupIds?: string[];
  onGroupIdsChange?: (groupIds: string[]) => void;
  customUserIds?: string[];
  onCustomUserIdsChange?: (userIds: string[]) => void;
  label?: string;
  description?: string;
}

export function VisibilitySelect({
  value,
  onChange,
  groupIds = [],
  onGroupIdsChange,
  customUserIds = [],
  onCustomUserIdsChange,
  label = "Who Can See This",
  description = "Control who can see and access this content",
}: VisibilitySelectProps) {
  const { data: groups = [] } = trpc.group.list.useQuery();

  const showGroupSelector = value === "inner_circle" || value === "community_groups";
  const showCustomSelector = value === "custom";

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="visibility-scope">{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="visibility-scope">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {showGroupSelector && onGroupIdsChange && (
        <div className="space-y-2">
          <Label>
            {value === "inner_circle" ? "Select Inner Circle Groups" : "Select Church/Community Groups"}
          </Label>
          <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
            {groups && groups.length > 0 ? (
              groups.map((group: { id: number; name: string }) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    checked={groupIds.includes(group.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onGroupIdsChange([...groupIds, group.id.toString()]);
                      } else {
                        onGroupIdsChange(groupIds.filter(id => id !== group.id.toString()));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                    {group.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No groups available. Create groups in the People page.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {value === "inner_circle" 
              ? "Choose groups for your closest family and friends"
              : "Choose community or church groups to share with"}
          </p>
        </div>
      )}

      {showCustomSelector && onCustomUserIdsChange && (
        <div className="space-y-2">
          <Label>Select People</Label>
          <UserSelector
            selectedUserIds={customUserIds}
            onChange={onCustomUserIdsChange}
          />
          <p className="text-xs text-muted-foreground">
            Choose specific people who can see this content
          </p>
        </div>
      )}
    </div>
  );
}

export function presetToBackend(
  preset: VisibilityPreset,
  groupIds: string[],
  customUserIds: string[]
): {
  visibilityScope: BackendVisibilityScope;
  visibilityGroupIds: number[];
  customUserIds?: string[];
} {
  switch (preset) {
    case "friends":
      return {
        visibilityScope: "all_supporters",
        visibilityGroupIds: [],
      };
    case "inner_circle":
    case "community_groups":
      return {
        visibilityScope: "group",
        visibilityGroupIds: groupIds.map(id => parseInt(id)),
      };
    case "custom":
      return {
        visibilityScope: "custom",
        visibilityGroupIds: [],
        customUserIds,
      };
  }
}

export function backendToPreset(
  visibilityScope: string,
  groupIds: number[],
  customUserIds?: string[]
): { preset: VisibilityPreset; groupIds: string[]; customUserIds: string[]; legacy: boolean } {
  if (visibilityScope === "all_supporters") {
    return { preset: "friends", groupIds: [], customUserIds: [], legacy: false };
  }
  if (visibilityScope === "custom") {
    return { preset: "custom", groupIds: [], customUserIds: customUserIds || [], legacy: false };
  }
  if (visibilityScope === "group") {
    return { 
      preset: "inner_circle",
      groupIds: groupIds.map(id => id.toString()),
      customUserIds: [],
      legacy: false
    };
  }
  
  if (visibilityScope === "private" || visibilityScope === "role") {
    return {
      preset: "custom",
      groupIds: [],
      customUserIds: [],
      legacy: true
    };
  }
  
  return { preset: "friends", groupIds: [], customUserIds: [], legacy: false };
}
