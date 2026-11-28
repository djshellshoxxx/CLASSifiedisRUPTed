# F08.S01 — 01_messaging

**Status:** SPECIFIED. **Parent:** [F08](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F08.S01.M01 | [Private messages](mod_private/SPEC.md) | SPECIFIED | End-to-end encrypted messages (x25519 + XChaCha20-Poly1305 via @noble), relay stores ciphertext only; size ≤ 8 KiB text; delivery receipts optional. |
| F08.S01.M02 | [Conversation threads](mod_threads/SPEC.md) | SPECIFIED | Threads bound to a context (listing/proposal/cycle/booking/rental) with participant set; block enforcement; per-thread mute. |
| F08.S01.M03 | [Message attachments](mod_attachments/SPEC.md) | SPECIFIED | Encrypted image attachments ≤ 5 MiB, metadata stripped before encryption, per-object key for crypto-shredding. |

## Aggregation

Modules in this subfeature share the feature package `packages/comms` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| comms.thread.archived | F08.S01.M02 | F08.S01.M01 | internal |
| identity.portable_doc.published | F07.S02.M01 | F08.S01.M01 | external |
| identity.device_key.added | F07.S01.M01 | F08.S01.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F08.S01.M01 | external |
| identity.block.added | F07.S02.M02 | F08.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S01.M01 | external |
| mutiny.party.joined | F02.S01.M02 | F08.S01.M02 | external |
| mutiny.party.left | F02.S01.M02 | F08.S01.M02 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F08.S01.M02 | external |
| mutiny.cycle.completed | F02.S03.M04 | F08.S01.M02 | external |
| services.booking.cancelled | F03.S02.M01 | F08.S01.M02 | external |
| services.booking.completed | F03.S02.M02 | F08.S01.M02 | external |
| rentals.rental.closed | F05.S02.M02 | F08.S01.M02 | external |
| bazaar.listing.archived | F01.S01.M04 | F08.S01.M02 | external |
| identity.block.added | F07.S02.M02 | F08.S01.M02 | external |
| comms.message.deleted | F08.S01.M01 | F08.S01.M03 | internal |
| federation.delivery.failed | F11.S02.M01 | F08.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S01.M03 | external |
