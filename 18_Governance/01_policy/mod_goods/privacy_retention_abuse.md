# PS-144-07 — Privacy, retention and abuse: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-07.R01** Taxonomy data is P0 and contains no personal data; the only personal link is the publisher key fingerprint, which is public by design.
- **PS-144-07.R02** Packs are retained RET-STANDARD; the last 3 applied versions are kept locally for diff and rollback.
- **PS-144-07.R03** A relay or publisher cannot silently change a user's mirror: every change arrives as a signed pack, and packs that change restricted flags or retire categories wait in the pending inbox until the owner applies or refuses them after seeing the diff.
- **PS-144-07.R04** A compromised or malicious publisher key is contained: packs signed by a revoked device key are quarantined through F07 key status, and the owner can pause trust in F18.S02.M01 so new packs wait in the pending inbox.

## Specification

**Data classification**
- Category and pack statements: P0, public, signed.

**Retention**
- Category mirror and last 3 packs: RET-STANDARD.
- Held and pending packs: F18.S02.M01 PendingStatement, 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious publisher marks competitor categories restricted or retires them | trusted-publisher list, receiving vaults verify the approved decision for every restricted change and retirement, owner review with diff before applying, 30-day deprecation before retirement, user can pin another publisher |
| T02 | Pack tampering in transit | Ed25519 signature over JCS and packCid check |
| T03 | Category id reuse to reinterpret old listings | ids immutable; reuse rejected in validation |
| T04 | Oversized or deep trees to exhaust a device | 2000 categories, depth 4, 1 MiB pack limit enforced before parsing into storage |
| T05 | A trusted publisher reuses another publisher's popular category ids to reinterpret listings or flip their restricted status | V11 rejects ids already held under a different publisherId |
| T06 | Publisher key compromise | signer key status through F07 (revoked keys quarantined), pause-trust command in F18.S02.M01, decisions needed for restricted and retire changes |

**Abuse controls**
- Trusted publishers are limited by F18.S02.M01 (at most 10 per vault); pack applications limited to 20 per day.
- Relay upload limited to 10 packs per day per operator key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T11 | abuse | PS-144-07.R01, PS-144-07.R02 | scan stored data and logs; pack with 2 001 categories; pack of 1.5 MiB | no personal data beyond fingerprint; 2 001 rejected with GOVERNANCE_CATEGORY_TREE_INVALID; 1.5 MiB rejected with PAYLOAD_TOO_LARGE before storage |
| TEST-PS-144-09.T15 | a11y | PS-144-07.R03 | axe run on picker, settings and the pending review diff | zero serious or critical issues; keyboard tree navigation, Move to flow, Apply and Refuse work |
| TEST-PS-144-09.T17 | abuse | PS-144-02.R04, PS-144-01.R04, PS-144-07.R03 | PK1 flips restricted on C1 without a proposal and releases to U; same flip with D1; owner refuses; owner applies | first held with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED and C1 unchanged; second held for owner review; refuse leaves C1 unchanged; apply sets the flag |
| TEST-PS-144-09.T20 | abuse | PS-144-07.R04 | pack signed by a revoked PK1 device key; owner pauses PK1 and a new pack arrives | revoked pack quarantined; new pack held with reason paused_publisher; applied mirror unchanged |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
