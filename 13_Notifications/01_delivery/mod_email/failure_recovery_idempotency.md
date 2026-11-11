# PS-102-06 — Failure recovery and idempotency: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-06.R01** Enable, disable, add, verify and remove are idempotent, and send is idempotent per dispatchRef with a 10-minute dedupe window.
- **PS-102-06.R02** Transport failures retry 3 times over 6 hours with the Message-ID unchanged so duplicate submissions collapse at the receiver.
- **PS-102-06.R03** A relay restart resumes queued deliveries from the database and never sends a delivery already marked sent.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with a 24 h replay window; add is naturally idempotent on addressHash for the user; verify is idempotent on token; send dedupes on dispatchRef for 10 minutes; bounce reports are idempotent on (transportMessageId, kind, source); vault enable is idempotent on (relayId, address).
- **concurrency:** Status changes use compare-and-set on revision inside one SQLite transaction; the daily cap counter is updated in the same transaction as the delivery insert; concurrent verifies resolve to one verified transition; in the vault a Web Lock per relay serializes enable, disable and sync_status.
- **retries:** Transport submission retries at 5 min, 1 h and 6 h with jitter on temporary errors; permanent errors fail at once; verification emails are not auto-retried beyond the limits of V05 and V09; the vault retries relay calls through the sync outbox.
- **offline:** The vault queues relay add and remove requests in the sync outbox until online and shows the address as pending; sends are relay-side and do not depend on the vault; if the relay cannot reach the SMTP adapter deliveries stay queued up to 6 hours and then fail while the inbox is unaffected.
- **partial failure:** If SMTP accepts but the status update fails, the delivery may be submitted again once with the same Message-ID; if verification mail submission fails the address stays unverified and the user may request another link; if the relay lost its copy the vault re-adds the address from its email target after user confirmation.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T08 | integration | PS-102-06.R01, PS-102-06.R02, PS-102-06.R03 | verify twice, retry on 4xx, crash after SMTP accept, dispatchRef repeated | one verified transition, 3 attempts max, one repeated submission with the same Message-ID, one delivery per dispatchRef |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
