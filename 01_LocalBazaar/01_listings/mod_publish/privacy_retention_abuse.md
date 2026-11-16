# PS-004-07 — Privacy, retention and abuse: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-07.R01** Only P0 fields leave the device in the projection; the UI shows exactly what becomes public and warns that copies already fetched by others cannot be recalled (PRV-6).
- **PS-004-07.R02** Tombstones are honoured by relays that follow CTR-FED-001; retention of the PublicationRecord is RET-EVIDENCE.
- **PS-004-07.R03** Pseudonymity is not anonymity: the author did:key and relay metadata link all of a principal's publications, and the publish sheet says so.

## Specification

**Data classification**
- Projection statement: P0, signed, contains regionCell at most L2.
- PublicationRecord: P1 in the vault, with receipt times that are relay claims.

**Retention**
- PublicationRecord: RET-EVIDENCE (2 years after last related activity).
- Tombstones: kept 180 days by senders and receivers (CTR-PRV-001).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Prohibited or illegal goods published | local rules before signing, relay hosting policy on receipt, relay-side removal with reasons; no claim of global enforcement |
| T02 | Location leak in the projection | schema caps regionCell at 5 characters; media GPS check; projection builder test fails if any field outside the allowlist appears |
| T03 | Impersonation by republishing another author's listing | receivers accept only statements whose author did:key matches the listing owner; duplicates by cid are ignored |
| T04 | Spam flooding relays | local cap of 100 active publications, relay quotas, local spam heuristics from F12.S02.M02 before signing |
| T05 | Stale offer terms after unpublish | tombstone queued to every relay that received the projection; UI states copies may persist |

**Abuse controls**
- At most 20 publish commands per hour per vault.
- Relay hosting policies are shown before sending; the user can choose relays, and relays can refuse.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03 | relay moderator removal for R2 and a foreign-author statement at a receiving vault | delivery relay_removed only for R2; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T12 | integration | PS-004-07.R01, PS-004-07.R02 | unpublish after publish | tombstone queued to every relay with a received delivery; UI copy states fetched copies may persist |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
