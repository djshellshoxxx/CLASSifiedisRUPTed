# CLASSifiedisRUPTed — Project specification

ClassRup is a **software artwork**, currently in specification development. Its functional scope, licensing, security requirements and acceptance criteria remain unchanged.

**Architecture constraint:** the entire CLASS suite is client-side, with user-controlled local keys and data. No mandatory product-operated backend, central account database or server-held user secrets. This owner requirement supersedes the API/SQL/server-ACK proposals inherited from `39ac847`. See [client-side architecture](planning/CLIENT_SIDE_ARCHITECTURE.md), ARCH-001..010.

## Product and available scope

Mobile-first installable PWA for local commerce (LocalBazaar), cyclic 2..N participant barter (LocalMutiny), services, auctions, rentals, discovery, portable pseudonymous identity, messaging, noncustodial settlement evidence, optional federation, local moderation and accessibility. Available recorded scope: 18 features, 148 modules and 1,480 process contracts. A [partial original-idea provenance summary](planning/REQUIREMENT_PROVENANCE.md) is available from user messages; assistant idea descriptions remain omitted and full coverage is uncertified. No registered feature is removed by implementation order or a local feature flag.

## Trust boundaries

The installed client owns its vault and local transaction decisions. A static distributor supplies code/assets and can compromise keys/data through malicious updates; dependency, CSP and update policy require review. Browser compromise, eviction and device loss remain risks. No remote recovery escrow. Pseudonyms/signatures do not establish real-world identity, item ownership or anonymity.

External peers/relays, browser push services, user-selected storage, wallets, chains, payment sources and physical exchanges are separate dependencies. None may become hidden product authority. Default operation is offline/local. Each adapter needs explicit selection/disclosure, constrained exported fields, validation and failure behavior. Private messages require reviewed encryption/key protocols before sending, with no plaintext relay fallback. Exact home addresses stay local/private by default, excluded from public search/federation.

## System rules

Local record revisions, idempotency receipts and events commit in one vault transaction. Network acknowledgements never imply local authority, peer consent or settlement. Local reservations constrain only that vault; cross-device conflicts and dishonest owners remain possible. Validate/quarantine imported signed records on known equivocation. No global single-writer or trusted-clock assumption. Locked vault, unknown signature, incompatible version and failed validation fail closed.

Each barter participant accepts an immutable digest covering assets/revisions, ordered transfers, values, terms and disclosures. Material changes invalidate prior consent. Each party controls its own commitments and attestations. No distributed atomic lock, real-world rollback, guaranteed delivery, global sanctions, Sybil-proof reputation or remote erasure. Dropout invalidates known coordination or opens a dispute, never silently reroutes assets. Display evidence freshness, partial acknowledgements and conflicts.

Money uses integer minor units and explicit currency/exponent. Claims, counterparty acknowledgement and external observation are distinct. No product custody, wallet secrets or automatic fund transfer. FX, finality, provider evidence and paid placement need exact policies/reviews. Source outage leaves unknown/unverified evidence. Local filtering and subscribed policy feeds create neither global enforcement nor legal certification.

## UX and acceptance

Distinguish saved locally, export prepared, transport acknowledged, peer accepted, consent collected, locally reserved and handoff reported. Show discovery coverage, closed-browser notification limits, key-loss/recovery limits and external evidence provenance at the relevant action. WCAG 2.2 AA, keyboard/screen-reader, localization, mobile and offline recovery need measured tests.

Required journeys: listing create/edit/publish/archive/restore; sale/wanted/giveaway; negotiation; direct and 3/4/N barter; compensation; revocation/dropout/dispute; stale/concurrent inventory; forged evidence; blocked peer; absent location/network/storage; key loss/export/restore; local message drafts and reviewed encrypted send; payment failure/reorg; local moderation; federation validation/tombstones. See [flows](planning/END_TO_END_FLOWS.md).

## Gates

Complete every leaf and parent integration contract with stable requirement/test traceability; resolve client-side conflicts; pass independent architecture/security review before application implementation. [Completeness report](SPEC_COMPLETENESS_REPORT.md) remains **NO-GO**. Specification GO permits implementation, not production certification. Later acceptance requires executable unit/property/integration/browser/offline/security/performance tests and reproducible static build. No application code, deployment or completed suite is claimed.
