# PS-027-07 — Privacy, retention and abuse: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-07.R01** Declared values are public once the owner opts the item into barter and the UI says so before signing; flags are private between the flagger and the owner.
- **PS-027-07.R02** Valuations never contain addresses or exact location, and flags carry no personal data beyond the flagger's DID.
- **PS-027-07.R03** Value manipulation to game tolerance and flag abuse to block rivals are limited by plausibility thresholds, the participants-only flag rule, a 30-day per-flagger limit and the owner's acknowledgement path.

## Specification

**Data classification**
- ItemValuation: P0 public projection fields; flags[] are P2 stored locally only.

**Retention**
- RET-STANDARD until the owner deletes it; signed tombstone on delete (PRV-6, copies already fetched cannot be recalled).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner declares an inflated or deflated value to make a bad cycle pass tolerance | automatic plausibility flag against the asking price, participant flags, and the participants' own consent on the displayed values |
| T02 | Rival floods flags to block an item | only participants of an active subject can flag, once per 30 days per item, and flags never delete the valuation |
| T03 | Value changed after consent | valuations of reserved items cannot change, and consents sign the revision snapshot that embeds the values |
| T04 | Forged valuation for someone else's item | signature must verify against the owner DID and the listing projection must be authored by that DID |
| T05 | Platform appears to appraise items | UI and copy state that values are the owner's own estimate; no module computes a market value |

**Abuse controls**
- Rate limit 60 declare commands per day per vault and 20 flags per day per vault.
- Peers that send more than 5 seq increments per item per hour are quarantined for 24 h.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T09 | abuse | PS-027-05.R01, PS-027-05.R02, PS-027-05.R03, PS-027-07.R02, PS-027-07.R03 | non-participant flags, 2nd flag within 30 days, forged projection, flags flood | rejected with documented codes |
| TEST-PS-027-09.T11 | integration | PS-027-07.R01, PS-027-07.R03 | value disclosure and relay indexing | disclosure shown before signing; relay sees only public projection fields; flags never leave as plaintext |
| TEST-PS-027-09.T15 | e2e | PS-027-01.R02, PS-027-07.R03 | mobile owner declares a value | disclosure and not-an-appraisal notice shown; axe zero serious issues |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
