# PS-091-07 — Privacy, retention and abuse: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-07.R01** Peer records contain no user data; they hold relay identity, quotas and health only.
- **PS-091-07.R02** A user's chosen relays are P1 vault data and are not shared with other users or relays, and the user is told which metadata a relay can observe (mailbox ID, size, time, IP).
- **PS-091-07.R03** Pseudonymity is not anonymity, so the relay chooser states that a relay sees the IP address of connecting devices and the did:key of each author.

## Specification

**Data classification**
- Peer: P1; relay id, URL, key, quotas, health.
- Audit log entries for peer changes: RET-AUDIT.

**Retention**
- Peers RET-AUDIT (1 year after removal); suspended and removed peers keep keys and reasons for the audit period.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious peer floods or forges provenance | explicit allowlist, per-peer quotas, health score auto-suspend, origin binding in F11.S01.M02 |
| T02 | Peer key substitution (man in the middle at first contact) | fingerprint confirmation out of band before activation; key pinned; rotation only via statement signed by the old key |
| T03 | SSRF through base URL (private IPs, redirects, DNS rebinding) | V01 checked on every connection; no redirects; resolved addresses validated at connect time |
| T04 | Equivocating or replaying relay | health -20 per fork, suspension on second fork within 24 h, replay handled by cid dedup |
| T05 | Rogue operator adds themselves as peer to harvest public data | peer needs both sides' opt-in; only public P0 owner-opted-in data is ever pushed; audit log of every peer change |

**Abuse controls**
- At most 200 peers per tenant; at most 10 proposals per hour.
- Quota breach returns FEDERATION_QUOTA_EXCEEDED with retryAfterMs and reduces health by 2 per 10 breaches.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T04 | abuse | PS-091-02.R02, PS-091-07.R03 | peer presents different key with and without rotation statement | mismatch refused and suspended; valid rotation accepted for 7 day overlap |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01 | 6 invalid-signature rejections, then a fork event | health drops by 25 cap then 20; suspension below 40 and federation.peer.suspended emitted |
| TEST-PS-091-09.T12 | abuse | PS-091-07.R01, PS-091-07.R02 | inspect peer rows, logs and relay chooser UI | no user data in peer rows; chooser states IP and did:key visibility |
| TEST-PS-091-09.T13 | abuse | PS-091-07.R03, PS-091-07.R01 | 11 proposals in an hour; quota breach 10 times | rate limit on the 11th; health reduced by 2 per 10 breaches |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
