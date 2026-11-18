# PS-039-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-05. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (service principal), notifications, moderation (operator suspension); shared F07 identity, F16 security, F10 privacy, F15 platform, and CTR-CAP-001 per [contracts](../../../planning/CONTRACTS.md).

## Requirements
- PS-039-05.R01: Every action on every resource has an explicit actor rule. Default is deny. Enforcement happens on the server, never in the client.
- PS-039-05.R02: Capability grants and revocations are checked on every command. A revoked capability takes effect on the next command and invalidates no stored claim.
- PS-039-05.R03: Public and participant-scoped views are separate. Other parties' pseudonyms are never disclosed to a viewer who is not a party to the claim.

## Actors
- Anonymous viewer: no account.
- Owner: pseudonymous participant equal to `listing.owner_participant_id` (F07).
- Requester: pseudonymous participant who is not the owner.
- Lifecycle service: internal service principal of 02_rental_lifecycle, authenticated by F16.
- Operator: moderation staff with listing-suspension capability; no claim-body access.

## Capability names
Capabilities use the form `avail:<resource>:<action>` (A-AVAIL-16). They are mapped into CTR-CAP-001 when that contract is expanded.

| Capability | Granted to |
|---|---|
| avail:window:write | owner of listing |
| avail:block:write | owner of listing |
| avail:claim:hold | authenticated participant, not owner |
| avail:claim:release_own | requester of the claim |
| avail:claim:commit | lifecycle service principal only |
| avail:claim:release_commitment | lifecycle service principal only |
| avail:calendar:read_public | anonymous and authenticated |
| avail:claim:read_party | requester or owner of that claim |
| avail:windows:read_owner | owner of listing |
| avail:listing:suspend | operator (moderation), exercised by F16 workflow |

## Capability and permission matrix
Legend: Y = allowed; C = allowed with condition in brackets; N = denied.

| Action (resource) | Anonymous | Owner | Requester | Lifecycle service | Operator |
|---|---|---|---|---|---|
| publish window (window) | N | Y [own listing, listing not suspended] | N | N | N |
| withdraw window (window) | N | Y [own listing, no committed claim inside] | N | N | N |
| create block (block) | N | Y [own listing] | N | N | N |
| remove block (block) | N | Y [own listing] | N | N | N |
| hold period (claim) | N | N [AVAIL_SELF_REQUEST_FORBIDDEN] | Y [authenticated, listing not suspended] | N | N |
| release own hold (claim) | N | Y [owner may release a held claim with reason owner_declined] | Y [own claim, state held] | Y [any claim] | N |
| commit claim (claim) | N | N | N | Y [state held, unexpired] | N |
| release commitment (claim) | N | N | N | Y [state committed] | N |
| read public calendar (listing) | Y [day-level, 92-day max] | Y | Y | Y | Y |
| read claim (claim) | N | Y [claims on own listing] | Y [own claims] | Y | N |
| read owner windows (window) | N | Y [own listing] | N | N | N |
| suspend listing (listing) | N | N | N | N | Y [with moderation reason code] |

Operators never read claim bodies. Operator suspension blocks new holds and new windows but does not release existing commitments; those follow the lifecycle path.

## Enforcement rules
- Every command resolves the resource, then checks the actor against the matrix, then runs validation. Authorization failure returns `AVAIL_NOT_AUTHORIZED` (or `AVAIL_CLAIM_NOT_FOUND` / `AVAIL_WINDOW_NOT_FOUND` when the actor may not learn that the resource exists).
- Service principal calls require mutual authentication and carry the lifecycle service's identity in the audit fields. Any other principal calling commit returns `AVAIL_NOT_AUTHORIZED`.
- Revocation of a participant's account suspends new holds from that participant. Existing held claims are released with reason `requester_withdrew` by the platform, and commitments follow the lifecycle path.
- A capability check happens before idempotency replay. A replay by an actor who has since lost the capability is refused.

## Public and participant-scoped visibility
- Public calendar shows only `open`, `requested` and `unavailable` intervals, never IDs, pseudonyms or hold expiry.
- Owner sees claim IDs, intervals, states and requester pseudonym for claims on their listing, but not requester contact details (none are stored here).
- Requester sees their own claims and their state only.

## Open decisions
- A-AVAIL-16: Capability naming `avail:<resource>:<action>` is provisional until CTR-CAP-001 is expanded by F16.
- A-AVAIL-17: Only the lifecycle service principal may commit or release a commitment. Owners and requesters cannot commit directly, which prevents a rental being made without the lifecycle record.
- A-AVAIL-18: Whether anonymous users may read the public calendar at all is OPEN. Default in this spec is yes at day granularity, with a 92-day maximum, to support discovery. Rate limits in privacy_retention_abuse.md apply.
