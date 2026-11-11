# PS-022-07 — Privacy, retention and abuse: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-07.R01** Other participants receive only the coarse reason (withdrew, unavailable, timeout); the finer private reason, including that a block exists, never leaves the vault.
- **PS-022-07.R02** Dropout records are retained as evidence for RET-EVIDENCE and pseudonymized if the person erases their identity locally.
- **PS-022-07.R03** Griefing by repeated withdrawals is limited by local reputation signals, recipients' quarantine of repeat withdrawers and the cap on open cycles, since no central reputation write exists.
- **PS-022-07.R04** The module registers ExportSectionPort (section mutiny.dropouts), DeletionPort and RetentionPurgePort with F10 (N6), annotates every DropoutRecord field with its F10.S02.M02 class, and on privacy.deletion.completed pseudonymizes the erased participant in retained records.

## Specification

**Data classification**
- DropoutRecord: P2; privateReason is P3 within the record and stripped from every export to other users; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE 2 years after the last related activity.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Withdrawal reason reveals a block | only publicReason is shared and blocks map to unavailable |
| T02 | Attacker claims another participant withdrew | peer withdrawal counts only if signed by that participant's key |
| T03 | Silent reroute after a dropout to keep a cycle alive | no operation changes participantIds; MUTINY_REROUTE_FORBIDDEN; a new cycle needs new consent from everyone |
| T04 | Withdrawal timed after others' handover to abuse recovery | phase is computed from verified evidence and routes to partially_executed with recovery and dispute options |
| T05 | Forged timeout to cancel others' cycles | timeouts are recorded only on the local clock for the local vault; a peer cannot make my vault cancel |
| T06 | Replay of an old withdrawal to cancel a new cycle | statement names the cycle id and revision hash, and different cycles have different ids |
| T07 | A relay forges a withdrawal or a cancellation notice | only a withdrawal signed by the participant it names counts (V04); there is no cancel statement at all, each vault cancels only from its own evidence and clock |

**Abuse controls**
- Recipients quarantine DIDs with more than 3 withdrawals in 30 days for new proposals into their vault, locally and silently.
- Local rate limit of 10 withdraw commands per day.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T07 | abuse | PS-022-03.R03, PS-022-07.R03 | attempt to add, remove or replace a participant through revision, roster or dropout calls | MUTINY_REROUTE_FORBIDDEN everywhere; participantIds unchanged |
| TEST-PS-022-09.T09 | abuse | PS-022-05.R01, PS-022-05.R02, PS-022-07.R02, PS-022-01.R02, PS-022-02.R02 | forged withdrawal for another person; other principal calls withdraw; replay on new cycle | quarantined or FORBIDDEN; replay ignored |
| TEST-PS-022-09.T10 | abuse | PS-022-07.R01, PS-022-04.R03 | local block of a participant mid-cycle | principal withdrawn with public reason unavailable; no statement or event reveals the block |
| TEST-PS-022-09.T13 | abuse | PS-022-07.R03 | participant with 4 withdrawals in 30 days proposes again | recipient vault quarantines silently |
| TEST-PS-022-09.T16 | integration | PS-022-07.R02, PS-022-07.R04 | identity erased locally; F10 export and retention sweep | section mutiny.dropouts exported; records pseudonymized and retained; privateReason stripped from exports to others; signatures still verify |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
