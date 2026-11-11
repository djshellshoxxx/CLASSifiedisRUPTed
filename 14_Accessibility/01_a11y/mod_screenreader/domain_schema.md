# PS-110-01 — Domain schema: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-01.R01** The module owns no stored entity; its artifacts are page shell and form components, the announcer service and spoken-name helpers with typed inputs.
- **PS-110-01.R02** Spoken-name helpers take typed values (Money with its F09.S03.M01 CurrencyDef, the F06.S02.M01 DistanceBucket, Instant, SyncState) and a locale and return Result<string, AppError>; they never take pre-formatted strings.
- **PS-110-01.R03** Alt text belongs to the record that references the photo, as a shared MediaRef { ref, alt?: plain text ≤ 140 characters, decorative?: boolean } in the signed listing projection (F01.S01.M01) and as the attachment altText of F08.S01.M03 with the same 140 limit; this module receives alt and decorative as props and never stores them.
- **PS-110-01.R04** SyncState is 'local_committed' plus the F15.S01.M01 OutboxEntry.state enum (prepared, sending, transport_acknowledged, peer_accepted, completed, conflict, failed, expired, discarded); spokenSync speaks each of the ten values from the shared catalog keys sync.state.<value> that the F15.S01.M01 sync chip also uses, names the transport (relay display name or direct peer) and never claims a stronger state than CONSISTENCY_STATES allows.

## Specification

**Note:** UI library and tooling; it stores no data and owns no catalog entity. Spoken sync wording (en, keys sync.state.<value>): local_committed 'Saved on this device only'; prepared 'Saved on this device only, waiting to send'; sending 'Saved on this device only, sending now'; transport_acknowledged 'Delivered to {transport}, peer has not confirmed'; peer_accepted 'Confirmed by peer'; completed 'Delivered to {transport}, no peer confirmation needed'; conflict 'Needs attention: changed elsewhere, review your version'; failed 'Needs attention: not sent, retry or choose another relay'; expired 'Not sent: expired before delivery'; discarded 'Not sent: discarded'. {transport} is 'relay <display name>' or 'the peer's device directly'. DistanceBucket is the F06.S02.M01 enum lt5 | 5_10 | 10_25 | 25_50 | gt50; spoken variants use the keys discovery.bucket.<value>.spoken in the shared catalog next to the visual discovery.bucket.<value> keys.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T01 | unit | PS-110-01.R01, PS-110-02.R01, PS-110-09.R02 | lint fixtures with 2 main landmarks, skipped heading, duplicate nav names | V01 raised; compliant page passes |
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |
| TEST-PS-110-09.T08 | unit | PS-110-01.R04 | spokenSync for all ten values local_committed, prepared, sending, transport_acknowledged (relay and direct), peer_accepted, completed, conflict, failed, expired, discarded | each uses its sync.state key, the same text as the F15.S01.M01 chip, names the transport and never claims more than the state |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-09.R02 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
