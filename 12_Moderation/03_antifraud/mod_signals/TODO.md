# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Record and list signals; kinds payment_failed ... chargeback_claim, spam_detected (code: `packages/moderation/src/antifraud/signals.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Exponential decay, half-life 30 days (code: `packages/moderation/src/antifraud/signals.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Revoke by source on overturned enforcement (code: `packages/moderation/src/antifraud/signals.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [ ] Signals are scanned per account (no secondary index)

Operations, permissions and events: see `packages/moderation/README.md`.
