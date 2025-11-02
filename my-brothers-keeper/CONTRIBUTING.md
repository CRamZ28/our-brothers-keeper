# Contributing to Our Brother's Keeper

Thank you for contributing to Our Brother's Keeper! This document outlines the security patterns and best practices you must follow when developing features for this platform.

## Table of Contents
- [Security-First Development](#security-first-development)
- [The Visibility Security Pattern](#the-visibility-security-pattern)
- [Implementation Guidelines](#implementation-guidelines)
- [Testing Requirements](#testing-requirements)
- [Common Pitfalls](#common-pitfalls)

---

## Security-First Development

Our Brother's Keeper handles sensitive family data during difficult times. **Privacy and security are non-negotiable.** Every endpoint must prevent:

1. **Information Leakage** - Never reveal the existence of restricted content
2. **Enumeration Attacks** - Don't let attackers probe for valid IDs
3. **Cross-Household Access** - Strictly enforce household boundaries
4. **Visibility Bypass** - Respect all visibility controls (groups, custom, roles)

## The Visibility Security Pattern

**CRITICAL:** Every endpoint that accesses user-created content MUST follow this exact pattern:

### The Five-Step Security Pattern

```typescript
// 1. Fetch the resource by ID
const resource = await db.getResource(input.id);
if (!resource) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

// 2. Check household ownership - return NOT_FOUND to prevent enumeration
if (resource.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

// 3. Check visibility - supporter can only access resources they're allowed to view
const visibleResources = await filterByVisibility(
  [resource],
  ctx.user.id,
  ctx.user.role,
  ctx.user.householdId
);

if (visibleResources.length === 0) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

// 4. Check permissions - ONLY return FORBIDDEN after visibility is confirmed
const canPerformAction = ctx.user.role === "primary" || ctx.user.role === "admin";
if (!canPerformAction) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Only Primary or Admin can perform this action",
  });
}

// 5. Perform the operation
await db.updateResource(input.id, updateData);
```

### Why This Pattern Matters

**❌ WRONG - Leaks Information:**
```typescript
// BAD: Returns FORBIDDEN for cross-household resources
if (resource.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}
// ^ This tells attackers the resource EXISTS in another household!
```

**✅ CORRECT - Zero Information Leakage:**
```typescript
// GOOD: Returns NOT_FOUND for cross-household resources
if (resource.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}
// ^ Attackers can't tell if resource doesn't exist or is in another household
```

**❌ WRONG - Skips Visibility Check:**
```typescript
// BAD: Checks permissions before visibility
if (need.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
}

// Missing visibility check here!

const canUpdate = ctx.user.role === "admin";
if (!canUpdate) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Permission denied" });
}
// ^ Supporters can probe group-restricted needs and get FORBIDDEN instead of NOT_FOUND!
```

**✅ CORRECT - Checks Visibility First:**
```typescript
// GOOD: Checks visibility BEFORE permissions
if (need.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
}

// Check visibility
const visibleNeeds = await filterByVisibility(
  [need],
  ctx.user.id,
  ctx.user.role,
  ctx.user.householdId
);

if (visibleNeeds.length === 0) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
}

// NOW check permissions
const canUpdate = ctx.user.role === "admin";
if (!canUpdate) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Permission denied" });
}
```

## Implementation Guidelines

### Using Visibility Helpers

We provide optimized helper functions in `server/visibilityHelpers.ts`:

#### For Single Items
```typescript
import { checkContentVisibility } from "../visibilityHelpers";

const canView = await checkContentVisibility(
  ctx.user.id,
  ctx.user.role,
  ctx.user.householdId,
  event // must have: visibilityScope, visibilityGroupId, customUserIds
);

if (!canView) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
}
```

#### For Lists (Performance Optimized)
```typescript
import { filterByVisibility } from "../visibilityHelpers";

// Automatically caches user groups to avoid N+1 queries
const visibleNeeds = await filterByVisibility(
  allNeeds,
  ctx.user.id,
  ctx.user.role,
  ctx.user.householdId
);

return visibleNeeds; // Only returns items user can see
```

### Visibility Scopes

Every content type must support these visibility scopes:

- `all_supporters` - Visible to all household members
- `private` - Only visible to primary/admin
- `role` - Only visible to primary/admin
- `group` - Only visible to members of specific group (+ primary/admin)
- `custom` - Only visible to specific users (+ primary/admin)

**Note:** Primary and Admin roles can ALWAYS see all content, regardless of visibility scope.

### Database Schema for Visibility

When adding a new content type, include these fields:

```typescript
export const yourTable = pgTable("your_table", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id),
  
  // Required visibility fields
  visibilityScope: varchar("visibility_scope").notNull().default("all_supporters"),
  visibilityGroupId: integer("visibility_group_id").references(() => groups.id),
  customUserIds: text("custom_user_ids").array(),
  
  // Other fields...
});
```

## Testing Requirements

### Security Tests

Add tests to `server/__tests__/visibility-security.test.ts` for any new visibility features:

```typescript
it("should HIDE group-restricted content from unauthorized supporters", async () => {
  const content = {
    visibilityScope: "group",
    visibilityGroupId: 5,
    customUserIds: null,
  };

  const canView = await checkContentVisibility(
    "unauthorized-supporter",
    "supporter",
    1,
    content
  );

  expect(canView).toBe(false);
});
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode during development
pnpm test --watch

# Run specific test file
pnpm test visibility-security
```

### Manual Testing Checklist

When adding a new endpoint, manually verify:

1. ✅ Primary/Admin can access everything
2. ✅ Supporters see `all_supporters` content
3. ✅ Supporters DON'T see `private` content (NOT_FOUND)
4. ✅ Supporters DON'T see `role` content (NOT_FOUND)
5. ✅ Supporters IN group see `group` content
6. ✅ Supporters NOT in group DON'T see `group` content (NOT_FOUND)
7. ✅ Cross-household requests return NOT_FOUND
8. ✅ Invalid IDs return NOT_FOUND
9. ✅ Permission failures return FORBIDDEN (only after visibility confirmed)

## Common Pitfalls

### ❌ Pitfall 1: Returning FORBIDDEN for Cross-Household Access

**Problem:**
```typescript
if (resource.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "FORBIDDEN" }); // WRONG!
}
```

**Fix:**
```typescript
if (resource.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND" }); // CORRECT!
}
```

### ❌ Pitfall 2: Skipping Visibility Checks on Mutations

**Problem:**
```typescript
// update endpoint
const event = await db.getEvent(input.id);
if (!event || event.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND" });
}

// Missing visibility check!

if (ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

**Fix:**
```typescript
const event = await db.getEvent(input.id);
if (!event || event.householdId !== ctx.user.householdId) {
  throw new TRPCError({ code: "NOT_FOUND" });
}

// Add visibility check
const visibleEvents = await filterByVisibility([event], ctx.user.id, ctx.user.role, ctx.user.householdId);
if (visibleEvents.length === 0) {
  throw new TRPCError({ code: "NOT_FOUND" });
}

// Now check permissions
if (ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

### ❌ Pitfall 3: N+1 Queries in List Endpoints

**Problem:**
```typescript
// Inefficient: Calls getUserGroups() for EVERY item
for (const need of needs) {
  const canView = await checkContentVisibility(ctx.user.id, ctx.user.role, ctx.user.householdId, need);
  // ... N database calls!
}
```

**Fix:**
```typescript
// Efficient: Calls getUserGroups() ONCE, caches results
const visibleNeeds = await filterByVisibility(needs, ctx.user.id, ctx.user.role, ctx.user.householdId);
// Only 1 database call!
```

### ❌ Pitfall 4: Checking Permissions Before Visibility

**Problem:**
```typescript
// Check permission first
if (ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" }); // Leaks existence!
}

// Check visibility second
const visible = await filterByVisibility(...);
```

**Fix:**
```typescript
// Check visibility first
const visible = await filterByVisibility(...);
if (visible.length === 0) {
  throw new TRPCError({ code: "NOT_FOUND" });
}

// Check permission second
if (ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

## Code Review Checklist

Before submitting a PR, verify:

- [ ] All endpoints follow the Five-Step Security Pattern
- [ ] Cross-household checks return NOT_FOUND (not FORBIDDEN)
- [ ] Visibility checks come BEFORE permission checks
- [ ] List endpoints use `filterByVisibility` (not manual loops)
- [ ] Single-item endpoints use `checkContentVisibility` or `filterByVisibility`
- [ ] Added tests to `visibility-security.test.ts`
- [ ] Manual testing checklist completed
- [ ] No information leakage through error messages
- [ ] Database schema includes visibility fields

## Getting Help

If you're unsure about implementing security correctly:

1. Review existing routers: `needsRouter.ts`, `eventsRouter.ts`, `messagesRouter.ts`
2. Check `visibilityHelpers.ts` for reusable functions
3. Look at test examples in `visibility-security.test.ts`
4. Ask for a security review before merging

---

**Remember:** Our users trust us with their most sensitive family moments. We must earn that trust through rigorous security practices.
