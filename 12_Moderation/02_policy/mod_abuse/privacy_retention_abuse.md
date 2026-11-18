# PS-095-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-07.R01 | Scanning runs in-process on content the platform already stores; no third-party ML or text service without a recorded privacy impact assessment (ASSUMPTION). | MVP |
| PS-095-07.R02 | Matched text is never stored; `match_digest` is HMAC-SHA-256 with a per-environment key held in KMS. | MVP |
| PS-095-07.R03 | Findings and rules are never federated (CTR-FED-001 R03 on PRIVATE_PERSONAL sources). | MVP |
| PS-095-07.R04 | Each rule has a disparate-impact review record (dialect, language, reclaimed terms) before approval. | MVP |

## Data classes and retention
| Item | Class | Retention |
|---|---|---|
| finding metadata | PSEUDONYMOUS | RET-AUD 12 months after linked case closes |
| match_digest | SECRET (keyed) | with finding; purged with it |
| dismissed findings | PSEUDONYMOUS | purged after 90 days |
| reporter misuse counters | PSEUDONYMOUS | rolling 30 days |
| rule registry | PUBLIC (IDs and category) | lifetime; text confidential |

## Threats and controls
| Threat | Control |
|---|---|
| Harassment-by-report using scanner results | Findings are proposals; no visibility change (PS-095-03 R02). |
| Rule probing via error text | Uniform errors; no pattern echo (PS-095-02). |
| Digest reversal via dictionary attack | Keyed HMAC; key rotation annually. |
| Biased lexicon over-flags a community | Disparate-impact review; precision monitoring per rule. |
| Subject learns rule and evades | Subject sees category only. |

## Abuse controls
Reporter misuse detection feeds PS-094 restrictions with two-step approval. Scanner principal cannot read text.

## Validation & errors
Privacy-driven refusals use `SYS.FORBIDDEN` or `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Key rotation re-keys digests lazily on review; old digests expire with findings.

## Observability & budgets
Zero tolerance: matched text or digest in logs (alert). Metrics carry category only.

## Tests
- TEST-PS-095-07-01 (privacy): fixture text absent from DB rows other than the source, logs and events.
- TEST-PS-095-07-02 (bias): rule with known dialect false positives blocked at approval without review record.
- TEST-PS-095-07-03 (retention): dismissed findings purged at 90 days.

## Acceptance criteria
1. No matched text in any store outside source content.
2. Every approved rule has a disparate-impact record.

## Assumptions & open decisions
- ASSUMPTION: no external ML service without PIA.
- PROVISIONAL (D07 default, unapproved): retention classes above.
- PROVISIONAL (D01 default, unapproved): any cross-node sharing of findings uses signed events; none in MVP.
