# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] limitFor / checkLimit throwing LIMITS.EXCEEDED (code: `packages/moderation/src/antifraud/limits.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Trusted tier requires age, no active strikes and low decayed risk (code: `packages/moderation/src/antifraud/limits.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Self-service `limits.mine` through AccountLookup; system `limits.check` (code: `packages/moderation/src/antifraud/limits.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [ ] Caller supplies current usage; this package does not count other features' records
- [ ] Limit table is fixed in code, not tenant-configurable

Operations, permissions and events: see `packages/moderation/README.md`.
