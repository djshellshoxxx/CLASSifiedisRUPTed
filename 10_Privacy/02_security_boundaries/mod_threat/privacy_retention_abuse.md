# PS-082-07 — Privacy, retention and abuse: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-07.R01** The catalog contains no personal data, real user examples, credentials or working exploit details.
- **PS-082-07.R02** Attack descriptions are kept at the level needed to verify controls; sensitive details go to the security disclosure process (F16.S03.M03).
- **PS-082-07.R03** The model states limits honestly, namely that pseudonymity is not anonymity, relays see routing metadata, copies already fetched cannot be recalled.

## Specification

**Data classification**
- Catalog entries: P0 documentation.

**Retention**
- Kept in git history indefinitely; retired entries remain.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | PT-01 Trilateration of location via repeated proximity or distance queries | geohash cell storage (PRV-1), bucketed distances and minimum 5 km radius (PRV-2), relay rate limits on proximity queries, no distances finer than the cell; tests PRIVT-GEO-01 and PRIVT-GEO-02 |
| T02 | PT-02 Location from photo EXIF, background landmarks or filenames | EXIF/GPS strip and re-encode (F10.S02.M03, PRV-4), relay rejects images with GPS tags, upload guidance about landmarks; residual risk landmarks in image content; tests PRIVT-GEO-03 |
| T03 | PT-03 Metadata leakage through IP address, timing, user agent or fine timestamps | IP truncation /24 and /48 for any retained value, public timestamps coarsened to the hour, user agent reduced to family and major version, no third-party requests; tests PRIVT-META-01 to PRIVT-META-04 |
| T04 | PT-04 Sybil identities to farm reputation, observe a victim or distort matching | keys are cheap so reputation is local per observer and weighted by attestations, relay-level rate limits and invitation policies, no global ranking claimed; residual risk Sybil accounts cannot be eliminated; tests PRIVT-SYB-01 |
| T05 | PT-05 Social-graph deanonymization from follows, blocks, reviews and message partners | blocklists P3 and never exported to others, reviews show pseudonym only, no public friend lists, graph features computed in the vault; residual risk public reviews link pseudonyms to trades; tests PRIVT-GRAPH-01 |
| T06 | PT-06 Cycle-graph deanonymization by a participant or matcher who sees who trades with whom | proposals are P2 end-to-end encrypted to listed participants, relay matching runs only over public projections, participants see only their own legs and neighbours, no cycle composition in public events; residual risk participants learn their neighbours; tests PRIVT-GRAPH-02 |
| T07 | PT-07 Relay compromise or curious operator | relay stores signed public projections and ciphertext only, never plaintext P2 or higher, no keys; routing metadata minimized (mailbox ID, size, coarse time); user can switch relays and export; residual risk relay sees who contacts whom by mailbox ID and timing; tests PRIVT-RELAY-01 and PRIVT-RELAY-02 |
| T08 | PT-08 Malicious federated peer relays posting fake records, harvesting data or evading tombstones | signature verification FED-2, allowlisted peers with quotas FED-5, only P0 opt-in records exported FED-1, tombstone obligations and 24 h deletion FED-4, local block of peers; residual risk peers may keep copies; tests PRIVT-FED-01 and PRIVT-FED-02 |
| T09 | PT-09 Local device compromise or shoulder surfing of the vault | vault encrypted at rest with passphrase-derived or platform key, auto-lock after 5 minutes idle, fresh unlock for export and deletion, no secrets in logs; residual risk full device compromise defeats the vault; tests PRIVT-DEV-01 |
| T10 | PT-10 Traffic analysis of push and mailbox polling | content-free Web Push, padded envelopes to 1 KiB buckets, batched polling with jitter, relay selection by user; residual risk global passive observer; tests PRIVT-NET-01 |
| T11 | PT-11 Counterparty learns more than needed such as exact address or real name | exact address P3 never shared by default, L3 only by explicit action and L4 only user-initiated with TTL up to 24 h, public meetups suggested, consent shown per disclosure; tests PRIVT-GEO-04 |
| T12 | PT-12 Auction host or other chosen host abuses order or metadata | host explicitly chosen by seller and accepted by bidders, signed bid receipts, bid history exportable, UI names the host; residual risk host sees bid timing; tests PRIVT-HOST-01 |
| T13 | PT-13 Malicious update of the PWA or relay software exfiltrates data | subresource integrity, signed releases, pinned service worker versions with update on user consent, reproducible build check, strict CSP with no inline scripts; tests PRIVT-SUP-01 |
| T14 | PT-14 Re-identification of pseudonymized evidence after deletion | per-deletion pseudonym with destroyed salt, evidence limited to RET-EVIDENCE duration, honest notice that behavioral linkage may remain; tests PRIVT-DEL-01 |

**Abuse controls**
- Catalog changes require review by a privacy reviewer; the CI check blocks merges that violate completeness.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T10 | unit | PS-082-07.R01, PS-082-07.R02 | scan catalog for emails, keys, URLs to real services and exploit payload patterns | none found |
| TEST-PS-082-09.T11 | manual | PS-082-07.R03, PS-082-01.R03 | reviewer reads the user-facing summary page | states pseudonymity is not anonymity, relay metadata visibility and non-recall limits; reading level grade 8 |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
