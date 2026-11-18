# PS-029-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-05. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines who may perform which action on which skill-offer resource. The matrix is enforced server-side for every command, query and sweep. Capability names and revocation semantics follow CTR-CAP-001 (owner F16 with F07 identity, see [CONTRACTS](../../../planning/CONTRACTS.md)). Client-side hiding of controls is never an authorization decision.

Exclusions: authentication itself (F07), moderation case handling (moderation module), feature-flag administration (platform F15), and participant blocking decisions (F16).

## Requirements
- PS-029-05.R01: Business outcome: only the owner of an offer can change it, only published offers are visible to the public, and operators can configure categories and flags without reading participant content. Actors: anonymous visitor, owner participant, other participant, moderator, operator, scheduler. Exclusions as above.
- PS-029-05.R02: Case coverage: owner edits own offer; other participant tries to edit (denied); anonymous search (allowed, published only); expired or revoked capability; blocked participant; moderator acting without `case_ref` (denied); scheduler calling a participant command (denied); cross-region search (denied by region filter).
- PS-029-05.R03: Accessibility and budgets: denials return the same error shape as not-found where enumeration risk exists, so the client can show one accessible message. Authorization check adds at most 10 ms p95 to a command.
- PS-029-05.R04: Deny by default. An action not in the matrix is denied and logged as a policy gap.
- PS-029-05.R05: Ownership is checked against `owner_participant_id` on every owner-scoped action, not against a cached client claim.
- PS-029-05.R06: Capability revocation takes effect within 60 seconds for new requests. In-flight commands re-check the capability before commit.

## Capabilities
| Capability (CTR-CAP-001) | Grants | Typical holder |
|---|---|---|
| `skills.offer.write` | create, update, publish, pause, resume, renew, retire own offers | participant |
| `skills.offer.read.own` | get and list own offers, own transition summaries | participant |
| `skills.offer.read.public` | search published offers | anonymous or participant |
| `skills.offer.moderate` | `moderate_remove`, case-bound read of a reported offer | moderator (requires `case_ref`) |
| `skills.config.write` | taxonomy changes, category activation | operator |
| `skills.export.own` | export own offers (see [import/export](import_export_backup_rollback.md)) | participant |
| `skills.import.own` | restore own export into draft state | participant |

## Actor by action matrix
Legend: Y = allowed; N = denied; Own = allowed only when `owner_participant_id` equals the token subject; Case = allowed only with a valid `case_ref`; Pub = allowed only for `published` state.

| Action (command or query) | Anonymous | Owner | Other participant | Moderator | Operator | Scheduler |
|---|---|---|---|---|---|---|
| create offer (`skills.offer.create`) | N | Y (own new offer) | Y (own new offer) | N | N | N |
| get offer, draft fields (`skills.offer.get`) | N | Own | N (NOT_FOUND) | Case | N | N |
| list own offers | N | Own | N | N | N | N |
| search published offers | Pub, region-scoped | Pub | Pub | Pub | N | N |
| update offer | N | Own | N | N | N | N |
| publish / pause / resume / renew | N | Own | N | N | N | N |
| retire, reason `owner_withdrew` | N | Own | N | N | N | N |
| moderate_remove, reason `moderation_removed` | N | N | N | Case | N | N |
| expire, draft_inactive sweeps | N | N | N | N | N | Y (system scope only) |
| read transition summaries | N | Own (no moderator identity) | N | Case | N (aggregate counts only) | N |
| export own offers | N | Own | N | N | N | N |
| import own export | N | Own (draft only) | N | N | N | N |
| taxonomy add or deactivate category | N | N | N | N | Y | N |
| toggle `skills.enabled` for a region | N | N | N | N | Y (region scope) | N |
| change discovery region catalog | N | N | N | N | N (F10 only; read here) | N |

## Ordering of checks
1. Authenticate token and resolve subject (F07).
2. Check capability for the action (CTR-CAP-001).
3. Check participant is not blocked (blocked denies writes only; see [workflow](workflow_state_machine.md)).
4. Resolve resource and check ownership or case binding.
5. Check state guard. Denials in steps 2 to 4 return before any state read that could leak state.

## Cross-participant rules
- An owner's draft is never visible to another participant, including through search, event payloads or logs.
- Moderators see reported content only through a case-bound read; the read is logged with `case_ref` and the moderator's pseudonymous ID.
- Operators never read title, description or rate data. Their taxonomy and flag changes are logged with actor and reason.

## Access error codes
| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| `SKILLS_FORBIDDEN` | 403 | no | Capability missing or revoked, or action not in matrix |
| `SKILLS_NOT_FOUND` | 404 | no | Offer missing, or owned by another participant (no existence leak) |
| `SKILLS_PARTICIPANT_BLOCKED` | 403 | no | Caller blocked by F16; writes denied, reads of own record allowed |

## Assumptions
- A-skills-15: The seven capability names above are provisional until CTR-CAP-001 is published. Capability revocation is effective within 60 seconds for new requests and is re-checked at commit for in-flight commands.

## Open decisions
- Whether moderators may act on a `draft` offer at all, since drafts are private. Default here: moderators act only on published or paused offers; drafts are removed by the owner or the draft-inactive sweep. (Links to D10 for account recovery of owners.)
- Operator access to region-scoped flag changes depends on the F15 operator model, which is not yet defined.

## Testing
- TEST-PS-029-05-T01: Every cell in the matrix is exercised for at least one positive and one negative case. Pass when the observed result equals the matrix cell for all rows.
- TEST-PS-029-05-T02: Another participant's draft `skill_id` returns the same status and body shape as a nonexistent ID. Pass when the two responses are identical except for the echoed ID.
- TEST-PS-029-05-T03: Revoking `skills.offer.write` mid-command: the command is rejected at commit with no state change. Pass when the revision is unchanged after the rejection.
- TEST-PS-029-05-T04: Moderator call without `case_ref` is denied. Pass when denied and logged as a policy event.
- TEST-PS-029-05-T05: Scheduler credential calling `skills.offer.publish` is denied. Pass when denied with no write.
