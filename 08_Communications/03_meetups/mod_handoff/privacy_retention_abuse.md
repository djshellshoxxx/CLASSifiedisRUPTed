# PS-065-07 — Privacy, retention and abuse: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-07.R01** Check-in never reads or records location; the signature only evidences that a key holder asserted arrival at a time they claim, not that they were at the place.
- **PS-065-07.R02** Trusted-contact links are user-initiated, expire in at most 24 hours, show place label, window and check-in status only, and are encrypted so the relay operator cannot read them; anyone holding the full link can read it, which the UI states.
- **PS-065-07.R03** No-show reports are claims, labelled as the reporter's claim, rate limited, and carry no automatic penalties in this module.

## Specification

**Data classification**
- MeetupCheckin: P2, parties only; no coordinates.
- MeetupShare: P3 on the owner's device; relay holds only encrypted snapshot ≤ 2 048 bytes and share ID.

**Retention**
- Check-ins: RET-STANDARD, purged locally with the thread.
- Share ciphertext on the relay and share records: RET-EPHEMERAL (24 h) and erased at expiry or revocation.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | False no-show claim to harm reputation | claim label, reporter must have checked in, grace period, 24 hour limit, 5 reports per day, accused sees it and can contradict, consuming modules weigh it as a claim |
| T02 | Check-in spoofed from home | signature proves assertion only and the UI says so; no location is collected, so no false precision is implied |
| T03 | Share link leaked to a stalker | link expires in 24 hours at most, shows no names or exact addresses, owner can revoke, UI warns that anyone with the link can read it |
| T04 | Relay operator reads share content | snapshot encrypted with a key only in the URL fragment, which browsers do not send to servers |
| T05 | Forged check-in by a third party | statements need a party key signature, otherwise quarantined |
| T06 | Enumerating share IDs | UUIDv7 plus 256-bit key requirement for readable content, 30 requests per minute per IP, NOT_FOUND for unknown IDs |

**Abuse controls**
- Reports of abuse of no-show claims go to the relay operator or advisory feed with the signed statements attached (F12.S01.M01).
- Blocked parties' statements are dropped silently.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T09 | abuse | PS-065-01.R03, PS-065-07.R01, PS-065-07.R02 | capture all traffic during check-in and share creation | no location, no share key outside the fragment, relay stores ciphertext only ≤ 2 048 bytes |
| TEST-PS-065-09.T10 | abuse | PS-065-07.R03, PS-065-02.R03 | 6th no-show report in a day; report before grace period ends | RATE_LIMITED and COMMS_NO_SHOW_NOT_ALLOWED; reports labelled as claims in UI |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
