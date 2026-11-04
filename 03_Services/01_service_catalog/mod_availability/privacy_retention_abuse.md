# PS-028-07 — Privacy, retention and abuse: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-07.R01** Calendar rules and holds never leave the vault except the signed summary, which contains windows only and no client identities.
- **PS-028-07.R02** Summaries have a 14 day expiry so stale availability disappears from receivers' vaults.
- **PS-028-07.R03** Slot hoarding by clients is limited by per-client and per-calendar hold caps and short expiries.

## Specification

**Data classification**
- AvailabilityCalendar: P3 in the vault; summary: P1 signed projection.
- SlotHold: P2, holder identity stays local and is never in the summary.

**Retention**
- Holds: RET-SHORT, purged 30 days after release or expiry.
- Calendar: RET-STANDARD until vault deletion; expired summaries are dropped by receivers after expiry plus 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Client hoards slots with repeated quote requests | at most 3 active holds per client, 50 per calendar, default expiry 15 minutes, provider may block locally |
| T02 | Summary reveals routine and when the provider is away | summary windows can be coarsened to day parts by the provider and expire in 14 days; the UI states that copies cannot be recalled |
| T03 | Forged or replayed summary attributed to a provider | signature over JCS bytes, author must equal the offering provider key, expiry enforced by the receiver clock with 5 minute tolerance |
| T04 | DST confusion produces a double booking | slots are UTC intervals, overlap checks use UTC, property test across all zones with DST changes |

**Abuse controls**
- Receivers apply per-sender quotas (20 summaries per day per author) and drop excess.
- Relay hosting policy may rate limit uploads; the module surfaces refusal in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T10 | abuse | PS-028-07.R03 | one client requests 4 holds | 4th returns SERVICES_HOLD_LIMIT |
| TEST-PS-028-09.T11 | integration | PS-028-06.R01, PS-028-07.R01, PS-028-07.R02 | replay hold command; inspect summary payload; advance clock 15 days | same holdId; summary has no client identity; expired summary dropped |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
