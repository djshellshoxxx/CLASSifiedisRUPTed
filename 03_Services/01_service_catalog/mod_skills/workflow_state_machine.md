# PS-029-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-03. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the lifecycle of one `skill_offer` ([domain schema](domain_schema.md)): its states, the commands and sweeps that move it, guards, timeouts, and terminal state. A transition is an explicit, authorized, versioned write. Reaching `published` means only that the offer is visible in the catalog. It does not mean any transaction, booking or payment has happened.

Exclusions: booking lifecycle (02_service_booking), availability windows (mod_availability), moderation decisions (moderation module; this module only records their outcome), purge of retired data (retention job in [privacy_retention_abuse.md](privacy_retention_abuse.md)).

## Requirements
- PS-029-03.R01: Business outcome: an owner can move an offer through draft, publish, pause, resume, renew and retire, and the catalog shows only offers that are currently published. Actors: owner participant, moderator, scheduler, identity signal (F07/F16). Exclusions as stated above.
- PS-029-03.R02: Case coverage: normal publish and pause; invalid transition (e.g., publish a retired offer); expired offer (scheduler sweep); duplicate publish request (second request is a no-op on the same revision); concurrent owner edit against a sweep (compare-and-set on revision); offline replay of a stale pause (rejected by revision); adversarial replay of a publish after retire (rejected, state terminal).
- PS-029-03.R03: Accessibility and budgets: each state has a user-facing label key and an explanation key (for example `skills.state.expired.explain`). State changes must complete within the write budget in [observability_performance.md](observability_performance.md).
- PS-029-03.R04: Explicit consent: publishing is an owner command. No state reaches `published` through a sweep, import or moderation action.
- PS-029-03.R05: Every transition is atomic with its transition row and its outbox event (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).
- PS-029-03.R06: `retired` is terminal. No command or sweep leaves it. Reuse of the same content requires a new `skill_id`.

## State table
| State | Entry event(s) | Allowed transitions (command or sweep) | Guard for each transition | Terminal |
|---|---|---|---|---|
| draft | `skills.offer.create` | draft to draft (`skills.offer.update`); draft to published (`skills.offer.publish`); draft to retired (`skills.offer.retire`, reason `owner_withdrew`; sweep `skills.sweep.draft_inactive`, reason `draft_inactive`) | Publish: see publish guard below. Inactivity: `updated_at` older than 90 days (A-skills-09). | No |
| published | `skills.offer.publish`, `skills.offer.resume`, `skills.offer.renew` | published to published (update); published to paused (`skills.offer.pause`); published to expired (`skills.sweep.expire`); published to retired (`skills.offer.retire` owner_withdrew, or `skills.offer.moderate_remove` moderation_removed, or identity signal participant_closed) | Expire: `now >= expires_at`. Moderation: moderator capability. Identity: F07 closure signal. | No |
| paused | `skills.offer.pause` | paused to published (`skills.offer.resume`); paused to retired (owner, moderation, identity) ; paused to paused (update) | Resume: `expires_at > now`, quota (A-skills-10), duplicate check, participant not blocked, feature flag enabled. | No |
| expired | `skills.sweep.expire` | expired to published (`skills.offer.renew`); expired to retired (owner, moderation, identity); expired to expired (update) | Renew: quota, duplicate check, participant not blocked. Renew sets `expires_at = now + 180 days`. | No |
| retired | any of the retire commands or sweeps above | none | Not applicable | Yes |

Update is allowed in draft, published, paused and expired. An update never changes state. Updating a published offer re-runs validation and the duplicate check; if either fails, the update is rejected and the offer stays published with its old content.

## Publish guard (applies to publish, resume and renew)
1. Owner is the caller (capability and ownership checked, see [authorization](authorization_capabilities.md)).
2. `title`, `category_code` and `discovery_region_code` are present and valid (`SKILLS_PUBLISH_INCOMPLETE` otherwise).
3. Participant is not blocked (`SKILLS_PARTICIPANT_BLOCKED`).
4. Published count for the owner is below 5, and non-retired count is below 20 (A-skills-10; `SKILLS_QUOTA_EXCEEDED`).
5. No other non-retired offer by the same owner has the same `category_code` and normalized title (A-skills-14 in [validation rules](validation_rules.md); `SKILLS_DUPLICATE_OFFER`).
6. Feature flag `skills.enabled` is on for the owner's region.

## Timeouts and sweeps
- Expiry sweep runs every 5 minutes. A published offer moves to expired at most 5 minutes after `expires_at`. Paused offers are never swept to expired; `expires_at` is frozen while paused (A-skills-09).
- Draft inactivity sweep runs daily. Drafts with `updated_at` older than 90 days move to retired with `draft_inactive`.
- Sweeps process at most 500 records per run and use compare-and-set on `revision`. A record whose revision changed since the sweep read is skipped and picked up on the next run.

## Consent and revocation
- Publish, resume and renew are consent to appear in the public catalog. Pause and retire are revocation and take effect for search within 60 seconds (search index refresh budget, see observability).
- Moderation removal and participant closure are involuntary transitions to retired. The owner receives a `SkillOfferRetired` event with the reason code and no moderator identity.
- A blocked participant (F16 signal) keeps its states unchanged. Search hides their published offers and writes are rejected. Unblocking restores visibility with no state change.

## Concurrency and compensation
- Every owner command carries `expected_revision`. A mismatch returns `SKILLS_REVISION_CONFLICT`. Sweeps use the same compare-and-set.
- Duplicate publish with the same idempotency key returns the stored result and does not write again.
- Single-aggregate transitions have no saga or compensation. If the transaction fails, nothing is written. If the outbox write fails after commit, the outbox retries (see failure file). A transition is never reversed by a later command; corrections use a new revision.

## Assumptions
- A-skills-09: Expiry is 180 days after publish or renew. Draft inactivity is 90 days. Paused offers keep `expires_at` frozen; resume after expiry is rejected with `SKILLS_OFFER_EXPIRED`, which forces renew.
- A-skills-10: Quota is 5 published and 20 non-retired offers per participant.
- A-skills-11: A blocked participant's offers are hidden from search by a flag, not by a state change, so unblocking is lossless.

## Open decisions
- D07 (retention): whether retired offers keep a tombstone and for how long (see privacy file). Not decided here.
- D10 (auth and portability): recovery of offers after account loss is not defined; this state machine assumes the same participant_id is preserved.

## Testing
- TEST-PS-029-03-T01: Every row in the state table is exercised by a test that asserts the target state and revision. Pass when all allowed transitions succeed and all disallowed ones return `SKILLS_STATE_TRANSITION_INVALID`.
- TEST-PS-029-03-T02: Sweep vs owner-edit race: a sweep and an update run on the same record with the same revision. Pass when exactly one wins and the loser returns or skips without a second write.
- TEST-PS-029-03-T03: `retired` has no outbound transition. Pass when every command and sweep against a retired offer is rejected and the row is unchanged.
- TEST-PS-029-03-T04: Paused offer is not swept to expired after `expires_at` passes; resume after expiry returns `SKILLS_OFFER_EXPIRED`. Pass on both.
- TEST-PS-029-03-T05: Publish with quota at 5 published returns `SKILLS_QUOTA_EXCEEDED` and writes nothing. Pass when the state and the transition table are unchanged.
