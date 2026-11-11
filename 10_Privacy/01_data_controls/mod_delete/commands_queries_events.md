# PS-077-04 — Commands, queries and events: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-04.R01** Request and cancel are vault commands; execution is driven by an internal sweep and is not a user command; the relay command privacy.deletion.relay_apply serves relays that receive the signed deletion statement, and privacy.deletion.assert_not_pending and privacy.deletion.ledger_check are in-process guard queries.
- **PS-077-04.R02** Execution produces the signed statements classrup.privacy.deletion_statement/v1 (to relays) and classrup.privacy.deletion_notice/v1 (end-to-end encrypted to counterparties) and orchestrates classrup.federation.tombstone/v1 per published record through the F11.S01.M02 DeletionPort step; all are signed before any key is revoked or destroyed.
- **PS-077-04.R03** The module consumes commitment-closing and commitment-cancelling events to end deferral and never accepts a request to shorten the grace period.
- **PS-077-04.R04** DeletionPort is defined in the note with typed methods, step order, error semantics and a CI conformance check, and open commitments are reported as blockers by plan().
- **PS-077-04.R05** privacy.deletion.requested permits only reversible actions, privacy.deletion.cancelled tells consumers to undo them, and privacy.deletion.completed is a notification only on which consumers must not sign, pseudonymize or call relays.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.deletion.request` | privacy.deletion.request | [vault command, local; nothing is signed until execution] { confirmText, keepEvidence?: boolean (default true) } | { requestId, status: pending_grace, graceEndsAt, summaryPlan } | UNAUTHENTICATED, VALIDATION_FAILED, PRECONDITION_FAILED | privacy.deletion.requested | yes (Idempotency-Key) |
| `privacy.deletion.cancel` | privacy.deletion.cancel | [vault command, local] { requestId, expectedRevision } | { requestId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | privacy.deletion.cancelled | yes (Idempotency-Key) |
| `privacy.deletion.relay_apply` | privacy.deletion.relay_apply | [relay command] signed statement classrup.privacy.deletion_statement/v1 { author did (envelope), requestId, relayId, signedAt, batch {index, total}, tombstones: cid[] up to 100 } | { accepted: boolean, purgedCount, someRetained: boolean } | VALIDATION_FAILED, PRIVACY_DELETION_STATEMENT_INVALID, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.deletion.get` | privacy.deletion.read | { requestId? } | { request: DeletionRequest, blockers[], relayStates[], counterpartyStates[] } | NOT_FOUND |
| `privacy.deletion.preview` | privacy.deletion.read | no parameters (empty object) | { perModule: [{moduleId, willDelete, willPseudonymize, cannotRecall}], relays: string[], thisDeviceOnly: true, otherDeviceKeys: int, recoveryKitExists: boolean } |  |
| `privacy.deletion.assert_not_pending` | privacy.deletion.guard | [vault in-process query] { capability: string (the publish or commit capability being attempted) } | { ok: true } or the error PRIVACY_DELETION_PENDING with params.requestId and params.graceEndsAt | PRIVACY_DELETION_PENDING |
| `privacy.deletion.ledger_check` | privacy.deletion.ledger_check | [in-process query of the residue store] { did } | { deleted: boolean, ledgerUntil? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.deletion.requested` | P3 | { requestId, graceEndsAt, keepEvidence } |
| `privacy.deletion.completed` | P1 | { requestId, tombstoneCount, completedAt } |
| `privacy.deletion.cancelled` | P3 | { requestId, cancelledAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.completed` | re-evaluate blockers of a deferred request; execute when none remain |
| `mutiny.cycle.cancelled` | re-evaluate blockers of a deferred request |
| `commerce.deal.completed` | re-evaluate blockers of a deferred request |
| `commerce.deal.cancelled` | re-evaluate blockers of a deferred request |
| `commerce.dispute.resolved` | re-evaluate blockers of a deferred request |
| `rentals.rental.closed` | re-evaluate blockers of a deferred request |
| `rentals.reservation.cancelled` | re-evaluate blockers of a deferred request |
| `services.booking.completed` | re-evaluate blockers of a deferred request |
| `services.booking.cancelled` | re-evaluate blockers of a deferred request |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_DELETION_STATEMENT_INVALID | 422 | no | relay deletion statement has an invalid signature, signer, audience, age or replayed content |
| PRIVACY_DELETION_PENDING | 409 | no | a deletion request is active; publishing and new commitments are refused |
| PRIVACY_DELETION_GRACE_ACTIVE | 409 | no | the 14-day grace period has not ended |
| PRIVACY_DELETION_DEFERRAL_LIMIT | 409 | no | deferral cannot exceed 30 days beyond the grace period |
| PRIVACY_DELETION_PLAN_MISSING | 500 | no | a registered module has no deletion plan; build and CI must fail for this |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** DeletionPort (N6; defined here, implemented by every module that owns user data and registered at vault composition): plan(ctx{requestId, did, keepEvidence}) -> {moduleId, willDelete: string[], willPseudonymize: string[], blockers: [{kind: deal|cycle|booking|reservation|rental|auction|dispute, ref, counterparties: did[]}], steps: step[]}; execute(ctx{requestId, step, signer (available only in sign and revoke_keys), outbox}) -> {done: boolean, counts}, idempotent per (requestId, moduleId, step); pseudonymize(ctx{requestId, pseudonym}) -> {count}, replacing the principal's did by the pseudonym in retained evidence. Steps run in this order across all modules - sign (each module signs the statements and signed relay requests it needs, for example F11.S01.M02 tombstones, F10.S01.M01 consent withdrawals, F07.S01.M01 handle releases, mailbox deletes of the F08 modules, and this module's deletion statements and notices), revoke_keys (F07.S01.M01 signs classrup.security.keyrevocation/v1 for every registered device key with reason account_deleted and the list of final statement cids it still vouches for), pseudonymize, shred (F10.S01.M03 export bundles, blob keys of every module), purge, destroy_keys (F07.S01.M01 only, last). A step error with DEPENDENCY_UNAVAILABLE or INTERNAL counts as one failed attempt; a missing or invalid plan is PRIVACY_DELETION_PLAN_MISSING. CI conformance check - every module whose catalog entry owns user-data entities registers a DeletionPort, and a contract test runs plan, execute and pseudonymize on its fixtures twice with identical results and asserts that no consumer of privacy.deletion.requested purges or tombstones and no consumer of privacy.deletion.completed signs or pseudonymizes. F11.S01.M02 and the delivery modules are reached through their registered ports and the sync outbox (F15.S01.M01) rather than depends_on, because they already depend on this module transitively through F07.S02.M01. Statements (N2, registered with F11.S01.M01 roleFor) - classrup.privacy.deletion_statement/v1, signer role principal (a registered device key of the did, the envelope author), audience one relay (payload relayId), payload exactly {requestId, relayId, signedAt, batch {index, total}, tombstones: cid[] ≤ 100}, signed once in the sign step; classrup.privacy.deletion_notice/v1, signer role principal, receivers the counterparties of the listed commitment (the party DIDs carried by the commitment), payload exactly {requestId, commitmentRef {type, id}, effectiveAt, recourse: dispute|recovery|none}, encrypted end-to-end to those counterparties' mailbox keys (PRV-5). Residue outbox - at completion the sync outbox entries still awaiting delivery move to the residue store and F15.S01.M01 keeps delivering them whenever the PWA is open on this origin, for 30 days after signing; no key is needed because every entry is already signed. relay_apply runs as the relay-system actor, calls privacy.legal_hold.check and the relay purge path of F10.S01.M02 (RetentionPurgePort purgeSubject) for the author and each listed tombstone. Own ports - ExportSectionPort section privacy.deletion (F10.S01.M03), RetentionPurgePort kinds privacy.deletion_request (RET-EVIDENCE, anchorField completedAt) and privacy.deletion_ledger (180 days, anchorField ledgerUntil) with F10.S01.M02; every field classified with F10.S02.M02.

