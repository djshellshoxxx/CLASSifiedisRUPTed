# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Decisions on claimed cases by the assignee, each with policy clause and reason (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] Four-eyes approve/reject for ban and any minor_safety case (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] Port effects via SubjectActionsPort; atomic with the decision (rollback on port failure) (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] Strikes derived from history, 180-day decay, suspension recommendation at 3 (code: `packages/moderation/src/policy/strikes.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] Restrictions queryable (`restrictionsOf`, `assertNotRestricted`) and expiring (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] Subject notice and reporter outcome notifications after commit (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [x] `expire_due` system sweeper (does not reinstate while another suspension runs) (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/enforcement.test.ts`)
- [ ] Restrictions are enforced by the relay calling assertNotRestricted; no port exists to push them into feature packages
- [ ] Strike threshold only recommends a suspension; a moderator must decide it

Operations, permissions and events: see `packages/moderation/README.md`.
