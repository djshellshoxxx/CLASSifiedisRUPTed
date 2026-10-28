# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Token bucket persisted in moderation_buckets, driven by deps.clock (code: `packages/moderation/src/antifraud/rate.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Longest-prefix policy table, overridable via options.ratePolicies (code: `packages/moderation/src/antifraud/rate.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Never admits more than capacity + refill * elapsed (property) (code: `packages/moderation/src/antifraud/rate.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [ ] Single-writer store assumed; a multi-process relay needs a store with atomic compare-and-set (put already uses expectedVersion)

Operations, permissions and events: see `packages/moderation/README.md`.
