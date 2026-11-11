# PS-061-05 — Authorization and capabilities: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-05.R01** Vault policy lets only the unlocked local principal create, mute or archive its own threads, and only with parties it has not itself blocked.
- **PS-061-05.R02** Inbound thread-open statements are accepted only when signed by a key entitled for the context role per the entitlement table; unknown but entitled senders become message requests and others are quarantined with a reason.
- **PS-061-05.R03** Group threads (cycle, booking, rental) are archived only by context events; participants may only mute or leave through the context module. No relay or global role can read or alter a thread.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.thread.create | local principal | vault policy; the local principal has not blocked any participant in its own block list; context known to the vault; at most 30 new threads per day as a UX guard |
| comms.thread.archive | local principal | participant(thread) and contextType in (direct, listing, proposal) |
| comms.thread.mute | local principal | participant(thread) |
| comms.thread.manage_request | local principal | thread in status request addressed to the local principal |
| comms.thread.read_own | local principal | participant(thread) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T07 | abuse | PS-061-05.R01, PS-061-05.R02, PS-061-05.R03 | outsider D sends a cycle thread-open; A (who blocked B) creates with B; participant archives a cycle thread; relay operator tries to read threads | quarantine, BLOCKED_PARTY or FORBIDDEN as documented; relay has no thread data |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
