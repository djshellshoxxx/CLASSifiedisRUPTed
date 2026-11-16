# PS-030-01 — Domain schema: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-01.R01** A ServiceDisputeLink stores booking, optional milestone, scope, opener, counterparty, statement, evidence pack, case reference, state and outcome, with revision per CTR-ID-001.
- **PS-030-01.R02** Links are P2 and kept under RET-EVIDENCE; the evidence pack stores cids and hashes, never copies of deliverable bytes.
- **PS-030-01.R03** A link is unique per booking and scope key; duplicates are merged rather than stored twice.

## Specification

### ServiceDisputeLink

Schema `classrup.services.dispute_link/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| bookingId | uuidv7 — ref F03.S02.M01 Booking |
| milestoneId? | uuidv7 — ref F03.S02.M02 Milestone when scope is milestone |
| scope | enum — not_delivered \| quality \| scope_change \| payment_not_received \| no_show \| cancellation_fee \| other |
| scopeKey | string — bookingId plus milestoneId or 'booking'; unique among non-withdrawn links |
| openerId | actorId — party who opened |
| counterpartyId | actorId — other party |
| statement | string — 20..2000 code points, plain text |
| evidencePack | EvidenceRef[] — 1..25 items {kind: statement \| attachment, cid? , attachmentId?, sha256?, missing?} |
| disputeCaseId? | uuidv7 — ref F09.S02.M02 DisputeCase once created |
| state | enum — pending_link \| linked \| resolved \| withdrawn \| link_failed |
| outcome? | enum — continue \| settled \| cancelled \| split \| no_action |
| noticeCid? | string — cid of the signed dispute notice |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| retryCount | int — 0..3 |
| revision | int — CTR-ID-001 ID-4 |
| openedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- state linked or resolved implies disputeCaseId is set.
- At most one non-withdrawn link per scopeKey in a vault.
- evidencePack always contains the cids of the booking confirmation statement and of the quote that the booking derives from.

### Storage DDL

```sql
CREATE TABLE services_dispute_link (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, booking_id TEXT NOT NULL, scope_key TEXT NOT NULL, state TEXT NOT NULL,
  dispute_case_id TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX services_dispute_scope ON services_dispute_link(tenant_id, scope_key) WHERE state <> 'withdrawn';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T01 | unit | PS-030-01.R01, PS-030-01.R03, PS-030-02.R01, PS-030-02.R02, PS-030-02.R03 | rules V01–V07 each violated | documented code returned and nothing stored; notices with bad signature quarantined |
| TEST-PS-030-09.T02 | integration | PS-030-01.R02, PS-030-04.R01 | open dispute with 5 extra evidence references | evidence pack holds cids and hashes only; notice signed; case requested once |
| TEST-PS-030-09.T15 | e2e | PS-030-01.R01, PS-030-02.R01 | mobile client opens dispute, provider receives notice in second browser | both show linked with case reference; axe zero serious issues |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
