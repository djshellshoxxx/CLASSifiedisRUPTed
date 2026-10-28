# TODO: F10.S01.M02 retention and holds

**Status:** IMPLEMENTED

## Implemented
- [x] Defaults ephemeral 1d, session 30d, content until deletion, commerce_evidence 7y, moderation 2y, audit 1y, legal_hold frozen
- [x] computeExpiry and expiryFor
- [x] Holds place/release/list, assertNotHeld guard
- [x] planSweep returns due vs held

## Remaining
- [ ] Automatic purge execution (each owning feature purges its own data).
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
