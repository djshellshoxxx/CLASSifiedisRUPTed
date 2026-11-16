# PS-012-07 — privacy retention abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, disclosure), CTR-CAP-001 (field visibility), CTR-EVT-001 (`max_data_class`).

**Decision label:** Retention periods are PROVISIONAL (D07 default, unapproved). Rate and block limits are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-07.R01 | Counter rows reference holders only by `acc_`. No name, contact or profile field is stored. | MVP |
| PS-012-07.R02 | No location field of any class; `LOCATION_*` values are rejected at schema validation. | MVP |
| PS-012-07.R03 | Counter timestamps are visible to participants only and never in public or federated payloads. | MVP |
| PS-012-07.R04 | Idempotency keys deleted after 7 days; counter `value_terms` retained per the table below. | MVP |
| PS-012-07.R05 | Abuse controls: ≤ 5 revisions per `cyc_`; ≤ 10 creates per actor per `cyc_` per 24 h; invalidation on blocked or inactive holders. | MVP |

## Retention (PROVISIONAL, D07)
| Data | Default retention | After |
|---|---|---|
| Open or terminal counter rows | Until `cyc_` closes + 180 days | Minimized: IDs, status, revision, timestamps |
| `value_terms` | Same as row | Deleted with row |
| Idempotency keys | 7 days | Deleted |
| Audit (`aud_`) for counter decisions | Per CTR-PRV-001 retention class | Deleted; completion record kept |

Legal holds (CTR-PRV-001.R07) suspend minimization for the held `cas_` only.

## Abuse and linkage controls
| Threat | Control |
|---|---|
| Negotiation spam or stalling | Revision cap, create rate limit, expiry 7 days default |
| Graph deanonymization via counter history | Counter history visible to the two holders only; no public counter feed |
| Metadata linkage through timing | Timestamps coarsened to the minute in participant views (ASSUMPTION) |
| Sybil accounts used to stall | Rate limit per `acc_`; account trust signals from F07/F16 (PENDING) |
| Fabricated value terms | Value terms are assertions; they do not create settlement state (CTR-COM-001.R06) |

## Export, deletion and disclosure
- Owner export includes the owner's own counters and shared counter history at classes allowed by CTR-PRV-001.R11.
- Account deletion replaces the holder's `acc_` in closed counters with a tombstone. Counterparty history keeps terms without identity.

## Assumptions & open decisions
- D05 PROVISIONAL (D05 default, unapproved): meeting location is not stored here.
- D07 PROVISIONAL (D07 default, unapproved): retention table above.
- PENDING: block control and trust signal ownership (F12, F07/F16).
