# PS-004-06 — Failure recovery and idempotency: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-06.R01** Publishing is idempotent per CTR-IDM-001; a replay returns the stored PublicationRecord and never signs a second statement.
- **PS-004-06.R02** federation.record.publish (signing and seq allocation in F11.S01.M02), the PublicationRecord, the Listing status change and the F15.S01.M01 outbox entries commit in one IndexedDB transaction; transport is a separate retried step.
- **PS-004-06.R03** Offline publish commits locally and shows prepared; the UI never reports relay receipt or acceptance before a signed receipt exists.

## Specification

- **idempotency:** Idempotency-Key required on every command; keys and request hashes kept 24 h in the vault. Statements are additionally deduplicated by cid at relays and peers (CTR-FED-001 FED-3); inbound relay notices are deduplicated by cid.
- **concurrency:** expectedRevision on the listing and on the publication; one live publication per listing is enforced by a partial unique index. Seq and prev are allocated by F11.S01.M02 in its storing transaction, so concurrent publishers in one vault never collide; a conflict detected by F11.S02.M03 (seq fork or a second projection of the listing from another device of the principal) freezes the publication and the owner chooses which candidate to keep; no last-writer-wins.
- **retries:** Transport retries follow IDM-4: exponential backoff with full jitter, base 500 ms, cap 30 s, 6 attempts per burst, then waits for the next app start or network event; a relay_rejected or relay_removed result is never retried to that relay.
- **offline:** Everything except relay delivery works offline. The sync outbox entry stays prepared; entries older than 7 days prompt the user to resend or discard. Offline publish uses the last known receipt median for V10 and warns when it is older than 7 days.
- **partial failure:** Delivery to relay A may succeed while relay B fails; each destination has its own state. A local policy-change unpublish with some relays unreachable queues tombstones for them and shows tombstone pending. If commerce.deal.open fails, attach_promotion stores nothing.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T01 | unit | PS-004-01.R01, PS-004-01.R03, PS-004-06.R03 | publish L offline | PublicationRecord active, delivery prepared, no receiptAt, no peer_accepted claim |
| TEST-PS-004-09.T05 | integration | PS-004-03.R03, PS-004-06.R02 | R1 accepts, R2 rejects | R1 peer_accepted after signed receipt, R2 relay_rejected, record stays active |
| TEST-PS-004-09.T10 | integration | PS-004-06.R01, PS-004-06.R02 | replay publish with same key; federation.conflict.detected names the statementCid (second device published another projection of L), then federation.conflict.resolved drop_all | one statement; publication frozen with the user prompt, then unpublished with a tombstone issued through federation.tombstone.issue |
| TEST-PS-004-09.T11 | chaos | PS-004-06.R03 | R1 unreachable for 2 h then returns | backoff schedule honoured, state moves prepared to transport_acknowledged without duplicate statements |
| TEST-PS-004-09.T25 | contract | PS-004-04.R02, PS-004-06.R02 | publish, renew, unpublish and end with reason expired through the StatementPublisherPort test double | every statement is created by federation.record.publish or federation.tombstone.issue with the seq returned by F11.S01.M02; the module calls no signing primitive and keeps no seq counter; bazaar.listing.unpublished carries tombstoneCid; end with reason expired returns tombstoneCid and emits no bazaar.listing.unpublished |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
