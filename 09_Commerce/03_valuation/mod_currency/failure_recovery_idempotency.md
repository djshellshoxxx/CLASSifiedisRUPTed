# PS-073-06 — Failure recovery and idempotency: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-06.R01** Registration and status changes are idempotent under CTR-IDM-001 (vault command IDs) and use expectedRevision where applicable.
- **PS-073-06.R02** The unique (vault, code) index serializes concurrent registrations from several tabs so exactly one wins.
- **PS-073-06.R03** The in-memory cache falls back to IndexedDB if invalidation messages between tabs are lost.

## Specification

- **idempotency:** Command ID recorded in the vault inbox; replay within 24 h returns the stored response. Seeding is keyed by the snapshot version, so reopening a seeded vault is a no-op.
- **concurrency:** Unique index on (vault id, code) in IndexedDB; set_status uses expectedRevision; multi-tab writers serialize through a Web Lock named commerce-currency; cache invalidation is broadcast to other tabs on a BroadcastChannel.
- **retries:** No network involved; cache refresh retries every 5 s up to 6 times, then reads through to IndexedDB.
- **offline:** Fully offline; the registry and the descriptor check are local.
- **partial failure:** Seeding a new vault runs in one IndexedDB transaction; failure rolls back to zero rows and is retried at next vault open.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T07 | integration | PS-073-06.R01 | vault seeding interrupted halfway and reopened twice | exactly one complete set of rows exists, second open is a no-op |
| TEST-PS-073-09.T09 | integration | PS-073-06.R01, PS-073-06.R02 | two tabs concurrently registering the same code | one succeeds, one COMMERCE_CURRENCY_EXISTS |
| TEST-PS-073-09.T16 | integration | PS-073-04.R03, PS-073-06.R03 | disable a currency in tab 1 and resolve it in tab 2 within 30 s; then drop the BroadcastChannel invalidation message | tab 2 sees disabled within 30 s; with the message lost the cache refresh retries and then reads through to IndexedDB and still returns disabled |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
