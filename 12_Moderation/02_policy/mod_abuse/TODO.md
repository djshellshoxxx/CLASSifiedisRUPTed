# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] block / unblock / list own blocks; events carry no account ids (code: `packages/moderation/src/policy/abuse.ts`, tests: `packages/moderation/test/policy.test.ts`)
- [x] BlockPort.isBlocked in both directions (code: `packages/moderation/src/policy/abuse.ts`, tests: `packages/moderation/test/policy.test.ts`)
- [x] Harassment pattern raises priority of all open cases about the account (code: `packages/moderation/src/policy/abuse.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [ ] Blocks are not propagated to federated peers

Operations, permissions and events: see `packages/moderation/README.md`.
