# CTR-TST-001 — Test identifiers and verification conventions

**Status:** APPROVED. **Owner:** F17.S01 (testing).

- **TST-1** Test case IDs `TEST-PS-NNN-PP.Txx` where `PS-NNN-PP` is the process spec. Test titles in code start with the ID so the traceability tool (`tools/trace`) can map requirements → tests.
- **TST-2** Levels: `unit` (pure functions, vitest), `property` (fast-check, seeded, ≥ 200 runs; 10 000 in nightly), `contract` (command/event schemas against registry), `integration` (relay + SQLite in-memory), `e2e` (Playwright, Pixel 7 and iPhone 14 profiles), `a11y` (axe-core, zero serious/critical), `abuse` (authorization/privacy negative cases), `load` and `chaos` (F17.S02).
- **TST-3** Determinism: injected clock and ID generator; no network in unit/integration; fixed seeds recorded on failure.
- **TST-4** Every requirement ID is covered by ≥ 1 test or has a documented reason in the module spec (`untested_reason`).
