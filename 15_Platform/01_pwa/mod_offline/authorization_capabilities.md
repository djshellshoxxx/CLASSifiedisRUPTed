# PS-116-05 — Authorization and capabilities: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-05.R01** Vault policy applies, meaning only the unlocked local principal may run any command or query here, and every entry is bound to the principal that created it.
- **PS-116-05.R02** The outbox stores no session token, relay access token or private key; each delivery obtains a relay access token by challenge-response at send time (CTR-CAP-001 CAP-10), so a relay that revoked access cannot be sent to.
- **PS-116-05.R03** Relay policy decides at send time whether the relay accepts the write or mailbox delivery; a FORBIDDEN or BLOCKED_PARTY response from a relay marks the entry failed and never changes local data.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.outbox.enqueue | local-principal | vault unlocked; entry principal = actor |
| platform.outbox.deliver | local-principal | vault unlocked; one delivery runner per vault through the Web Lock |
| platform.outbox.record_peer_ack | local-principal | called only by the ingest path with a verified signed acknowledgement; signer role = counterparty in the statement |
| platform.outbox.resolve | local-principal | entry.principal = actor and state is conflict or failed or prepared (reroute) |
| platform.outbox.discard | local-principal | entry.principal = actor and state is prepared, conflict or failed |
| platform.outbox.read | local-principal | entry.principal = actor |
| platform.storage.request_persistence | local-principal | user gesture |
| platform.storage.record_export | local-principal | called by the export module after the bundle is written |
| platform.storage.read_status | local-principal | vault unlocked; also readable while locked for the data-loss and persistence banner (no vault content) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T10 | abuse | PS-116-05.R01, PS-116-07.R03 | principal P2 unlocks a vault profile holding P1 entries | list and delivery return none of P1's entries; P1 entries keep their state |
| TEST-PS-116-09.T11 | integration | PS-116-05.R02, PS-116-05.R03 | relay revokes access then answers 401 and 403; token store inspected | delivery obtains a fresh token per send via challenge-response; FORBIDDEN marks entry failed; no token or private key in IndexedDB |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
