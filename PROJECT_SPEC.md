# CLASSifiedisRUPTed — Project specification

## Product
BlindMatch is the flagship direction: private local intents and discovery first,
with separately reviewed confidential matching later. LocalBazaar and LocalMutiny
are subsequent product releases; their existing mobile-first PWA, public listing,
barter and encrypted-vault foundations remain reusable. This priority does not
claim that the current alpha is a completed BlindMatch product.

The [local foundation](packages/blindmatch/README.md) adds experimental ownership,
intent/recovery and matching contracts under F19. Runtime activation stays off
until its UI, session, privacy and acceptance gates pass. Private intent erasure
retains no identifying deletion event, hash, tombstone or audit trail; public
listing withdrawals remain a separate existing operation. Broader account and
cross-domain erasure requirements still need implementation.

## Trust boundaries (ADR-0016 local-first hybrid)
The installable PWA is the product: every module runs in the user's local vault (IndexedDB) with user-held Ed25519 keys; no central account database, no product-operated backend and no server-held user secrets are required. A static host distributes untrusted client code; updates require user consent and integrity checks. Optional, self-hostable, user-selected relays index signed public projections, store-and-forward end-to-end encrypted envelopes, run matching over public data, send content-free push, host auctions chosen by sellers, and federate; relays are never authoritative for private records and never see plaintext private data. All cross-party facts are signed statements verified by each receiving vault. External wallets, blockchains, payment providers and physical cash exchanges remain outside platform control. Signatures evidence an assertion, not delivery or receipt. No platform-held funds or custodial keys. Cryptographic transfers require independent confirmation and reorg/finality policy. Cash is self-attested with optional bilateral receipt evidence. Exact home addresses are private, never in public, search or federation payloads; public discovery regions are coarse (max geohash 5). Pseudonyms are user-selected display labels; no anonymity guarantee against network metadata, counterparties or legal process. Consistency limits: see planning/CONSISTENCY_STATES.md.

## System rules
Feature flags isolate optional modules; versioned domain events and APIs; one canonical owner per record; append-only commerce evidence with policy-driven retention; explicit consent for every barter participant and every material proposal revision. Multi-party cycles require asset compatibility, ownership, value/currency normalization with pinned quotes, participant uniqueness, bounded search, deadlines, concurrency locks and all-party consent; dropout invalidates or renegotiates cycle, never silently reroutes assets. No implicit escrow. Use integer minor units, explicit FX source/time and rounding policy. Offline writes are pending until server acknowledgement. Federated content requires signatures, provenance, revocation and abuse handling.

## User journeys and edge cases
Publish/edit/expire/restore listings; buy/want/giveaway, negotiate, reject/counteroffer, trade two-person, propose/consent/execute 3/4/N-person cycles, revoke/dropout/recover, cross-currency value differences, no feasible cycle, duplicate item, stale inventory, concurrent acceptance, fraudulent proof, blocked participant, missing location permission, no network, relay outage, payment failure/reorg, delivery dispute, account recovery, export/portability, appeal and deletion.

## BlindMatch — local foundation and future confidential discovery

The flagship starts with owner-private local intents and authenticated filtering
of already-retained public listings. Its F19 catalog entries and bounded local
implementation do not enable the product. The continuation must keep the main
application launch gate false until native/mobile, accessibility and remaining
activation requirements are qualified.

Future scope includes scoped confidential bilateral matching, private price
overlap, progressive mutual disclosure and bounded multi-party barter. LocalBazaar
and LocalMutiny retain their domain contracts and later product release priority.
No mandatory chain/provider/account, plaintext fallback, automatic trade or
settlement is introduced. The published [specification](docs/blindmatch/SPEC.md),
[diagrams](docs/blindmatch/DIAGRAMS.md) and
[acceptance roadmap](docs/blindmatch/ROADMAP.md) distinguish that future scope from
the current local contract, including erasure without identifying deletion history.

## Release gates
Prompt 1 hierarchy and ownership audit; Prompt 2 process specification expansion; Prompt 3 completeness and security review; Prompt 4 implementation proceeds per dependency layer once that layer's specifications pass `pnpm spec:check` (see SPEC_COMPLETENESS_REPORT.md).
