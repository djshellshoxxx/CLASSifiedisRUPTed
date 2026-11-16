# PS-077-04 — Commands, queries and events: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-04.R01** Request and cancel are vault commands; execution is driven by an internal sweep and is not a user command; the relay command privacy.deletion.relay_apply serves operators' relays that receive the signed deletion statement.
- **PS-077-04.R02** Execution produces signed statements classrup.privacy.deletion_request/v1 (to relays), classrup.privacy.deletion_notice/v1 (to counterparties) and classrup.federation.tombstone/v1 (per published record).
- **PS-077-04.R03** The module consumes commitment-closing events to end deferral and never accepts a request to shorten the grace period.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.deletion.request` | privacy.deletion.request | [vault command, local; statements are produced at execution] { confirmText, keepEvidence?: boolean (default true) } | { requestId, status: pending_grace, graceEndsAt, summaryPlan } | UNAUTHENTICATED, VALIDATION_FAILED, PRECONDITION_FAILED | privacy.deletion.requested | yes (Idempotency-Key) |
| `privacy.deletion.cancel` | privacy.deletion.cancel | [vault command, local] { requestId, expectedRevision } | { requestId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `privacy.deletion.relay_apply` | privacy.deletion.relay_apply | [relay command] signed statement classrup.privacy.deletion_request/v1 { did, requestId, signedAt, tombstones?: cid[] up to 100 per batch } | { accepted: boolean, purgedCount, heldCount } | VALIDATION_FAILED, PRIVACY_DELETION_STATEMENT_INVALID, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.deletion.get` | privacy.deletion.read | { requestId? } | { request: DeletionRequest, blockers[], relayStates[] } | NOT_FOUND |
| `privacy.deletion.preview` | privacy.deletion.read | no parameters (empty object) | { perModule: [{moduleId, willDelete, willPseudonymize, cannotRecall}], relays: string[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.deletion.requested` | P3 | { requestId, graceEndsAt, keepEvidence } |
| `privacy.deletion.completed` | P1 | { requestId, pseudonym, tombstoneCount, completedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.completed` | re-evaluate blockers of a deferred request; execute when none remain |
| `mutiny.cycle.cancelled` | re-evaluate blockers of a deferred request |
| `commerce.deal.completed` | re-evaluate blockers of a deferred request |
| `commerce.dispute.resolved` | re-evaluate blockers of a deferred request |
| `rentals.rental.closed` | re-evaluate blockers of a deferred request |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_DELETION_STATEMENT_INVALID | 422 | no | relay deletion statement has an invalid signature, signer or freshness |
| PRIVACY_DELETION_PENDING | 409 | no | a deletion request is active; publishing and new commitments are refused |
| PRIVACY_DELETION_GRACE_ACTIVE | 409 | no | the 14-day grace period has not ended |
| PRIVACY_DELETION_DEFERRAL_LIMIT | 409 | no | deferral cannot exceed 30 days beyond the grace period |
| PRIVACY_DELETION_PLAN_MISSING | 500 | no | a registered module has no deletion plan; build and CI must fail for this |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command privacy.deletion.request { "confirmText": "quiet-otter-42", "keepEvidence": true }
=> { "requestId": "0192f3e0-…", "status": "pending_grace", "graceEndsAt": "2026-11-18T10:00:00.000Z",
     "summaryPlan": { "pseudonymize": ["commerce.deals", "commerce.receipts"], "delete": ["bazaar.listings", "comms.messages"], "relays": ["relay.example.org"] } }
day 14: executing -> tombstones queued (prepared) -> pseudonymize -> crypto-shred -> keys destroyed -> completed, pseudonym del-7q3k9m2x4t8w5r1c
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T06 | contract | PS-077-04.R01, PS-077-04.R02, PS-077-04.R03, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | statements, tombstones and events validate against registry schemas |
| TEST-PS-077-09.T07 | integration | PS-077-04.R02, PS-077-07.R01 | complete deletion with keepEvidence true then false | true keeps pseudonymized evidence and deletes content; false also purges own evidence copies; pseudonym stable across modules |

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
