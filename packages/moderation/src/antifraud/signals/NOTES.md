# F12.S03.M02 Fraud signals (PS-101)

Files: `index.ts`, `signals.test.ts`.

## Implemented
- Repos `moderation.signal` (insert only; indexes source, subjectObs, expiry, ref) and `moderation.signal_rollup` (counts per kind, 365 days).
- Command `moderation.signal.record_manual` (manual_concern, manual_positive, compensation; reason 10..500; net manual weight per subject within 30 days at most 20 in absolute value; 10 manual signals per author per day; a signal is compensated once; compensation decays from the original observation time and expires with it, so the pair nets to zero at every instant).
- Queries `moderation.signal.list_for_subject`, `moderation.signal.summarize` (decay `w x 0.5^(age/h)`, capped and expired signals excluded), `moderation.signal.categories_own`; event `moderation.signal.recorded`; errors `SIGNALS_DUPLICATE_SOURCE`, `SIGNALS_MANUAL_CAP`.
- Consumers, one per consumed event: moderation.spam.detected, auctions.shill.suspected, auctions.result.voided, commerce.dispute.opened, commerce.dispute.resolved, commerce.payment.disputed, commerce.payment.expired, commerce.deal.completed, comms.meetup.no_show, mutiny.cycle.participant_dropped, rentals.damage.claimed, moderation.action.applied (relay only). Deduplicated by (kind, sourceEventId); per-source cap 3 per 30 days marks the 4th as `capped` (kept, ignored for scoring).
- Functions for the root (run in a command transaction): `purgeExpiredSignals(ctx)` (daily), `deleteSubjectSignals(tx, subject)`, `exportSignals(tx, subjects, now)`, `importSignals(ctx, rows)` (source import, weight clamped to +-20, original observedAt kept, unknown kinds become manual_concern 0), `readRollup`.
- `SIGNALS_ROLES` for `createRoleTableAuthz`, `CONSUMED_EVENT_TYPES`.

## Options and ports
- `mode` (`vault` default, requires `principalKey`; `relay` requires `hasOpenCase(moderatorKey, subjectKey)` for moderators), `linkedKeys(subject)` (verified rotation links held by the identity module), `resolveSubjectKey(subjectKeyHash)`, `metrics`.
- Vault trust rule: events with actor kind federated and no provenance signature are ignored; relay-only actions are ignored in a vault.

## Deviations
- Dispute resolution is derived from the documented resolution enum: `no_fault_close` or `lapsed` compensates the dispute_opened signals of that case; `refund_claimed` or `return_agreed` records dispute_lost (20, half-life 90 days, the spec gives none) against the respondents found through the case id; `enforcement_referral` records nothing. Opened signals use sourceEventId `<caseId>#<respondent>` so redelivery under a new event id still counts once.
- auctions.result.voided and commerce.payment.expired carry no party in their documented payload; the mapping reads optional `partyId` and `payeeId` and ignores the event when absent.
- commerce.deal.completed uses `parties[{did}]` (N3). mutiny dropouts count when `phase` is not `before_commit`.
- moderation.action.applied: warn 10, restrict_feature 20, suspend_relay_access 40; remove_from_index has no documented weight and is ignored.
- A compensation of a signal is found through evidenceRef `compensates:<id>` (evidenceRef of event-derived compensations is therefore not the case id).
- The 4th signal from a source is stored with `capped: true` rather than dropped, so it stays auditable; it never counts.
- Append-only is by construction (module code only inserts; removal only at expiry or subject deletion); the kernel repo layer has no UPDATE trigger.

## Test rows not covered
T09 (aborted transaction and dispatcher outage: kernel behaviour, no module-specific hook), T10 (SQL trigger; not expressible in kernel repos), T11 load, T12 traceability, T13 (export/import round trip is tested without the TEST id because the relay backup restore part is not available here), signals above 5 000 per subject are not rolled up into a rollup signal (not implemented; counts rollup at purge only).

## Open questions
- moderation.spam.detected carries `subjectKeyHash`, not a did:key; who resolves it to the subject key?
- Relay pseudonymization of signals on subject deletion for the case duration is not implemented (needs the privacy module).
- report_dismissed_bad_faith has no consumed event in the spec table; no mapping.

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 60 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
