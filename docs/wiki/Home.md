# CLASSifiedisRUPTed (ClassRup)

**Navigation:** [User Guide](User-Guide.md) · [Developer Guide](Developer-Guide.md)

ClassRup is a local-first classifieds and cyclic-barter browser application. Users keep their identity keys and records in a local browser vault and exchange signed files explicitly. The default `main` branch contains the runnable **development alpha**. Full feature completion, production security and release qualification remain open.

## Choose your path

- **[User Guide](User-Guide.md)** — setup, vaults, listings, signed-file exchange, barter, backup and current limitations.
- **[Developer Guide](Developer-Guide.md)** — architecture, installation, validation, specification sources and integration boundaries.

## Current source and evidence

These guides were reconciled against main commit [`50abc470139a`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/50abc470139a613f4404bdb9fb442f4011c13932), which integrated the qualified listing/vault stack through [PR #44](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/44). Later candidates require their own validation. See the [project status](../status/PROJECT_STATUS.md) for test evidence tied to source commits, the [branch ledger](../status/BRANCH_LEDGER.md) for integration history and the [README](../../README.md) for implemented scope.

The alpha includes encrypted local records, listing editing/history/archive recovery, signed-file barter coordination, private coarse-area preferences and local notifications. It does not supply complete live relay federation, private messaging, device recovery, payment settlement, services, rentals or auctions. Some reviewed libraries remain opt-in or unmounted; source presence alone does not establish a usable product workflow.

## Reference

- [Project specification](../../PROJECT_SPEC.md) and [project TODO](../../PROJECT_TODO.md)
- [Local-first architecture, ADR-0016](../../planning/adr/ADR-0016.md)
- [Canonical contracts](../../planning/CONTRACTS.md)
- [Barter file-exchange walkthrough](../BARTER_ALPHA.md)
- [Preserved November 10–11 wiki source](../history/pr-13-20261110/README.md)

These are version-controlled wiki source pages. Their presence in the repository does not mean the live GitHub Wiki has been published or updated.
