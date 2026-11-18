# PS-028-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-05. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** 03_Services/02_service_booking (service principal); moderation and operator roles from F16; identity F07. Capability matrix is owned by F16 with F07 under CTR-CAP-001 (OPEN).

## Purpose and scope
Defines which actor may perform which action on which resource in this module, the capability key that grants it, and the checks applied. Authorization is enforced by the module on every command and query. Client-side hiding is never the control.

Exclusions: identity proofing and credential issuance (F07), role assignment for moderators and operators (F16), and the public visibility rules of listings beyond this module's own fields.

## Actors
| Actor | Identity source | Notes |
|---|---|---|
| provider | F07 account; actor_ref equals provider_ref | Owns schedules and windows created under its provider_ref |
| booking_service | service principal issued by F16 to 02_service_booking | Only actor that writes claims (A-availability-05) |
| moderator | F16 role `moderator` | Suspends and lifts windows with a moderation case reference |
| operator | F16 role `operator` | Platform operations; read of audit; no provider data edits |
| viewer | anonymous or any authenticated account | Public fields only |
| system | internal scheduler principal | Sweeper and materialization; no external calls |

## Capability keys
| Key | Grants |
|---|---|
| availability.schedule.manage | create, pause, resume, archive own schedules |
| availability.window.manage | create, publish, update, withdraw own windows |
| availability.window.moderate | suspend and lift any window with a case reference |
| availability.claim.write | hold, confirm and release claims |
| availability.claim.read | read a claim by ID |
| availability.window.read.public | read public fields of PUBLISHED windows |
| availability.window.read.owner | read full owner fields of own windows |
| availability.audit.read | read AvailabilityAudit rows for support, without claimant_ref |

Capability revocation takes effect on the next command. Tokens older than the revocation timestamp are rejected for write commands (CTR-CAP-001 revocation rule, pending F16 expansion).

## Permission matrix
Key: Y = allowed; O = allowed only when the actor owns the resource (provider_ref match); N = denied with AVAILABILITY_CAPABILITY_DENIED (or AVAILABILITY_WINDOW_NOT_FOUND where existence must not leak); M = allowed only with moderation case reference.

| Action | Resource | provider | booking_service | moderator | operator | system | viewer |
|---|---|---|---|---|---|---|---|
| schedule.create | schedule | O | N | N | N | N | N |
| schedule.pause / resume / archive | schedule | O | N | N | N | N | N |
| schedule.list | schedule | O | N | N | Y (counts only) | N | N |
| window.create | window | O | N | N | N | N | N |
| window.publish / update / withdraw | window | O | N | N | N | N | N |
| window.suspend | window | N | N | M | N | N | N |
| window.lift | window | N | N | M | N | N | N |
| window.search | window | Y | Y | Y | Y | N | Y (public fields) |
| window.get | window | O (full fields) | Y (public + claim-related fields) | Y | Y (counts only) | N | Y (public fields, PUBLISHED only) |
| claim.hold | claim | N | Y | N | N | N | N |
| claim.confirm | claim | N | Y | N | N | N | N |
| claim.release (booking cancel) | claim | N | Y | N | N | N | N |
| claim.release (claimant request) | claim | N | Y (on behalf of claimant) | N | N | N | N |
| claim.get | claim | N | Y | N | Y (no claimant_ref) | N | N |
| expiry sweep | claim, window | N | N | N | N | Y | N |
| materialization | window | N | N | N | N | Y | N |
| audit.read | audit | N | N | N | Y (no claimant_ref) | N | N |

Notes on the matrix:
- The claimant identity is never visible to provider, viewer or operator. Only booking_service sees claimant_ref, and only for its own claims.
- Operator may read counts and states but may not edit provider data. Emergency edits use the moderation path with a case reference.
- `claim.release` by a claimant is not a direct call. The claimant asks the booking service, which calls release with the service principal.

## Checks applied on each command
1. Token valid and not revoked.
2. Actor type matches the action row above.
3. Capability key present for the action.
4. Resource ownership check (O rows): actor's provider_ref equals the resource's provider_ref.
5. Moderation case reference present and well-formed for M rows.
6. Service principal scope check for booking_service: the principal's allowed window owner set includes the window's service_offering_id provider only where booking has an active booking relation (checked by the booking contract, A-availability-05).
7. Failure returns AVAILABILITY_CAPABILITY_DENIED, except for read rows where existence must not leak, which return AVAILABILITY_WINDOW_NOT_FOUND.

## Separation of duties
- A provider cannot suspend or lift their own window.
- A moderator cannot publish or hold claims.
- booking_service cannot change window status except through hold, confirm and release. It cannot publish or withdraw.
- The system principal cannot create or edit records. It may only move status by sweeper rules.

## Audit of authorization decisions
Denied commands are logged with actor type, action, resource type, and error code only. Logs carry no actor_ref for viewer denials. Successful writes create an AvailabilityAudit row (domain_schema.md). Audit rows are readable only with availability.audit.read.

## Requirements
- [ ] PS-028-05.R01: Every action in the permission matrix has exactly one allowed-actor set and no implicit grants.
- [ ] PS-028-05.R02: Cross-tenant access (provider reading another provider's window full fields) is denied in all tests. Covered by TEST-PS-028-05-T02.
- [ ] PS-028-05.R03: booking_service cannot write provider or window fields. Covered by TEST-PS-028-05-T03.
- [ ] PS-028-05.R04: Revoked capability denies the next command. Covered by TEST-PS-028-05-T04.
- [ ] PS-028-05.R05: Denied responses do not reveal existence of windows or claims to non-owners.

## Open decisions
- A-availability-05: booking_service is the only writer of claims. The booking-side protocol (hold, confirm, release, claimant_ref format) is not in [CONTRACTS.md](../../../planning/CONTRACTS.md) and needs a new contract ID proposed to the lead.
- Capability key names above are proposals for CTR-CAP-001. F16 owns the final registry.
- Operator read of counts is an assumption; F16 must confirm that operators do not need window owner fields for support.
