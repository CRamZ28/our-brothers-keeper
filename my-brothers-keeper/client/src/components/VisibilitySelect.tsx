import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VISIBILITY_OPTIONS, type VisibilityOption, type BackendVisibilityScope } from "@/const";
import { UserSelector } from "./UserSelector";
import { trpc } from "@/lib/trpc";

interface VisibilitySelectProps {
  value: VisibilityOption;
  onChange: (value: VisibilityOption) => void;
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

  const showGroupSelector = value === "groups";
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
            {VISIBILITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {showGroupSelector && onGroupIdsChange && (
        <div className="space-y-2">
          <Label>Select Groups (you can select multiple)</Label>
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
            Choose specific groups who can see this content
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

export function visibilityToBackend(
  option: VisibilityOption,
  groupIds: string[],
  customUserIds: string[]
): {
  visibilityScope: BackendVisibilityScope;
  visibilityGroupIds: number[];
  customUserIds?: string[];
} {
  switch (option) {
    case "everyone":
      return {
        visibilityScope: "all_supporters",
        visibilityGroupIds: [],
      };
    case "groups":
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

export function backendToVisibility(
  visibilityScope: string,
  groupIds: number[],
  customUserIds?: string[]
): { option: VisibilityOption; groupIds: string[]; customUserIds: string[] } {
  if (visibilityScope === "all_supporters") {
    return { option: "everyone", groupIds: [], customUserIds: [] };
  }
  if (visibilityScope === "custom") {
    return { option: "custom", groupIds: [], customUserIds: customUserIds || [] };
  }
  if (visibilityScope === "group") {
    return { 
      option: "groups",
      groupIds: groupIds.map(id => id.toString()),
      customUserIds: []
    };
  }
  if (visibilityScope === "private" || visibilityScope === "role") {
    return {
      option: "custom",
      groupIds: [],
      customUserIds: []
    };
  }
  
  return { option: "everyone", groupIds: [], customUserIds: [] };
}
