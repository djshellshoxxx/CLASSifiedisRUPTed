# TODO — mod_tenants

**Status:** SPEC-DRAFT-COMPLETE (pending approval).

- [x] PS-125-01 domain schema specified.
- [x] PS-125-02 validation rules specified (slug, reserved names, config allowlist).
- [x] PS-125-03 tenant lifecycle state machine specified.
- [x] PS-125-04 commands, queries and events specified.
- [x] PS-125-05 authorization matrix specified (tenant admin = owner rule; suspend/resume/offboard dual control).
- [x] PS-125-06 provisioning saga and idempotency specified.
- [x] PS-125-07 privacy, retention and slug-abuse controls specified.
- [x] PS-125-08 observability and budgets specified.
- [x] PS-125-09 acceptance tests specified.
- [x] PS-125-10 export, backup and rollback specified.
- [ ] Confirm the working definition of "tenant" with F15 (ASSUMPTION in SPEC.md).
- [ ] Register `ten_` prefix in CTR-ID-001.
- [ ] Confirm reserved-slug list and review queue owner with Trust&Safety Lead.
- [ ] Confirm federation_mode default `none` against D01 when decided.
- [ ] Confirm retention_profile defaults against D07 when decided.
- [ ] Implement (future prompt only).
