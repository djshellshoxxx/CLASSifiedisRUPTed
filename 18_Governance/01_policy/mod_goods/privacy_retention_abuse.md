# PS-144-07 — Privacy, retention and abuse: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-07.R01** Taxonomy data is P0 and contains no personal data; the only personal link is the publisher key fingerprint, which is public by design.
- **PS-144-07.R02** Packs are retained RET-STANDARD; the last 3 applied versions are kept locally for diff and rollback.
- **PS-144-07.R03** A relay or publisher cannot silently change a user's mirror: every change arrives as a signed pack that the user can inspect and refuse.

## Specification

**Data classification**
- Category and pack statements: P0, public, signed.

**Retention**
- Category mirror and last 3 packs: RET-STANDARD.
- Pending untrusted packs: 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious publisher marks competitor categories restricted or retires them | trusted-publisher list, diff shown before applying, restricted changes need an approved proposal reference, user can pin a publisher |
| T02 | Pack tampering in transit | Ed25519 signature over JCS and packCid check |
| T03 | Category id reuse to reinterpret old listings | ids immutable; reuse rejected in validation |
| T04 | Oversized or deep trees to exhaust a device | 2000 categories, depth 4, 1 MiB pack limit enforced before parsing into storage |

**Abuse controls**
- A vault trusts at most 10 publishers; pack applications limited to 20 per day.
- Relay upload limited to 10 packs per day per operator key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T11 | abuse | PS-144-07.R01, PS-144-07.R02, PS-144-07.R03 | scan stored data and logs; pack with 2 001 categories and 1.5 MiB | no personal data beyond fingerprint; oversized pack rejected before storage |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
