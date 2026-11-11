# PS-091-07 — Privacy, retention and abuse: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-07.R01** Peer records contain no user data; they hold relay identity, quotas and health only.
- **PS-091-07.R02** A user's selected relays are vault data; only relays the user marks 'List in my identity document' (at most 5) are published in the portable identity document (F07.S02.M01, P0, readable by anyone who holds the document), unlisted relays are never shared with other users or relays, and the user is told which metadata a relay can observe (mailbox ID, size, time, IP).
- **PS-091-07.R03** Pseudonymity is not anonymity, so the relay chooser states that a relay sees the IP address of connecting devices and the did:key of each author.
- **PS-091-07.R04** The module registers the N6 ports (ExportSectionPort for the selected-relay list, DeletionPort whose purge step deletes the principal's selected-relay list and which retains nothing to pseudonymize, RetentionPurgePort for RET-AUDIT peers) and classifies fields with F10.S02.M02; privacy.deletion.completed is a notification only (N6a).

## Specification

**Data classification**
- Peer: P1; relay id, URL, key, quotas, health.
- listInIdentityDoc selection: P1 in the vault; listed relays become P0 once the portable document is published.
- Audit log entries for peer changes: RET-AUDIT.

**Retention**
- Peers RET-AUDIT (1 year after removal); suspended and removed peers keep keys and reasons for the audit period; expired inbound offers are deleted after 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious peer floods or forges provenance | explicit allowlist, per-peer quotas, health score auto-suspend for relay-attributable faults; provenance is display-only in F11.S01.M02 and grants no authority |
| T02 | Peer key substitution (man in the middle at first contact) | fingerprint confirmation out of band before activation; key pinned; rotation only via statement signed by the old key; previous key refused after 7 days |
| T03 | SSRF through base URL (private IPs, redirects, DNS rebinding) | V01 checked on every connection; no redirects; resolved addresses validated at connect time |
| T04 | Equivocating or replaying relay | health -20 per conflict among statements signed by the relay's own key or per contradictory receipt, suspension on the second within 24 h, replay handled by cid dedup |
| T05 | Rogue operator adds themselves as peer to harvest public data | peer needs both sides' opt-in; only public P0 owner-opted-in data is ever pushed; audit log of every peer change |
| T06 | Honest relays punished for authors' behaviour (forks via throwaway did:keys, local-policy rejections) | only relay-attributable codes and relay-key equivocation change health; author forks are limited by F11.S02.M03 |
| T07 | Flood of unsolicited peering offers | 8 KiB cap, 5 per day per IP prefix and relay id, verification before storage, 14-day expiry, operator action required |

**Abuse controls**
- At most 200 peers per tenant; at most 10 outbound proposals per hour; at most 5 inbound offers per day per source IP prefix and per relay id.
- Quota breach returns FEDERATION_QUOTA_EXCEEDED with retryAfterMs and reduces health by 2 per 10 breaches.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01, PS-091-09.R02 | peer P forwards 6 envelopes with invalid signatures, then two conflicts among statements signed by P's relay key within 24 h | health drops by 25 (cap) then 20; suspension with reason equivocation and federation.peer.suspended emitted |
| TEST-PS-091-09.T12 | abuse | PS-091-07.R01, PS-091-07.R02, PS-091-01.R02 | inspect peer rows, logs, federation payloads and the relay chooser; toggle 'List in my identity document' on for one relay and off for another | no user data in peer rows; chooser states IP and did:key visibility and exactly which relays the identity document publishes; only the listed relay appears in the next portable document |
| TEST-PS-091-09.T13 | abuse | PS-091-02.R04, PS-091-07.R03 | 11 outbound proposals in an hour; 6 inbound offers in a day from one /24; an 8193-byte offer; an offer self-signed by a different key; quota breach 10 times | rate limit on the 11th and the 6th, PAYLOAD_TOO_LARGE, FED_SIGNATURE_INVALID with nothing stored; health reduced by 2 per 10 breaches |
| TEST-PS-091-09.T22 | unit | PS-091-07.R04 | export, deletion and retention ports called by F10 (plan, execute in step order, pseudonymize); privacy.deletion.completed delivered alone in a vault | selected-relay section exported without secrets; the purge step deletes the list and pseudonymize returns count 0; privacy.deletion.completed changes nothing; relay peers untouched |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
