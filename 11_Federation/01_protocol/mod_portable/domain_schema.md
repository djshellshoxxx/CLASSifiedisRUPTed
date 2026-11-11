# PS-083-01 — Domain schema: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-01.R01** The module owns no stored entity; it defines allowlist tables, the statement-type registry and draft value types keyed by envelope type string.
- **PS-083-01.R02** Allowed payload fields per type are listed in code and in the schema registry and each is annotated P0 by F10.S02.M02; a field without an annotation is not exportable.
- **PS-083-01.R03** Location is carried only as a geohash string of length ≤ 5 plus locationLevel L1 or L2, never coordinates; finer cells are snapped to their containing L2 cell before the F06.S02.M01 assertPublicCell check.
- **PS-083-01.R04** The statement-type registry is static versioned data that names, for every registered envelope type, the audience, the signer role a receiving vault must verify before acting on the statement, how that role is resolved, the payload schema, the optional subject key and commitment predicate used by F11.S02.M03, and the maximum age used by F11.S01.M02 V08.
- **PS-083-01.R05** Relay roles resolve only through relay keys pinned in F11.S03.M01 or, for relay_identity roles, through the self-certifying relay key history of F15.S02.M01, and user roles only through the author principal's portable identity document (F07.S02.M01), so a relay key never satisfies a user role and a user key never satisfies a relay role.
- **PS-083-01.R06** Unregistered types, and registered types whose role cannot be resolved, are quarantined by receivers with FEDERATION_SIGNER_ROLE_INVALID; the registry check (V01) is separate from the portable-allowlist check (V08), which applies only to audience public portable types.
- **PS-083-01.R07** The StatementPublisherPort (publish and issueTombstone) is declared here and implemented by F11.S01.M02, so every producer (F01, F03, F07, F11.S03.*) signs through the single F11.S01.M02 path that allocates seq and prev, without a dependency cycle.
- **PS-083-01.R08** Every timestamp member of a public portable payload and the envelope createdAt are floored to the UTC hour with F10.S02.M03 publicTime (busy-block interval ends are raised to the next full hour so a busy interval never shrinks), and an author's records are ordered by the registry version member or the per-chain seq, never by time.
- **PS-083-01.R09** Every registry entry also names its acknowledger (counterparty, destination_relay or none) and the privacy class F10.S02.M02 registers for its payload schema, both read through entryFor(type) by the F15.S01.M01 sync outbox, and the compiled registry is exported as machine-readable data with one row per type.
- **PS-083-01.R10** roleFor(type, context) is the implementation of the F16.S01.M01 RoleResolverPort; the vault composition root injects it into F16.S01.M01 authorizeStatement, so F16.S01.M01 needs no dependency on this module and F11.S01.M02 calls only authorizeStatement.
- **PS-083-01.R11** Audience community addresses a statement to one hosting relay that serves it only to that relay's authenticated members; it is never indexed publicly, never sent relay to relay and never routed by F11.S02.M01, its owner module sends it to the hosting relay as a relay command, and its registry defaults are acknowledger destination_relay and privacy class P1.
- **PS-083-01.R12** Delegated roles resolve only through the injected delegations resolver over the publisher's verified authority lists (registered by F18.S02.M01) and relay operator context roles only through the injected operatorKeys resolver over the relay's latest verified tenant_config (registered by F15.S04.M03), both by inverted registration at composition without a depends_on edge, and a missing resolver, list or tenant_config resolves no role so the statement is quarantined with FEDERATION_SIGNER_ROLE_INVALID.

## Specification

