# PS-001-05 — Authorization and capabilities: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-05.R01** Vault policy: only the local principal who owns the listing may close, archive, restore; expire runs from the vault scheduler.
- **PS-001-05.R02** No relay role participates; relays remove content only when they receive the signed tombstone or by their own hosting policy.
- **PS-001-05.R03** Reading archive records is limited to the owner.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.listing.close | owner | listing.ownerId = local principal; status published, unpublished or expired |
| bazaar.listing.archive | owner | listing.ownerId = local principal; status published, unpublished, expired or closed |
| bazaar.listing.restore | owner | record.ownerId = local principal; status archived; within 90 days |
| bazaar.listing.expire | system | vault scheduler; listing status published and expiresAt <= now |
| bazaar.archive_record.read | owner | record.ownerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T08 | abuse | PS-001-05.R01, PS-001-05.R02, PS-001-05.R03 | other principal or UI context calls expire, restores foreign record | FORBIDDEN or NOT_FOUND |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
