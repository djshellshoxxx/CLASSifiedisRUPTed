# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Score from decayed signals x sensitivity table (longest prefix) (code: `packages/moderation/src/antifraud/risk.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Thresholds 40 / 75 and explainable reasons (code: `packages/moderation/src/antifraud/risk.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [x] Properties: monotonic in weight and in signal count, non-increasing over time (code: `packages/moderation/src/antifraud/risk.ts`, tests: `packages/moderation/test/antifraud.test.ts`)
- [ ] RiskInput.amount is ignored (no currency-normalised thresholds yet)

Operations, permissions and events: see `packages/moderation/README.md`.
