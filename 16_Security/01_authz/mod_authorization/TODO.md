# TODO — mod_authorization

**Status:** SPEC-DRAFT-COMPLETE (pending approval).

- [x] PS-126-01 domain schema for grants, approvals, decisions, policy versions and cache.
- [x] PS-126-02 validation rules for grant creation and policy publication.
- [x] PS-126-03 grant and policy state machines.
- [x] PS-126-04 decision, grant and policy commands and events.
- [x] PS-126-05 authz-owned capabilities (`grt.administer`, `pol.administer`, `authz.explain`, `aud.read`).
- [x] PS-126-06 fail-closed behavior, revocation race and approval race handling.
- [x] PS-126-07 decision-log privacy, purpose registry and enumeration defence.
- [x] PS-126-08 decision latency and revocation-lag budgets.
- [x] PS-126-09 matrix, negative (S3-02) and privileged tests.
- [x] PS-126-10 policy bundle export, policy rollback and vocabulary migration.
- [ ] Resolve CTR-CAP-001 named owners (S3-11) with Identity&Trust Lead.
- [ ] Choose decision cache backing store (ASSUMPTION: in-process, ≤ 60 s TTL).
- [ ] Confirm approval count N for co-approval alert (ASSUMPTION: 10 per 30 days).
- [ ] Implement (future prompt only).
