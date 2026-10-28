# TODO

**Status:** IMPLEMENTED (package `@classrup/moderation`).

- [x] Reason taxonomy, free text <=2000, message excerpt supplied by reporter (code: `packages/moderation/src/reporting/flags.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] One open report per (reporter, subject); duplicates merged and counted (code: `packages/moderation/src/reporting/flags.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] Reporter rate limit (token bucket `report:` prefix) (code: `packages/moderation/src/reporting/flags.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] Case per subject; priority = f(severity, report count, reporter trust); SLA deadline (code: `packages/moderation/src/reporting/priority.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] Moderator queue: list by priority, claim, assign (admin), release, conflict-of-interest guard (code: `packages/moderation/src/reporting/cases.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [x] Reporter identity absent from events (neutral actor) and from staff case DTOs (code: `packages/moderation/src/reporting/flags.ts`, tests: `packages/moderation/test/reporting.test.ts`)
- [ ] Secondary indexes for open-report and active-case lookups (collections are scanned; relay SQLite adapter should index)
- [ ] Retention/deletion of stored message excerpts is owned by F10 privacy and not wired here

Operations, permissions and events: see `packages/moderation/README.md`.
