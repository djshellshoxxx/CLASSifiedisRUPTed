# PS-077-04 — Commands, queries and events: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-04.R01** Request and cancel are vault commands; execution is driven by an internal sweep and is not a user command; the relay command privacy.deletion.relay_apply serves relays that receive the signed deletion statement, and privacy.deletion.assert_not_pending and privacy.deletion.ledger_check are in-process guard queries.
- **PS-077-04.R02** Execution produces the signed statements classrup.privacy.deletion_statement/v1 (to relays) and classrup.privacy.deletion_notice/v1 (end-to-end encrypted to the counterparties of open commitments and, as one departure notice, to every thread counterparty) and orchestrates classrup.federation.tombstone/v1 per published record through the F11.S01.M02 DeletionPort step; all are signed before any key is revoked or destroyed.
- **PS-077-04.R03** The module consumes commitment-closing and commitment-cancelling events to end deferral and never accepts a request to shorten the grace period.
- **PS-077-04.R04** DeletionPort is defined in the note with typed methods, step order, error semantics and a CI conformance check, and open commitments are reported as blockers by plan().
- **PS-077-04.R05** privacy.deletion.requested permits only reversible actions, privacy.deletion.cancelled tells consumers to undo them, and privacy.deletion.completed is a notification only on which consumers must not sign, pseudonymize or call relays.
- **PS-077-04.R06** DeletionPort registrations are discovered through the kernel port registry at vault composition, by inverted registration for modules that cannot list this module in depends_on without closing a cycle (F07.S01.M01, F15.S01.M01 platform.outbox, F15.S04.M03 platform.local_settings); a module registered twice fails composition and every registrant takes part in the fixed step order.
- **PS-077-04.R07** The sign step runs every registered sign implementation before revoke_keys and destroy_keys, including F07.S01.M01 signed handle releases, the tombstone of its own identity document and session revocations on relays, the F08 signed message and attachment deletes and mailbox closes, and this module's departure notice to the thread counterparties that the F08 plans list.

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

**Note:** DeletionPort (N6; defined here, implemented by every module that owns user data and registered at vault composition): plan(ctx{requestId, did, keepEvidence}) -> {moduleId, willDelete: string[], willPseudonymize: string[], blockers: [{kind: deal|cycle|booking|reservation|rental|auction|dispute, ref, counterparties: did[]}], noticeRecipients?: [{did, mailboxId, relayId}] (thread counterparties, listed by F08.S01.M02), steps: step[]}; execute(ctx{requestId, step, signer (available only in sign and revoke_keys), outbox}) -> {done: boolean, counts}, idempotent per (requestId, moduleId, step); pseudonymize(ctx{requestId, pseudonym}) -> {count}, replacing the principal's did by the pseudonym in retained evidence. Steps run in this order across all modules - sign (each module signs the statements and signed relay requests it needs, for example F11.S01.M02 tombstones, F10.S01.M01 consent withdrawals, F07.S01.M01 handle releases, the tombstone of its own identity document and session revocations on relays, the F08 signed message deletes (F08.S01.M01), attachment deletes (F08.S01.M03) and mailbox closes, and this module's deletion statements and notices), revoke_keys (F07.S01.M01 signs classrup.security.keyrevocation/v1 for every registered device key with reason account_deleted and the list of final statement cids it still vouches for), pseudonymize, shred (F10.S01.M03 export bundles, blob keys of every module), purge, destroy_keys (F07.S01.M01 only, last). A step error with DEPENDENCY_UNAVAILABLE or INTERNAL counts as one failed attempt; a missing or invalid plan is PRIVACY_DELETION_PLAN_MISSING. CI conformance check - every module whose catalog entry owns user-data entities registers a DeletionPort, and a contract test runs plan, execute and pseudonymize on its fixtures twice with identical results and asserts that no consumer of privacy.deletion.requested purges or tombstones and no consumer of privacy.deletion.completed signs or pseudonymizes. F11.S01.M02 and the delivery modules are reached through their registered ports and the sync outbox (F15.S01.M01) rather than depends_on, because they already depend on this module transitively through F07.S02.M01. Registry - every DeletionPort is registered in the kernel port registry at vault composition; F07.S01.M01, F15.S01.M01 (platform.outbox) and F15.S04.M03 (platform.local_settings) register by inverted registration because this module already depends on them or on a module that depends on them, and the F15.S01.M01 purge step moves the entries that this deletion's sign step queued and that still await delivery to the residue outbox instead of deleting them. Modules that keep RET-EVIDENCE, for example F11.S01.M02 provenance, F11.S02.M03 conflict records and F11.S03.M03 migration records, pseudonymize in the pseudonymize step, the only call that receives the pseudonym; privacy.deletion.completed carries no pseudonym and is never a pseudonymization trigger (N6a). Statements (N2, registered with F11.S01.M01 roleFor) - classrup.privacy.deletion_statement/v1, signer role principal (a registered device key of the did, the envelope author), audience one relay (payload relayId), payload exactly {requestId, relayId, signedAt, batch {index, total}, tombstones: cid[] ≤ 100}, signed once in the sign step; classrup.privacy.deletion_notice/v1, signer role principal (the deleted did is the envelope author, FED-7, and is never repeated in the payload), in two kinds - commitment, receivers the counterparties of the listed commitment (the party DIDs carried by the commitment), payload exactly {requestId, signedAt, kind: commitment, commitmentRef {type, id}, effectiveAt, recourse: dispute|recovery|none}; and departure, one notice signed once and sealed separately to the mailbox key of every thread counterparty in the noticeRecipients of the F08 plans, payload exactly {requestId, signedAt, kind: departure, effectiveAt, recourse: none}, so the account_deleted revocation lists a single departure cid however many threads exist; both encrypted end-to-end to the receivers' mailbox keys (PRV-5). Residue outbox - at completion the sync outbox entries still awaiting delivery move to the residue store and F15.S01.M01 keeps delivering them whenever the PWA is open on this origin, for 30 days after signing; no key is needed because every entry is already signed. relay_apply runs as the relay-system actor, calls privacy.legal_hold.check and the relay purge path of F10.S01.M02 (RetentionPurgePort purgeSubject) for the author and each listed tombstone. Own ports - ExportSectionPort section privacy.deletion (F10.S01.M03), RetentionPurgePort kinds privacy.deletion_request (RET-EVIDENCE, anchorField completedAt) and privacy.deletion_ledger (180 days, anchorField ledgerUntil) with F10.S01.M02; every field classified with F10.S02.M02.

