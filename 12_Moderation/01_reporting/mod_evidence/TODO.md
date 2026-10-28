# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Evidence items {kind, contentHash, ref, addedBy, at, prevHash} chained from a genesis hash (code: `packages/moderation/src/reporting/evidence.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] Chain head record detects truncation (code: `packages/moderation/src/reporting/evidence.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] verifyEvidenceChain + staff verify query; tamper tests (code: `packages/moderation/src/reporting/evidence.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] System-written links for reports, message excerpts, decisions, appeal outcomes (code: `packages/moderation/src/reporting/flags.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [ ] Evidence blobs live outside this package; only hashes and opaque refs are kept
- [ ] Hash chain proves integrity of this store, not authenticity of the uploaded material

Operations, permissions and events: see `packages/moderation/README.md`.
