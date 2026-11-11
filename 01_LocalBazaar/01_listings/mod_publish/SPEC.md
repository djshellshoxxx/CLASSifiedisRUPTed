# F01.S01.M03 — Listing publication

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-004-01…PS-004-10. **Code:** `packages/bazaar/src/listings/publish`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Turns a local draft into a public offer to the world. Publishing runs local checks before anything leaves the vault (prohibited-item rules and jurisdiction notices from F18, local spam heuristics, the in-process risk assessment of F12.S03.M01, the federation consent purpose of F10.S01.M01 and the public-cell assertion of F06.S02.M01, plus the deletion guard of F10.S01.M04), then builds a public projection of the listing as a classrup.bazaar.listing/v1 statement with an exact allowlist of P0 keys, distinct from the private vault record classrup.bazaar.listing_record/v1, and hands it to the StatementPublisherPort (declared by F11.S01.M01, implemented by F11.S01.M02 federation.record.publish), which signs it (CTR-FED-001 envelope), allocates seq and prev and routes it through the F15.S01.M01 sync outbox to the relays the user selected, named by their canonical relayId (F15.S02.M01). Unpublishing issues a tombstone through federation.tombstone.issue. Each destination relay applies its own hosting policy and may refuse the projection (relay_rejected) or remove it later with a signed classrup.federation.relay_removal/v1 advisory; either changes only that relay's delivery state, never the owner's records. The owner sees per-relay sync state (prepared, transport_acknowledged once the relay's verified receipt completes the sync outbox entry, relay_rejected, relay_removed) and never more certainty than that; a public projection has no peer acknowledgement and is never shown as peer_accepted. A rule pack change that blocks a live publication only holds it for its owner (policy_attention); nothing is unpublished or tombstoned until the owner confirms. Optional promotion is a relay-local policy whose fee is claimed through a noncustodial Deal and is shown only after the relay signs it. Copies already fetched by other vaults cannot be recalled.

## Responsibilities

- [object Object]
- Evaluate prohibited-item rules (F18.S01.M02 governance.prohibited_rule.evaluate with the selected ProfileRefs), jurisdiction notices (F18.S01.M01 governance.jurisdiction_profile.resolve over ProfileRef {publisherId, code}), local spam heuristics (moderation.spam.evaluate of F12.S02.M02 in mode author_presign, N19), the risk assessment (moderation.risk.assess of F12.S03.M01 with subjectType listing_publication, levels low, medium and high, N19), the federation consent purpose (F10.S01.M01, N6), the public-cell assertion (F06.S02.M01, N8), photo descriptions (F14.S01.M02) and the deletion guard privacy.deletion.assert_not_pending (F10.S01.M04) before anything is published; block, hold for owner confirmation, or allow.
- Build the projection from an exact P0 allowlist (maximum location L2, EXIF-free media with author alt text, mailbox hints, the vault tenantId for thread derivation, barterAcceptable, in-stock flag, kind-specific public subsets) and publish it and its tombstones only through the StatementPublisherPort (federation.record.publish and federation.tombstone.issue of F11.S01.M02, which allocate seq and prev atomically); this module keeps no signing path and no seq counter of its own.
- Renew a publication (last 7 days of life, +30 days, maximum 3 renewals and 120 days in total), also on request of the F01.S01.M04 expiry deferral.
- Record optional per-relay promotion whose fee is claimed through a Deal with the relay operator (F09), active only on that relay's signed promotion statement and revocable by it.
- Act on relay-signed classrup.federation.relay_removal/v1 advisories, hosting reversals and promotion statements after F11.S01.M02 verified them, quarantine anything not signed by the relay of that delivery, and react to policy pack changes by holding a newly blocked publication in policy_attention for its owner (owner notified, reminder after a grace of at least 7 days, renewals and re-publication of the unchanged revision stopped, tombstone only after the owner confirms), without claiming any global takedown.
- Derive each relay's delivery state from the F15.S01.M01 OutboxEntry of the statement (the verified relay receipt that completes the entry, relay_rejected with its reason cid) and never claim more than it shows; classrup.bazaar.listing/v1 has acknowledger none, so a delivery is never peer_accepted.
- Implement the F09.S01.M01 ContextTermsPort {verify, openerRole, ownerRole} for the Deal context type listing_fee (N5).
- Record the policy evidence of every evaluation as the F18.S01.M02 evaluate result names it (packs [{publisherId, packVersion, packCid}], packsDigest, matched rules with their publisherId) and the jurisdiction profiles as ProfileRef {publisherId, code}.

## Not responsible for

- Listing record and status field (F01.S01.M01); this module requests changes through apply_status and never because of a relay notice.
- Expiry sweep, archive, restore and close (F01.S01.M04), which calls bazaar.publication.end here before closing or archiving.
- Relay-side indexing, ranking and hosting decisions (F06 and F12 on the relay); this module only submits and records outcomes.
- Payment handling (F09.S01.M01); promotion uses a Deal and payment claim between the user and the relay operator, never platform custody.
- Variant data, which F01.S03.M02 contributes to the projection through the ProjectionContributorPort it registers here.
- Federation transport between relays (F11), and signing, seq and prev allocation of every statement (F11.S01.M02 behind the F11.S01.M01 StatementPublisherPort).
- Sync outbox entries, retries and receipt verification (F15.S01.M01) and the canonical relay identifiers and relay receipts (F15.S02.M01).
- Future: scheduled publication at a chosen time; multi-author shop accounts.

## User stories

- As a seller, I publish a listing to one or more relays I choose and see for each relay whether it was only sent, received by the relay, or rejected or removed by it.
- As a seller, if a rule blocks my listing I see which policy reason applies and what to change.
- As a seller, I can unpublish and understand that people who already saw it may still have a copy.
- As a seller, I can pay a relay operator for a promoted slot and see 'Promoted on R' only after that relay signs it.
- As a seller, if one relay removes my listing under its policy, my listing stays published on my other relays and I can read that relay's signed reasons.
- As a seller using a screen reader, I am told before publishing which photo still needs a description or a decorative mark.
- As a seller, if a new rule pack blocks one of my live listings, I am told, reminded after a week, and decide myself whether to edit it or unpublish it.

## Edge cases

- Listing text matches a review-level rule; the owner sees the notice, must confirm explicitly, and the confirmation is recorded in the PublicationRecord.
- Listing has no region cell or no sell terms for its kind; publish is refused with a specific code before any signing.
- A relay rejects the projection under its own hosting policy; that delivery becomes relay_rejected with the relay's signed reason; other relays are unaffected and the local publication stays active.
- The policy pack is updated while publications are active and a new block rule matches; the publication moves to policy_attention, the owner is notified and reminded after 7 days, renewal and re-publication of the unchanged revision are refused, and nothing is unpublished or tombstoned until the owner confirms Unpublish or re-publishes an edited revision that clears the verdict.
- The same publish command is replayed after a crash; the original PublicationRecord is returned and exactly one statement exists in the outbox.
- The device clock is more than 24 h off the median of the latest receipts of at least 2 relays; publish refuses with PRECONDITION_FAILED. With only one relay the UI warns instead, and a relay whose receipts run more than 24 h ahead of the median is flagged untrusted and ignored.
- The federation_publish consent for a destination relay is missing (F11.S01.M02 requires it for every public projection; with federationOptIn it also covers relay-to-relay forwarding); publish is refused with BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED and the UI links to the consent screen.
- The risk assessment returns medium for a new key posting many listings; the publication is held for confirmation instead of being published.
- A relay_removal advisory naming relay R2 arrives signed by relay R1 or by a random key; it is quarantined and no delivery changes.
- Photo 2 of a listing has no alt text and is not marked decorative; publish is refused with BAZAAR_LISTING_MEDIA_ALT_MISSING naming the photo, before anything is published.
- The principal requested deletion and another tab publishes during the grace period; publish is refused with PRIVACY_DELETION_PENDING.
- A relay removed the listing; the next publish skips that relay and reports it in skippedRelays instead of failing for every relay.
- Promotion claim is never acknowledged within 14 days; promotion becomes expired and the listing stays published unpromoted.
- The owner unpublishes a listing that has an active deal hold; the command asks for confirmation and the hold stays valid.
- A pack from a compromised publisher blocks every live listing of the vault; each publication only enters policy_attention, stays on its relays, and a later pack that retires the rule clears the attention without any new statement.

## UX and accessibility

- Publish review sheet: summary of what becomes public (exactly the allowlisted fields, L2 area, mailbox hint), expiry selector 1 to 90 days, relay chooser with each relay's hosting policy link, federation opt-in toggle with consent status, required notices checklist.
- Policy result sheet: verdict (blocked, needs confirmation, allowed) with localized reason keys and a Fix action.
- Publication status card: per-relay state chips (prepared, relay received, rejected by relay, removed by relay with its signed reasons; never accepted, because a public projection has no peer acknowledgement) and an honest note that copies already fetched cannot be recalled.
- Promotion sheet: tiers boost_7d and boost_14d, price from the chosen relay, Deal and payment claim steps, states requested, claimed, acknowledged, Promoted on R (only after the relay's signed statement), revoked.
- Policy attention sheet: the new block verdict with each rule's publisher and plain-language reason, the date of the reminder, actions Edit listing and Unpublish (a confirmation dialog), and a note that the listing stays on the selected relays until the owner decides.

**States:** loading; blocked; needs-confirmation; prepared; transport-acknowledged; policy-attention; relay-rejected; relay-removed; unpublished; expired; frozen-fork; offline-pending; clock-warning

**Accessibility:** State chips use text plus icon and are announced in an aria-live polite region when they change.; The review sheet is a dialog with focus trap and a visible heading; all actions are at least 44x44 px.; Policy reasons are plain-language sentences, not codes.

## Owned data

- `PublicationRecord` (classrup.bazaar.publication/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.publication.publish`, `bazaar.publication.confirm`, `bazaar.publication.unpublish`, `bazaar.publication.end`, `bazaar.publication.renew`, `bazaar.publication.attach_promotion`, `bazaar.publication.receive_relay_notice`
- Queries: `bazaar.publication.get`, `bazaar.publication.list_mine`, `bazaar.publication.preview_policy`
- Emits: `bazaar.listing.published`, `bazaar.listing.unpublished`, `bazaar.publication.renewed`, `bazaar.publication.promotion_activated`, `bazaar.publication.policy_attention`
- Consumes: `bazaar.listing.expired`, `governance.prohibited_rule.changed`, `governance.category.changed`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.finalized`, `federation.conflict.detected`, `federation.conflict.resolved`, `commerce.payment.reorged`, `commerce.payment.expired`, `commerce.payment.failed`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-004-01 | [Domain schema](domain_schema.md) | 6 |
| PS-004-02 | [Validation rules](validation_rules.md) | 9 |
| PS-004-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-004-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-004-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-004-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-004-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-004-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-004-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-004-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/publish/index.ts`.

## Acceptance criteria

- All tests T01-T30 pass in CI.
- No projection contains data beyond the P0 allowlist or a region finer than L2, and no projection is published with a photo that lacks both alt text and a decorative mark.
- No UI or API reports transport_acknowledged or Promoted without a verified signed receipt or relay statement, no publication delivery is ever shown as peer_accepted, no relay notice changes the owner's Listing, and no text claims global removal.
- A rule pack or category change never unpublishes, ends or tombstones a publication without its owner's confirmation; it only holds it in policy_attention with a reminder after at least 7 days.
