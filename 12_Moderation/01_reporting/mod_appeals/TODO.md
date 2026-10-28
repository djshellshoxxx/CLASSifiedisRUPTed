# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Appeal window 14 days, once per decision, subject only (code: `packages/moderation/src/reporting/appeals.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [x] Reviewer independence (decider, approver, appellant excluded) (code: `packages/moderation/src/reporting/appeals.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [x] Outcomes upheld | overturned | modified (strictly milder replacement) (code: `packages/moderation/src/reporting/appeals.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [x] Overturn restores content / reinstates account / drops strike and risk signals (code: `packages/moderation/src/policy/enforcement.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [x] Appellant sees outcome and note, never reviewer identity; staff see full history (code: `packages/moderation/src/reporting/appeals.ts`, tests: `packages/moderation/test/appeals.test.ts`)
- [ ] No automatic escalation of appeals left unreviewed (no appeal SLA yet)

Operations, permissions and events: see `packages/moderation/README.md`.
