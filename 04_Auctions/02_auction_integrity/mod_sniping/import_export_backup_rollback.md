# PS-038-10 — Import, export, backup and rollback: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-10.R01** Vault exports carry the extension history for auctions the user took part in, with host signatures.
- **PS-038-10.R02** Import verifies each signature against the host key and the contiguity of seq; broken histories are kept as read-only history with a warning.
- **PS-038-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.extensions in classrup-export/v1; one line per Extension with the signed envelope.
- **import:** Verified extensions import as history; extensions of auctions still open import read-only until the host confirms current state.
- **backup:** The vault export is the primary backup (IOX-6); the host uses relay SQLite backup (IOX-3, IOX-7) and verifies seq contiguity after restore.
- **migration rollback:** Additive optional fields only in v1; rules version softclose-v1 is frozen so rollback never changes end-time semantics.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T14 | integration | PS-038-10.R01, PS-038-10.R02, PS-038-10.R03 | export history, import into fresh vault, restore host backup | extensions round-trip; signature chain verifies; unique seq preserved |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
