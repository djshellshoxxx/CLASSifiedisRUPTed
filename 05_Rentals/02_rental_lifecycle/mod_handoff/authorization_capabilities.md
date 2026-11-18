# PS-042-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-05. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines who may do what to which handoff resource. Capability naming and revocation follow CTR-CAP-001 (owner F16 with F07 identity, OPEN). Identity and blocking come from F07. Authorization is enforced by the relay, never by the static client.

## Requirements
- PS-042-05.R01 — Business outcome: only the two parties of a rental agreement can act on its handoff. A moderator can act on disputes only. The system can act only on timers and agreement events.
- PS-042-05.R02 — Cases covered: party acts on own handoff; non-party reads or writes; counterparty tries to act as proposer; moderator tries to confirm; system job runs after a manual state change; blocked participant acts; capability revoked mid-session; lessor and renter identical.
- PS-042-05.R03 — Authorization is evaluated per request on current state. Cached grants expire within 60 seconds of revocation.
- PS-042-05.R04 — Non-parties receive `HANDOFF_NOT_FOUND`, identical in body and latency to an unknown ID, so existence of a handoff is not disclosed ([A-handoff-22](#assumptions-and-open-decisions)).

## Capabilities
| Capability | Grants |
|---|---|
| `handoff.create` | create a handoff for an agreement where the caller is a party |
| `handoff.read` | read own handoff record and its attestations |
| `handoff.reschedule` | propose, accept, decline or withdraw a reschedule |
| `handoff.confirm` | record own handover attestation |
| `handoff.cancel` | cancel before any confirmation |
| `handoff.dispute` | open a dispute after a confirmation |
| `handoff.resolve` | resolve disputes (moderator role only) ([A-handoff-21](#assumptions-and-open-decisions)) |
| `handoff.history.read` | read transition log for own handoff |
| `handoff.export` | export own records ([import_export_backup_rollback.md](import_export_backup_rollback.md)) |
| `handoff.metrics.read` | aggregate counters with no identifiers (operator role) |
| `handoff.lifecycle.system` | timer and agreement-event transitions T13–T15 (service identity only) |

## Actor × action matrix
Legend: Y = allowed; Y* = allowed with an extra condition in the last column; N = denied; N/404 = denied and reported as not found.

| Action | Lessor | Renter | Moderator | System | Non-party | Operator | Condition |
|---|---|---|---|---|---|---|---|
| create | Y | Y | N | N | N/404 | N | caller is agreement lessor or renter |
| read | Y | Y | Y | N | N/404 | N | moderator scope set by open dispute |
| propose reschedule | Y* | Y* | N | N | N/404 | N | state scheduled; limit not reached |
| accept or decline reschedule | Y* | Y* | N | N | N/404 | N | caller is counterparty of proposer |
| withdraw reschedule | Y* | Y* | N | N | N/404 | N | caller is proposer |
| confirm | Y* | Y* | N | N | N/404 | N | caller's role not yet attested |
| cancel | Y* | Y* | N | N | N/404 | N | state scheduled or reschedule_proposed |
| dispute | Y* | Y* | N | N | N/404 | N | state lessor_confirmed or renter_confirmed |
| resolve dispute | N | N | Y | N | N/404 | N | state disputed |
| timer and agreement transitions | N | N | N | Y | N | N | service identity only |
| read transition log | Y | Y | Y | N | N/404 | N | own handoff |
| export own records | Y | Y | N | N | N | N | portability request |
| read aggregate metrics | N | N | N | N | N | Y | no IDs in response |

## Field visibility by actor
| Field class ([privacy_retention_abuse.md](privacy_retention_abuse.md)) | Parties | Moderator | Operator | Non-party |
|---|---|---|---|---|
| P0 identifiers and states | Y | Y | Y (aggregated only) | N |
| P1 `region_code` | Y | Y | N | N |
| P2 `meeting_note`, `condition_note`, window, dispute reason | Y | Y (during dispute) | N | N |
| `evidence_refs` | Y | Y (during dispute) | N | N |
| `signature` | Y | Y | N | N |
| `deposit_ref` | Y | N | N | N |

## Revocation and blocks
- A block recorded by F07 is checked at each command (`HANDOFF_PARTICIPANT_BLOCKED`). A blocked party keeps read access to completed history only.
- Revoking `handoff.resolve` from a moderator takes effect within 60 seconds. Open dispute actions by that moderator after revocation are rejected.
- A party removed from the agreement loses write capabilities immediately. Their attestations remain, because they are evidence.

## Assumptions and open decisions
- **Assumption A-handoff-21:** Moderator access is the role `moderator` holding `handoff.resolve`. Role assignment belongs to F16 and is not defined in CONTRACTS.md.
- **Assumption A-handoff-22:** Non-party access returns `HANDOFF_NOT_FOUND` with the same timing bucket as an unknown ID.
- Open decisions in this file: CTR-CAP-001 naming and role catalogue (OPEN); D10 (auth and key recovery, OPEN) for how party keys are recovered.
