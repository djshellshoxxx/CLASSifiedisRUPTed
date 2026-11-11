# PS-030-04 — Commands, queries and events: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-04.R01** The module exposes vault commands open, withdraw and receive; open produces the signed notice statement and calls the F09.S02.M02 case port (the single case-creation path) in the same vault transaction.
- **PS-030-04.R02** services.dispute.opened and services.dispute.closed are local events; they leave the device only as the signed dispute notice and dispute withdrawal statements, and an opened event derived from a received notice carries origin federated and never creates a case.
- **PS-030-04.R03** The module consumes F09 case events to link, resolve and close; it never writes to the DisputeCase except through the open and withdraw ports.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.dispute.open` | services.dispute.open | [statement classrup.services.dispute_notice/v1 signed by opener, E2E encrypted to counterparty; calls F09.S02.M02 commerce.dispute.open {contextRef: {type: booking, id: bookingId}, reason mapped from scope, description, respondentIds [counterparty], serviceScope {scope, scopeKey, milestoneId?}, idempotencyRef: linkId}] { bookingId, milestoneId?, scope, statement, extraEvidence? } | { linkId, state: linked \| pending_link, disputeCaseId?, evidenceCount, noticeCid, syncState } | NOT_FOUND, FORBIDDEN, VALIDATION_FAILED, SERVICES_DISPUTE_WINDOW_CLOSED, SERVICES_DISPUTE_DUPLICATE, SERVICES_DISPUTE_LIMIT, SERVICES_DISPUTE_NOT_ELIGIBLE, RATE_LIMITED | services.dispute.opened | yes (Idempotency-Key) |
| `services.dispute.withdraw` | services.dispute.withdraw | [statement classrup.services.dispute_withdrawal/v1 signed by the opener, E2E encrypted to counterparty; for a linked link also calls F09.S02.M02 commerce.dispute.withdraw] { linkId, expectedRevision } | { linkId, revision, state: withdrawn, withdrawalCid } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | services.dispute.closed | yes (Idempotency-Key) |
| `services.dispute.receive` | services.dispute.receive | [vault-local ingestion of an inbound dispute_notice or dispute_withdrawal envelope per CTR-FED-001; re-validated against this vault's records and clock] { envelope, via? } | { accepted: boolean, quarantined?: boolean, linkId?, code? } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, SERVICES_DISPUTE_DUPLICATE, SERVICES_DISPUTE_WINDOW_CLOSED, SERVICES_DISPUTE_LIMIT, SERVICES_DISPUTE_NOT_ELIGIBLE, RATE_LIMITED | services.dispute.opened, services.dispute.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.dispute.get` | services.dispute.read_own | [vault-local] { linkId } | { link: ServiceDisputeLink, allowedNextSteps: [mutual_cancellation \| new_refund_deal \| none] } | NOT_FOUND |
| `services.dispute.preview_evidence` | services.dispute.read_own | [vault-local] { bookingId, milestoneId?, scope } | { eligible: boolean, reasonCode?, evidencePack: EvidenceRef[], windowEndsAt } | NOT_FOUND, SERVICES_DISPUTE_WINDOW_CLOSED, SERVICES_DISPUTE_NOT_ELIGIBLE |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.dispute.opened` | P2 | { linkId, bookingId, milestoneId?, scope, openerId, counterpartyId, clientId, providerId, disputeCaseId, preDisputeState, origin: local\|federated } |
| `services.dispute.closed` | P2 | { linkId, bookingId, milestoneId?, disputeCaseId?, clientId, providerId, reason: withdrawn\|link_failed\|case_withdrawn\|resolved\|merged, resolution?, outcomeType?, effect: restore\|restore_then_renegotiate\|none } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.dispute.opened` | for contextRef {type: booking, id} matching a link on (contextRef.id = bookingId, openerId) or the stored caseId, store the case id and move pending_link to linked; it never creates a link by itself |
| `commerce.dispute.resolved` | for disputeCaseId move linked to resolved, store resolution and outcomeType, and apply the resolution mapping |
| `commerce.dispute.withdrawn` | for disputeCaseId move linked to withdrawn with closeReason case_withdrawn |
| `privacy.deletion.completed` | replace the erased counterparty DID with the deletion pseudonym in retained links; notice signatures are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_DISPUTE_WINDOW_CLOSED | 409 | no | more than 30 days since the booking end, last milestone activity or cancellation |
| SERVICES_DISPUTE_DUPLICATE | 409 | no | a dispute for this scope already exists, or another dispute on this booking is open |
| SERVICES_DISPUTE_LIMIT | 409 | no | three disputes already exist for this booking |
| SERVICES_DISPUTE_NOT_ELIGIBLE | 409 | no | the booking or milestone state does not allow this scope |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2): classrup.services.dispute_notice/v1 signer role opener (client or provider of the booking); classrup.services.dispute_withdrawal/v1 signer role the opener of the referenced notice. Scope to F09 reason - not_delivered to not_received; quality to not_as_described; payment_not_received to payment_not_acknowledged; no_show to no_show; scope_change, cancellation_fee and other to other. Single case-creation path: the services.dispute.open port call in the opener vault; F09.S02.M02 must not create a case from services.dispute.opened, and an opened event with origin federated is never acted on by F09.

### Example

```
client vault services.dispute.open { "bookingId": "0192f3c0-00b1-…", "milestoneId": "5f0c2a9e-…", "scope": "not_delivered",
  "statement": "No files were delivered after the agreed date of 2027-04-05." }
-> port commerce.dispute.open { "contextRef": { "type": "booking", "id": "0192f3c0-00b1-…" }, "reason": "not_received", "idempotencyRef": "0192f3e0-0001-…", … }
-> { "linkId": "0192f3e0-0001-…", "state": "linked", "disputeCaseId": "7a1c…", "evidenceCount": 5, "noticeCid": "sha256-Dn…", "syncState": "prepared" }
provider vault: notice received and re-validated -> pending_link; commerce.dispute.opened ingested by F09 -> linked, services.dispute.opened origin federated
later: commerce.dispute.resolved resolution no_fault_close -> state resolved, services.dispute.closed effect restore in both vaults
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T02 | integration | PS-030-01.R02, PS-030-04.R01 | open dispute with 5 extra evidence references | evidence pack holds cids and hashes only; notice signed; case requested once through the port with contextRef booking, serviceScope and the link id |
| TEST-PS-030-09.T04 | integration | PS-030-03.R02, PS-030-04.R03 | each F09 outcome - no_fault_close accepted by both and mediator-only, refund_claimed, return_agreed, enforcement_referral, lapsed - and commerce.dispute.withdrawn, each delivered twice | link resolved or withdrawn once; resolution stored; services.dispute.closed carries the mapped effect; booking and milestone back in their pre-dispute status; no obligation changed |
| TEST-PS-030-09.T05 | integration | PS-030-03.R03, PS-030-04.R02 | services.dispute.opened, then the matching commerce.dispute.resolved, consumed by the quotes and milestones modules while services.dispute.closed is emitted here | booking disputed and milestones frozen exactly once, then unfrozen exactly once; exactly one opened and one closed event per link |
| TEST-PS-030-09.T08 | contract | PS-030-04.R01, PS-030-09.R02 | each command, statement, event and F09 port call | payloads and signatures validate against registry and F09 schemas |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
