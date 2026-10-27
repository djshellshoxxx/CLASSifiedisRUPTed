# CLASSifiedisRUPTed (ClassRup)

ClassRup is a **software artwork**, currently in specification development. Its functional scope, licensing, security requirements and acceptance criteria remain unchanged.

A modular, mobile-first, privacy-aware PWA for local commerce, classifieds (LocalBazaar), and bilateral/multi-party cyclic barter (LocalMutiny). Supports services, auctions, rentals, discovery, portable identity, messaging, noncustodial settlement evidence, federation, moderation and accessibility.

## Navigation

- [Project specification](PROJECT_SPEC.md) · [Root roadmap](ROADMAP.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy and traceability](INDEX.md)
- [Feature inventory](FEATURE_INVENTORY.md) · [Dependency matrix](DEPENDENCY_MATRIX.md) · [Risk register](RISK_REGISTER.md)
- [Glossary](GLOSSARY.md) · [Research notes](RESEARCH_NOTES.md) · [ADR index](ADR_INDEX.md) · [Hierarchy audit](HIERARCHY_AUDIT.md)
- [Execution prompts](planning/metaprompts/README.md)

## Client-side mandate

The entire CLASS suite runs client-side with user-controlled local keys/data. No mandatory product-operated backend, central account database or server-held user secrets. [Architecture and honest consistency limits](planning/CLIENT_SIDE_ARCHITECTURE.md) supersede historical server proposals. External peers/relays/storage are optional explicit dependencies.

## Planning status

Prompt 2 has registered 1,480 structured process-spec placeholders across 148 modules. Prompt 3 foundation work is in progress on a documentation branch: 30 process proposals across listing creation, offline state and in-app notices have concrete contract bodies pending dependency/independent approval; 1,450 remain DRAFT. Canonical local API, listing, cycle, messaging, payment and federation baselines are proposed, not formally accepted. Inventories/checklists were repaired; [reproducible audit](planning/audits/spec_audit.md) and [restart handoff](HANDOFF.md) track actual evidence. Stage 4 implementation is blocked by [SPEC_COMPLETENESS_REPORT.md](SPEC_COMPLETENESS_REPORT.md) (**NO-GO**). A mock-backed framework demo lives in [app/](app/README.md): synthetic data, no server, no authentication, no payments, nothing published, and [STATUS.md](app/STATUS.md) lists its verification and gaps. It is not a product implementation of these specifications. The NO-GO gate above remains in force, and no security audit or production deployment is claimed.

## Prompt 3 foundations
- [Completeness and gap report](SPEC_COMPLETENESS_REPORT.md)
- [Process specification registry](planning/SPEC_REGISTRY.md) · [Machine-readable registry](planning/SPEC_REGISTRY.csv)
- [Integration ownership and dependency graph](planning/INTEGRATION_DEPENDENCIES.md) · [End-to-end flows](planning/END_TO_END_FLOWS.md)
- [Canonical core API/events/data](planning/contracts/CORE_API_EVENTS_DATA.md)
- [Classified listing contract](planning/contracts/CLASSIFIED_LISTING_CONTRACT.md)
- [Cycle/barter contract](planning/contracts/CYCLE_BARTER_EXECUTION.md)
- [Messages/payments/federation contract](planning/contracts/MESSAGING_PAYMENTS_FEDERATION.md)
- [Security/privacy threat model](planning/SECURITY_PRIVACY_THREAT_MODEL.md)
- [Provisional ADRs](planning/ADR_PROVISIONAL_DECISIONS.md) · [Library research](planning/THIRD_PARTY_RESEARCH.md)
- [Release and acceptance gates](planning/RELEASE_AND_TEST_GATES.md)

## Principles

User-selected pseudonyms, private home addresses by default, optional federation, independently configurable modules, no platform custody of funds, and explicit trade consent. Pseudonymity does not guarantee anonymity. Static-hosted PWA code is not a trusted backend; relays, external wallets and chains have distinct trust boundaries.
