# PS-012-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (PENDING prefix entry), CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-COM-001 (value terms only).

**Decision labels:** Per-party attestation on accept is PROVISIONAL (D04 default, unapproved). Record ID prefix is PENDING CTR-ID-001 (proposed `cof_`, ASSUMPTION).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-01.R01 | One `counter` row per proposed revision of one `cyc_` proposal. After insert only `status`, `state_version`, `updated_at` change. | MVP |
| PS-012-01.R02 | At most one row per `cyc_` with `status = 'OPEN'` (partial unique index). | MVP |
| PS-012-01.R03 | `revision = target_revision + 1`, unique per (`cyc_id`, `revision`). Revision cap 5 per `cyc_` (ASSUMPTION). | MVP |
| PS-012-01.R04 | `slot_terms` has exactly 2 entries. N-slot counters are Future. | MVP |
| PS-012-01.R05 | Money is `amount_minor` as decimal string, max 39 digits (CTR-COM-001.R02). No float, no balance or wallet field (CTR-COM-001.R01). | MVP |
| PS-012-01.R06 | No location field of any class. Meeting points are out of scope (D05 PROVISIONAL). | MVP |

## Data / schema
```sql
CREATE TABLE counter (
  counter_id      TEXT PRIMARY KEY,            -- cof_ + 26 Crockford base32 (PENDING CTR-ID-001)
  cyc_id          TEXT NOT NULL,               -- cyc_ ref, owner F02 (not this module)
  target_revision INTEGER NOT NULL CHECK (target_revision >= 1),
  revision        INTEGER NOT NULL,
  proposer_ref    TEXT NOT NULL CHECK (proposer_ref ~ '^acc_[0-9A-HJKMNP-TV-Z]{26}$'),
  recipient_ref   TEXT NOT NULL CHECK (recipient_ref ~ '^acc_[0-9A-HJKMNP-TV-Z]{26}$'
                                       AND recipient_ref <> proposer_ref),
  slot_terms      JSONB NOT NULL,              -- array, length 2 (R04)
  value_terms     JSONB,                       -- NULL when no value change
  content_hash    CHAR(64) NOT NULL,           -- SHA-256(JCS(slot_terms, value_terms))
  status          TEXT NOT NULL CHECK (status IN ('OPEN','ACCEPTED','REJECTED',
                                  'WITHDRAWN','SUPERSEDED','EXPIRED','INVALIDATED')),
  state_version   INTEGER NOT NULL DEFAULT 1 CHECK (state_version >= 1),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL,
  schema_version  TEXT NOT NULL DEFAULT 'counter.v1',
  UNIQUE (cyc_id, revision)
);
CREATE UNIQUE INDEX counter_one_open ON counter (cyc_id) WHERE status = 'OPEN';
```
`slot_terms[i]` = `{"holder":"acc_…","gives":[{"listing_id":"lst_…","qty":1}],"gets":[…]}`; `gives`/`gets` max 20 entries; `qty` integer 1–100.
`value_terms` = `{"direction":"proposer_pays"|"recipient_pays","amount_minor":"12345","currency":{"kind":"fiat","code":"EUR"},"quote_id":"qte_…"|null}`. `quote_id` required when currencies differ (CTR-COM-001.R04).

Classes (CTR-PRV-001): `counter_id`, `cyc_id`, `revision`, `status` = PSEUDONYMOUS; `slot_terms` listing refs = PUBLIC; `value_terms` = FINANCIAL_EVIDENCE.

## Assumptions & open decisions
- ASSUMPTION: creating a counter records the proposer's consent to exactly `content_hash`.
- ASSUMPTION: `cyc_` proposal aggregate owner (F02.S01.M01 or F02.S01.M02) is unresolved; this module writes `counter` only.
- PENDING CTR-ID-001: prefix `cof_` registration (CTR-ID-002 if the registry is changed).
- D02 PROVISIONAL (D02 default, unapproved): counter creation never triggers cycle search.
- D03 PROVISIONAL (D03 default, unapproved): pinned quote, integer minor units, expiry.
- D04 PROVISIONAL (D04 default, unapproved): accept records per-party consent; no atomic handover.
- D05 PROVISIONAL (D05 default, unapproved): no precise location fields.
