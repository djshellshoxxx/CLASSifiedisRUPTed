# PS-028-07 — Privacy, retention and abuse: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-07.R01** Calendar rules and holds never leave the vault except the signed summary, whose allowlisted fields are generated from rules and exceptions only and contain no client identities, holds or bookings.
- **PS-028-07.R02** Summaries have a 14 day expiry so stale availability disappears from receivers' vaults.
- **PS-028-07.R03** Slot hoarding by clients is limited by per-client and per-calendar hold caps and short expiries.
- **PS-028-07.R04** The module registers ExportSectionPort (section services.calendars), DeletionPort and RetentionPurgePort with F10 (N6), annotates fields with their F10.S02.M02 class, calls privacy.consent.check(federation_publish, relayId) before signing any relay summary, and pseudonymizes holder DIDs on privacy.deletion.completed.

## Specification

**Data classification**
- AvailabilityCalendar: P3 in the vault (classrup.services.calendar/v1); fields classified with F10.S02.M02.
- Summary (classrup.services.availability_summary/v1): allowlisted fields {providerId, offeringId?, timeZone, windows[{startUtc, endUtc}] generated from rules and exceptions only, granularity slot or day_part, issuedAt, expiresAt, seq, prev}; P0 when sent to a relay, P2 end-to-end encrypted (F08.S01.M01) when sent to a client.
- SlotHold: P2, holder identity stays local and is never in the summary.

**Retention**
- Holds: RET-SHORT, purged 30 days after release or expiry by the RetentionPurgePort sweep.
- Calendar: RET-STANDARD until vault deletion; expired summaries are dropped by receivers after expiry plus 24 h; receivers keep only the highest seq per provider and offering.
- On privacy.deletion.completed: holderId in retained holds replaced with the deletion pseudonym.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Client hoards slots with repeated quote requests | at most 3 active holds per client, 50 per calendar, default expiry 15 minutes, quote holds end at validUntil plus 5 minutes, provider may block locally |
| T02 | Summary reveals routine, bookings or when the provider is away | windows come from rules and exceptions only so holds and bookings never show, granularity day_part coarsens windows, 14 day expiry, PRV-6 notice before relay publish and federation_publish consent per relay |
| T03 | Forged or replayed summary attributed to a provider | signature over JCS bytes, signer must equal the providerId carried in the summary, receivers keep the highest seq, expiry enforced by the receiver clock with 5 minute tolerance |
| T04 | DST confusion produces a double booking | slots are UTC intervals, overlap checks use UTC, property test across all zones with DST changes |
| T05 | A rule change silently invalidates a promised slot | affected held holds flagged needsReconfirmation, commit refused until the provider reconfirms, quote cards flagged by F03.S02.M01 |

**Abuse controls**
- Receivers apply per-sender quotas (20 summaries per day per author) and drop excess.
- Relay hosting policy may rate limit uploads; the module surfaces refusal in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T10 | abuse | PS-028-07.R03 | one client requests 4 holds | 4th returns SERVICES_HOLD_LIMIT |
| TEST-PS-028-09.T11 | integration | PS-028-06.R01, PS-028-07.R02 | replay hold command; advance clock 15 days after a summary | same holdId; expired summary dropped by the receiver |
| TEST-PS-028-09.T16 | integration | PS-028-01.R03, PS-028-07.R01 | run every command with held and committed slots present and inspect the sync outbox | only publish_summary produces an outbound envelope; it carries only the allowlisted fields, no held or committed interval and no client identity |
| TEST-PS-028-09.T17 | integration | PS-028-01.R02, PS-028-07.R04 | retention sweep 30 days after release and expiry | released and expired holds purged through RetentionPurgePort; counts only in privacy.retention.purged |
| TEST-PS-028-09.T21 | abuse | PS-028-07.R04 | publish_summary to a relay without federation_publish consent; privacy.deletion.completed for a holder; export | SERVICES_PUBLISH_CONSENT_MISSING and nothing signed; holderId replaced by the pseudonym; export section services.calendars present |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
