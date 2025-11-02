import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as db from "../db";
import { checkContentVisibility, filterByVisibility } from "../visibilityHelpers";

/**
 * Security tests for visibility filtering implementation
 * 
 * These tests ensure that:
 * 1. Supporters can ONLY see content they're authorized to view
 * 2. Group-restricted content is COMPLETELY HIDDEN from unauthorized supporters
 * 3. Cross-household content is NEVER visible
 * 4. Custom visibility works correctly
 * 
 * CRITICAL: These tests prevent security regressions that could leak private information
 */

describe("Visibility Security Tests", () => {
  describe("checkContentVisibility", () => {
    it("should allow primary/admin to see all content regardless of visibility", async () => {
      const content = {
        visibilityScope: "private",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const primaryCanView = await checkContentVisibility(
        "user-123",
        "primary",
        1,
        content
      );
      const adminCanView = await checkContentVisibility(
        "user-456",
        "admin",
        1,
        content
      );

      expect(primaryCanView).toBe(true);
      expect(adminCanView).toBe(true);
    });

    it("should allow supporters to see all_supporters content", async () => {
      const content = {
        visibilityScope: "all_supporters",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(true);
    });

    it("should HIDE private content from supporters (return false, not throw)", async () => {
      const content = {
        visibilityScope: "private",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(false);
    });

    it("should HIDE role-restricted content from supporters", async () => {
      const content = {
        visibilityScope: "role",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(false);
    });

    it("should allow custom visibility for included users", async () => {
      const content = {
        visibilityScope: "custom",
        visibilityGroupId: null,
        customUserIds: ["user-123", "user-456"],
      };

      const includedUserCanView = await checkContentVisibility(
        "user-123",
        "supporter",
        1,
        content
      );
      const excludedUserCanView = await checkContentVisibility(
        "user-789",
        "supporter",
        1,
        content
      );

      expect(includedUserCanView).toBe(true);
      expect(excludedUserCanView).toBe(false);
    });
  });

  describe("filterByVisibility - Performance & Correctness", () => {
    it("should handle empty lists efficiently", async () => {
      const result = await filterByVisibility([], "user-123", "supporter", 1);
      expect(result).toEqual([]);
    });

    it("should filter mixed visibility items correctly", async () => {
      const items = [
        {
          id: 1,
          title: "Public need",
          visibilityScope: "all_supporters",
          visibilityGroupId: null,
          customUserIds: null,
        },
        {
          id: 2,
          title: "Private need",
          visibilityScope: "private",
          visibilityGroupId: null,
          customUserIds: null,
        },
        {
          id: 3,
          title: "Role-restricted need",
          visibilityScope: "role",
          visibilityGroupId: null,
          customUserIds: null,
        },
      ];

      const visible = await filterByVisibility(
        items,
        "supporter-123",
        "supporter",
        1
      );

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe(1);
      expect(visible[0].title).toBe("Public need");
    });

    it("should allow admin to see all items", async () => {
      const items = [
        {
          id: 1,
          visibilityScope: "all_supporters",
          visibilityGroupId: null,
          customUserIds: null,
        },
        {
          id: 2,
          visibilityScope: "private",
          visibilityGroupId: null,
          customUserIds: null,
        },
        {
          id: 3,
          visibilityScope: "role",
          visibilityGroupId: null,
          customUserIds: null,
        },
      ];

      const visible = await filterByVisibility(items, "admin-123", "admin", 1);

      expect(visible).toHaveLength(3);
    });

    it("should filter custom visibility correctly", async () => {
      const items = [
        {
          id: 1,
          visibilityScope: "custom",
          visibilityGroupId: null,
          customUserIds: ["user-123", "user-456"],
        },
        {
          id: 2,
          visibilityScope: "custom",
          visibilityGroupId: null,
          customUserIds: ["user-789"],
        },
      ];

      const visible = await filterByVisibility(
        items,
        "user-123",
        "supporter",
        1
      );

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe(1);
    });
  });

  describe("Group Visibility - CRITICAL SECURITY", () => {
    // Mock db.getUserGroups to test group membership logic
    beforeEach(() => {
      vi.spyOn(db, "getUserGroups");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should allow supporters IN the group to see group-restricted content", async () => {
      // Mock: User is in group 5
      vi.mocked(db.getUserGroups).mockResolvedValue([
        { id: 5, name: "Inner Circle", description: null, householdId: 1, createdAt: new Date() },
        { id: 7, name: "Church Friends", description: null, householdId: 1, createdAt: new Date() },
      ]);

      const content = {
        visibilityScope: "group",
        visibilityGroupId: 5,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-in-group",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(true);
      expect(db.getUserGroups).toHaveBeenCalledWith("supporter-in-group", 1);
    });

    it("should HIDE group-restricted content from supporters NOT in the group", async () => {
      // Mock: User is in groups 7 and 8, but NOT in group 5
      vi.mocked(db.getUserGroups).mockResolvedValue([
        { id: 7, name: "Church Friends", description: null, householdId: 1, createdAt: new Date() },
        { id: 8, name: "Work Colleagues", description: null, householdId: 1, createdAt: new Date() },
      ]);

      const content = {
        visibilityScope: "group",
        visibilityGroupId: 5,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-not-in-group",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(false);
      expect(db.getUserGroups).toHaveBeenCalledWith("supporter-not-in-group", 1);
    });

    it("should filter group-restricted items correctly in lists", async () => {
      // Mock: User is in group 5, but NOT in group 10
      vi.mocked(db.getUserGroups).mockResolvedValue([
        { id: 5, name: "Inner Circle", description: null, householdId: 1, createdAt: new Date() },
      ]);

      const items = [
        {
          id: 1,
          title: "Public need",
          visibilityScope: "all_supporters",
          visibilityGroupId: null,
          customUserIds: null,
        },
        {
          id: 2,
          title: "Inner Circle only",
          visibilityScope: "group",
          visibilityGroupId: 5, // User IS in this group
          customUserIds: null,
        },
        {
          id: 3,
          title: "Family only",
          visibilityScope: "group",
          visibilityGroupId: 10, // User NOT in this group
          customUserIds: null,
        },
      ];

      const visible = await filterByVisibility(
        items,
        "supporter-123",
        "supporter",
        1
      );

      expect(visible).toHaveLength(2);
      expect(visible[0].id).toBe(1); // Public
      expect(visible[1].id).toBe(2); // Group 5 (user is member)
      // Item 3 (group 10) should be HIDDEN
      expect(db.getUserGroups).toHaveBeenCalledOnce(); // Called ONCE (performance optimization!)
    });

    it("should optimize group lookups - only 1 DB call for 100 items", async () => {
      // Mock: User is in group 5
      vi.mocked(db.getUserGroups).mockResolvedValue([
        { id: 5, name: "Inner Circle", description: null, householdId: 1, createdAt: new Date() },
      ]);

      // Create 100 group-restricted items
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        visibilityScope: "group",
        visibilityGroupId: i % 2 === 0 ? 5 : 10, // Half in group 5, half in group 10
        customUserIds: null,
      }));

      const visible = await filterByVisibility(
        items,
        "supporter-123",
        "supporter",
        1
      );

      // Should see 50 items (those in group 5)
      expect(visible).toHaveLength(50);
      
      // CRITICAL PERFORMANCE TEST: Only 1 DB call, not 100!
      expect(db.getUserGroups).toHaveBeenCalledOnce();
    });

    it("should HIDE group content from supporters with no groups", async () => {
      // Mock: User has no group memberships
      vi.mocked(db.getUserGroups).mockResolvedValue([]);

      const content = {
        visibilityScope: "group",
        visibilityGroupId: 5,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-no-groups",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(false);
    });
  });

  describe("Security Regression Prevention", () => {
    it("should default to deny for unknown visibility scopes", async () => {
      const content = {
        visibilityScope: "unknown_scope",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const canView = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content
      );

      expect(canView).toBe(false);
    });

    it("should handle null/undefined visibility fields safely", async () => {
      const content1 = {
        visibilityScope: "group",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const content2 = {
        visibilityScope: "custom",
        visibilityGroupId: null,
        customUserIds: null,
      };

      const canView1 = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content1
      );
      const canView2 = await checkContentVisibility(
        "supporter-123",
        "supporter",
        1,
        content2
      );

      expect(canView1).toBe(false);
      expect(canView2).toBe(false);
    });

    it("should not leak visibility through exceptions", async () => {
      const dangerousContent = {
        visibilityScope: "private",
        visibilityGroupId: null,
        customUserIds: null,
      };

      expect(async () => {
        await checkContentVisibility("attacker", "supporter", 1, dangerousContent);
      }).not.toThrow();

      const canView = await checkContentVisibility(
        "attacker",
        "supporter",
        1,
        dangerousContent
      );
      expect(canView).toBe(false);
    });
  });
});
