# CLASSifiedisRUPTed (ClassRup)

A modular, mobile-first, privacy-aware PWA for local commerce, classifieds (LocalBazaar), and bilateral/multi-party cyclic barter (LocalMutiny). Supports services, auctions, rentals, discovery, portable identity, messaging, noncustodial settlement evidence, federation, moderation and accessibility.

## Navigation

- [Project specification](PROJECT_SPEC.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy and traceability](INDEX.md)
- [Feature inventory](FEATURE_INVENTORY.md) · [Dependency matrix](DEPENDENCY_MATRIX.md) · [Risk register](RISK_REGISTER.md)
- [Glossary](GLOSSARY.md) · [Research notes](RESEARCH_NOTES.md) · [ADR index](ADR_INDEX.md) · [Hierarchy audit](HIERARCHY_AUDIT.md)
- [Execution prompts](planning/metaprompts/README.md)

## Planning status

Hierarchy and module-level specification inventories are in this repository. Process specifications are still largely draft. A mock-backed framework demo lives in [app/](app/README.md): synthetic data, no server, no authentication, no payments, nothing published. The demo is not a product implementation of the specifications, and no security certification or production deployment is claimed. The specification completeness gate is not passed (see the completeness report on the open documentation PR).

## Principles

User-selected pseudonyms, private home addresses by default, optional federation, independently configurable modules, no platform custody of funds, and explicit trade consent. Pseudonymity does not guarantee anonymity. Static-hosted PWA code is not a trusted backend; relays, external wallets and chains have distinct trust boundaries.
