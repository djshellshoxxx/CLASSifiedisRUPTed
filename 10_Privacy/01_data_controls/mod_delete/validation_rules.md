# PS-077-02 — Validation rules: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-02.R01** Requests are validated for fresh unlock, typed confirmation and the single-active-request rule.
- **PS-077-02.R02** Execution validates that grace has ended, that deferral limits are respected and that every registered module has a plan.
- **PS-077-02.R03** Incoming relay deletion statements are verified for signature by a registered, non-revoked key of the did (or one listed as final by its account_deleted revocation) and for replay rather than age: dedupe on (did, requestId, batch hash) and accept signedAt up to 30 days old plus 10 minutes of clock skew.
- **PS-077-02.R04** Publishing and new commitments are refused during an active request through the guard privacy.deletion.assert_not_pending, which every publishing and commitment module calls.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | vault unlocked within the last 5 minutes | UNAUTHENTICATED |
| V02 | typed confirmation equals the principal's pseudonym | VALIDATION_FAILED |
| V03 | no other deletion request is active in this vault | PRECONDITION_FAILED |
| V04 | cancel only while pending_grace or deferred | CONFLICT_STATE |
| V05 | execution starts only at or after graceEndsAt | PRIVACY_DELETION_GRACE_ACTIVE |
| V06 | deferral lasts at most 30 days beyond graceEndsAt | PRIVACY_DELETION_DEFERRAL_LIMIT |
| V07 | every registered DeletionPort module returns a plan before executing | PRIVACY_DELETION_PLAN_MISSING |
| V08 | relay statement signature valid over JCS bytes; signer is a registered key of the did in the relay key registry (F16.S02.M02) that is not revoked, or is revoked only by an account_deleted revocation listing this statement cid; payload relayId equals the receiving relay; signedAt at most 30 days old and at most 10 minutes in the future; (did, requestId, batch hash) not already applied with different content | PRIVACY_DELETION_STATEMENT_INVALID |
| V09 | privacy.deletion.assert_not_pending - no request is pending_grace, deferred, executing or failed in this vault | PRIVACY_DELETION_PENDING |
| V10 | a DeletionPort step starts only after every lower-order step of every module is done (sign, revoke_keys, pseudonymize, shred, purge, destroy_keys) | CONFLICT_STATE |
| V11 | a relay_apply batch has at most 100 tombstone cids and its batch index is within total | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-02.R01, PS-077-07.R03 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T03 | unit | PS-077-02.R02, PS-077-03.R02 | commitments open at day 14, then clear at day 20, then limit reached | deferred then executing; at day 44 execution proceeds with notices sent |
| TEST-PS-077-09.T08 | abuse | PS-077-02.R03, PS-077-05.R01, PS-077-05.R02, PS-077-05.R03 | relay_apply with a statement signed by another did; operator tries to start deletion; suspended on a relay; user reads the relay result | rejected or FORBIDDEN; deletion by owner still allowed; result carries someRetained without a count |
| TEST-PS-077-09.T12 | abuse | PS-077-02.R04 | publish a listing, open a deal, commit a cycle, book a service and reserve a rental during grace through module doubles that call the guard | each refused with PRIVACY_DELETION_PENDING |
| TEST-PS-077-09.T14 | unit | PS-077-09.R01, PS-077-09.R03, PS-077-02.R02, PS-077-04.R04 | traceability tool run and the DeletionPort CI conformance check with a module without a port and one whose execute differs between runs | every PS-077 requirement maps to a passing test; build fails for a module without a plan or with non-idempotent steps |
| TEST-PS-077-09.T17 | abuse | PS-077-02.R03 | relay_apply with a statement signed 31 days ago, a replayed batch with changed content, a statement signed by a key revoked for compromise, and a valid statement delivered on day 3 after the account_deleted revocation | first three PRIVACY_DELETION_STATEMENT_INVALID; an exact replay is a no-op; the day-3 statement is accepted because the revocation lists its cid |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