### Example

```
vault command privacy.deletion.request { "confirmText": "quiet-otter-42", "keepEvidence": true }
=> { "requestId": "0192f3e0-…", "status": "pending_grace", "graceEndsAt": "2026-11-18T10:00:00.000Z",
     "summaryPlan": { "pseudonymize": ["commerce.deals", "commerce.receipts"], "delete": ["bazaar.listings", "comms.messages"], "relays": ["relay:3fz7hq2wkmpd5ra6t4ncxb7ygu"], "threadCounterparties": 63 } }
query privacy.deletion.assert_not_pending { "capability": "bazaar.listing.publish" } => PRIVACY_DELETION_PENDING { "params": { "requestId": "0192f3e0-…" } }
day 14: executing -> sign (tombstones, consent withdrawals, handle releases, identity document tombstone, relay session revocations,
  message and attachment deletes, mailbox closes, deletion statements, commitment notices, one departure notice; prepared) -> revoke_keys -> pseudonymize -> shred -> purge
  -> destroy_keys -> completed, pseudonym del-7q3k9m2x4t8w5r1c; residue keeps the ledger entry and the outbox entries until delivered
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T06 | contract | PS-077-01.R01, PS-077-01.R05, PS-077-04.R01, PS-077-04.R02, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | entity, statements, tombstones and events validate against registry schemas; deletion_statement and deletion_notice payloads contain exactly the allowlisted fields |
| TEST-PS-077-09.T14 | unit | PS-077-09.R01, PS-077-09.R03, PS-077-02.R02, PS-077-04.R04 | traceability tool run and the DeletionPort CI conformance check with a module without a port and one whose execute differs between runs | every PS-077 requirement maps to a passing test; build fails for a module without a plan or with non-idempotent steps |
| TEST-PS-077-09.T19 | integration | PS-077-04.R03, PS-077-04.R05 | deferred request with each of the nine commitment events; consumer doubles of requested that try to purge and of completed that try to sign; cancel during grace | blockers re-evaluated on each event; the purging and signing doubles fail the conformance check; after cancel privacy.deletion.cancelled undoes hide and pause, consents are unchanged and no outbox entry exists for any relay or counterparty |
| TEST-PS-077-09.T20 | integration | PS-077-03.R03, PS-077-04.R04 | execution with recording stub ports for F11.S01.M02, F10.S01.M01, F07.S01.M01 and a blob module | every sign step (tombstones, consent withdrawals, deletion statements, notices) runs before revoke_keys, nothing is signed after it, destroy_keys runs last, and F11.S01.M02 issues tombstones only at execution |
| TEST-PS-077-09.T25 | integration | PS-077-01.R06, PS-077-02.R05, PS-077-04.R02 | deletion with 40 threads and 63 thread counterparties listed by an F08.S01.M02 plan double, one open cycle and a notice addressed to a did that no plan listed | one departure notice signed once and sealed to 63 mailboxes under one cid, payload {requestId, signedAt, kind, effectiveAt, recourse}; the cycle gets a commitment notice; the unlisted recipient is refused with VALIDATION_FAILED; the account_deleted revocation lists the departure cid |
| TEST-PS-077-09.T26 | integration | PS-077-04.R06, PS-077-04.R07, PS-077-03.R03 | execution with stub registrants in the kernel port registry for F07.S01.M01, F08.S01.M01, F08.S01.M03, F15.S01.M01 and F15.S04.M03 and recording order | F07 handle releases, identity document tombstone and relay session revocations, F08 message and attachment deletes and mailbox closes all run in sign before revoke_keys and destroy_keys; F15.S01.M01 moves pending signed entries to the residue outbox; F15.S04.M03 local settings are purged; no registrant needs a depends_on edge to this module |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
