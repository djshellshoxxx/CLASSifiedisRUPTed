# PS-094-07 — Privacy, retention and abuse: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-07.R01** Reporter key and details are P3 in the vault and travel only sealed to the chosen relay's moderation key, never in federation payloads or public projections.
- **PS-094-07.R02** Reports are retained under RET-EVIDENCE; on the relay the retention is the relay's published policy, never less than the case duration.
- **PS-094-07.R03** Report abuse (mass reporting, retaliation, spoofed outcomes) is limited by per-key and per-prefix relay caps, dedupe, signature checks and local-only effects of advisories.

## Specification

**Data classification**
- Report: P3 (reporter vault; moderators of the addressed relay after opening).
- details: P3 free text; sealed; treated as untrusted content by moderators.
- AdvisorySubscription: P3 (device only); reveals the user's moderation preferences so it is never synced.

**Retention**
- Resolved and withdrawn reports in the vault: RET-EVIDENCE (2 years after last related activity), user may delete earlier from the vault.
- Relay copy: per relay policy, default RET-EVIDENCE; signed tombstones from the reporter are honoured only for the details field when no case is open.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Mass reporting to take down a competitor's listing | relay caps 20 reports per day per key and 60 per /24 prefix, no automatic removal from report count alone, human or deterministic rule decides on that relay only |
| T02 | Reported party deduces the reporter | relay policy omits reporter from notices; the UI states that the relay operator can see the reporting key and pseudonymity is not anonymity; reporters may use a fresh per-relay device key |
| T03 | Forged outcome statement shows 'content removed' to the reporter | outcomes accepted only with valid relay signature over the report id; invalid ones are quarantined |
| T04 | Malicious advisory feed hides a competitor's listings in many vaults | advisories are opt-in per publisher, show the publisher name, can be undone, and have local effect only |
| T05 | Report details used to smuggle links or private data to moderators | details is plain text capped at 1000 code points, links rendered inert, scanned by F12.S02.M02 |
| T06 | Relay replays an old receipt to fake acknowledgement | receipts bind reportId and a relay sequence number; replay of a stale sequence is rejected |

**Abuse controls**
- Bad-faith signal: five reports dismissed by one relay within 30 days sends a report_dismissed_bad_faith signal in that relay's F12.S03.M02 store and lowers that key's cap to 3 per day; minor_safety and imminent-harm reasons are exempt.
- Vault UX throttle: more than 10 reports per hour from one vault asks for confirmation (local convenience guard, not security).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T07 | abuse | PS-094-05.R01, PS-094-05.R03, PS-094-07.R01, PS-094-09.R03 | outcome signed by a different key; non-moderator queries relay reports | outcome quarantined; NOT_FOUND and no reporter key in any response or event to the author |
| TEST-PS-094-09.T11 | abuse | PS-094-07.R03 | 21 reports by one key in a day; key with five dismissed reports files a 4th | 21st and 4th return RATE_LIMITED; minor_safety exempt |
| TEST-PS-094-09.T15 | integration | PS-094-07.R01, PS-094-07.R02, PS-094-10.R01, PS-094-10.R02, PS-094-10.R03 | export, restore into fresh vault, import imported open report | own reports round-trip; imported open reports become withdrawn; details stay sealed |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
