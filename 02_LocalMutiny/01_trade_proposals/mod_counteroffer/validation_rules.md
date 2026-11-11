# PS-012-02 — Validation rules: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-02.R01** A revision is accepted locally only if its number, chain, author role, turn, size, hash and signature all verify.
- **PS-012-02.R02** Cycle revisions may change money terms, quotes and deadlines but never participants or items.
- **PS-012-02.R03** Every violation maps to exactly one stable code and the offending statement is quarantined with that code rather than discarded.
- **PS-012-02.R04** Ingest runs the number checks in a fixed order after V04 (hash) and V05 (signature): V01 limit, V12 duplicate, V11 fork, V13 gap, V14 chain, then V02, V03 and V06..V10, so a concurrent same-number revision is always detected as a fork and an early arrival is buffered, never rejected.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | revisionNo is 1..20; revisionNo > 20 is refused and the parties must start a new subject | MUTINY_REVISION_LIMIT |
| V02 | authorId is a party of the subject in the roster (F02.S01.M02) | MUTINY_REVISION_AUTHOR_INVALID |
| V03 | for trade_proposal the author differs from the author of the head revision (turn-taking); for cycle the author is the coordinator | MUTINY_REVISION_TURN |
| V04 | snapshot size ≤ 65536 bytes and contentHash equals the cid of JCS({subjectType, subjectId, revisionNo, prev, authorId, snapshot}) | MUTINY_REVISION_HASH_MISMATCH |
| V05 | sig verifies Ed25519 over JCS of the envelope without sig against authorId's registered device key | MUTINY_STATEMENT_SIGNATURE_INVALID |
| V06 | subject is open (trade_proposal draft or open; cycle proposed) | CONFLICT_STATE |
| V07 | for subjectType cycle the party set and legIds equal the head revision's | MUTINY_REVISION_MATERIAL_FORBIDDEN |
| V08 | every legId and compensationLegId exists, belongs to the subject and is not voided | MUTINY_REVISION_REFERENCE_INVALID |
| V09 | consentDeadline between local now + 1 h and now + 7 d for cycle or now + 14 d for trade_proposal; when normalizationId is present (more than one currency) consentDeadline ≤ now + 24 h and ≤ the record's earliestQuoteExpiry (N16), otherwise a quote_refresh revision with fresh consent is required; executionWindowMs in 86400000..1987200000 and (consentDeadline − now) + executionWindowMs ≤ 2592000000 | MUTINY_DEADLINE_INVALID |
| V10 | createdAtClaim is not more than 5 minutes after the local clock | MUTINY_STATEMENT_FROM_FUTURE |
| V11 | revisionNo ≤ head revisionNo with a contentHash different from the stored revision of that number is a fork: both are kept with forked true, mutiny.revision.forked is emitted and the subject is frozen | MUTINY_REVISION_FORK |
| V12 | revisionNo ≤ head revisionNo with the same contentHash as the stored revision is a duplicate; it is acknowledged and skipped (EVT-3) | MUTINY_REVISION_DUPLICATE |
| V13 | revisionNo > head revisionNo + 1 is buffered for at most 24 h on the local clock until the missing revisions arrive, then quarantined | MUTINY_REVISION_GAP |
| V14 | revisionNo = head revisionNo + 1 requires prev equal to the head contentHash (absent only for revision 1) | MUTINY_REVISION_CHAIN_INVALID |
| V15 | acceptedImbalances entries name parties of the subject, at most one per party, with maxAmount ≥ 0 in the settlement currency | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T01 | unit | PS-012-01.R01, PS-012-01.R02, PS-012-02.R02 | create revision 1 then verify stored fields | snapshot, contentHash and sig immutable; hash equals independent JCS cid |
| TEST-PS-012-09.T02 | unit | PS-012-02.R01, PS-012-02.R03 | each rule V01..V15 violated in turn, including a cross-currency deadline of 25 h and 14 d consent plus 23 d execution window | documented code returned and nothing stored |
| TEST-PS-012-09.T10 | abuse | PS-012-02.R02, PS-012-02.R03 | tampered snapshot with unchanged hash; replayed older revision; swapped participant in cycle revision | MUTINY_REVISION_HASH_MISMATCH, MUTINY_REVISION_DUPLICATE or fork, MUTINY_REVISION_MATERIAL_FORBIDDEN |
| TEST-PS-012-09.T11 | abuse | PS-012-02.R01 | createdAtClaim 6 minutes in the future and backdated | first quarantined, second accepted but not used for ordering or deadline |
| TEST-PS-012-09.T19 | integration | PS-012-02.R04, PS-012-01.R03 | same-number concurrent revision, revision 5 before 4, exact duplicate, wrong prev | fork detected (not MUTINY_REVISION_LIMIT); 5 buffered with MUTINY_REVISION_GAP and applied after 4; duplicate skipped; MUTINY_REVISION_CHAIN_INVALID |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
