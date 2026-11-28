# PS-069-06 — Failure recovery and idempotency: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-06.R01** Commands are idempotent per CTR-IDM-001 using vault command IDs, and mutating commands require expectedRevision.
- **PS-069-06.R02** Statement delivery uses the sync outbox with states prepared, transport_acknowledged and peer_accepted; the UI shows only the state reached (IDM-7).
- **PS-069-06.R03** Conflicting signed statements are detected, frozen and surfaced; there is no last-writer-wins for money or consent.

## Specification

- **idempotency:** Vault command ID recorded in the inbox for 24 h; replay returns the original result. Statements are deduplicated by cid, so redelivery is a no-op. dealId is the UUIDv8 of (contextRef, contextCid) and dealCid the cid of the canonical terms, so repeated or independent opens converge; the completion body is deterministic so every party signs the same completionCid.
- **concurrency:** expectedRevision on acknowledge, dispute and cancel; unique index on (vault, context type, context id, context cid); multi-tab writers serialize through a Web Lock named commerce-deal. Cross-vault there is no lock: statements are ordered by the per-author seq and prev chain, unknown parents are buffered 24 h, and only two different statements by one author with the same prev or seq freeze the claim.
- **retries:** Sync outbox retries delivery with backoff 5 s, 30 s, 5 min, 1 h, then every 6 h until the claim expires; receivers dedupe by cid. Held claims are never retried by the outbox because they are not in it.
- **offline:** All commands commit locally while offline and show pending; statements wait in the sync outbox. Acknowledgement is allowed offline but the UI says the payer has not seen it until peer_accepted. A crypto claim made offline with a verifier configured stays held until the txid lookup succeeds.
- **partial failure:** Local commit and outbox insert are one IndexedDB transaction, so no statement is prepared without its state change. If transport fails the state stays prepared and is retried; no automatic rollback of a signed statement. A ContextTermsPort failure on open stores nothing; on ingest it buffers the statement for 24 h.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T12 | integration | PS-069-06.R01, PS-069-06.R02 | same command ID replayed; delivery interrupted at each sync state | original result returned; UI state equals the highest sync state reached |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03, PS-069-02.R02, PS-069-02.R05 | vault B receives two different claims by the payer with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour from a known party quarantines the 21st |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
