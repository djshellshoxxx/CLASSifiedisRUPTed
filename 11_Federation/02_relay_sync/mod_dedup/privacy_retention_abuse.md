# PS-087-07 — Privacy, retention and abuse: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-07.R01** The module reads only cids, authors, seq and prev, never payloads, so it cannot leak content.
- **PS-087-07.R02** Buffer limits cap the memory and storage an attacker can pin with forged future seq numbers.
- **PS-087-07.R03** Retention of buffered envelopes is at most 24 h and is enforced through bufferedUntil.

## Specification

**Data classification**
- Cids, did:key authors, seq numbers: P0 identifiers.

**Retention**
- No data kept; buffered rows follow F11.S01.M02 and are dropped after 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Memory or storage exhaustion by many forged future seq numbers | gap ≤ 100, 50 per author, 5000 total (V02, V03) |
| T02 | Replay of delivered envelopes to cause repeated side effects | duplicate decision by cid; callers emit no event on duplicate |
| T03 | Equivocation: two different histories for the same seq | fork decision, never accepted; handed to F11.S02.M03 |
| T04 | Hash-chain splice: valid envelope with prev pointing at an unrelated cid | prev must equal the stored cid at seq-1, else fork prev_mismatch |

**Abuse controls**
- Buffer-full and gap-too-large counts per peer are reported to F11.S03.M01 health score; 100 per hour marks the peer degraded.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T04 | property | PS-087-01.R01, PS-087-02.R01, PS-087-07.R03 | random splices of prev values and duplicated seq with different cid | never next; always fork or reject |
| TEST-PS-087-09.T09 | abuse | PS-087-07.R01, PS-087-07.R02, PS-087-07.R03 | forge 10 000 future seq numbers for one author | at most 50 buffered; counters and peer report recorded; payload never read |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
