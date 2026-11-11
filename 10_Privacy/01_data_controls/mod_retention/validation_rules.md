# PS-079-02 — Validation rules: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-02.R01** Policy and hold input is validated strictly against schema and class bounds.
- **PS-079-02.R02** Hold approval enforces separation of duties, an admin in every requester and approver pair, unlinked DIDs and current relay roles.
- **PS-079-02.R03** Sweeps validate that every record kind has a registered purge port and that anchor times are not in the future.
- **PS-079-02.R04** A vault sweep that finds the clock more than 24 h ahead of its high-water clock, or more than 24 h ahead of the latest relay-signed receipt time, runs as a dry run and purges RET-SHORT, RET-STANDARD or RET-EVIDENCE records only after the user confirms.
- **PS-079-02.R05** A RET-SIGNAL kind is accepted only with an expiresAt anchor, a createdAt field and a registered counts-only rollup kind, and its records are purged at expiresAt or at createdAt plus 365 days, whichever comes first.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | durationDays is inside the bounds of the class | VALIDATION_FAILED |
| V02 | user override in a vault only shortens SHORT, STANDARD or EVIDENCE within bounds and never changes AUDIT | FORBIDDEN |
| V03 | jurisdictionCode refers to a profile known to F18.S01.M01 | VALIDATION_FAILED |
| V04 | hold requester holds the operator or admin role on the relay | FORBIDDEN |
| V05 | hold approver (and releaser) differs from the requester (and release requester) | PRIVACY_HOLD_SELF_APPROVAL |
| V06 | hold approved before approvalDeadline | EXPIRED |
| V07 | hold reference at most 100 code points and contains no email or phone pattern | VALIDATION_FAILED |
| V08 | at most one active or requested hold per subject on a relay | PRIVACY_HOLD_EXISTS |
| V09 | sweep cursor and batch size are at most 1000 rows per transaction and 50 000 per run | VALIDATION_FAILED |
| V10 | at least one member of each requester and approver pair, and of each release requester and releaser pair, holds the relay admin role; both hold operator or admin | FORBIDDEN |
| V11 | the two DIDs of a pair are not linked by an F07 same-owner attestation or a key rotation chain read through KeyLinkagePort (N11); an unreadable linkage fails closed | PRIVACY_HOLD_SELF_APPROVAL |
| V12 | a record whose anchor time is later than the local sweep clock is never purged and is reported as skipped_future_anchor | VALIDATION_FAILED |
| V13 | a vault sweep after a forward clock jump over 24 h beyond the high-water clock, or over 24 h ahead of the latest relay-signed receipt time, purges RET-SHORT, RET-STANDARD or RET-EVIDENCE only with confirmClockJump from the user | PRIVACY_RETENTION_CLOCK_JUMP |
| V14 | every registered RetentionPurgePort kind declares a class and an anchorField that exists in its schema and is classified by F10.S02.M02 | VALIDATION_FAILED |
| V15 | a RET-SIGNAL record kind declares anchorField expiresAt, createdField createdAt and a rollupKind registered with rollup true; its schema caps expiresAt at createdAt + 365 days; a rollup kind holds only counts per period and kind, no did, key, cid or free text | VALIDATION_FAILED |
| V16 | privacy.retention_policy.set never changes RET-SIGNAL in any scope or source, including jurisdiction overrides | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T01 | unit | PS-079-01.R01, PS-079-02.R01 | set durations at, below and above class bounds | in-bound accepted; out-of-bound VALIDATION_FAILED; defaults EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365, SIGNAL 365 |
| TEST-PS-079-09.T02 | unit | PS-079-01.R02, PS-079-02.R01 | hold requested with personal data in reference; user tries to change AUDIT | VALIDATION_FAILED and FORBIDDEN |
| TEST-PS-079-09.T03 | unit | PS-079-02.R02, PS-079-03.R01, PS-079-07.R03 | A requests and A approves; B approves A's request; C approves A's request; C requests release and C approves it; B approves C's release; D approves A's request | self and linked approvals refused with PRIVACY_HOLD_SELF_APPROVAL; operator-only pair refused with FORBIDDEN; admin-plus-operator pairs succeed |
| TEST-PS-079-09.T18 | unit | PS-079-02.R03 | sweep with a record whose anchor is 2 days in the future and a kind without a purge port | the future record is kept and counted skipped_future_anchor; the kind is reported skipped_unregistered |
| TEST-PS-079-09.T19 | unit | PS-079-02.R04, PS-079-01.R04 | clock set 3 days forward since the last sweep; clock 2 days ahead of the latest relay-signed receipt; clock set 3 days back | both forward cases run as dry runs and return PRIVACY_RETENTION_CLOCK_JUMP until confirmClockJump; the backward case purges nothing with a future anchor and does not lower the high-water clock |
| TEST-PS-079-09.T21 | abuse | PS-079-07.R03, PS-079-02.R02 | E (rotation chain of A) approves A's request; KeyLinkagePort unavailable during an approval | refused with PRIVACY_HOLD_SELF_APPROVAL in both cases (fail closed) |
| TEST-PS-079-09.T23 | integration | PS-079-01.R05, PS-079-02.R05 | sweep over the signal fixtures in a vault and on a relay, one signal record under an active hold; rollup rows aged 364 and 366 days; set RET-SIGNAL to 180 days as user, operator and jurisdiction; register a signal kind without rollupKind and one whose rollup holds a did | the expired and the 400-day records are rolled up and purged (the latter at createdAt + 365 days), the 10-day record and the held record are kept; the 366-day rollup row is purged; every set returns FORBIDDEN; both registrations fail with VALIDATION_FAILED |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
