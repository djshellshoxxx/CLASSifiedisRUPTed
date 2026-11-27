# PS-149-01 — Domain schema: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-01.R01** Store one current PrivateIntent under the unlocked principal with a random UUIDv4 key and no historical revision table.
- **PS-149-01.R02** Keep owner, criteria, state and expiry inside existing encrypted vault storage without public projection.
- **PS-149-01.R03** Use StoredRecord revision and canonical intentId binding; the cancellation epoch is ephemeral only.

## Specification

### PrivateIntent

Schema `classrup.blindmatch.private_intent/v1` · storage **device** · privacy **P3** · retention **RET-OWNER-LIVE**

| Field | Type and constraints |
|---|---|
| intentId | UUIDv4 — random local ID equal to stored key |
| ownerId | DID — current unlocked principal |
| criteria | PrivateIntentCriteria — closed local query and filters |
| state | draft\|active\|paused — explicit activation only |
| expiresAt | UTC timestamp — canonical expiry |
| revision | safe integer — StoredRecord metadata only |

**Invariants**
- Tenant, owner and intent ID match the owning session and canonical key.
- Erasure leaves no row or identifying deletion history.

**Note:** LocalMatchContext is an ephemeral value, not a persisted entity or backup record.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T01 | integration | PS-149-01.R01, PS-149-01.R02, PS-149-01.R03 | Create an intent, inspect its detached owner-bound record and encrypted raw vault rows | Random ID binds the row key; criteria, owner and ID remain inside the encrypted record |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
