# CLASSifiedisRUPTed — Project specification

## Product
Mobile-first installable PWA for local commerce (LocalBazaar) and barter including cyclic 2..N participant trades (LocalMutiny), plus services, auctions, rentals and optional federation.

## Trust boundaries
A static PWA host distributes untrusted client code and public assets; it cannot protect server-side secrets, enforce authorization, guarantee delivery, or independently store durable private data. Independently deployed relays/backends enforce authenticated authorization, validation, rate limits, durable persistence, messaging delivery, moderation and event consistency. External wallets, blockchains, payment providers and physical cash exchanges remain outside platform control. Signatures evidence an assertion, not actual delivery or receipt. No platform-held funds or custodial keys. Cryptographic transfers require independent confirmation and reorg/finality policy. Cash is self-attested with optional bilateral receipt evidence. Exact home addresses private by default, never included in public listing/search/federation payloads; approximate discovery regions are deliberately coarse. Pseudonyms are user-selected; no anonymity guarantee against network metadata, counterparties or legal process.

## System rules
Feature flags isolate optional modules; versioned domain events and APIs; one canonical owner per record; append-only commerce evidence with policy-driven retention; explicit consent for every barter participant and every material proposal revision. Multi-party cycles require asset compatibility, ownership, value/currency normalization with pinned quotes, participant uniqueness, bounded search, deadlines, concurrency locks and all-party consent; dropout invalidates or renegotiates cycle, never silently reroutes assets. No implicit escrow. Use integer minor units, explicit FX source/time and rounding policy. Offline writes are pending until server acknowledgement. Federated content requires signatures, provenance, revocation and abuse handling.

## User journeys and edge cases
Publish/edit/expire/restore listings; buy/want/giveaway, negotiate, reject/counteroffer, trade two-person, propose/consent/execute 3/4/N-person cycles, revoke/dropout/recover, cross-currency value differences, no feasible cycle, duplicate item, stale inventory, concurrent acceptance, fraudulent proof, blocked participant, missing location permission, no network, relay outage, payment failure/reorg, delivery dispute, account recovery, export/portability, appeal and deletion.

## Release gates
Prompt 1 hierarchy and ownership audit; Prompt 2 process specification expansion; Prompt 3 completeness and security review; Prompt 4 implementation only after GO. This phase creates no application code.
