<!-- Thanks for contributing to OBK. A few quick things before you submit. -->

## Summary

<!-- What does this PR change, in 1-3 sentences? -->

## Why

<!-- What problem does this solve, or what user need does it address?
     If this fixes an open issue, link it: "Fixes #123" -->

## Test plan

<!-- How did you verify this works? Concrete steps a reviewer can repeat.
     Examples:
     - [ ] Ran `pnpm dev` locally and signed in successfully
     - [ ] Created a need at "Friend" tier and confirmed Community-tier user can't see it
     - [ ] Added unit test in `tests/visibility.spec.ts`
     - [ ] Manually triggered /api/cron/reminders with the CRON_SECRET header  -->

## Screenshots / Recordings

<!-- For UI changes, drop in a before/after screenshot or short Loom.
     Skip this section for backend-only changes. -->

## Things to check before merge

- [ ] I read [PHILOSOPHY.md](my-brothers-keeper/PHILOSOPHY.md) and this change aligns with it
- [ ] I followed the Five-Step Security Pattern in `server/visibilityHelpers.ts` for any new endpoints that touch private data
- [ ] No new dependencies on Replit-specific services (we're trying to remove these, not add more)
- [ ] No console.log / debug statements left behind
