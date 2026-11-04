# PS-030-04 — Commands, queries and events: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-04.R01** The module exposes vault commands open, withdraw and receive_notice; open produces the signed notice statement and calls the F09 case port in the same vault transaction.
- **PS-030-04.R02** services.dispute.opened is a local event; it leaves the device only as the signed dispute notice.
- **PS-030-04.R03** The module consumes F09 case events to link and resolve; it never writes to the DisputeCase itself.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.dispute.open` | services.dispute.open | [statement classrup.services.dispute_notice/v1 signed by opener, E2E encrypted to counterparty; calls F09.S02.M02 case open port] { bookingId, milestoneId?, scope, statement, extraEvidence? } | { linkId, state: pending_link, evidenceCount, noticeCid, syncState } | NOT_FOUND, FORBIDDEN, VALIDATION_FAILED, SERVICES_DISPUTE_WINDOW_CLOSED, SERVICES_DISPUTE_DUPLICATE, SERVICES_DISPUTE_LIMIT, RATE_LIMITED | services.dispute.opened | yes (Idempotency-Key) |
| `services.dispute.withdraw` | services.dispute.withdraw | [vault-local plus withdrawal note inside the notice thread] { linkId, expectedRevision } | { linkId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `services.dispute.receive` | services.dispute.receive | [vault-local ingestion of an inbound dispute_notice envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, linkId?, code? } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, SERVICES_DISPUTE_DUPLICATE | services.dispute.opened | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.dispute.get` | services.dispute.read_own | [vault-local] { linkId } | { link: ServiceDisputeLink } | NOT_FOUND |
| `services.dispute.preview_evidence` | services.dispute.read_own | [vault-local] { bookingId, milestoneId?, scope } | { eligible: boolean, reasonCode?, evidencePack: EvidenceRef[], windowEndsAt } | NOT_FOUND, SERVICES_DISPUTE_WINDOW_CLOSED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.dispute.opened` | P2 | { linkId, bookingId, milestoneId?, scope, openerId, counterpartyId } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.dispute.opened` | for context type service_dispute link the case id and move pending_link to linked |
| `commerce.dispute.resolved` | move linked to resolved and store the outcome |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_DISPUTE_WINDOW_CLOSED | 409 | no | more than 30 days since the booking end, last milestone activity or cancellation |
| SERVICES_DISPUTE_DUPLICATE | 409 | no | a dispute for this scope already exists |
| SERVICES_DISPUTE_LIMIT | 409 | no | three disputes already exist for this booking |
| SERVICES_STATEMENT_INVALID | 422 | no | dispute notice signature or signer role is invalid; quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
client vault services.dispute.open { "bookingId": "0192f3c0-00b1-…", "milestoneId": "0192f3d0-0001-…", "scope": "not_delivered",
  "statement": "No files were delivered after the agreed date of 2027-04-05." }
-> { "linkId": "0192f3e0-0001-…", "state": "pending_link", "evidenceCount": 5, "noticeCid": "sha256-Dn…", "syncState": "prepared" }
later: commerce.dispute.opened consumed -> state linked, disputeCaseId set; commerce.dispute.resolved consumed -> state resolved, outcome settled
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T02 | integration | PS-030-01.R02, PS-030-04.R01 | open dispute with 5 extra evidence references | evidence pack holds cids and hashes only; notice signed; case requested once |
| TEST-PS-030-09.T04 | integration | PS-030-03.R02, PS-030-04.R03 | commerce.dispute.opened then commerce.dispute.resolved consumed twice | link linked then resolved once; outcome stored; duplicates skipped |
| TEST-PS-030-09.T05 | integration | PS-030-03.R03, PS-030-04.R02 | services.dispute.opened consumed by quotes and milestones modules | booking disputed and milestones frozen exactly once |
| TEST-PS-030-09.T08 | contract | PS-030-04.R01, PS-030-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
