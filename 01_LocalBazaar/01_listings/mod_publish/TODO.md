# TODO — mod_publish (F01.S01.M03)

**Status:** SPEC-DRAFT-COMPLETE for 10 of 10 process specs (pending approval). Open items below block approval, not drafting.

- [x] Define ownership and directory contract.
- [x] Enumerate module process specifications (PS-004-01 to PS-004-10).
- [x] Expand domain_schema (PS-004-01): publish-state fields, `region_cell`, `hold` shape.
- [x] Expand validation_rules (PS-004-02): steps V0–V10 and eight PUB codes.
- [x] Expand workflow_state_machine (PS-004-03): draft / published / held_review, transitions T1–T9.
- [x] Expand commands_queries_events (PS-004-04): `lst.publish`, `lst.get_publish_state`, three listing events.
- [x] Expand authorization_capabilities (PS-004-05): owner rule, moderator release grant, no operator override.
- [x] Expand failure_recovery_idempotency (PS-004-06): atomic commit, risk fail-closed, outbox, offline re-check.
- [x] Expand privacy_retention_abuse (PS-004-07): PII scan and hold, federation opt-in, rate limit, deletion.
- [x] Expand observability_performance (PS-004-08): publish latency budget, hold-rate and PII-log alerts.
- [x] Expand contract_and_acceptance_tests (PS-004-09): TEST-PS-004-09-01 to -10.
- [x] Expand import_export_backup_rollback (PS-004-10): owner export, federated read-only, flag rollback, upcast.
- [ ] Resolve PENDING CTR-LST-001 (listing aggregate schema; owner F01).
- [ ] Resolve PENDING CTR-MOD-001 (`cas.cleared`, `cas.rejected`, risk verdict interface; owner F12).
- [ ] Resolve PENDING CTR-REG-001 (region-cell registry; OPEN in CTR-PRV-001; F06 and F10).
- [ ] Decide OPEN-1: `price` data class. CTR-SCH-001 example says FINANCIAL_EVIDENCE; CTR-FED-001 example emits PUBLIC. Default PUBLIC (F10).
- [ ] Decide whether CTR-CAP-001 gets a `publish` verb (MINOR) or publish keeps `lst.update` with the state gate (current default; Marketplace Lead and F16).
- [ ] Confirm D05 (coarse region default) for `region_cell` and K_MIN = 5 with F10.
- [ ] Confirm D07 retention values for listing fields (RET-ACC) and hold history with F10.
- [ ] Confirm D08 offline publish semantics with F15 and the PWA owner.
- [ ] Confirm `duration_days` set {7, 14, 30, 60, 90} and default 30 with Marketplace Lead.
- [ ] Confirm risk-service fail-closed behavior (timeout → held_review) and 300 ms budget with F12.
- [ ] Confirm media-scan dependency and owner (PENDING; not in planning/contracts).
- [ ] Confirm feature flag name `lst.publish.enabled` with F15 configuration.
- [ ] Confirm rate limit 30 publishes per 24 h with F12 abuse owners.
- [ ] Paid-listing publish path (Future): depends on F09 claims (CTR-COM-001); no MVP spec.
- [ ] Verify tests, accessibility, privacy and security (future phase; not claimed).
