# PS-106-09 — Contract and acceptance tests: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-106-09.R02** Contract tests check commands, mirror statements and event payloads against the schema registry.
- **PS-106-09.R03** The default matrix is verified against a golden table.
- **PS-106-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues and a keyboard and screen-reader walk-through.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U with default matrix version 2 on devices A and B, relay R holding a registered push consent for U, relay R2 holding push and email consent, F16.S02.M02 registry double, fake clock starting 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01, PS-106-01.R04 | create a new vault and read the matrix | 8 records equal the golden default table version 2; security inApp true and locked; activity inApp false and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V09 violated in turn including security in-app off and activity in-app on | documented error code returned and nothing changed |
| TEST-PS-106-09.T03 | unit | PS-106-03.R01, PS-106-03.R02 | edit cells across categories and channels | edits in place with revision increments; no cell deleted; locks held |
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged and peer_accepted only after the acceptance signature over its cid |
| TEST-PS-106-09.T05 | contract | PS-106-04.R01, PS-106-04.R02, PS-106-09.R02 | each command and query executes in its environment | outputs, statements and event payloads validate against registry schemas; relay-local changed emitted in the SQLite transaction of an applied mirror |
| TEST-PS-106-09.T06 | integration | PS-106-04.R03, PS-106-02.R04 | vault-local opted_in and opted_out; push flag set before push consent | channel shown active or inactive; flag stored inactive and not mirrored until consent; column mirrored after the registration on opt-in |
| TEST-PS-106-09.T07 | abuse | PS-106-05.R01, PS-106-05.R02, PS-106-05.R03 | forged mirror from another key; mirror for email at R without email consent; third party read | rejected; operator cannot read the in-app column |
| TEST-PS-106-09.T08 | integration | PS-106-06.R02, PS-106-06.R03 | replay mirror seq 5 after seq 7 on one chain; devices A and B each mirror a different push column; a restored vault reuses seq 7 with another cid | stale replay acknowledged without change and never peer_accepted; the column accepted last is effective and A shows that the relay uses B's settings; fork refused CONFLICT_STATE with currentCid; no merged cells |
| TEST-PS-106-09.T09 | abuse | PS-106-07.R01, PS-106-07.R02, PS-106-05.R02 | inspect mirror statements and relay storage at R (push only) and R2; app update with a new category | R holds only push booleans and no email flags; R2 one column per channel; no in-app column or other bucket anywhere; user choices preserved |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | relay-local opted_out for the last push consent at R; fake clock advanced 24 h; 61st edit in an hour | R's push rows deleted at once and absent after 24 h; RATE_LIMITED |
| TEST-PS-106-09.T11 | load | PS-106-08.R01, PS-106-08.R02, PS-106-08.R03 | 50 mirror per second for 2 minutes and 100 000 resolve calls | budgets met |
| TEST-PS-106-09.T12 | unit | PS-106-09.R01 | traceability tool run | every PS-106 requirement maps to a passing test |
| TEST-PS-106-09.T13 | integration | PS-106-10.R01, PS-106-10.R02, PS-106-10.R03, PS-106-01.R05 | export, import into fresh vault with an unknown category, restore relay from backup | matrix round trips; unknown category kept in the other bucket with defaults and never mirrored |
| TEST-PS-106-09.T14 | a11y | PS-106-09.R04 | matrix with screen reader and keyboard | table semantics, locked switches explained, zero serious axe issues |
| TEST-PS-106-09.T15 | contract | PS-106-09.R03, PS-106-06.R03 | golden default table and resolve without a mirror; security.key.revoked for the effective device key | resolve returns the defaults with source defaults and allows security push; after revocation the next active chain or the defaults apply |
| TEST-PS-106-09.T16 | integration | PS-106-04.R04, PS-106-04.R05 | registry lookup of classrup.notify.preference_mirror/v1; DeletionPort plan and purge, export section and retention purge with F10 doubles; check for os_alert | signer role principal and audience relayId present; purge removes the matrix; section notify.preferences exported; os_alert follows inApp |

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- The security category in-app flag can never be false through any command, import or app-update merge.
- Relay storage and traffic captures contain no in-app column, no unconsented channel and no content.

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
