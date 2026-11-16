# PS-004-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, disclosure matrix, K_MIN), CTR-FED-001 (federation opt-in, tombstones), CTR-CAP-001 (field visibility, decision records), CTR-EVT-001 (`max_data_class`). **Pending:** PENDING CTR-REG-001 (cells and K_MIN inputs).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-07.R01 | Publish payloads carry no coordinates, street address, phone or email. Region is a registered cell only (CTR-PRV-001 R03, R04). | MVP |
| PS-004-07.R02 | Title and description are PII-scanned before commit. A match sets `personal_data_suspected` (T2). Matched text is not stored, logged or returned. | MVP |
| PS-004-07.R03 | `federate` defaults to false (CTR-FED-001 R02). Federating `listing.published` needs owner opt-in and K_MIN for `region_cell`. | MVP |
| PS-004-07.R04 | Listing and publish fields: RET-ACC. Hold reason: kept on listing until cleared. Moderation decision records: RET-AUD (12 months). | MVP |
| PS-004-07.R05 | ≤ 30 `lst.publish` per `acc_` per 24 h (ASSUMPTION). Duplicate (same owner, same normalized title, same price, within 24 h) → T2 `risk_review`. | MVP |
| PS-004-07.R06 | Draft existence is hidden from non-owners (identical SYS.NOT_FOUND). | MVP |
| PS-004-07.R07 | On account deletion, listing content is removed or tombstoned within 24 h. Federated copies receive a tombstone (CTR-FED-001 R07). | MVP |

## Data class and retention
| Field | Class | Retention |
|---|---|---|
| listing_id, owner_ref, revision, state | PSEUDONYMOUS | RET-ACC |
| title, listing_kind, price | PUBLIC (PROVISIONAL, see PS-004-01 OPEN-1) | RET-ACC |
| region_cell | LOCATION_COARSE | RET-ACC |
| hold.reason_code, placed_at | PSEUDONYMOUS | until cleared; then in event history under RET-ACC |
| PII scan matches | not stored | none |

## Threats and controls
| Threat | Control |
|---|---|
| Home address or phone typed into title | R02 scan and hold. Detection is not guaranteed; residual risk stated in RISK_REGISTER terms. |
| Region triangulation by repeated publish or probes | R05 limits; state query returns no history; K_MIN in discovery (CTR-PRV R05). |
| Sybil mass publication | Rate limit, risk verdict, K_MIN; pseudonyms are cheap, so no trust is granted from them. |
| Linkage of listings through `owner_ref` | `acc_` never public; `prf_` view only (CTR-CAP R02). |
| Owner republishes held content | PUB.HOLD_ACTIVE; offline replay re-checked at commit. |
| Metadata via federation timing | Outbound jitter (CTR-FED R12). |

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 applies to `region_cell` in public and federated output (CTR-PRV-001).
- PROVISIONAL (D05 default, unapproved): coarse region and user-initiated precision disclosure. Publish never discloses precision.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions.

## Tests
- TEST-PS-004-07-01 (zero tolerance): fixtures with coordinates, addresses, phone numbers in any field produce no occurrence in public output, federation batch, log or push payload (CTR-PRV TEST-03).
- TEST-PS-004-07-02 (PII): email, phone and street patterns in title and description produce T2 with no matched text in the record.
- TEST-PS-004-07-03 (federation): `federate = false` listing absent from every batch; held listing never federated.
- TEST-PS-004-07-04 (abuse): 31st publish in 24 h → SYS.RATE_LIMITED; replay of an earlier key does not count.
- TEST-PS-004-07-05 (deletion): deleted account's listings absent from public reads within 24 h; federated tombstones emitted.

## Acceptance criteria
1. TEST-PS-004-07-01 shows zero precise-location or contact-data occurrences across the corpus.
2. TEST-PS-004-07-02 to -05 pass in CI.
3. Retention values match the table above or carry an approved F10 change.
