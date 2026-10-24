# In-app module cross-review — 2026-10-24

Disposition: **SPECIFIED_REVIEW_PENDING; all three sampled findings resolved; dependency and whole-module review pending.** Independent cross-review of the twelve files below against current CLIENT_SIDE_ARCHITECTURE.md and CORE_API_EVENTS_DATA.md. Documentation review only: no implementation, product tests, security certification, per-process approval or whole-module GO.

## Finding dispositions after scoped recheck

1. **Resolved — bulk-delete CAS input.** `commands_queries_events.md:16,19` now specifies 1..1000 unique explicitly selected IDs/per-row revisions, all-or-abort read/CAS checks, no envelope CAS, exclusion of later unselected rows and terminal batch marker replay returning OBJECT_DELETED. The acceptance document adds concurrent-row/replay oracles. This resolves the earlier ambiguity as a proposed contract; owner receipt/store implementation remains pending.

2. **Resolved — rejected-event cursor progress.** `SPEC.md:34` and `workflow_state_machine.md:11` now atomically commit terminal rejected outcome keyed by F15 source_position plus cursor progress, without fabricating an event ID or retaining raw payload. Unavailable-policy/storage and cap cases remain pending. The acceptance document adds E1 rejection/restart/E2 progress and unavailable-policy E1 oracles. F15 iterator semantics still require owner review.

3. **Resolved — already-read no-op at maximum revision.** Rechecked only the corrected `domain_schema.md:40` paragraph: it now distinguishes a matching-CAS already-read no-op from a genuine unread-to-read mutation, which fails at MAX_SAFE_INTEGER. This matches the previously reviewed command/workflow/recovery precedence and acceptance oracle. No residual contradiction in this sampled finding; schema hash refreshed below.

## Confirmed improvements and review gates

- Row CAS revision and per-vault insertion sequence are distinct; sequence/cursor bounds and exhaustion do not imply global order. Unread delete requires confirmation; unread rows are not auto-evicted/age-purged.
- Consent notice copy says only evidence recorded locally and does not identify a signer or imply unanimity. Preference decision union is fail-closed; unavailable/malformed policy leaves pending per SPEC/validation (privacy wording “suppresses creation” must not be implemented as durable suppression).
- Deleted command replay gives OBJECT_DELETED for any payload, with no old body comparison/receipt. Specification GO is separated from later implemented runtime test/build evidence.
- Local-only allowlist, no networking/push/email, protected-store gate, transient label, principal/capability isolation, fixed localization copy and user-controlled backup limits align with ARCH/core.
- Pending owner contracts remain required: F15 committed-event iterator/cursor, transaction/protected store/volatile mode and receipt deletion lifecycle; F13.S02 preference resolution/versioning; F07/F16 authorization; F10 retention; F14 accessible presentation. Source producers and all cryptographic/protected persistence profiles remain review gates. No disabled protocol is approved as product-scope deferral.
- Whole-module source-bound review and dependency approval remain necessary before implementation; planned fixtures are not executed tests. No per-process approval granted by this audit.

## Reviewed source SHA-256

Hashes identify the exact bytes reviewed, not approval. Any source change requires recheck of affected findings.

| File under `13_Notifications/01_delivery/mod_inapp/` | SHA-256 |
|---|---|
| `SPEC.md` | `85ce2f42a63243ed1e8ed3970c2f6b7128a13205f924325781f8c9ea3661147c` |
| `TODO.md` | `45ddf84dc589c548db4469fc67d6f1dba7c9198b4ea65b4a667c5d7a16f94aed` |
| `domain_schema.md` | `dc9889de331d0fd00cf708e10c5876ad8bf265b15b3e81755e884d17d69f2de6` |
| `validation_rules.md` | `3a667041d0ab26244ffded2c5b2bfdffd8f641e22cde7e019eeacfb5774d2242` |
| `workflow_state_machine.md` | `3313d872e002cd135f5118698f96708168b5589cf411e4863cfcc586b257b506` |
| `commands_queries_events.md` | `e29e8e87a3a82161c0220718e75b7f21d501ad7fc2773e33b9c9efa740d1256b` |
| `authorization_capabilities.md` | `7df649451f2b6ffa19afdb8012d97a4f04e3e37e515b03aaf212f4c9cdb08408` |
| `failure_recovery_idempotency.md` | `5549d8812167572f203ec9ab6e2237258af38d5929410f0632288adb095db98f` |
| `privacy_retention_abuse.md` | `85a66b1777c37b63d96dec200197e0d6adcd146f1d8a917fc5cb110eecc2e97d` |
| `observability_performance.md` | `39f99b200dc7d38046e70fcd0aea094b8b983c2c4c01f2f26db0a22793c1d4ec` |
| `contract_and_acceptance_tests.md` | `89b1228ea50715ee208fc61c41cb5c8080dab5b3a966a07ecb99cda4086cdd10` |
| `import_export_backup_rollback.md` | `e6a76ddfd2ffd4c025e2409cf50013a216c55845c29b390d2907df31b608b0e8` |
