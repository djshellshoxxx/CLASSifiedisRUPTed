# TODO — F08.S03.M01 mod_safe

**Status:** IMPLEMENTED — Moderator-curated public spots (name, kind, regionCell<=5), public list, safety tips. No address or coordinates stored; names are free text curated by moderators.

## Implemented
- [x] Moderator-only create/retire, public list by region/kind, regionCell <= 5
- [x] Safety tips query
- [x] No exact address or coordinates stored

## Code and tests
- Code: `packages/comms/src/meetups/safe.ts`
- Tests: `packages/comms/test/meetups.test.ts`

## Remaining
- [ ] Suggested spots by proximity (needs discovery geo index)
- [ ] Community nomination and review workflow
