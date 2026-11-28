# PS-004-02 — Validation rules: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-02.R01** Publication is allowed only for a complete listing whose kind-specific terms exist and whose region is at least L1.
- **PS-004-02.R02** Policy checks run in the vault before signing and cannot be skipped by the caller.
- **PS-004-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-004-02.R04** Before anything leaves the vault, publish runs the in-process spam evaluation moderation.spam.evaluate in mode author_presign and the risk assessment moderation.risk.assess {subjectType listing_publication, publication {draftId, spamScore, publicationsLast24h}} (N19), the federation_publish consent check for every destination relay, which F11.S01.M02 requires for any public projection and which with federationOptIn also covers relay-to-relay forwarding (N6), and assertPublicCell on the region (N8); a risk level of medium or high, which already weighs the spam score, holds the publication for owner confirmation.
- **PS-004-02.R05** The clock sanity check trusts no single relay: it compares the device clock with the median of the latest receipts from at least 2 distinct relays in the last 7 days, discards receipts more than 24 h ahead of that median and flags their relay untrusted, and only warns when fewer than 2 relays are available (ADR-0016 §5).
- **PS-004-02.R06** Unpublishing a listing that has active local inventory holds requires explicit owner confirmation; the holds stay valid and are listed.
- **PS-004-02.R07** Publication refuses a photo that has neither non-empty alt text nor decorative true with BAZAAR_LISTING_MEDIA_ALT_MISSING (params.mediaIndexes), before the risk assessment and before anything is published; F14.S01.M02 relies on this rule and its end-to-end suite.
- **PS-004-02.R08** Publish, confirm and renew call privacy.deletion.assert_not_pending (F10.S01.M04) first and refuse with PRIVACY_DELETION_PENDING while a deletion request of the principal is pending, deferred, executing or failed.
- **PS-004-02.R09** While a publication is in policy_attention, renewal (also when the F01.S01.M04 expiry deferral asks for it) and re-publication of the unchanged revision are refused with BAZAAR_PUBLISH_POLICY_ATTENTION; only a newer revision that passes every check may be published, and jurisdiction profiles are named only as ProfileRef {publisherId, code}.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | listing status is draft, unpublished or expired, or published with its live publication active or in policy_attention and a listing revision newer than the signed listingRevision (re-publication in place after an F01.S01.M02 edit); relays whose delivery for this listing has hostingRemoved are dropped from relayIds and reported in skippedRelays, and only an empty remaining relay list is refused | BAZAAR_PUBLISH_NOT_ALLOWED |
| V02 | title >= 3 and description >= 10 code points; kind sell has SellTerms, wanted has WantSpec, giveaway has GiveawayTerms | BAZAAR_PUBLISH_INCOMPLETE |
| V03 | regionCell present with length 4 or 5 and no media ref has a GPS tag | BAZAAR_PUBLISH_INCOMPLETE |
| V04 | category is active and, if restricted under the selected ProfileRefs (governance.jurisdiction_profile.resolve of F18.S01.M01 with profileRefs [{publisherId, code}]), notices are acknowledged | BAZAAR_PUBLISH_BLOCKED |
| V05 | verdict of governance.prohibited_rule.evaluate {kind, categoryId, title, description, tags, profileRefs} (F18.S01.M02) is not block; its packs, packsDigest and matches with publisherId are stored | BAZAAR_PUBLISH_BLOCKED |
| V06 | verdict review or risk level medium or high requires ownerConfirmedAt; a re-publication in place records it from confirmedRules covering every matched review rule and confirmedRisk | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V07 | expiresInDays between 1 and 90 | VALIDATION_FAILED |
| V08 | 1 to 10 destination relays, each a user-selected relay known to the vault with a pinned signing key and named by its canonical relayId (relay: plus 26 lowercase base32 characters, F15.S02.M01) | VALIDATION_FAILED |
| V09 | vault has fewer than 100 active publications | BAZAAR_PUBLISH_LIMIT |
| V10 | publish and renew: device clock within 24 h of the median of the latest receipts from at least 2 distinct relays in the last 7 days, after discarding receipts more than 24 h ahead of that median (their relay is flagged untrusted); with fewer than 2 relays the UI warns and the command proceeds | PRECONDITION_FAILED |
| V11 | renew only in the last 7 days of life (or at expiry when requested by the F01.S01.M04 deferral), renewals < 3 and total life <= 120 days | BAZAAR_PUBLISH_RENEW_NOT_ALLOWED |
| V12 | moderation.risk.assess (F12.S03.M01, N19) called with { subjectType: listing_publication, publication: { draftId: listingId, spamScore (score of moderation.spam.evaluate), publicationsLast24h (own PublicationRecords of the last 24 h) } } returns level low; medium or high moves the record to held_for_confirmation before anything is published | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V13 | privacy.consent.check {purpose federation_publish, relayId} returns granted for every destination relay before the projection is handed to federation.record.publish, which re-checks it (F11.S01.M02 V13); federationOptIn true additionally lets those relays forward the projection to their federation peers (N6) | BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED |
| V14 | assertPublicCell(regionCell) of F06.S02.M01 accepts the cell (N8) before the projection is built | DISCOVERY_PRECISION_FORBIDDEN |
| V15 | unpublish of a listing with active local holds (F01.S03.M01 list_holds) requires confirmHolds true | BAZAAR_PUBLISH_HOLDS_ACTIVE |
| V16 | relay_removal advisory, hosting reversal or promotion statement: verified by F11.S01.M02 and signed by the pinned key of deliveries[].relayId (rotation only when signed by the previous key), its target statementCid or listingId belongs to this publication, and its cid is new | VALIDATION_FAILED |
| V17 | the built projection's key set equals the allowlist exactly and maxBudget is present only when budgetVisible is true | VALIDATION_FAILED |
| V18 | every media entry of the listing has alt text of 1..140 code points or decorative true | BAZAAR_LISTING_MEDIA_ALT_MISSING |
| V19 | publish, confirm and renew: privacy.deletion.assert_not_pending (F10.S01.M04) returns ok | PRIVACY_DELETION_PENDING |
| V20 | moderation.spam.evaluate is called with { mode: author_presign, subjectKey: the author did:key, targetType: listing_publication, targetId: listingId, text: title and description, links, receivedAt }; a degraded result is treated as risk level medium | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V21 | publication in policy_attention (checked before V01 and V11): renew (owner or expiry_deferral) is refused, and publish is accepted only for a listing revision newer than policyAttention.blockedRevision | BAZAAR_PUBLISH_POLICY_ATTENTION |
| V22 | publish and preview_policy name jurisdiction profiles only as profileRefs, 1..3 distinct ProfileRef {publisherId (did:key), code ^[a-z0-9_-]{2,40}$}; confirmedRules entries are {publisherId, ruleKey}; packs holds 1..20 entries and packsDigest equals sha256-JCS(packs) | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T03 | unit | PS-004-02.R01, PS-004-02.R02, PS-004-02.R03 | violate each rule V01-V22 | documented error code returned, no statement published |
| TEST-PS-004-09.T13 | integration | PS-004-03.R01, PS-004-03.R05, PS-004-02.R09, PS-004-04.R08 | governance.prohibited_rule.changed adds a block rule matching active L; renew and publish of the unchanged revision; 6 days, then 7 days pass; the owner edits L so the verdict clears and publishes it; in a second run the owner confirms Unpublish; in a third run a later pack retires the rule | L moves to policy_attention with bazaar.publication.policy_attention raised for ownerId and no unpublish, end or federation.tombstone.issue call; renew and unchanged publish refused with BAZAAR_PUBLISH_POLICY_ATTENTION; no reminder at day 6, one at day 7; the edited revision is published and the attention resolved as edited; the confirmation unpublishes with reason policy_changed and only then issues the tombstone; the retirement returns L to active as verdict_cleared without a new statement |
| TEST-PS-004-09.T19 | integration | PS-004-02.R04 | spam stub (moderation.spam.evaluate, mode author_presign) scores 72 and risk stub (moderation.risk.assess with subjectType listing_publication and publication {draftId, spamScore 72, publicationsLast24h}) returns medium, then high, then a degraded spam result; publish without federation_publish consent for R1 (federationOptIn false); regionCell of 6 characters injected past the record check | held_for_confirmation and nothing published in the first three cases with riskLevel medium or high recorded; BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED; DISCOVERY_PRECISION_FORBIDDEN; nothing queued in each case |
| TEST-PS-004-09.T20 | abuse | PS-004-02.R05 | R3 returns receipts 3 days in the future while R1 and R2 agree with the device; then only R3 is configured | R3 flagged untrusted and publish succeeds; with R3 alone the command proceeds with clockWarning instead of PRECONDITION_FAILED |
| TEST-PS-004-09.T21 | integration | PS-004-02.R06 | unpublish L with an active deal hold without and with confirmHolds | BAZAAR_PUBLISH_HOLDS_ACTIVE first; then unpublished with the hold still active and listed |
| TEST-PS-004-09.T23 | e2e | PS-004-02.R07 | on a mobile profile the seller publishes M (photo 2 without alt and not decorative), adds a description, then publishes again; L with a decorative photo is published | first publish refused with BAZAAR_LISTING_MEDIA_ALT_MISSING naming photo 2 and the review sheet announces it; second publish active; decorative photo accepted; axe reports zero serious issues; F14.S01.M02 T16 relies on this suite |
| TEST-PS-004-09.T24 | integration | PS-004-02.R08 | deletion guard stub reports a pending request, then publish, confirm and renew; then the request is cancelled | each refused with PRIVACY_DELETION_PENDING and nothing published; after cancellation publish succeeds |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
