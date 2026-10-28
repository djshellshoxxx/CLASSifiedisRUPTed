# CLASSifiedisRUPTed (ClassRup)

A modular, mobile-first, privacy-aware PWA for local commerce, classifieds (LocalBazaar), and bilateral/multi-party cyclic barter (LocalMutiny). Supports services, auctions, rentals, discovery, portable identity, messaging, noncustodial settlement evidence, federation, moderation and accessibility.

## Navigation

- [Project specification](PROJECT_SPEC.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy and traceability](INDEX.md)
- [Feature inventory](FEATURE_INVENTORY.md) · [Dependency matrix](DEPENDENCY_MATRIX.md) · [Risk register](RISK_REGISTER.md)
- [Glossary](GLOSSARY.md) · [Research notes](RESEARCH_NOTES.md) · [ADR index](ADR_INDEX.md) · [Hierarchy audit](HIERARCHY_AUDIT.md)
- [Execution prompts](planning/metaprompts/README.md)

## Planning status

**Phase:** Prompt 2 structural pass complete; semantic review open (see [inventory audit](planning/INVENTORY_AUDIT.md)).

| Item | Count |
|---|---|
| Features (`NN_Name/`) | 18 |
| Directories with `SPEC.md` + `TODO.md` | 218 |
| Modules (`mod_*`) | 148 |
| Process placeholders (10 per module) | 1480 |
| Requirement placeholders | 4440 |

Process contracts are DRAFT. Next gate: Prompt 3 (developer-ready specs, semantic overlap review, GO/NO-GO). No application code, screenshots, security certification or production deployment exist or are claimed.

## Repository layout

- `NN_Feature/` → `NN_subfeature/` → `mod_name/`: each level has `SPEC.md` and `TODO.md`; each module also has `PROCESS_CHECKLIST.md` and ten process specs.
- `planning/`: [registry](planning/SPEC_REGISTRY.md), [contracts](planning/CONTRACTS.md), [requirements checklist](planning/REQUIREMENTS_CHECKLIST.json) and the four staged [metaprompts](planning/metaprompts/README.md).

## Screenshots

None yet: this repository contains specifications only. Screenshots will be added when the Prompt 4 PWA implementation exists.

## Principles

User-selected pseudonyms, private home addresses by default, optional federation, independently configurable modules, no platform custody of funds, and explicit trade consent. Pseudonymity does not guarantee anonymity. Static-hosted PWA code is not a trusted backend; relays, external wallets and chains have distinct trust boundaries.
