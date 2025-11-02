import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserSelectorProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export function UserSelector({ selectedUserIds, onChange }: UserSelectorProps) {
  const { data: users = [] } = trpc.user.listInHousehold.useQuery();

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const toggleAll = () => {
    if (selectedUserIds.length === users.length) {
      onChange([]);
    } else {
      onChange(users.map((u: any) => u.id));
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          id="select-all"
          checked={selectedUserIds.length === users.length && users.length > 0}
          onCheckedChange={toggleAll}
        />
        <Label htmlFor="select-all" className="font-semibold cursor-pointer">
          Select All ({selectedUserIds.length} of {users.length})
        </Label>
      </div>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
              <Checkbox
                id={`user-${user.id}`}
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={() => toggleUser(user.id)}
              />
              <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  {user.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt={user.name || user.email || 'User'}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    {user.role && (
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
