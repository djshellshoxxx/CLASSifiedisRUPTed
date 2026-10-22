# CLASSifiedisRUPTed (ClassRup)

A modular, privacy-aware, federatable classifieds, barter and direct-commerce platform.

## Modules
- **LocalBazaar:** classifieds, buy/sell/wanted, giveaways, local listings.
- **LocalMutiny:** two-person barter, multi-person cyclic barter (3+), intelligent trade matching and mixed-value proposals.
- Skills and services, auctions and rentals, identity and portable reputation, messaging, payments, local search and discovery, community hosting and federation.

## Project methodology
1. Define project → feature → optional subfeature → module hierarchy, with SPEC.md and TODO.md in every folder.
2. Inventory all module-level process specs as explicit Markdown placeholders.
3. Complete every spec to developer-ready quality; check cross-module dependencies and requirements traceability.
4. Only after the spec-completeness gate, implement in dependency order with tests, QA and security review.

See [the four execution prompts](planning/metaprompts/README.md).

## Status
Planning bootstrap. No production software or completed security audit is claimed.

## Design constraints
- Mobile-first, accessible PWA; allow pseudonymous participation and minimize location exposure.
- Noncustodial payments; direct cash/crypto/barter exchanges with explicit settlement states.
- Modular features independently usable; shared interfaces; optional federation.
- Treat signing as evidence of a statement, not proof of real-world delivery.
- Technical scope and supported jurisdictions must be explicit for escrow, ticketing, auctions and regulated services.
- Avoid inventing cryptographic primitives. Use audited libraries and staged test deployments.

## Planned folder convention
`NN_FEATURE/SPEC.md`, `NN_FEATURE/TODO.md`, optional `NN_SUBFEATURE/SPEC.md`, and `mod_descriptive_name/SPEC.md`, `mod_descriptive_name/TODO.md`, plus focused process specifications like `listing_validation.md`.

Licensing and contribution policies are to be selected during architecture planning.
