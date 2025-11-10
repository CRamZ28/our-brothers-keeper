import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VISIBILITY_OPTIONS, type VisibilityScope } from "@/const";
import { UserSelector } from "./UserSelector";

interface VisibilitySelectProps {
  value: VisibilityScope;
  onChange: (value: VisibilityScope) => void;
  customUserIds?: string[];
  onCustomUserIdsChange?: (userIds: string[]) => void;
  label?: string;
  description?: string;
}

export function VisibilitySelect({
  value,
  onChange,
  customUserIds = [],
  onCustomUserIdsChange,
  label = "Who Can See This",
  description = "Control who can see and access this content",
}: VisibilitySelectProps) {
  return (
    <div className="space-y-2">
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

      {value === "custom" && onCustomUserIdsChange && (
        <div className="pt-2">
          <Label>Select People</Label>
          <div className="mt-2">
            <UserSelector
              selectedUserIds={customUserIds}
              onChange={onCustomUserIdsChange}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Choose specific people who can see this content
          </p>
        </div>
      )}
    </div>
  );
}
