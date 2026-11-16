# PS-147-09 — Contract and acceptance tests: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-09.R01** Every requirement is covered by at least one automated test.
- **PS-147-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-147-09.R03** Time-based behaviour is tested with injected clocks for vault and relay separately.

## Specification

See the module test table below (all processes).

**Fixtures:** Publisher vault P (key KP), decider vault D (key KD in authority list), member vaults M1 and M2, relay stub with its own clock, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T01 | unit | PS-147-01.R01, PS-147-02.R01, PS-147-02.R02 | draft a proposal with valid and invalid fields | stored with revision 1; invalid length or target gives documented error |
| TEST-PS-147-09.T02 | unit | PS-147-01.R02, PS-147-01.R03, PS-147-02.R03 | violate each rule V01-V10 | documented error code returned; no statement produced or accepted |
| TEST-PS-147-09.T03 | property | PS-147-03.R01, PS-147-03.R03 | random command and clock sequences | only declared transitions; terminal states never leave; decision cannot be reversed |
| TEST-PS-147-09.T04 | integration | PS-147-03.R02, PS-147-02.R03 | comment accepted by relay clock after publisher clock ended | relay clock decides acceptance; UI labels times as claims |
| TEST-PS-147-09.T05 | contract | PS-147-04.R01, PS-147-04.R02, PS-147-09.R02 | open, decide, post comment, receive | statements validate and verify; decided event payload valid |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03 | verify with exact targets, other targets, after 31 days | valid true only for exact targets within 30 days |
| TEST-PS-147-09.T07 | abuse | PS-147-05.R01, PS-147-05.R03 | proposer decides own proposal; untrusted publisher decision; third key signs | GOVERNANCE_PROPOSAL_SELF_DECISION; statements quarantined |
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only |
| TEST-PS-147-09.T09 | integration | PS-147-06.R01, PS-147-06.R02 | replay decide with same key; crash after signing | one decision statement; consistent state after restart |
| TEST-PS-147-09.T10 | integration | PS-147-06.R03 | two conflicting decisions delivered to a receiver | proposal marked conflicted; verify returns false with reason conflicted |
| TEST-PS-147-09.T11 | chaos | PS-147-06.R03 | relay down while comment posted and decision queued | states prepared then transport_acknowledged only on receipt; local state intact |
| TEST-PS-147-09.T12 | abuse | PS-147-07.R01, PS-147-07.R02, PS-147-07.R03 | scan notifications, logs and exports | no comment content in notifications or logs; retention classes as specified; hidden comment kept for audit |
| TEST-PS-147-09.T13 | load | PS-147-08.R01, PS-147-08.R02, PS-147-08.R03 | 1 000 comments on Moto G profile, relay at 50 req/s | verify p95 <= 20 ms, receive p95 <= 80 ms, relay p95 <= 300 ms, no telemetry |
| TEST-PS-147-09.T14 | unit | PS-147-09.R01, PS-147-09.R03 | traceability tool run | every PS-147 requirement maps to a passing test |
| TEST-PS-147-09.T15 | integration | PS-147-10.R01, PS-147-10.R02, PS-147-10.R03 | export, import to fresh vault, import tampered decision | proposals and decisions round-trip; tampered statement quarantined |
| TEST-PS-147-09.T16 | a11y | PS-147-01.R01 | axe run on proposal detail and comment form | zero serious or critical issues; keyboard-only commenting works |

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No policy change is applied by a consuming module without a verified, unexpired, exact-target approved decision signed by a key different from the proposer.
- The UI never presents a proposal decision as binding beyond the publishers a user trusts, and times from other parties are labelled as claims.

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
