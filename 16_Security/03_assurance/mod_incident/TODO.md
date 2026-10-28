# TODO: F16.S03.M02 incident

**Status:** IMPLEMENTED; responder paging is relay work.

## Implemented
- [x] Forward-only lifecycle detected -> triaged -> contained -> eradicated -> recovered -> postmortem_done (+ dismissed) (`packages/platform/src/assurance/incidents.ts`; `packages/platform/test/assurance.test.ts`)
- [x] SEV1-4 response targets, SLA evaluation and `escalate_due` sweeper (same files; `packages/platform/src/assurance/incident-ops.ts`)
- [x] Append-only timeline, postmortem record, support/admin permission split, tenant isolation

## Remaining
- [ ] Notifying responders on `platform.incident.sla_breached` (relay subscribes and uses the notification port)
- [ ] Incident export for regulators

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