### Example

```
vault command privacy.deletion.request { "confirmText": "quiet-otter-42", "keepEvidence": true }
=> { "requestId": "0192f3e0-…", "status": "pending_grace", "graceEndsAt": "2026-11-18T10:00:00.000Z",
     "summaryPlan": { "pseudonymize": ["commerce.deals", "commerce.receipts"], "delete": ["bazaar.listings", "comms.messages"], "relays": ["relay.example.org"] } }
query privacy.deletion.assert_not_pending { "capability": "bazaar.listing.publish" } => PRIVACY_DELETION_PENDING { "params": { "requestId": "0192f3e0-…" } }
day 14: executing -> sign (tombstones, consent withdrawals, deletion statements, notices; prepared) -> revoke_keys -> pseudonymize -> shred -> purge
  -> destroy_keys -> completed, pseudonym del-7q3k9m2x4t8w5r1c; residue keeps the ledger entry and the outbox entries until delivered
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T06 | contract | PS-077-01.R01, PS-077-01.R05, PS-077-04.R01, PS-077-04.R02, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | entity, statements, tombstones and events validate against registry schemas; deletion_statement and deletion_notice payloads contain exactly the allowlisted fields |
| TEST-PS-077-09.T14 | unit | PS-077-09.R01, PS-077-09.R03, PS-077-02.R02, PS-077-04.R04 | traceability tool run and the DeletionPort CI conformance check with a module without a port and one whose execute differs between runs | every PS-077 requirement maps to a passing test; build fails for a module without a plan or with non-idempotent steps |
| TEST-PS-077-09.T19 | integration | PS-077-04.R03, PS-077-04.R05 | deferred request with each of the nine commitment events; consumer doubles of requested that try to purge and of completed that try to sign; cancel during grace | blockers re-evaluated on each event; the purging and signing doubles fail the conformance check; after cancel privacy.deletion.cancelled undoes hide and pause, consents are unchanged and no outbox entry exists for any relay or counterparty |
| TEST-PS-077-09.T20 | integration | PS-077-03.R03, PS-077-04.R04 | execution with recording stub ports for F11.S01.M02, F10.S01.M01, F07.S01.M01 and a blob module | every sign step (tombstones, consent withdrawals, deletion statements, notices) runs before revoke_keys, nothing is signed after it, destroy_keys runs last, and F11.S01.M02 issues tombstones only at execution |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
