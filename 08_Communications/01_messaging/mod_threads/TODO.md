# TODO — F08.S01.M02 mod_threads

**Status:** IMPLEMENTED — 2..20 participants, invite+accept, leave/re-invite, per-participant archive/mute, block checks. Subject binding is by id prefix; existence of the subject is not verified (no port).

## Implemented
- [x] Create with 1..19 invitees (2..20 participants), subject binding by typed id
- [x] Invite requires acceptance; decline, leave, re-invite via explicit transition table
- [x] Per-participant archive and mute, creator-only disappearing TTL
- [x] Block checks on create, invite, accept; 20-participant cap incl. pending invitations
- [x] Participant list is the only routing metadata; DTOs hide others' archive/mute

## Code and tests
- Code: `packages/comms/src/messaging/threads.ts`, `packages/comms/src/support.ts`
- Tests: `packages/comms/test/threads.test.ts`

## Remaining
- [ ] Verify that the bound subject exists and the creator may discuss it (needs owner lookup ports)
- [ ] Participant removal by creator / moderation hook
