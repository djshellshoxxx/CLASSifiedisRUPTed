# PS-031-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-05. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_disputes (PS-030) as event producer.

## Purpose and scope
Business outcome: each action on a plan or item is allowed only for the party or system role that owns it, and the same answer is given whether a plan exists or not for a non-party. The matrix below is the module's rows of the cross-module capability matrix CTR-CAP-001 (owner F16 with F07; not yet approved).

Exclusions: authentication and credential recovery (F07); moderation case handling (F16 and moderation feature); federation trust (F11). Consent records here are per plan revision, not general consent.

## Requirements
- PS-031-05.R01: Actors are: `provider` (plan provider_participant_id), `client` (plan client_participant_id), `operator` (support role), `system` (scheduler and mod_disputes consumer), `non_party` (any other authenticated participant), and `blocked` (F07 blocked status overlays any party).
- PS-031-05.R02: Denials for non-parties on plan-scoped resources return `MILESTONES_PLAN_NOT_FOUND` (404), never 403, so that plan identifiers cannot be enumerated. Party with wrong role returns `MILESTONES_ACTION_NOT_PERMITTED` (403).
- PS-031-05.R03: Capability checks run before any existence check that depends on the plan. Cost budget: capability decision p95 5 ms with a cache of 30 s; cache is invalidated by F07 block events.
- PS-031-05.R04: Revocation: when F07 blocks a participant, all write capabilities for that participant are denied within 30 seconds; a stored idempotent result is replayed only if the actor is not blocked at replay time.
- PS-031-05.R05: Operators never receive `title`, `description_text`, `note_text`, `evidence_uri` unless a moderation case is open and F16 grants `milestones.moderation.read_content` for that case for at most 24 hours. The grant is logged by F16.

## Capability matrix
Legend: Y = allowed, C = allowed only if the stated condition holds, N = denied. Resource is always scoped to the plan.

| Capability | Resource | Provider | Client | Operator | System | Non-party | Blocked |
|---|---|---|---|---|---|---|---|
| milestones.plan.create | plan | Y (feature on, quote accepted) | N | N | N | N | N |
| milestones.plan.read | plan and items | Y | Y | Y (redacted; see R05) | N | N | Y (read only) |
| milestones.plan.list_by_booking | plan | Y | Y | Y (redacted) | N | N | Y |
| milestones.plan.list_revisions | revision | Y | Y | N | N | N | Y |
| milestones.plan.edit_draft | items in draft | Y | N | N | N | N | N |
| milestones.plan.propose | plan | Y (draft) | N | N | N | N | N |
| milestones.plan.propose_revision | plan | C (agreed or active, no dispute) | C (same) | N | N | N | N |
| milestones.plan.consent | revision | C (pending proposal from client) | C (pending proposal from provider) | N | N | N | N |
| milestones.plan.reject_proposal | revision | C (proposal from client) | C (proposal from provider) | N | N | N | N |
| milestones.plan.withdraw_proposal | revision | C (own proposal) | C (own proposal) | N | N | N | N |
| milestones.plan.cancel_draft | plan | Y (draft or proposed) | N | N | N | N | N |
| milestones.plan.request_mutual_cancel | plan | C (agreed or active) | C (same) | N | N | N | N |
| milestones.plan.confirm_mutual_cancel | plan | C (other party requested) | C (same) | N | N | N | N |
| milestones.item.start | item | Y | N | N | N | N | N |
| milestones.item.submit | item | Y | N | N | N | N | N |
| milestones.item.accept | item | N | Y | N | N | N | N |
| milestones.item.reject | item | N | Y | N | N | N | N |
| milestones.item.open_dispute | item | C (item submitted or rejected) | C (same) | N | N | N | N |
| milestones.item.apply_dispute_outcome | item | N | N | N | Y (mod_disputes event, signed) | N | N |
| milestones.internal.expire_item | item | N | N | N | Y (timer) | N | N |
| milestones.moderation.read_content | plan content | N | N | C (open case, F16 grant, 24 h) | N | N | N |
| milestones.export.own | plan | Y | Y | N | N | N | Y |

Notes on conditions: "C (other party requested)" means the caller is the non-requesting party. "Own proposal" means the caller is `proposed_by` on the pending revision. A party may not consent to its own proposal as the other party; its propose command already records its consent.

## Rules
- Capability names are registered once in CTR-CAP-001 under the prefix `milestones.`. Adding a capability requires a new schema version of this file.
- A party may hold both roles on different plans; roles are per plan, never global.
- Operators cannot write any milestone state. Their only write is the moderation action recorded by F16, not by this module.
- `system` actions are authorized by a signed internal token scoped to the scheduler or the mod_disputes consumer; a user token never carries `system`.
- Every allowed or denied decision on a write is recorded in the command log with actor, capability and result code (no content).

## Assumptions and open decisions
- A-MILESTONES-13: Participants are pseudonymous F07 IDs; capability decisions use only those IDs.
- A-MILESTONES-09: mod_disputes events are authenticated by its signing key; this module verifies the signature before applying an outcome.
- Open: F16 must confirm the `milestones.moderation.read_content` grant shape and maximum duration; CTR-CAP-001 is not yet approved, so names above are proposals.
