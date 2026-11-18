# PS-056-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PSEUDONYMOUS, PRIVATE_PERSONAL, LOCATION_COARSE; RET-ACC, RET-PRIV, RET-LEGAL, RET-EPH; R11 export), CTR-CAP-001, CTR-FED-001 (profiles not federated in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-07.R01 | Private block (`contact_methods`) is PRIVATE_PERSONAL and never appears in public responses, events, logs, federation, analytics or push payloads (zero tolerance). | MVP |
| PS-056-07.R02 | `region_cell` is LOCATION_COARSE, K_MIN = 5, and never more precise than the registry grid. | MVP |
| PS-056-07.R03 | Private block purged 30 days after `prf_` retirement; public block retained as tombstone under RET-ACC. | MVP |
| PS-056-07.R04 | Disclosure grants expire at the earlier of 30 days or relation end; expired grants purged within 24 h. | MVP |
| PS-056-07.R05 | Counterparties receive private fields only with an explicit per-counterparty grant; no default share on match or trade. | MVP |
| PS-056-07.R06 | Profile text is scanned for contact patterns on write (PS-056-02 R02); residual leakage is documented, not claimed as prevented. | MVP |
| PS-056-07.R07 | Verification badges or identity documents on profile. | Future (out of scope; owned by mod_evidence) |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| public block (`bio`, `languages`, `region_cell`) | PSEUDONYMOUS / LOCATION_COARSE | RET-ACC |
| `contact_methods` | PRIVATE_PERSONAL | RET-PRIV (365 days after last access or deletion, whichever first) and purged at `prf_` retirement + 30 days |
| disclosure grants | PRIVATE_PERSONAL metadata | 30 days or relation end; then deleted |
| device queue | PRIVATE_PERSONAL (local) | RET-EPH |

## Commands / queries / events
Event payloads carry field names and grant IDs only (PS-056-04 R04).

## States & transitions
Purge timers start at transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Contact-pattern rejections logged as code and pattern type only.

## Authorization
Owner export and deletion only; counterparties see granted values only in window.

## Failure, idempotency, concurrency, offline
Purge and expiry jobs idempotent; re-run safe. Device caches cleared at logout (CTR-PRV-001). Legal hold (RET-LEGAL) suspends purge for held records only.

## Privacy, retention, abuse
- **Context leakage:** distinctive bio plus region can link a pseudonym across contexts. Mitigation: region K_MIN and user guidance. Residual risk accepted for MVP (ASSUMPTION).
- **Post-disclosure copies:** revocation stops future reads, cannot recall copies (CTR-PRV-001). UI states this.
- **Contact leakage through free text:** heuristic checks; not a guarantee.
- **Scraping:** public profile reads rate-limited per client (ASSUMPTION 120/min).
- **Abuse:** profiles with spam links are handled by mod_spam (F12); this module only enforces field rules.

## Observability & budgets
Aggregate counts of purges, grants and expiries; no per-profile values.

## Tests
- TEST-PS-056-07-01 (privacy scan): fixtures with contact data produce zero occurrences outside owner/granted responses.
- TEST-PS-056-07-02 (retention): purge at 30 days after retirement; grant expiry at 30 days.
- TEST-PS-056-07-03 (export): owner export includes own private block; counterparties' data redacted (CTR-PRV-001 R11).
- TEST-PS-056-07-04 (legal hold): held profile not purged.

## Acceptance criteria
1. Zero private values in any non-authorized output (fixture scan).
2. Retention timers verified.
3. Grants expire without manual action.
4. Residual leakage documented in user-facing copy (F14 review).

## Assumptions & open decisions
- ASSUMPTION: 30-day purge and 30-day grant maximum.
- ASSUMPTION: 120 public reads per minute per client.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- PROVISIONAL (D05 default, unapproved): coarse public regions; user-initiated precision disclosure only.