**Note:** Pure mapping library; allowlists and the registry are static data versioned with the schema registry and nothing is persisted here.
Statement-type registry (F11 types, the five portable types and the entries other modules contributed per N2, compiled into one registry at build time and exported as statement-registry.json). Each entry is {type, owner, audience, signerRole, roleResolution, payloadSchema, subjectKey?, version?, commitment?, maxAge, acknowledger, privacyClass, aliasOf?}.
Role resolution kinds: "principal" means the envelope author is a principal did:key and ext.signerKey is a device key active in that principal's latest verified portable document (F07.S02.M01 key_status at receiver time); "relay" means the author is a relay did:key pinned in F11.S03.M01 (current key, or previous key inside the 7-day rotation overlap); "relay_identity" means a key in the self-certifying key history of the relayId (F15.S02.M01: relayId derived from the genesis key, every rotation signed by the previous key), active or retired and not revoked at receipt; "named relay" means a relay or relay_identity key that also equals the relay or key the statement's context names (payload relayId, the hostKeyId of verified auction terms, the relay where a consent was registered); "subscription" means the publisher key (principal or relay) of an advisory feed the vault subscribed to. Context roles (party, participant, giver, opener, mediator) are evaluated by roleFor from the context the caller supplies (subject record, terms, head revision) on top of the key resolution. "delegated" (delegated by publisher authority_list) means principal resolution of the author plus a delegation returned by the injected delegations resolver: the author is listed with the role the row names in the latest verified classrup.governance.authority_list/v1 of payload.publisherId, under the row's anchoring condition, and the author differs from payload.publisherId; the delegations resolver is registered by F18.S02.M01 at vault composition (inverted registration, because F18.S02.M01 depends on this module). The context role "relay operator" means principal resolution of the author plus membership of the author in operatorKeys of the latest verified classrup.platform.tenant_config/v1 of the relay the statement names, read through the injected operatorKeys resolver registered by F15.S04.M03 at composition. A missing resolver, authority list or tenant_config resolves no role.
Defaults for every entry unless its row overrides them: audience participants gives acknowledger counterparty (a recipient signs classrup.federation.ack/v1) and privacy class P2; audience relay (addressed to one named relay) gives acknowledger destination_relay (that relay signs classrup.federation.ack/v1 or the owner's named acknowledgement) and P1; audience community (addressed to one hosting relay that serves it only to its authenticated members; never indexed publicly, never sent relay to relay through /fed/v1/inbox and never routed by F11.S02.M01; the owner module sends it to the hosting relay as a relay command through the F15.S01.M01 outbox) gives acknowledger destination_relay (the hosting relay's acceptance receipt named by the owner module) and P1; audience public, relay to relay and relay-local give acknowledger none and P0 (relay-local statements are never queued). The privacy class is the class F10.S02.M02 registers for the payload schema, and the CI registry check fails on a mismatch with the default. maxAge is none unless stated (F11.S01.M02 V08 then checks only the future skew).

F11 and portable entries:

| Type | Audience | Signer role (resolution) | Payload schema | Subject key and version | Class | Ack | Privacy | maxAge |
|---|---|---|---|---|---|---|---|---|
| classrup.bazaar.listing/v1 | public | author: listing author (principal) | listing allowlist | recordKey payload.listingId; version payload.listingRevision | public_projection | none | P0 | 120 d |
| classrup.identity.profile/v1 | public | author: profile owner, author = payload.did (principal) | profile allowlist | recordKey payload.did | public_projection | none | P0 | 400 d |
| classrup.services.offering/v1 | public | author: provider = payload.providerId (principal) | offering allowlist | recordKey payload.offeringId; version payload.seq | public_projection | none | P0 | 400 d |
| classrup.rentals.offering/v1 | public | author: owner = payload.ownerId (principal) | rental offering allowlist | recordKey payload.offeringId; version payload.revision | public_projection | none | P0 | 400 d |
| classrup.rentals.busy_blocks/v1 | public | owner of the offering (principal) | busy-blocks allowlist | recordKey busy:payload.offeringId; readers keep the union of unexpired summaries | public_projection | none | P0 | 24 h |
| classrup.federation.tombstone/v1 | audience of the target | target author: author equals the target record's author principal (principal); binding deletion; never a relay key | {target: cid or recordKey, reason} | target | control | as target | P0 | none |
| classrup.federation.relay_removal/v1 | public | hosting relay whose index held the item (relay); advisory only | {target, relayId, reasonCode, statementOfReasons ≤ 2000 chars} | target | advisory | none | P0 | none |
| classrup.federation.ack/v1 | participants | recipient: a principal named in ext.recipients of the acknowledged statement (principal); for an audience relay statement the addressed relay (named relay) | {ackedCid, ackedType} | ackedCid | control | none | P2 | 60 d |
| classrup.federation.peer_offer/v1 | relay to relay | proposing relay, self-certifying key confirmed by fingerprint (relay) | {relayId, baseUrl, relayKey, direction, targetRelayId} | none | control | none | P0 | 14 d |
| classrup.federation.peer_accept/v1 | relay to relay | accepting relay: key pinned for the offer target (relay) | {offerCid, relayId, relayKey} | none | control | none | P0 | none |
| classrup.federation.key_rotation/v1 | public | current pinned relay key (old key) (relay) | {relayId, newKey, effectiveAt} | none | control | none | P0 | none |
| classrup.federation.relay_identity/v1 | public | the relay key named in the payload (relay, self-certifying) | {relayId, baseUrl, relayKey, hostingPolicy} | none | control | none | P0 | 30 d |
| classrup.federation.blocklist/v1 | public | any publisher, advisory, never applied without review (principal or relay) | {title, entries ≤ 10000} | none | advisory | none | P0 | 180 d |
| classrup.federation.move/v1 | public | account move: device key of the subject (principal); relay move: pinned relay key (relay) | {subject, kind, fromRelay, toRelay, announcedAt} | move:subject | commitment (identity) | none | P0 | 210 d |
| classrup.federation.move_cancel/v1 | public | device key of the subject; a veto needs a key other than the move signer (principal) | {moveCid, subject} | move:subject | control | none | P0 | 210 d |

