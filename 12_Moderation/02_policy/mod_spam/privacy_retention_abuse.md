# PS-097-07 — Privacy, retention and abuse: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-07.R01** Only hashes, counters and heuristic names are stored; text is processed in memory and never logged.
- **PS-097-07.R02** Fingerprint entries are RET-SHORT (30 days) and keyed by a salted key hash so they cannot be joined across relays.
- **PS-097-07.R03** Heuristic gaming and false positives are limited by explainable results, no automatic bans and operator-tunable bounded thresholds.

## Specification

**Data classification**
- Fingerprint index: P2 derived hashes, per store.
- moderation.spam.detected: P2, consumed by F12.S03.M02, F12.S02.M01 and F12.S03.M03 only.

**Retention**
- Fingerprints: 30 days (RET-SHORT).
- Events: per signal retention in F12.S03.M02.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Spammer evades exact-hash checks by small edits | simhash with Hamming distance ≤ 3 on 64-bit hashes catches near duplicates |
| T02 | Attacker triggers throttles against a competitor by posting from lookalike keys | throttle applies only to the posting key's own intake and expires in 1 hour; no signal is attributed to other keys |
| T03 | Heuristics used to censor legitimate sellers of many similar items | results are signals with visible evidence, throttles are short, removal needs a human or a published deterministic rule |
| T04 | Regex or hash complexity attacks with hostile text | input capped at 20000 code points; linear-time heuristics only; evaluation timeout 50 ms |

**Abuse controls**
- Velocity throttle maximum 1 hour; renewable only with fresh evidence.
- Operator thresholds are clamped to allowed ranges (V02).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T09 | abuse | PS-097-07.R01, PS-097-07.R03 | hostile regex-like text of 20000 code points | evaluation under 50 ms; no text in logs |
| TEST-PS-097-09.T10 | integration | PS-097-03.R02, PS-097-07.R02 | throttle recommended then 61 minutes pass | throttle expired; no persistent penalty from this module |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
