# PS-145-02 — Validation rules: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-02.R01** Profile content is validated against bounds and privacy floors before it is staged, released or applied.
- **PS-145-02.R02** Selection and resolution validate trust in the publisher and the profile status.
- **PS-145-02.R03** Every violation maps to one stable error code.
- **PS-145-02.R04** Receiving vaults verify the approved decision for every version whose governed fields differ from the previous verified version, or from the generic profile for a new code, so the publisher's own client is not the only check.
- **PS-145-02.R05** Merge directions are fixed per field by one merge table that resolve, the Compare view, the upgrade check and the tests all use.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | code matches ^[a-z0-9_-]{2,40}$; names 1..60 code points with en present | VALIDATION_FAILED |
| V02 | evidenceDays in 180..3650, standardPurgeDays in 7..90, auditDays in 90..730 | GOVERNANCE_PROFILE_BOUNDS |
| V03 | no field requests public location above L2, exposure of exact addresses or federation of P2 data | GOVERNANCE_PROFILE_PRIVACY_FLOOR |
| V04 | minimumAge between 13 and 21 | GOVERNANCE_PROFILE_BOUNDS |
| V05 | at most 20 notices, each with a textKey, and at most 200 restricted category ids | VALIDATION_FAILED |
| V06 | disclaimerKey present | VALIDATION_FAILED |
| V07 | a version whose governed fields (countryCodes, retentionOverrides, minimumAge, ageGate, requiredNotices, restrictedCategoryIds, cashLimit, breachNotificationHours) differ from the previous verified version of the ProfileRef, or for a new code from the generic profile, cites a proposal that governance.policy_proposal.verify accepts for (publisherId, jurisdiction_profile, [code], changeDigest = sha256-JCS({code: governed fields}), asOf = activatedAt); checked at release and again at receive | GOVERNANCE_PROFILE_PROPOSAL_REQUIRED |
| V08 | profile signature verifies, the signing key is active (F07 key status through the F11 intake path), and the publisher is trusted for scope profiles and not paused (F18.S02.M01) when receiving or selecting | GOVERNANCE_PROFILE_UNTRUSTED |
| V09 | version is greater than the stored version for the same ProfileRef | CONFLICT_STATE |
| V10 | cashLimit is a positive CTR-MNY-001 amount in an ISO 4217 currency; breachNotificationHours in 24..720 | GOVERNANCE_PROFILE_BOUNDS |
| V11 | ageGate present when minimumAge is set, appliesTo a non-empty subset of publish, offer, giveaway, all, and at most 50 categoryIds | VALIDATION_FAILED |
| V12 | select names 1..3 distinct ProfileRefs whose resolved versions are active, not retired | CONFLICT_STATE |
| V13 | a decision already recorded for an earlier version of the same ProfileRef cannot approve a later version | GOVERNANCE_PROFILE_PROPOSAL_REQUIRED |

Merge table (stricter wins; Looser is the opposite direction and drives the upgrade prompt and the Compare view):
| Field | Merge | Looser when |
|---|---|---|
| evidenceDays | max | shorter |
| standardPurgeDays | min | longer |
| auditDays | max | shorter |
| minimumAge | max | lower or removed |
| ageGate.appliesTo | union | an action removed |
| ageGate.categoryIds | union; absent (all categories) wins | narrowed |
| requiredNotices | union by noticeId; the same noticeId keeps the text of the profile with the higher version | a notice removed |
| restrictedCategoryIds | union (scope_unresolved ids excluded) | an id removed |
| cashLimit | min per currency; limits in different currencies are all returned (no FX conversion here) | higher or removed |
| breachNotificationHours | min | longer |
| countryCodes | not merged; decides which selected profiles apply to regionCountry | not applicable |


## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01 | draft a valid profile with code eu_de, one with all new fields and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V13 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T05 | integration | PS-145-03.R03, PS-145-04.R03, PS-145-02.R05 | table-driven: for every merge-table row select two overlapping profiles with differing values | each field merged in its table direction (max, min or union); sources reported per field; Compare labels match the table |
| TEST-PS-145-09.T16 | unit | PS-145-02.R02 | select an untrusted profile, a retired profile and 4 profiles | GOVERNANCE_PROFILE_UNTRUSTED, CONFLICT_STATE and VALIDATION_FAILED; selection unchanged |
| TEST-PS-145-09.T17 | abuse | PS-145-02.R04 | KP releases a restriction change without a proposal and a new code differing from generic without a proposal, both delivered to U; a new code equal to generic | first two held pending (decision_unavailable) with GOVERNANCE_PROFILE_PROPOSAL_REQUIRED, not applied, and the previous version stays in force; the generic-equal profile accepted without a decision |
| TEST-PS-145-09.T22 | integration | PS-145-02.R04, PS-145-04.R03 | vault offline 45 days receives eu_de version 4 released 40 days ago; fresh vault receives version 3 whose decision is a year old and was anchored 2 days before its release receipt | both versions apply because asOf is the anchored release time (or the claimed release time labelled as a claim), never the receiving vault clock |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [domain_schema.md](domain_schema.md).
