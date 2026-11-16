# PS-084-07 — Privacy, retention and abuse: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-07.R01** Only P0 data at L2 or coarser is ever federated relay to relay, and participant statements travel only as end-to-end encrypted envelopes (PRV-5) whose plaintext a relay never sees; anything else fails V11 and the envelope is rejected, and exact home addresses never exist in this module.
- **PS-084-07.R02** Provenance must not leak user metadata, so peers receive neither reader identity nor IP addresses, and media is fetched by the relay and served locally rather than hot-linked.
- **PS-084-07.R03** Tombstones remove content within 24 h of receipt and are kept 180 days; this is deletion propagation, not recall (PRV-6), and the UI states that peers who copied content earlier may keep it.

## Specification

**Data classification**
- FederatedRecord: P0 for public audience mirrors, ciphertext only for participants audience, plus provenance (peer relay id, claimed and local timestamps).
- Tombstone: P0 (target cid or record id, reason enum).
- Rejection log rows: cidPrefix (12 chars), peer id, code; no payload.

**Retention**
- Accepted mirrors: RET-STANDARD; mirrors of listings are also purged 35 days after the payload expiresAt.
- Tombstones: 180 days from appliedAt, then deleted; rejected-envelope log rows 30 days.
- Quarantined records: held until operator decision, auto-dropped after 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged provenance: relay B claims records of an author homed at relay C | V10 origin binding, signature check, FEDERATION_ORIGIN_MISMATCH, rebind only via signed move record |
| T02 | Replay of an old valid envelope to resurrect deleted content | cid dedup, tombstones kept 180 days, V08 rejects envelopes older than 180 days so replay can never outlive the tombstone |
| T03 | Flood of valid-looking envelopes from a peer | per-peer 6000 envelopes/hour and 10 batches/minute quota, 100-envelope batches, 4 MiB body cap, cheap checks before signature verification |
| T04 | Fork or equivocation: author or relay shows different histories to different peers | same author and seq with different cid is quarantined and reported by F11.S02.M03; neither version is shown |
| T05 | Metadata leakage: reader IP revealed to origin relay through hot-linked images | receiving relay fetches media server-side (https only, ≤ 5 MiB, ≤ 8 per record, SSRF-guarded) and serves it locally |
| T06 | Probing the blocklist by sending candidate cids | every block-rule hit returns the same generic FEDERATION_NOT_ACCEPTED with identical timing class |
| T07 | Malicious payload content (scripts, links, oversized strings) | inbound payload allowlist, plain-text only, strings ≤ 10000 code points, escaped at render |
| T08 | Tombstone forged by a third party to censor content | V12 issuer must be the target's author or origin relay and the signature is verified |

**Abuse controls**
- Repeated invalid signatures from one peer (20 in 10 minutes) are reported to F11.S03.M01 which suspends the peer.
- Rejected-event emission is coalesced: at most 20 record.rejected events per batch with suppressedCount on the last.
- Relay operators can set a kill switch by turning off flag F11, which stops ingest and hides mirrors without deleting data (F16.S03.M03 runbook).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T06 | integration | PS-084-03.R01, PS-084-07.R01 | seq 7 buffered and 24 h pass | record dropped with reason gap_timeout and one origin fetch attempted |
| TEST-PS-084-09.T07 | integration | PS-084-01.R02, PS-084-03.R03, PS-084-07.R02 | valid owner tombstone for accepted record | content purged within 1 h, tombstone applied with expiresAt = appliedAt + 180 days, event emitted |
| TEST-PS-084-09.T08 | abuse | PS-084-03.R03, PS-084-07.R01 | resend the tombstoned envelope, and an envelope dated 181 days ago | FEDERATION_TOMBSTONED and FEDERATION_RECORD_TIME_INVALID; no resurrection |
| TEST-PS-084-09.T09 | integration | PS-084-03.R01, PS-084-07.R02 | tombstone arrives before target | pending_target then applied after 24 h; later target rejected FEDERATION_TOMBSTONED |
| TEST-PS-084-09.T10 | abuse | PS-084-05.R02, PS-084-07.R01 | third party signs tombstone for X's record | FEDERATION_TOMBSTONE_UNAUTHORIZED and record remains accepted |
| TEST-PS-084-09.T11 | abuse | PS-084-02.R01, PS-084-07.R01 | relay B sends record by author Y homed at C; then valid signed move record | FEDERATION_ORIGIN_MISMATCH; after federation.account.moved rebind the same sender is accepted |
| TEST-PS-084-09.T12 | abuse | PS-084-02.R01, PS-084-07.R01 | 7000 valid envelopes from one peer within an hour and 11 batches in a minute | FEDERATION_QUOTA_EXCEEDED with retryAfterMs; stored count capped at 6000 |
| TEST-PS-084-09.T13 | integration | PS-084-03.R01, PS-084-07.R01, PS-084-08.R02 | two envelopes same author and seq with different cids | both quarantined, hidden from reads, federation.conflict.detected consumed |
| TEST-PS-084-09.T14 | abuse | PS-084-02.R01, PS-084-07.R02, PS-084-07.R03 | payload with homeAddress, lat/lon, geohash 7 and a script tag | FEDERATION_PAYLOAD_INVALID; nothing stored; escaped render for allowed text |
| TEST-PS-084-09.T20 | integration | PS-084-07.R03, PS-084-01.R03 | media from origin with hot-link URL and 6 MiB image | fetched by relay only, oversize skipped, no client request reaches origin |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