Allowlists (closed key sets; every member classified P0 by F10.S02.M02; every timestamp member floored with publicTime):
- classrup.bazaar.listing/v1 (F01.S01.M03): listingId, kind, title, description, categoryId, condition?, mediaRefs, tags, locale, regionCell (length 4 or 5), subtypeRef? (service, rental, auction), listingRevision, publishedAt, expiresAt, inStock (boolean from F01.S03.M01 at signing), barterAcceptable, mailboxHints [1..3 {relayId, mailboxId}], federationOptIn, variants? [{variantId, label, attributes, price?, inStock}] (F01.S03.M02), and one kind subset: sell {askingPrice, acceptedCurrencies, paymentMethods, cryptoAssets?, negotiable, pickup, delivery, deliveryNote?}; want {categoryId, keywords, minCondition, quantityWanted, barterAcceptable, barterNote?, maxDistanceBucket?, neededBy?, maxBudget? only when the WantSpec has budgetVisible true}; giveaway {selectionMode, queueLimit, closesAt?}. Never minOffer, pickupNote, quantities, holds, status, closeReason, drafts, offers or any P1 to P4 field.
- classrup.identity.profile/v1: the profile allowlist of F07.S02.M01.
- classrup.services.offering/v1 (F03.S01.M01): offeringId, providerId, listingId, skillCodes, rateType, rate, minBillableMinutes, serviceAreaCell (L2), providerTimeZone, remoteCapable, credentials [{label, issuer, year?, attestation}] (evidenceAttachmentId and every other evidence reference excluded), seq and prev (the offering's own projection sequence, separate from the envelope chain seq and prev), publishedAt.
- classrup.rentals.offering/v1 (F05.S01.M01): offeringId, ownerId, listingId, rates, quantity, durations, buffers, leadTimeMinutes, horizonDays, timeZone, blackoutDates, lateFee, cancellationPolicy, declaredValue, checklistTemplate labels only, pickupAreaCell (L2), revision.
- classrup.rentals.busy_blocks/v1 (F05.S01.M01): offeringId, fromUtc, toUtc (≤ 365 days apart), intervals [{start, end, unitsBusy}] (≤ 500, no identities); interval starts floored and ends raised to the full hour.

Contributed entries (N2), registered on request of their owner modules; payload schemas are owned there and defaults above apply unless stated:

| Owner | Types | Audience | Signer role (resolution) | maxAge |
|---|---|---|---|---|
| F01 | classrup.bazaar.promotion/v1 | public | operator key of payload.relayId (named relay) | none |
| F01 | classrup.bazaar.offer/v1, offer_withdrawal/v1 | participants | buyer (principal) | none |
| F01 | classrup.bazaar.offer_decision/v1 | participants | listing author (principal) | none |
| F01 | classrup.bazaar.negotiation_round/v1 | participants | proposer, buyer or seller of the chain (principal) | none |
| F01 | classrup.bazaar.negotiation_close/v1 | participants | closing party (principal) | none |
| F01 | classrup.bazaar.negotiation_confirm/v1 | participants | seller (principal) | none |
| F01 | classrup.bazaar.negotiation_accept/v1 | as consent | alias of classrup.comms.consent/v1 (F08.S02.M02): verified with that entry's audience, role, schema and predicate (aliasOf) | as consent |
| F01 | classrup.bazaar.giveaway_request/v1, giveaway_withdrawal/v1 | participants | requester (principal) | none |
| F01 | classrup.bazaar.giveaway_selection/v1, giveaway_decision/v1 | participants | listing author (principal) | none |
| F01 | classrup.bazaar.reservation/v1 | participants | listing author, owner of the listed items; with holder.type cycle also a giver in the head revision (principal; head revision checked by F02.S03.M02) | none |
| F01 | classrup.bazaar.reservation_release/v1 | participants | signer of the released reservation (principal) | none |
| F02 | classrup.mutiny.proposal_revision/v1 | participants | party of the subject; coordinator for cycles (principal) | none |
| F02 | classrup.mutiny.proposal_response/v1 | participants | head author, decision withdraw (principal) | none |
| F02 | classrup.mutiny.reservation_release/v1 | participants | signer of the released reservation (principal) | none |
| F02 | classrup.mutiny.cycle_withdrawal/v1 | participants | withdrawing participant (principal) | none |
| F02 | classrup.mutiny.handover_attestation/v1 | participants | by kind: the leg's giver (handed_over, returned), receiver (received, issue_reported) or original giver (return_confirmed) (principal) | none |
| F02 | classrup.mutiny.recovery_action/v1 | participants | participant of the case; an accept counts only from requiredSignerIds (principal) | none |
| F02 | classrup.mutiny.matching_profile/v1 | public | the DID the projection describes (principal) | none |
| F02 | classrup.mutiny.cycle_suggestion/v1 | participants | the relay that computed it (relay); evidence of a relay assertion only | none |
| F02 | classrup.mutiny.item_valuation_projection/v1 | public | item owner (principal) | none |
| F02 | classrup.mutiny.valuation_flag/v1 | participants | kind flag: participant of the named subject; kind ack: item owner (principal) | none |
| F04 | classrup.auctions.auction/v1, auction_cancel/v1 | public | seller key sellerId (principal) | none |
| F04 | classrup.auctions.bid/v1, bid_retraction/v1 | relay (host) | bidder key bidderId (principal) | none |
| F04 | classrup.auctions.non_payment_report/v1 | relay (host) | seller key sellerId (principal) | none |
| F04 | classrup.auctions.second_chance_offer/v1 | participants | seller key sellerId (principal) | none |
| F04 | classrup.auctions.second_chance_response/v1 | participants | nominated candidate key (principal) | none |
| F04 | classrup.auctions.host_acceptance/v1, auction_opened/v1, host_cancel/v1, result/v1 | public | host key named in the auction terms (named relay: hostKeyId of the verified auction/v1) | none |
| F04 | classrup.auctions.bid_receipt/v1, retraction_receipt/v1, bid_outbid/v1, extension/v1, result_disclosure/v1, second_chance_candidates/v1, void/v1, void_rescission/v1 | participants | host key named in the auction terms (named relay) | none |
| F05 | classrup.rentals.offering/v1, busy_blocks/v1 | public | owner (principal); rows in the table above | 400 d, 24 h |
| F05 | classrup.rentals.rental_request/v1, return_report/v1, forfeit_response/v1, damage_response/v1 | participants | renter (principal) | none |
| F05 | classrup.rentals.rental_confirmation/v1, deposit_terms/v1, deposit_release_attestation/v1, forfeit_claim/v1, return_attestation/v1, owner_receipt/v1, late_fee_adjustment/v1, return_waiver/v1, not_returned_declaration/v1, damage_claim/v1, damage_counter_acceptance/v1, damage_withdrawal/v1 | participants | owner (principal) | none |
| F05 | classrup.rentals.rental_cancellation/v1 | participants | renter or owner (principal) | none |
| F05 | classrup.rentals.reservation_frozen/v1 | participants | owner for forks and equivocation; renter for a held late confirmation (principal) | none |
| F05 | classrup.rentals.deposit_withdrawal/v1 | participants | owner for a withdrawal, renter for a decline (principal) | none |
| F05 | classrup.rentals.deposit_dispute_notice/v1, damage_escalation/v1 | participants | the designated opener, owner or renter (principal) | none |
| F05 | classrup.rentals.handoff_report/v1 | participants | owner or renter of the reservation (principal) | none |
| F05 | classrup.rentals.handoff_changes_request/v1, handoff_attestation/v1 | participants | the party that did not author the named report (principal) | none |
| F05 | classrup.rentals.reservation_renegotiation/v1, deposit_renegotiation/v1, return_renegotiation/v1, damage_renegotiation/v1, rental_completion/v1 | participants | owner and renter, each signing a statement over the same cid (principal) | none |
| F06 | classrup.discovery.location_share/v1, location_share_revoke/v1 | participants | sharer = payload.sharerDid (principal) | none |
| F06 | classrup.discovery.ranking_config/v1 | public | relay key (relay) | none |
| F09 | classrup.commerce.deal/v1 | participants | opener role of the context type (principal; openerRole from the F09.S01.M01 ContextTermsPort) | none |
| F09 | classrup.commerce.deal_cancel/v1 | participants | each party for a mutual cancel, the context owner for a unilateral one (principal) | none |
| F09 | classrup.commerce.deal_completion/v1, dispute_mediator_accept/v1, dispute_outcome_accept/v1 | participants | each party (principal) | none |
| F09 | classrup.commerce.payment_claim/v1, cash_terms_accept/v1, cash_terms_decline/v1 | participants | payer (principal) | none |
| F09 | classrup.commerce.payment_ack/v1 | participants | payee; the relay operator DID for context listing_fee (principal) | none |
| F09 | classrup.commerce.payment_dispute/v1, cash_terms/v1, crypto_request/v1, crypto_request_cancel/v1 | participants | payee (principal) | none |
| F09 | classrup.commerce.receipt/v1 | participants | payer or payee of the claim by statementType, through a linked device key (principal) | none |
| F09 | classrup.commerce.dispute/v1, dispute_withdraw/v1 | participants | opener (principal) | none |
| F09 | classrup.commerce.dispute_evidence/v1 | participants | the authoring party (principal) | none |
| F09 | classrup.commerce.dispute_response/v1 | participants | respondent (principal) | none |
| F09 | classrup.commerce.dispute_mediator/v1 | participants | a party (principal) | none |
| F09 | classrup.commerce.dispute_outcome/v1 | participants | a party or the active mediator (principal) | none |
| F09 | classrup.commerce.fx_quote_revocation/v1 | participants | issuerRef of the manual quote (principal) | none |
| F10 | classrup.privacy.consent_statement/v1, consent_withdrawal/v1 | relay (payload relayId) | principal | none |
| F10 | classrup.privacy.deletion_statement/v1 | relay (one relay, payload relayId) | principal | none |
| F10 | classrup.privacy.deletion_notice/v1 | participants (commitment counterparties) | principal | none |
| F12 | classrup.moderation.report/v1, reportwithdrawal/v1, appeal/v1, appealwithdrawal/v1 | relay (addressed relay) | reporter or appellant device key (principal) | none |
| F12 | classrup.moderation.reportreceipt/v1, reportlinked/v1, reportoutcome/v1, reasons/v1, reversal/v1, appealreceipt/v1, appealstatus/v1, appealdecision/v1 (relay key only, no reviewer signature), appealmoot/v1 | participants | addressed relay key (named relay) | none |
| F12 | classrup.moderation.policy/v1 | public | addressed relay key (relay) | none |
| F12 | classrup.moderation.advisory/v1, advisoryretraction/v1 | public | subscribed publisher key (subscription) | none |
| F13 | classrup.notify.channel_consent_statement/v1, channel_withdrawal/v1, quiet_hours_mirror/v1, preference_mirror/v1 | relay (payload relayId) | principal | 400 d |
| F13 | classrup.notify.channel_withdrawal_receipt/v1 | participants (the consenting principal) | relay where the consent was registered (named relay, pinned key chain) | 400 d |
| F15 | classrup.platform.relay_receipt/v1 | participants (the sender, returned in the response; acknowledger none) | relay_identity | none |
| F15 | classrup.platform.relay_rotation/v1, relay_key_revocation/v1, relay_restore/v1, tenant_config/v1 | public | relay_identity | none |
| F16 | classrup.security.role_statement/v1, audit_anchor/v1 | public | relay: the relay's current key (relay) | none |
| F16 | classrup.security.role_approval/v1 | relay-local | principal whose device key is active and who holds an active relay-scope admin role on payload.relayId, confirmed by F16.S01.M01 (principal) | none |
| F16 | classrup.security.incident_notice/v1 | participants | relay (relay); optional successorOf | none |
| F16 | classrup.security.keyrevocation/v1 | public | the revoked key itself or the DID root key (immediate), another active device key of the same principal (7-day pending period), the relay key for relay-owned keys (principal or relay; semantics owned by F16.S02.M02) | none |
| F18 | classrup.governance.policy_proposal/v1, policy_withdrawal/v1, authority_list/v1 | public | publisher, author = payload.publisherId (principal) | none |
| F18 | classrup.governance.taxonomy_pack/v1, rule_pack/v1, jurisdiction_profile/v1, jurisdiction_profile_retirement/v1 | public | publisher, author = payload.publisherId (principal); versioned configuration superseded by version | none |
| F18 | classrup.governance.policy_decision/v1 | public | delegated decider (delegated): listed with role decider in the publisher's latest verified authority list anchored no later than payload.decidedAt, first listed at least 14 d before the proposal's relay receipt (payload.proposalReceipt), author differs from payload.publisherId | none |
| F18 | classrup.governance.policy_cosign/v1 | public | delegated co-signer (delegated): listed with role cosigner or decider in the publisher's latest verified authority list, author equals the coSignerId of the cosigned proposal (context supplied by the caller) and differs from payload.publisherId | 60 d |
| F18 | classrup.governance.policy_comment/v1 | community (members of the hosting relay; acknowledger destination_relay, P1) | comment author (principal) | 45 d |
| F18 | classrup.governance.transparency_counts/v1 | participants (sealed to the requesting operator key and returned in the relay_counter_snapshot response; acknowledger none) | relay named in payload.relayId (named relay: relay_identity key history of F15.S02.M01, current key or previous key inside the 7-day rotation overlap) | 30 d |
| F18 | classrup.governance.transparency_draft/v1 | participants (sealed to the reviewer) | compiler (principal, context relay operator of payload.relayId) | 30 d |
| F18 | classrup.governance.transparency_report/v1 | public | reviewer (principal, context relay operator of the embedded draft's relayId), different from the author of the embedded transparency_draft/v1 | none |

Commitment predicates (subject key and conflict test used by F11.S01.M02 and F11.S02.M03; owning modules confirm their entries): classrup.federation.move/v1 conflicts when two verified moves of one subject are open with different toRelay; classrup.comms.consent/v1 (F08.S02.M02) conflicts when one signer signs the same subjectType, subjectRef and statementKey over different subjectRevisionHash values, which covers two acceptances of one offer and two consents on one proposal; classrup.bazaar.reservation/v1 (F01.S03.M01) conflicts when one signer reserves overlapping items of the same listing to different holders with overlapping unexpired windows; classrup.commerce.deal/v1 (F09.S01.M01) conflicts when one signer signs two different obligation digests for one dealId. Registered ext members: stream, signerKey, audience, recipients [{did, mailboxId}], supersedes, crit (critical-extension list, F11.S01.M03 V08); unknown non-critical ext members are preserved byte-exact within the 4 KiB ext cap and never added by buildDraft.


## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present; drafts carry no seq or prev |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01 | random records with random extra fields and outbound geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 and equal to the prefix of the source cell (snapped); assertPublicCell called once per draft |
| TEST-PS-083-09.T06 | unit | PS-083-01.R02, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-04.R04 | roleFor for every registry row (three portable types and every F11 type) with the correct signer and with a wrong signer of the same key class | correct signer resolves its role; wrong signer yields a rule that makes F11.S01.M02 quarantine; every row has audience, role, resolution, schema and maxAge |
| TEST-PS-083-09.T19 | unit | PS-083-01.R05, PS-083-01.R06 | listing signed by pinned relay key R as author; peer_accept signed by user device key D; type classrup.federation.unknown/v1 | each quarantined with FEDERATION_SIGNER_ROLE_INVALID; V01 runs and fails independently of V08 |
| TEST-PS-083-09.T21 | contract | PS-083-01.R07 | producer stubs (listing publication, profile, offering, peer, blocklist, migration) call StatementPublisherPort.publish and issueTombstone | every call reaches the F11.S01.M02 implementation, which allocates seq; no producer signs through another path |
| TEST-PS-083-09.T22 | unit | PS-083-01.R06, PS-083-02.R03 | tombstone, ack, peer_offer and move payloads, and a participants ciphertext payload of 12288 and 12289 bytes | per-type schemas checked; portable allowlist (V08) and opt-in (V02) never applied to them; 12289 bytes rejected with FEDERATION_PAYLOAD_INVALID |
| TEST-PS-083-09.T23 | unit | PS-083-01.R08, PS-083-02.R05 | listing published at 10:47:12.345 with expiresAt 2026-12-04T10:47:12.345Z; busy block 10:20-11:40; two listing revisions inside one hour; a draft with an undeclared fine timestamp member | createdAt and publishedAt 10:00:00.000Z, expiresAt 2026-12-04T10:00:00.000Z; busy block 10:00-12:00; assertCoarseTime passes; revisions ordered by listingRevision and seq; the undeclared member refused with FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T24 | unit | PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry over every F11 and contributed row | every row has owner, audience, signerRole, roleResolution, payloadSchema, maxAge, acknowledger and privacyClass; participants rows give counterparty and P2, relay-audience rows destination_relay and P1, public rows none and P0 unless the row overrides; aliases carry aliasOf; the export validates against its JSON schema |
| TEST-PS-083-09.T25 | contract | PS-083-01.R10, PS-083-04.R06 | F16.S01.M01 authorizeStatement stub with RoleResolverPort bound to roleFor at composition; module import scan | authorizeStatement receives the role only from roleFor; this module never calls authorizeStatement and F16.S01.M01 has no import of it |
| TEST-PS-083-09.T26 | unit | PS-083-01.R02, PS-083-02.R01 | build drafts for a listing with every kind subset and variants, a service offering with credential evidence, a rental offering and a busy-blocks summary | payload keys equal the closed key sets of the note; offering keeps providerTimeZone, seq, prev and publishedAt and drops evidenceAttachmentId; maxBudget only when budgetVisible; busy blocks carry intervals and unit counts only |
| TEST-PS-083-09.T28 | unit | PS-083-01.R04, PS-083-01.R05, PS-083-04.R04 | roleFor for contributed rows: offer_decision by the buyer, bid_receipt by a relay key not named in the terms, tenant_config by a key outside the relay key history, an advisory by an unsubscribed publisher, negotiation_accept/v1 by the consenting party, reservation with holder cycle by an owner who is not a giver in the head revision | each wrong signer yields a quarantining rule, the correct signer resolves, the alias resolves through the consent entry |
| TEST-PS-083-09.T29 | unit | PS-083-01.R12, PS-083-01.R04, PS-083-02.R03, PS-083-04.R04 | roleFor for F18 rows with delegations and operatorKeys resolver stubs: policy_decision by a decider first listed 15 d and 10 d before the proposal receipt, by the publisher's own key, and with no delegations resolver registered; policy_cosign by a listed cosigner and by an unlisted key; transparency_report by a second operator key, by the embedded draft's compiler and by a key outside operatorKeys; rule_pack by its publisher | the 15 d decider, the listed cosigner, the second operator and the publisher resolve; every other case yields a rule that makes the receiving path quarantine with FEDERATION_SIGNER_ROLE_INVALID |
| TEST-PS-083-09.T30 | unit | PS-083-01.R11, PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry for policy_comment/v1, transparency_counts/v1, transparency_draft/v1, transparency_report/v1, policy_cosign/v1 and the publisher-signed F18 types | community row gives acknowledger destination_relay, P1 and maxAge 45 d; transparency_counts acknowledger none, P2, 30 d; transparency_draft counterparty, P2, 30 d; transparency_report none, P0, maxAge none; policy_cosign 60 d; publisher rows P0 and maxAge none; every F18 row is in the export |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [module SPEC](SPEC.md).
