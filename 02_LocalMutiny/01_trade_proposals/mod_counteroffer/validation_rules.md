# PS-012-02 — Validation rules: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-02.R01** A revision is accepted locally only if its number, chain, author role, turn, size, hash and signature all verify.
- **PS-012-02.R02** Cycle revisions may change money terms, quotes and deadlines but never participants or items.
- **PS-012-02.R03** Every violation maps to exactly one stable code and the offending statement is quarantined with that code rather than discarded.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | revisionNo equals head revisionNo + 1 and revisionNo ≤ 20, and prev equals head contentHash | MUTINY_REVISION_LIMIT |
| V02 | authorId is a party of the subject in the roster (F02.S01.M02) | MUTINY_REVISION_AUTHOR_INVALID |
| V03 | for trade_proposal the author differs from the author of the head revision (turn-taking); for cycle the author is the coordinator | MUTINY_REVISION_TURN |
| V04 | snapshot size ≤ 65536 bytes and contentHash equals cid of JCS(snapshot) | MUTINY_REVISION_HASH_MISMATCH |
| V05 | sig verifies Ed25519 over JCS of the envelope without sig against authorId's registered device key | MUTINY_STATEMENT_SIGNATURE_INVALID |
| V06 | subject is open (trade_proposal draft or open; cycle proposed) | CONFLICT_STATE |
| V07 | for subjectType cycle the party set and legIds equal the head revision's | MUTINY_REVISION_MATERIAL_FORBIDDEN |
| V08 | every legId and compensationLegId exists, belongs to the subject and is not voided | MUTINY_REVISION_REFERENCE_INVALID |
| V09 | consentDeadline between local now + 1 h and now + 7 d (trade_proposal up to 14 d) and executionWindowMs in range | MUTINY_DEADLINE_INVALID |
| V10 | createdAtClaim is not more than 5 minutes after the local clock | MUTINY_STATEMENT_FROM_FUTURE |
| V11 | no other non-forked revision with the same subject and revisionNo and a different contentHash exists | MUTINY_REVISION_FORK |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T01 | unit | PS-012-01.R01, PS-012-01.R02, PS-012-02.R02 | create revision 1 then verify stored fields | snapshot, contentHash and sig immutable; hash equals independent JCS cid |
| TEST-PS-012-09.T02 | unit | PS-012-02.R01, PS-012-02.R03 | each rule V01..V11 violated in turn | documented code returned and nothing stored |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
