# PS-090-03 — Workflow state machine: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-03.R01** A move advances prepared, announced and effective and may be cancelled only before it becomes effective.
- **PS-090-03.R02** The redirect and the switch of the author's fetch hints start only at effective, never at announce, and no acceptance rule depends on them.
- **PS-090-03.R03** Closed and cancelled are terminal; a later move creates a new record.
- **PS-090-03.R04** Conflicting move statements for one subject open a commitment conflict in F11.S02.M03 through detect, hold both moves and activate no redirect until the conflict is resolved.

## Specification

### MigrationRecord lifecycle

Initial **prepared**; terminal **cancelled**, **closed**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| prepared -> announced | federation.migration.announce signed with a device key active ≥ 24 h, copy step ≥ 99 percent | produces classrup.federation.move/v1 through F11.S01.M02 publish and queues it to old relay, new relay and peers |
| prepared -> announced | federation.migration.receive_move of a verified observed move | effectiveAt computed on this receiver's clock (V04, V08); conflicting moves call federation.conflict.detect and set conflictId |
| prepared -> cancelled | federation.migration.cancel, or this module's DeletionPort sign step at deletion execution (never on privacy.deletion.requested) | no statement |
| announced -> effective | this receiver's effectiveAt reached with no valid veto, the signer key still active on re-check (V01) and no open conflict for the subject | emits federation.account.moved; old relay starts redirect for 180 days |
| announced -> cancelled | valid veto from another device key of the subject, cancel by the signer, signer key revoked before effectiveAt, federation.conflict.resolved drop_all for the subject, or this module's DeletionPort sign step at deletion execution for an own move | produces classrup.federation.move_cancel/v1 for own moves, in the deletion case signed before any key is revoked |
| effective -> closed | redirectUntil reached | old relay removes redirect |

```mermaid
stateDiagram-v2
  [*] --> prepared
  prepared --> announced: federation.migration.announce signed with a device key active ≥ 24 h, copy step ≥ 99 percent
  prepared --> announced: federation.migration.receive_move of a verified observed move
  prepared --> cancelled: federation.migration.cancel, or this module's DeletionPort sign step at deletion execution (never on privacy.deletion.requested)
  announced --> effective: this receiver's effectiveAt reached with no valid veto, the signer key still active on re-check (V01) and no open conflict for the subject
  announced --> cancelled: valid veto from another device key of the subject, cancel by the signer, signer key revoked before effectiveAt, federation.conflict.resolved drop_all for the subject, or this module's DeletionPort sign step at deletion execution for an own move
  effective --> closed: redirectUntil reached
  cancelled --> [*]
  closed --> [*]
```

### Timeouts and scheduled transitions

- Veto window 24 h from this receiver's window start (own clock, first verified receipt or old relay receipt); sweep every 5 min promotes announced records whose effectiveAt ≤ now after re-checking the signer key.
- Redirect expiry sweep daily closes effective records with redirectUntil ≤ now.
- Prepared records idle for 14 days are cancelled.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T04 | integration | PS-090-03.R01, PS-090-03.R02 | veto from K2 at 23 h 59 min and at 24 h 01 min after this receiver's first receipt | first cancels the move; second ignored; redirect inactive after cancel |
| TEST-PS-090-09.T05 | property | PS-090-03.R01, PS-090-03.R03 | random command sequences on one record | only declared transitions succeed; cancelled and closed never change |
| TEST-PS-090-09.T06 | integration | PS-090-03.R02, PS-090-04.R03 | observer R3 receives a move before and after its local effectiveAt | fetch hints and redirect switch only after effective; F11.S01.M02 accepts P's records from R2 both before and after, on signature alone |
| TEST-PS-090-09.T13 | abuse | PS-090-03.R01 | replay of an old move statement after a newer effective move | rejected by cid dedup and the cool-down; no move back |
| TEST-PS-090-09.T17 | a11y | PS-090-03.R01 | operate wizard, countdown and veto prompt by keyboard and screen reader | steps announced in order prepared, announced, effective; countdown text milestones announced; targets ≥ 44 px |
| TEST-PS-090-09.T23 | integration | PS-090-04.R04, PS-090-03.R04 | two moves for P with different targets reach V3 | federation.conflict.detect called with statementClass commitment and subjectRef move:P; both held with no redirect; a drop_all resolution cancels both |
| TEST-PS-090-09.T26 | integration | PS-090-07.R05, PS-090-03.R01 | privacy.deletion.requested with a prepared own migration, then privacy.deletion.cancelled; a second request with an announced own move, then execution | copy and announce refused with PRIVACY_DELETION_PENDING while pending and nothing signed, cancelled or sent; after cancel copy and announce succeed; at execution the DeletionPort sign step cancels the move and signs move_cancel before the revoke_keys step |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
