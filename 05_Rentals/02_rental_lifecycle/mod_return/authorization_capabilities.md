# PS-043-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-05. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** commands and queries in [commands_queries_events.md](commands_queries_events.md); capability matrix owner per CTR-CAP-001 (F16 with F07).

## Purpose and scope
Defines which actor may perform which action on which return resource, the capability keys used, where the grant comes from, and how revocation takes effect. Enforcement happens on the server; client UI hiding is convenience only.

**Exclusions:** identity proofing and session issuance (F07); role administration (F16); the moderation case workflow itself (moderation feature, A-return-08).

## Requirements
- PS-043-05.R01: Business outcome: only the renter and owner of a rental can act on its return, only in the state and window that allows the action, and moderators can act only on disputed returns they are assigned to. Actors and exclusions as above.
- PS-043-05.R02: Case coverage: each cell of the matrix is tested (TEST-PS-043-05-T01). Non-party access, blocked participants, revoked moderator roles, expired windows and wrong-role attempts each return a defined code.
- PS-043-05.R03: Accessibility: authorization denials that the user can fix (wrong window, not the renter) show plain text via `message_key`, not a bare 403.
- PS-043-05.R04: Capability keys below are the only keys this module declares. Each key is registered in the CTR-CAP-001 matrix when F16 publishes it.
- PS-043-05.R05: Revocation takes effect for mutating commands on the next transaction (no cache for mutation decisions), and for reads within the cache TTL in A-return-20.

## Capability keys
| Key | Grants |
|---|---|
| rental.return.initiate | InitiateReturn for a rental where actor is renter |
| rental.return.declare | DeclareReturn on own return |
| rental.return.cancel | CancelReturn on own return |
| rental.return.confirm | ConfirmReturn on return where actor is owner |
| rental.return.dispute | DisputeReturn on return where actor is owner |
| rental.return.resolve | ResolveReturnDispute on a disputed return, moderator case-scoped |
| rental.return.read | GetReturn, ListReturnsByRental, GetReturnTransitions for party-scoped returns |
| rental.return.read_all | Audit read of any return by moderator, logged to F16 audit trail |
| rental.return.export_own | Export of records where actor is a party (PS-043-10) |
| rental.return.system_transition | Scheduler timers only |
| rental.return.configure | Read and change rental_return configuration (operator) |

## Matrix (actor x action)
Key: `A` allowed when the guard holds; `A*` allowed with the guard noted below; `D` denied. Denial code is in the validation table.

| Actor | Initiate | Declare | Cancel | Confirm | Dispute | Resolve | Read (party) | Read all | Export own | System transition | Configure |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Renter (party) | A* | A* | A* | D | D | D | A* | D | A* | D | D |
| Owner (party) | D | D | D | A* | A* | D | A* | D | A* | D | D |
| Moderator | D | D | D | D | D | A* | A* | A* | D | D | D |
| Operator | D | D | D | D | D | D | D | D | D | D | A |
| Scheduler (system) | D | D | D | D | D | D | D | D | D | A* | D |
| Non-party participant | D | D | D | D | D | D | D | D | D | D | D |
| Blocked participant | D | D | D | D | D | D | A* | D | A* | D | D |

Guards:
- Renter initiate: actor = renter of rental; rental handed_off; no active return; now within window (PS-043-02 Table 2).
- Renter declare and cancel: actor = renter of return; state initiated (declare also requires valid returned_at).
- Owner confirm and dispute: actor = owner of return; state declared or unconfirmed; inside window.
- Moderator resolve: state disputed; moderation_decision_ref final; moderator assigned to the case.
- Moderator read: return linked to an open moderation case; every access is audit-logged. Read-all is case-independent for audit only and logged with reason code.
- Party read and export: actor is renter or owner. Export excludes counterparty notes (redacted, PS-043-07).
- Blocked participant read and export: own records only; all mutations return RETURN_PARTICIPANT_BLOCKED.
- Scheduler: only transitions listed in workflow_state_machine.md Timers.

## Grant sources
- Party status: rental_return row (renter_participant_id, owner_participant_id), cross-checked against the rental_agreement projection at initiation and at mutation time.
- Session identity: F07 session token bound to participant_id; the token is never accepted for a different participant.
- Moderator and operator roles: F16 role claims; scoped by case assignment for moderators.
- Scheduler: F15 service identity with `rental.return.system_transition` only.

## Non-disclosure
When actor is not a party, `GetReturn` and `ListReturnsByRental` return RETURN_NOT_FOUND or RETURN_RENTAL_NOT_FOUND with identical body length and status. Return identifiers are ULIDs and are not sequential.

## Revocation
- F07 block on a participant: new mutating commands return RETURN_PARTICIPANT_BLOCKED immediately (checked inside the transaction). Existing returns are not changed. Timers continue.
- Moderator role removal: resolve and read-all denied on the next request. Decisions already recorded stay recorded.
- Capability decision cache: reads may use a cached decision for at most 60 seconds (A-return-20). Mutations never use the cache.

## Open decisions
- A-return-20: Read decisions may be cached for 60 seconds at the gateway; mutation decisions are not cached.
- A-return-21: Moderator read-all access is logged to the F16 audit trail with a mandatory reason code from a fixed list.
- A-return-22: Capability keys follow the `rental.return.<action>` namespace; CTR-CAP-001 mapping is pending F16 publication.
