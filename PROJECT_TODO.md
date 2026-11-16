# Implementation work remaining

Current evidence: [project status](docs/status/PROJECT_STATUS.md), [generated feature inventory](docs/status/FEATURE_STATUS.md), and [security/consolidation review](docs/status/SECURITY_REVIEW_20261116.md). Specifications describe intended behavior; their presence does not establish implemented features.

- [x] Specify all 148 modules and resolve current strict specification errors/warnings.
- [x] Consolidate the reviewed runnable alpha and expose retained-listing search, local barter inbox, and draft/unpublished editing on PR #37.
- [x] Qualify and merge consolidated alpha PR #37 after successful Alpha verification and six CLI platform jobs.
- [ ] Qualify encrypted domain persistence, migration, tamper detection and recovery on the new candidate before merging.
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

The generated inventory currently finds runtime code in 31/148 modules and passing mapped tests for 442/4510 requirements. These are inventory/traceability measures, not a completion percentage or evidence that all requirements in those modules are met. Continue from the current integration head and inspect its CI before adding or merging work.
