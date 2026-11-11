# PS-038-02 — Validation rules: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-02.R01** The qualification test uses only host-side data - host time, currentEndsAt, extensionCount and the kind of the triggering entry - never client-claimed times.
- **PS-038-02.R02** Extension application is a compare-and-set against extensionCount so concurrent paths cannot exceed the cap.
- **PS-038-02.R03** Every violation maps to one stable error code; non-qualifying bids are not errors for the bidder.
- **PS-038-02.R04** Vaults verify each extension's rulesVersion against the softCloseRulesVersion of the auction terms they hold, and its signature, sequence and previous end, and quarantine any extension that fails.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | triggering entry is a bidder-submitted manual or proxy bid with a visible amount that the host accepted; auto entries, max-only updates and retractions never qualify | AUCTIONS_EXTENSION_NOT_QUALIFIED |
| V02 | host time is strictly before currentEndsAt and at most 120000 ms before it | AUCTIONS_EXTENSION_NOT_QUALIFIED |
| V03 | extensionCount is below 30 | AUCTIONS_EXTENSION_LIMIT |
| V04 | expectedExtensionCount equals the stored extensionCount at write time | CONFLICT_REVISION |
| V05 | auction status is open | CONFLICT_STATE |
| V06 | vault - the extension's rulesVersion equals the terms' softCloseRulesVersion, its signature verifies against hostKeyId, seq is the next expected, previousEndsAt equals the last verified end and newEndsAt is previousEndsAt plus 120000 ms | AUCTIONS_EXTENSION_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T01 | unit | PS-038-01.R01, PS-038-01.R02, PS-038-02.R01, PS-038-02.R02 | bids with 120001, 120000, 1 and 0 ms remaining | 120001 no; 120000 yes; 1 yes; 0 refused by bid path with AUCTIONS_NOT_OPEN, no extension |
| TEST-PS-038-09.T02 | unit | PS-038-02.R03, PS-038-01.R03 | extensionCount 29 then 30 and a bid in window | 30th extension created; next qualifying bid accepted without extension; constants equal softclose-v1 |
| TEST-PS-038-09.T04 | unit | PS-038-02.R01, PS-038-03.R01 | proxy auto entry, max-only update, retraction, rejected bid and manual bid in window | only the manual bid extends |
| TEST-PS-038-09.T07 | integration | PS-038-02.R03, PS-038-06.R03, PS-038-04.R01 | first bid with 30 ms remaining and a second 50 ms later; first bid with 60 000 ms remaining and a second 50 ms later | two extensions, the second at 119 980 ms remaining counted from the moved end; one extension, the second bid at 179 950 ms remaining does not extend; unique seq holds |
| TEST-PS-038-09.T08 | contract | PS-038-04.R02, PS-038-04.R03, PS-038-09.R02, PS-038-09.R03, PS-038-02.R04 | apply, receive, list, preview, event and statement; auction terms and host acceptance; receipt of an extending bid | payloads and signatures validate; terms carry softCloseRulesVersion softclose-v1 and host_acceptance echoes it; the receipt carries the extension; the vault rejects a wrong host key, a wrong previous end or another rulesVersion with AUCTIONS_EXTENSION_INVALID |
| TEST-PS-038-09.T10 | integration | PS-038-02.R01 | clock step backwards and forged client times | hostTime stays non-decreasing; client time ignored |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
