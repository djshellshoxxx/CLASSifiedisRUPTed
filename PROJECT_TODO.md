# Implementation work remaining

Current evidence: [project status](docs/status/PROJECT_STATUS.md), [generated feature inventory](docs/status/FEATURE_STATUS.md), and [security/consolidation review](docs/status/SECURITY_REVIEW_20261116.md). Specifications describe intended behavior; their presence does not establish implemented features.

- [x] Specify all 148 modules and resolve current strict specification errors/warnings.
- [x] Consolidate the reviewed runnable alpha and expose retained-listing search, local barter inbox, and draft/unpublished editing on PR #37.
- [x] Qualify and merge consolidated alpha PR #37 after successful Alpha verification and six CLI platform jobs.
- [x] Qualify and merge encrypted domain persistence, migration and tamper detection through PR #38.
- [x] Qualify and integrate owner listing history PR #39; preserve unfinished published-edit and offer-reconfirmation work below.
- [x] Implement owner closure, signed expiry, bounded unlocked-vault maintenance, and verified withdrawal re-download; final-source browser CI passed; purge and full retention remain pending.
- [x] Implement session idle/hidden lock, local unlock backoff and stale-result/export guards; canonical device/session recovery remains pending.
- [x] Implement exact-money arithmetic and signed-consent foundations with fresh independent review.
- [x] Implement encrypted coarse-location preferences, optional one-shot GPS snapping, and explicit listing/search copies.
- [x] Move signed barter admission and matching to a cancellable background worker with offline asset packaging.
- [x] Implement an opt-in currency registry with authenticated snapshot admission and immutable currency bindings.
- [ ] **P1 — BlindMatch confidential economic discovery:** reconcile module ownership, implement private intent/consent/local matching first, then qualified bilateral and bounded confidential barter matching. See [spec](docs/blindmatch/SPEC.md), [diagrams](docs/blindmatch/DIAGRAMS.md), and [roadmap](docs/blindmatch/ROADMAP.md). Preserve existing P1 safety dependencies; no runtime activation without qualification.
- [ ] Supply an authenticated release snapshot and canonical vault/usage adapters before enabling registry-backed commerce in the PWA.
- [ ] Qualify money performance on its specified target; wire consent adapters, wording UI, backup validation and quarantine before enabling it in the PWA.
- [ ] Complete remaining encrypted-storage load/rotation/recovery contracts after the implemented row-encryption and migration slice.
- [ ] Finish canonical identity/device rotation, revocation and recovery contracts.
- [ ] Finish published editing and material-change offer reconfirmation after the owner history slice; complete kind-specific terms, quantity/variant inventory and media workflows.
- [ ] Implement purchase offers, negotiations, payment claims, settlement evidence and receipts.
- [ ] Finish barter matching profiles, execution, handover and recovery beyond signed coordination evidence.
- [ ] Implement private messaging, consent capture/revocation and safe-meetup workflows.
- [ ] Finish canonical federation streams, relay delivery, import preflight and recovery compatibility.
- [ ] Complete governance/moderation application wiring, notification channels, retention/deletion/export and remaining specified operations.
- [ ] Implement services, auctions, rentals and reputation workflows.
- [ ] Reconcile historical security findings with runtime controls and negative tests; none are closed solely by preserving their reports.
- [ ] Complete requirement-level acceptance, fuzz/security testing and manual accessibility qualification.

The generated inventory measures source paths, interfaces and passing mapped tests; it is not a completion percentage or evidence that all requirements in those modules are met. Continue from current `main` and the [comprehensive consolidation record](docs/development/BRANCH_CONSOLIDATION.md), using the prioritized [remaining-work register](docs/development/REMAINING_WORK.md). The [parallel integration handoff](docs/handoffs/20261116-parallel-integration.md) and its source `bdd2971` remain historical evidence. PR #42 itself was closed without a direct merge; its later source was preserved through subsequent integration. Neither that earlier checkpoint nor the current consolidation establishes full-product completion.
