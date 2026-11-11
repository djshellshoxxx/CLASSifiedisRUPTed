# PS-086-07 — Privacy, retention and abuse: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-07.R01** Conflict records hold cids, provenance and public payload diffs only; commitment conflicts reference encrypted statements by cid and never store plaintext on a relay.
- **PS-086-07.R02** A relay operator sees only public projections and ciphertext metadata and therefore resolves only public_projection conflicts on that relay.
- **PS-086-07.R03** Attackers must not be able to freeze someone else's trade with unsigned or role-less statements.

## Specification

**Data classification**
- ConflictRecord: P1; candidate cids, claimed and receipt times, author did.
- Candidate payloads stay in F11.S01.M02 under their own class.

**Retention**
- RET-EVIDENCE (2 years after resolution) so a trade dispute can show what was received and when; pseudonymized on account deletion.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Griefing: attacker injects a second statement to freeze a victim's trade | detect requires a verified signature by the victim's authorized key or a listed participant; role-less statements are quarantined by F11.S01.M02 and never open a conflict |
| T02 | Equivocating author or relay shows different histories to different peers | both versions retained as evidence; author's chain marked forked; peers receive health signal via federation.conflict.detected |
| T03 | Operator abuse: resolving in favor of a friendly author | resolution recorded with decidedBy and note; both signed candidates remain; audit entry under RET-AUDIT |
| T04 | Clock-claim manipulation to look earlier | claimed times labelled claims; only relay receipts count as evidence and only of that relay's clock; origin-wins uses arrival from the bound relay, not claimed time |

**Abuse controls**
- At most 20 open conflicts per author per relay; the 21st quarantines the author's further envelopes with a health signal to F11.S03.M01.
- Commitment freezes can always be lifted by the local principal choosing drop_all, so no counterparty can lock a vault indefinitely.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T04 | integration | PS-086-03.R02, PS-086-04.R03, PS-086-07.R02 | public conflict untouched for 7 days with a bound origin | auto_resolved origin_wins keeps the first-received-from-origin cid; event emitted |
| TEST-PS-086-09.T09 | abuse | PS-086-05.R01, PS-086-05.R02, PS-086-05.R03, PS-086-07.R03 | non-operator resolves on relay; external request calls detect; third party reads conflict | FORBIDDEN or NOT_FOUND; operator resolution logged with decidedBy |
| TEST-PS-086-09.T10 | abuse | PS-086-07.R01, PS-086-07.R03 | attacker signs a statement as a non-participant for a victim's proposal | quarantined, no conflict opened, trade not frozen |
| TEST-PS-086-09.T13 | integration | PS-086-07.R02, PS-086-03.R03 | relay with ciphertext commitment statements | relay stores no plaintext and refuses to resolve commitment conflicts |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
