# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Duplicate content hash across different accounts (7-day window) (code: `packages/moderation/src/policy/spam.ts`, tests: `packages/moderation/test/policy.test.ts`)
- [x] Link density, posting velocity, new-account burst heuristics (code: `packages/moderation/src/policy/spam.ts`, tests: `packages/moderation/test/policy.test.ts`)
- [x] System operation records a spam_detected risk signal on block; idempotent replay (code: `packages/moderation/src/policy/spam.ts`, tests: `packages/moderation/test/policy.test.ts`)
- [ ] Heuristic thresholds are constants, not tenant-configurable
- [ ] No content similarity beyond exact hash equality (caller defines normalisation)

Operations, permissions and events: see `packages/moderation/README.md`.
