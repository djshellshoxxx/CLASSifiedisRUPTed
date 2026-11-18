# F08.S03.M01 — safe

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** [F08.S03 meetups](../SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001. **Decisions:** D05, D07, D08 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
Safety plan for in-person exchanges arranged in ClassRup. Two participants agree a time window and a public venue, exchange one-time check-in codes, check in and out, and can end the plan at any time with a silent safe exit. The module records only what the participants choose to share. It does not track live location, does not accept home addresses, and does not confirm that a handover happened. Transitions are explicit, authorized and auditable.

## User stories
- As a participant, I propose a meetup window and a public venue and my counterparty confirms before anything is shared.
- As a participant, I check in with a code shown to my counterparty, so both of us know the meetup started.
- As a participant, I can end the plan with a safe exit that tells my counterparty only that the meetup ended.
- As a participant, I can nominate one trusted contact who sees only status and window end, and I can revoke that at any time.

## Scope
- In scope: meetup plan lifecycle, venue reference rules, check-in codes, check-in/out, safe exit, trusted-contact status grant, plan expiry and purge.
- Out of scope: live location, route sharing, messaging (F08 mod_threads, mod_private), venue catalogue curation, transaction claims (F09), moderation case handling (F12).

## Public interfaces
Commands `meetup.propose`, `meetup.confirm`, `meetup.cancel`, `meetup.check_in`, `meetup.check_out`, `meetup.safe_exit`, `meetup.set_trusted_contact`; query `meetup.get`. Events `meetup_plan.*` (PS-066-04). Entity prefix `mtp_` is PENDING CTR-ID-001 registration.

## Relationships, dependencies and integration
Upstream: F07 identity (`acc_`), F08 threads (`thr_`), F06 venue reference data (`ven_`, PENDING), CTR-PRV-001 retention. Downstream: F13 notifications (generic text only, no venue or window in push previews), F12 reports (plan snapshot limited to status and codes). No dependency on F06 geoprivacy precision: this module never requests device location.

## Data ownership
Owns `mtp_` plan records, check-in code hashes and trusted-contact hashes. Does not own accounts, threads, messages or venue catalogue entries. Consumers reference `mtp_` by full ID.

## Risk considerations
Inference of home or work location from venue and time patterns; stalking through repeated plans; coerced check-ins; false safety signals from forged check-ins; metadata leakage to the trusted contact beyond status; abuse of safe exit to disrupt counterparties. The platform cannot guarantee physical safety, and a plan does not prove a handover happened.

## Completion criteria
All ten process specs drafted and cross-linked; PENDING contract entries resolved by F15/F10; privacy review of venue and window classification; accessibility review of check-in controls; implementation and test phases tracked separately.

## Required process specification inventory
- [x] `domain_schema.md` — PS-066-01
- [x] `validation_rules.md` — PS-066-02
- [x] `workflow_state_machine.md` — PS-066-03
- [x] `commands_queries_events.md` — PS-066-04
- [x] `authorization_capabilities.md` — PS-066-05
- [x] `failure_recovery_idempotency.md` — PS-066-06
- [x] `privacy_retention_abuse.md` — PS-066-07
- [x] `observability_performance.md` — PS-066-08
- [x] `contract_and_acceptance_tests.md` — PS-066-09
- [x] `import_export_backup_rollback.md` — PS-066-10
