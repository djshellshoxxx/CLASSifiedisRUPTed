# ClassRup aggregation, ownership and dependency graph
Status: PROPOSED dependency baseline. Parent [INDEX.md](../INDEX.md) remains the hierarchy source; [SPEC_REGISTRY.csv](SPEC_REGISTRY.csv) remains the per-process ID/path source. No child module is complete by virtue of this document.

## Aggregation model (INT-001)
Process spec (schema/validation/lifecycle/API/authorization/retries/privacy/telemetry/tests/exports) -> one mod_* domain boundary with atomic internal invariants -> sibling modules combined under one subfeature API with explicit call order -> feature facade and feature flag -> product gateway and task-based PWA. A parent is complete ONLY when all in-scope children are complete AND the parent-level composed end-to-end contract has passed acceptance review. A passing leaf contract cannot substitute for parent integration tests.

## Canonical owners (INT-002)
- F01: listing/variant/offer inventory; no duplicate identity or wallet records.
- F02: barter proposal, cycle candidate, unanimous consent, reservation coordinator; F01 owns inventory compare-and-swap.
- F03: service catalog and work obligations; F09 owns payment evidence.
- F04: auction bids and close decision; F01/F09 invoked but not forked.
- F05: rental calendar and condition evidence; F09 owns external deposit claims.
- F06: search projection and approximate geography; no precise address in index.
- F07: users, sessions, portable public profile, local identity; does not own fraud sanctions.
- F08: message/thread ACL and handoff coordination; case evidence belongs to F12 or F09.
- F09: payment claims, verifiers, settlement receipts, FX quotes and integer price normalization; owns no custody.
- F10: consent ledger, personal data export, deletion, retention and location disclosure policy.
- F11: signed exchange envelopes, peer trust, import/export, dedup and tombstones; imported data is non-authoritative projection.
- F12: content policy enforcement, flags, abuse/risk signals, audit of moderation actions; does not own source listing.
- F13: push/email/in-app notification delivery and preferences; event consumers with least content necessary.
- F14: design-system accessibility, localization and display formatting; never alters canonical numeric value.
- F15: relay, storage, PWA, cache and operational config; platform primitives, not domain-specific behavior.
- F16: authorization, signatures, key management, threat/incident controls; F07 still owns user accounts.
- F17: testing, load/offline/chaos and release gates; no feature passes without contract tests.
- F18: jurisdiction and prohibited goods/service policy, governance/transparency; approved policies feed F12/feature validators.

## Composition and critical order (INT-003)
~~~mermaid
flowchart LR
  F18[Governance policy] --> F12[Moderation]
  F16[Security/AuthZ] --> F07[Identity]
  F15[Platform/API/Storage] --> F07
  F07 --> F01[Classifieds]
  F10[Privacy] --> F06[Discovery]
  F01 --> F06
  F01 --> F02[Barter]
  F07 --> F08[Messaging]
  F01 --> F08
  F09[Payment evidence] --> F01
  F09 --> F02
  F08 --> F02
  F01 --> F03[Services]
  F01 --> F04[Auctions]
  F01 --> F05[Rentals]
  F01 --> F11[Federation]
  F12 --> F11
  F01 --> F13[Notifications]
  F02 --> F13
  F14[Accessibility] --> PWA[Product experience]
  F06 --> PWA
  F02 --> PWA
  F03 --> PWA
  F04 --> PWA
  F05 --> PWA
  F17[Quality gates] --> PWA
~~~
This shows *logical dependencies*, not runtime synchronous service calls. F10/F16/F15 apply to all features; tests assert fail-closed authorization, consistent versioning and redacted events.

## Boundaries and explicit consumer contracts (INT-004)
- listing.published F01 -> F06 search projector, F11 outbound federation (only explicit opt-in public data), F13 notification. F12 can veto initial publish. Consumer is idempotent.
- reservation.created F01 -> F02 feasibility recheck, F08 coordination, F13 notification; consumer cannot independently allocate item.
- cycle.proposed F02 -> F08 participant thread, F13 opt-in notices; never put private graph in public event.
- cycle.locked F02 -> F01 reservation monitor and F09 obligation tracking; do not mark paid.
- payment.claimed F09 -> F02/F01 optional informational status ONLY; payment.verified and payment.verification_revoked separately drive declared policies.
- moderation.actioned F12 -> F01 takedown, F06 index purge, F11 outbound tombstone, F13 participant notice, F02 lock stop; purge noncritical consumer retries.
- federation.record_imported F11 -> F12 quarantine/allow decision -> F06 index; never directly to F01 authoritative listing table.
- user.deletion_requested F10 -> per-owner data processors with scoped disclosure log and exception ledger; federation tombstone best effort, not global guaranteed erasure.
- message.sent F08 -> F13 generic notification; no body in event.

## MVP / deferred matrix (INT-005)
MVP in-scope to specify completely: F01 fixed-price sell/wanted/giveaway; F02 2..8 single-item cycles and same-currency compensation as claims; F06 coarse search; F07 local sessions/pseudonyms; F08 server-readable private thread with disclosed encryption-at-rest; F09 cash and external transfer claims (no integrations claiming verification); F10 basic data rights; F12 moderation; F13 in-app notification; F14 WCAG2.2 AA; F15 basic PWA/relay/SQL/outbox/observability/backup; F16 authorization, encryption/key rotation; F17 automated gates; F18 content policy.
Deferred, disabled by default pending separate full contracts: F03 services bookings/milestones, F04 auctions, F05 rentals/deposits, F09 chain/card verification and FX, F11 federation outside controlled pilots, F13 push/email channels, F07 cross-tenant portable identities, F08 E2EE, F02 cycle >8 or multi-asset routes, F15 multitenancy beyond isolated single tenant, F18 jurisdiction expansion. Deferred scope is NOT approved for release; existing registry entries remain DRAFT until deferral ADR, privacy test and feature-disable semantics are individually verified.
