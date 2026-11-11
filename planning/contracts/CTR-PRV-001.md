# CTR-PRV-001 — Privacy, location and retention classes

**Status:** APPROVED. **Owner:** F10.S01 (data_controls) and F10.S02 (security_boundaries).

## Data classes
| Class | Visibility | Examples | Federation | Logs |
|---|---|---|---|---|
| P0 Public | anyone | listing title/description/photos (EXIF stripped), pseudonym, L2 region | allowed if user opted in | allowed |
| P1 Community | signed-in members of tenant | reputation summary, profile bio | no (unless opted in) | IDs only |
| P2 Participant | parties to a specific proposal/thread/booking | offers, cycle composition, meetup window, L3 area | never | IDs only |
| P3 Private | owner only (and legal-hold export) | exact address, contact email, drafts, blocked list, recovery hints | never | never |
| P4 Secret | owner device only / hashed at relay | private keys, session tokens, recovery codes | never | never |

## Location precision (D05)
| Level | Precision | Use |
|---|---|---|
| L0 | none | default when permission absent |
| L1 | geohash 4 (≈39 km × 19.5 km) | coarse browse |
| L2 | geohash 5 (≈4.9 km × 4.9 km) | **maximum precision in any public/search/federated payload** |
| L3 | geohash 6 (≈1.2 km × 0.6 km) | disclosed to a counterparty only by explicit user action |
| L4 | exact lat/lon | user-initiated share to one counterparty, TTL ≤ 24 h, P3 storage |

- **PRV-1** Points are snapped to the geohash cell (cell ID stored, not a jittered point); repeated queries reveal nothing finer than the cell.
- **PRV-2** Distances shown publicly are bucketed: `<5 km`, `5–10`, `10–25`, `25–50`, `>50 km`; computed cell-to-cell; minimum search radius 5 km. Proximity queries are rate limited (F12.S03.M03 rate limits) to block trilateration.
- **PRV-3** Home addresses are P3; never part of listing, search index, event payload of class < P3, export to other users, or federation.
- **PRV-4** Uploaded images are re-encoded client-side and server-side with metadata stripped (EXIF/XMP/GPS); the relay rejects images still containing GPS tags.

## Retention classes (D07)
| Class | Default | Notes |
|---|---|---|
| RET-EPHEMERAL | 24 h | nonces, live-location shares, rate-limit counters |
| RET-SHORT | 30 days | idempotency keys (24 h), notification delivery logs, drafts after deletion request |
| RET-STANDARD | until user deletion, purge 30 days after delete | listings, profiles, messages |
| RET-EVIDENCE | 2 years after last related activity, configurable per jurisdiction (F18.S01.M01) | proposals, consents, payment claims, receipts, moderation decisions |
| RET-AUDIT | 1 year | authorization audit, operator actions |
| RET-LEGAL-HOLD | until hold released | overrides all deletion; requires admin + second approver |
Deletion = tombstone (ID, type, deletedAt) kept for federation propagation for 180 days; content purged; encrypted blobs crypto-shredded by deleting their per-object key.

## ADR-0016 amendment (local-first)
- **PRV-5** P2 data travels only as end-to-end encrypted envelopes addressed to the listed participants; relays see ciphertext plus minimal routing metadata (recipient mailbox ID, size, time). P3/P4 never leave the vault except in the user's own export.
- **PRV-6** Relays retain public projections per their published policy and must honour signed tombstones; copies already fetched by other vaults cannot be recalled, and the UI says so before publishing.

## ADR-0016 amendment 2 (review pass, 2026-11-11)
- **PRV-7** Supersedes the server-side re-encode in PRV-4: vaults strip and re-encode images before upload; relays only run `verifyImageClean` and reject with `PRIVACY_METADATA_GPS_PRESENT`; relays never re-encode (N9).
