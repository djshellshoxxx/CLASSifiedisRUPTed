# F01.S01.M03 — Listing publication

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-004-01…PS-004-10. **Code:** `packages/bazaar/src/listings/publish`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Turns a local draft into a public offer to the world. Publishing runs local policy checks (prohibited-item rules and jurisdiction notices from F18, local spam heuristics), then signs a public projection of the listing as a classrup.bazaar.listing/v1 statement (CTR-FED-001 envelope, Ed25519 over JCS) and queues it to the relays the user selected. Unpublishing signs a tombstone. Each destination relay applies its own hosting policy and may refuse or remove the projection; the owner sees per-relay sync state (prepared, transport_acknowledged, peer_accepted) and never more certainty than that. Copies already fetched by other vaults cannot be recalled.

## Responsibilities

- [object Object]
- Evaluate prohibited-item rules (F18.S01.M02), jurisdiction notices (F18.S01.M01) and local spam heuristics before signing; block, hold for owner confirmation, or allow.
- Sign and queue the listing projection (maximum location L2, EXIF-free media, federation opt-in flag) and tombstones through the sync outbox.
- Renew a publication (last 7 days of life, +30 days, maximum 3 renewals and 120 days in total).
- Record optional per-relay promotion purchased by a payment claim (F09), active only after that relay's signed acknowledgement.
- React to relay hosting notices and policy pack changes without claiming any global takedown.

## Not responsible for

- Listing record and status field (F01.S01.M01); this module requests changes through apply_status.
- Expiry sweep, archive, restore and close (F01.S01.M04), which calls bazaar.publication.end here before closing or archiving.
- Relay-side indexing, ranking and hosting decisions (F06 and F12 on the relay); this module only submits and records outcomes.
- Payment handling (F09.S01.M01); promotion uses a payment claim between the user and the relay operator, never platform custody.
- Federation transport between relays (F11).
- Future: scheduled publication at a chosen time; multi-author shop accounts.

## User stories

- As a seller, I publish a listing to one or more relays I choose and see for each relay whether it was only sent, received by the relay, or accepted.
- As a seller, if a rule blocks my listing I see which policy reason applies and what to change.
- As a seller, I can unpublish and understand that people who already saw it may still have a copy.
- As a seller, I can pay a relay operator for a promoted slot and see it only after that relay confirms.

## Edge cases

- Listing text matches a review-level rule; the owner sees the notice, must confirm explicitly, and the confirmation is recorded in the PublicationRecord.
- Listing has no region cell or no sell terms for its kind; publish is refused with a specific code before any signing.
- A relay rejects the projection under its own hosting policy; that delivery becomes relay_rejected with the relay's signed reason; other relays are unaffected and the local publication stays active.
- The policy pack is updated while publications are active and a new block rule matches; the publication is ended locally with reason policy_changed and a tombstone is queued.
- The same publish command is replayed after a crash; the original PublicationRecord is returned and exactly one statement exists in the outbox.
- The device clock is wrong by more than 24 h; publish refuses with PRECONDITION_FAILED because expiry and ordering would be misleading.
- Federation opt-in is set but the tenant federation flag is off; the statement is signed without federation export and the UI says so.
- Promotion claim is never acknowledged within 14 days; promotion state becomes expired and the listing stays published unpromoted.

## UX and accessibility

- Publish review sheet: summary of what becomes public (title, text, photos, price, L2 area), expiry selector 1 to 90 days, relay chooser with each relay's hosting policy link, federation opt-in toggle, required notices checklist.
- Policy result sheet: verdict (blocked, needs confirmation, allowed) with localized reason keys and a Fix action.
- Publication status card: per-relay state chips (prepared, relay received, accepted, rejected by relay) and an honest note that copies already fetched cannot be recalled.
- Promotion sheet: tiers boost_7d and boost_14d, price from the chosen relay, payment claim steps, status.

**States:** loading; blocked; needs-confirmation; prepared; transport-acknowledged; peer-accepted; relay-rejected; unpublished; expired; offline-pending

**Accessibility:** State chips use text plus icon and are announced in an aria-live polite region when they change.; The review sheet is a dialog with focus trap and a visible heading; all actions are at least 44x44 px.; Policy reasons are plain-language sentences, not codes.

## Owned data

- `PublicationRecord` (classrup.bazaar.publication/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.publication.publish`, `bazaar.publication.confirm`, `bazaar.publication.unpublish`, `bazaar.publication.end`, `bazaar.publication.renew`, `bazaar.publication.attach_promotion`
- Queries: `bazaar.publication.get`, `bazaar.publication.list_mine`, `bazaar.publication.preview_policy`
- Emits: `bazaar.listing.published`, `bazaar.listing.unpublished`, `bazaar.publication.renewed`, `bazaar.publication.promotion_activated`
- Consumes: `bazaar.listing.expired`, `governance.prohibited_rule.changed`, `governance.category.changed`, `moderation.action.applied`, `moderation.action.reverted`, `commerce.payment.acknowledged`

## Dependencies

F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-004-01 | [Domain schema](domain_schema.md) | 3 |
| PS-004-02 | [Validation rules](validation_rules.md) | 3 |
| PS-004-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-004-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-004-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-004-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-004-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-004-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-004-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-004-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/publish/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- No projection contains data beyond the P0 allowlist or a region finer than L2.
- No UI or API reports transport_acknowledged or peer_accepted without a verified signed receipt, and no text claims global removal.
