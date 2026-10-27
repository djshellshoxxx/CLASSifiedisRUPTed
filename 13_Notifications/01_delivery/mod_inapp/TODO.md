# In-app notices — specification and implementation gates

**Status:** SPECIFIED — REVIEW PENDING. The ten process contracts define a reviewable local-only proposal; nothing here claims implementation or test completion.

- [x] Reconcile module scope with mandatory client-owned architecture and exact F15 local event ownership.
- [x] Specify the four-event allowlist, generic content keys, local-only meaning, fail-closed preference decision union, and transient-memory label.
- [x] Specify notice schema/CAS revision, per-vault sequence/cursor, bounded commands, deletion confirmation, idempotency, privacy, retention, accessibility, recovery, and future test path/fixture/oracle mapping.
- [ ] Obtain whole-module SPEC GO through review of all ten process contracts and explicit source-bound reviewer evidence.
- [ ] Obtain approved shared contracts for F15 local events/transactions/protected store, the F13.S02 preference resolver, F07/F16 local principal/capabilities, F10 retention, and F14 accessibility.
- [ ] Root to sync registry/checklist statuses after review.
- [ ] Implement only after whole-module SPEC GO and the required dependency contracts are approved.
- [ ] After implementation, execute the planned product tests, produce a build identity, and collect release evidence; no product tests/build/pass are claimed here.
