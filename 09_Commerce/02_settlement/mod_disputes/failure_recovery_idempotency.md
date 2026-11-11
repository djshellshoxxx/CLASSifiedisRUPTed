# PS-070-06 — Failure recovery and idempotency: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-06.R01** Commands are idempotent per CTR-IDM-001 using vault command IDs and expectedRevision on mutations.
- **PS-070-06.R02** Statement delivery uses the sync outbox states and the UI shows only the state reached.
- **PS-070-06.R03** Forked or conflicting signed outcomes are detected, frozen and surfaced; there is no last-writer-wins.
- **PS-070-06.R04** Statements of an open case from a party this vault blocked are stored as evidence with notifications suppressed and are never dropped, the timeline says 'responses from a party you blocked are hidden', and the response window flag is noResponseReceivedHere, which such stored statements clear.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; statements deduplicated by cid; caseId is deterministic so repeated opens converge; an open carrying an idempotencyRef already stored in this vault returns that case without signing a new statement.
- **concurrency:** expectedRevision on every mutation; unique partial index for one open case per context and opener; Web Lock commerce-dispute per case; across vaults conflicts are detected by statement chain and acceptance sets and freeze the case.
- **retries:** Sync outbox retry 5 s, 30 s, 5 min, 1 h, then every 6 h until the case is terminal plus 7 days.
- **offline:** All commands commit locally and show pending; evidence attachments are sent through the AttachmentTransportPort (F08.S01.M01 mailbox adapter) when online; deadlines still run on the local clock.
- **partial failure:** Statement and local state commit in one IndexedDB transaction. If an attachment upload fails the statement stays prepared and the evidence item shows upload pending; the case is never partially opened. If metadata stripping fails the attachment is refused and nothing is sent.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T06 | integration | PS-070-03.R03, PS-070-06.R03 | two conflicting accepted outcomes delivered to vault B | case frozen with COMMERCE_DISPUTE_FORK, both retained, no auto-resolution |
| TEST-PS-070-09.T11 | integration | PS-070-06.R01, PS-070-06.R02 | replay of command ID; delivery interrupted at each sync state | original result; UI shows only the highest reached sync state |
| TEST-PS-070-09.T21 | integration | PS-070-06.R04 | A has blocked B; A opens a case against B; B responds and adds evidence | open allowed; B's statements stored with notifications suppressed; timeline says 'responses from a party you blocked are hidden'; noResponseReceivedHere stays false |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
