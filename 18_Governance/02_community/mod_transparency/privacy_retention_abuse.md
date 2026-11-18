# PS-148-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-07.R01 | Cells below the small-cell threshold are suppressed (PS-148-02 R01) and complementary suppression applies (R02). | MVP |
| PS-148-07.R02 | Figures under legal hold are excluded from publication until the hold is released and the figure is recomputed. | MVP |
| PS-148-07.R03 | Drafts are retained 1 year; published reports indefinitely (ASSUMPTION; D07 default PROVISIONAL for drafts). | MVP |

## Abuse controls
- **Selective reporting:** every category in the approved list must appear, suppressed or not (ASSUMPTION).
- **Differencing attacks:** complementary suppression (R02) and rounding (PS-148-01 R02).
- **Pre-publication leaks:** draft read is privileged and logged.

## Assumptions & open decisions
- ASSUMPTION: the approved category list is public with the methodology.
- D05 and D07 defaults: PROVISIONAL (unapproved).
