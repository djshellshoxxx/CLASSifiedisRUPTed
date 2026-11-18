# PS-041-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-05. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines which actor may perform which action on which resource, under which conditions. Authorization is enforced by the server on every command and query. Client-side hiding of controls is not authorization.

Exclusions: identity proofing and credential issuance (F07), moderator role assignment (F12), and the capability matrix format itself (CTR-CAP-001, owner F16 with F07).

## Requirements
- **PS-041-05.R01** Matrix. The matrix below is the module's complete grant set. Any action not listed is denied.
- **PS-041-05.R02** Case coverage. Non-party access to an existing claim returns DAMAGE_CLAIM_NOT_FOUND, so that claim existence is not disclosed. Blocked participants can read their own claims but cannot write. Revoked roles are rejected at the next command. Moderators cannot act on claims where they are a party.
- **PS-041-05.R03** Operational controls. Authorization decisions take under 20 ms p95 excluding network hops. Denials are logged with role and code only (observability_performance.md). Accessibility is unaffected: denied actions return text codes, not visual-only states.

## Actors
- **lender**: the participant in the lender role of the rental (the claim's `lender_participant_id`).
- **renter**: the participant in the renter role (the claim's `renter_participant_id`).
- **moderator**: a moderation role issued by F12 (A-damage-15).
- **system**: a service identity used by the expiry timer only.
- **non-party**: any other authenticated participant.
- **blocked**: a participant under an active block (F07/F12).

## Capability matrix
Y = allowed. Y(own) = allowed only for the actor's own claims. N = denied. Conditions apply on top of the matrix.

| Capability token | Lender | Renter | Moderator | System | Non-party | Blocked | Resource | Conditions |
|---|---|---|---|---|---|---|---|---|
| damage.claim.open | Y | N | N | N | N | N | damage_claim | Return recorded; window open; no duplicate |
| damage.claim.read | Y | Y | Y | N | N | Y(own) | damage_claim | Party, or moderator on an open case |
| damage.claim.list | Y(own) | Y(own) | N | N | N | Y(own) | damage_claim | Pagination limit 50 |
| damage.claim.revise | Y | N | N | N | N | N | damage_claim | State OPEN; revision count below 2; no hold |
| damage.claim.withdraw | Y | N | N | N | N | N | damage_claim | State OPEN or COUNTER_PROPOSED; no hold |
| damage.evidence.attach | Y | Y | N | N | N | N | damage_evidence | Non-terminal; no hold; actor is party |
| damage.response.submit | N | Y | N | N | N | N | damage_response | State OPEN; no hold |
| damage.counter.accept | Y | N | N | N | N | N | damage_claim | State COUNTER_PROPOSED; no hold |
| damage.claim.escalate | Y | Y | N | N | N | N | damage_claim | State COUNTER_PROPOSED; no hold (renter may also escalate from OPEN via dispute) |
| damage.external.attest | Y | Y | N | N | N | N | damage_attestation | State OPEN, COUNTER_PROPOSED or ESCALATED; no hold |
| damage.timeline.read | Y | Y | Y | N | N | Y(own) | damage_event | As claim.read |
| damage.moderation.hold | N | N | Y | N | N | N | damage_claim | Non-terminal |
| damage.moderation.resolve | N | N | Y | N | N | N | damage_claim | State ESCALATED; clears hold |
| damage.timer.expire | N | N | N | Y | N | N | damage_claim | `now` at or past deadline; no hold |
| damage.export.request | Y(own) | Y(own) | N | N | N | Y(own) | export bundle | Per PS-041-10 |

## Rules
- **Party check.** The actor's participant ID must equal the claim's lender or renter ID for party actions. Evaluated server-side against stored IDs, never against IDs in the request body alone (V24).
- **Separation of duties.** A moderator is refused on any claim where the moderator's participant ID is a party. The check is enforced by F12 role assignment and re-checked here.
- **Revocation.** Capability tokens are checked at each command. A revoked role yields DAMAGE_NOT_PARTY on the next command. A block yields DAMAGE_PARTICIPANT_BLOCKED for writes.
- **Read masking.** Non-parties asking for an existing claim receive DAMAGE_CLAIM_NOT_FOUND, the same as for a missing claim, to prevent enumeration.
- **Deny by default.** Unknown actor types, unknown capability tokens and missing claim visibility are denied.

## Capability naming and CTR-CAP-001 mapping
**Assumption A-damage-14:** Capability tokens use the form `damage.<resource>.<action>`. Each token maps to one CTR-CAP-001 tuple of (actor, action, resource). The mapping is recorded here until CTR-CAP-001 is published by F16.

## Open decisions
- **Assumption A-damage-14:** Token naming and mapping above.
- **Assumption A-damage-15:** Moderator role is issued and revoked by F12. This module only consumes it.
- D10 (auth and portability) is OPEN. Key rotation and recovery affect how party IDs stay stable across devices.
- Whether a blocked participant may still read claims they are party to is a product choice; this spec allows read for transparency. Confirm in Prompt 3.
