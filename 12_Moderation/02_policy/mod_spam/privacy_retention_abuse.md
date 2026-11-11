# PS-097-07 — Privacy, retention and abuse: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-07.R01** Only hashes, counters and heuristic names are stored; text is processed in memory and never logged.
- **PS-097-07.R02** Fingerprint entries are RET-SHORT (30 days) and keyed by a salted key hash so they cannot be joined across relays.
- **PS-097-07.R03** Heuristic gaming and false positives are limited by explainable results, no automatic bans and operator-tunable bounded thresholds.

## Specification

**Data classification**
- Fingerprint and key-observation indexes: P2 derived hashes, per store.
- moderation.spam.detected: P2 with the subject did:key, store-local, consumed by F12.S03.M02, F12.S02.M01 and F12.S03.M03 only.
- Pre-sign results: returned to the author's own vault only, never stored or sent.

**Retention**
- Fingerprints: 30 days (RET-SHORT); key observations 30 days after last observation (RET-SHORT).
- Events: per signal retention in F12.S03.M02.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Spammer evades exact-hash checks by small edits | simhash with Hamming distance ≤ 3 on 64-bit hashes catches near duplicates |
| T02 | Attacker triggers throttles against a competitor by posting from lookalike keys | throttle applies only to the posting key's own intake and expires in 1 hour; no signal is attributed to other keys |
| T03 | Heuristics used to censor legitimate sellers of many similar items | results are signals with visible evidence, throttles are short, removal needs a human or a published deterministic rule |
| T04 | Regex or hash complexity attacks with hostile text | input capped at 20000 code points; linear-time heuristics only; evaluation timeout 50 ms |
| T05 | Backdated createdAt to escape velocity | velocity uses store receipt time for every first-seen content id; backdating adds backdated_claim |
| T06 | Joining spam indexes across relays to track a key | per-store salts; the did:key appears only in store-local events |

**Abuse controls**
- Velocity throttle maximum 1 hour; renewable only with fresh evidence.
- Operator thresholds are clamped to allowed ranges (V02).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T09 | abuse | PS-097-07.R01 | hostile regex-like text of 20000 code points | evaluation under 50 ms; no text in logs or index rows |
| TEST-PS-097-09.T18 | unit | PS-097-01.R02, PS-097-01.R04, PS-097-07.R02 | inspect index rows after evaluations on relays X and Y; injected clock 31 days later | only hashes and counters; key hashes differ between X and Y; entries expired |
| TEST-PS-097-09.T19 | abuse | PS-097-07.R03 | legitimate seller posts 12 variant listings in an hour | signal and at most a 1 hour throttle; no removal or suspension |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
