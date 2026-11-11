# PS-079-09 — Contract and acceptance tests: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-09.R01** Every requirement is covered by at least one automated test.
- **PS-079-09.R02** Sweeps are tested with a controllable clock and stub purge ports for every record kind.
- **PS-079-09.R03** Separation of duties and fail-closed hold checks are tested with adversarial scenarios.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault and relay with records in each class aged 0, 1, 31, 731 and 366 days; stub purge ports; operators A, B and C; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T01 | unit | PS-079-01.R01, PS-079-02.R01, PS-079-01.R03 | set durations at, below and above class bounds | in-bound accepted; out-of-bound VALIDATION_FAILED; defaults EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365 |
| TEST-PS-079-09.T02 | unit | PS-079-01.R02, PS-079-02.R02 | hold requested with personal data in reference; user tries to change AUDIT | VALIDATION_FAILED and FORBIDDEN |
| TEST-PS-079-09.T03 | unit | PS-079-02.R02, PS-079-03.R01 | A requests, A approves; B approves; B then requests release and B approves it | self approvals refused with PRIVACY_HOLD_SELF_APPROVAL; second operator approvals succeed |
| TEST-PS-079-09.T04 | integration | PS-079-03.R03, PS-079-03.R02 | 72 h without approval; policy change | hold lapses; policy revision effective at next sweep |
| TEST-PS-079-09.T05 | integration | PS-079-02.R03, PS-079-03.R02 | sweep with records at each age and one under active hold; one record kind without port | expired records purged, held record untouched, missing port reported skipped_unregistered |
| TEST-PS-079-09.T06 | property | PS-079-03.R01 | random hold command sequences | only declared transitions succeed; terminal states have no exits |
| TEST-PS-079-09.T07 | contract | PS-079-04.R01, PS-079-04.R02, PS-079-04.R03, PS-079-09.R02 | execute each command and query in vault and relay forms | outputs and events validate against registry schemas; purged events contain counts only |
| TEST-PS-079-09.T08 | integration | PS-079-04.R03, PS-079-02.R03 | federation.tombstone.applied for a held and a non-held record | held sealed and not served; non-held purged within 24 h |
| TEST-PS-079-09.T09 | abuse | PS-079-05.R01, PS-079-05.R02, PS-079-05.R03 | member calls relay hold commands; vault called with hold command; user asks for hold status | FORBIDDEN or not exposed; generic notice only |
| TEST-PS-079-09.T10 | chaos | PS-079-06.R02, PS-079-06.R03 | kill sweep mid-run and corrupt the hold table read | resume from cursor without double count; purge of affected subjects skipped |
| TEST-PS-079-09.T11 | integration | PS-079-06.R01 | replay of Idempotency-Key and vault command ID; vault offline sweep | original results; offline sweep completes |
| TEST-PS-079-09.T12 | abuse | PS-079-07.R02, PS-079-07.R03 | 11 hold requests in a day by one operator; check audit entries | 11th RATE_LIMITED; every step audited with actor |
| TEST-PS-079-09.T13 | integration | PS-079-07.R01, PS-079-07.R03 | inspect run records and logs | counts and kinds only; no record contents |
| TEST-PS-079-09.T14 | load | PS-079-08.R01, PS-079-08.R02, PS-079-08.R03 | 50 000 relay rows and 20 000 vault rows | relay ≤ 60 s, vault ≤ 10 s with no main-thread block over 50 ms; overdue alert fires when last sweep is 26 h old |
| TEST-PS-079-09.T15 | unit | PS-079-09.R01, PS-079-09.R03 | traceability tool run | every PS-079 requirement maps to a passing test |
| TEST-PS-079-09.T16 | integration | PS-079-10.R01, PS-079-10.R02, PS-079-10.R03 | export vault policies, import into fresh vault, restore relay from backup, roll back one release | policies round-trip; holds restore with status; unknown hold subjects stay sealed |

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- No hold can be activated or released by one person alone.
- Active holds are never violated by any sweep or tombstone handler, and holds never alter a vault.
- Every record kind has a registered purge port or the build fails.

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
