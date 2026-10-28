# TODO — F08.S03.M03 mod_coordination

**Status:** IMPLEMENTED — Propose/accept/counter/reschedule/cancel with per-revision consent, encrypted private place, expiry sweeper, no-show claims flagged when contradicted by check-in.

## Implemented
- [x] Propose with safe spot or sealed private place; accept, counter, reschedule, cancel with per-revision consent
- [x] Explicit transition table, expiry sweeper, optimistic concurrency
- [x] No-show claims, flagged when contradicted by a check-in

## Code and tests
- Code: `packages/comms/src/meetups/coordination.ts`
- Tests: `packages/comms/test/meetups.test.ts`

## Remaining
- [ ] Calendar export
- [ ] Reminder notifications scheduling (notifications module)
