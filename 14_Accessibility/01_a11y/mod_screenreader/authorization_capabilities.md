# PS-110-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-05. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines who may perform which action on which mod_screenreader resource. This file maps module actions to capability names for CTR-CAP-001 (owner F16 with F07 identity). It does not define the canonical capability matrix; that is owned by F16. Deny is the default for any actor and action not listed.

## Requirements
- PS-110-05.R01: **Business outcome.** Only authorized operators change the catalog. Participants read active text and manage only their own preferences. No one reads another participant's preference through this module. **Actors:** anonymous visitor (A), participant (P), feature owner for prefix `sr.fNN` (FO), catalog editor (CE), release manager (RM), auditor (AU), system service (SY). **Exclusions:** account authentication (F07); role administration (F16); per-user moderation of content (F12).
- PS-110-05.R02: **Cases.** Normal: participant updates own preference. Invalid: participant submits `participant_id` of another account. Expired: a capability grant past its expiry is treated as absent. Duplicate: repeated grant has no additional effect. Concurrent: role revoked while a publish is in progress; checked again at commit. Offline: a queued preference write made after sign-out is rejected at replay. Adversarial: feature owner writes a label under another prefix; editor attempts to approve own release; anonymous caller requests draft rows.
- PS-110-05.R03: **Budgets.** Authorization decision ≤ 5 ms p95 with cached grants. Grant or revocation propagates to all servers within 60 s. Authorization failures return `SCREENREADER_FORBIDDEN` (403) without revealing whether the resource exists, except where the caller already has read access.

## Capability names (CTR-CAP-001 vocabulary, proposed)

| Capability | Covers |
|---|---|
| `sr.label.resolve` | resolve active labels and read active releases |
| `sr.catalog.read_draft` | read draft rows |
| `sr.label.draft.write` | upsert and discard draft rows under own prefix |
| `sr.release.stage` | stage, extend or abandon a staging release |
| `sr.release.publish` | publish a staged release |
| `sr.release.rollback` | create rollback staging release |
| `sr.preference.own.read` | read own preference |
| `sr.preference.own.write` | update or enable/disable own sync |
| `sr.preference.export` | system-only, used by F10 export path |
| `sr.coverage.read` | coverage counts |
| `sr.catalog.export` | export catalog file |

## Permission matrix (actor x action x resource)

Legend: ALLOW, DENY, OWN (own resource only), SCOPE (own feature prefix only), APPROVER (second approver, distinct from stager).

| Action | Resource | A | P | FO | CE | RM | AU | SY |
|---|---|---|---|---|---|---|---|---|
| resolve label | active `sr_label` | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| read release metadata and active rows | `sr_release` (published) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| read draft or staging rows | `sr_label` draft | DENY | DENY | SCOPE | ALLOW | ALLOW | ALLOW | DENY |
| upsert or discard draft | `sr_label` draft | DENY | DENY | SCOPE | ALLOW | DENY | DENY | DENY |
| stage or abandon release | `sr_release` staging | DENY | DENY | DENY | ALLOW | ALLOW | DENY | DENY |
| publish release | `sr_release` staging | DENY | DENY | DENY | DENY | ALLOW (not stager if assertive) | DENY | DENY |
| rollback | `sr_release` published | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| read own preference | `sr_preference` | DENY | OWN | DENY | DENY | DENY | DENY | DENY |
| update own preference, toggle sync | `sr_preference` | DENY | OWN | DENY | DENY | DENY | DENY | DENY |
| read any preference | `sr_preference` | DENY | DENY | DENY | DENY | DENY | DENY | export only |
| read coverage counts | feature coverage | DENY | DENY | SCOPE | ALLOW | ALLOW | ALLOW | DENY |
| export catalog file | `sr_release` | DENY | DENY | DENY | ALLOW | ALLOW | ALLOW | DENY |

Notes: the stager of a release may not approve it. A feature owner may upsert only `label_id` values with their own `sr.fNN` prefix (VR-02). The system actor reads preferences only through the F10 export path using `sr.preference.export`.

## Rules
- **Two-person publish:** a release containing any `assertive` row requires two distinct `release_manager` approvers, neither equal to the stager (VR-14, A-screenreader-05).
- **Revocation:** a revoked grant is effective for new requests within 60 s. An in-flight publish re-checks the publisher's grant inside its transaction and aborts with `SCREENREADER_FORBIDDEN` if revoked.
- **Identity source:** caller identity comes only from the session token (F07). Body fields naming a caller are ignored.
- **Deny by default:** unlisted actor/action pairs are denied and logged with the error code only.

## Open decisions
- **A-screenreader-10:** Operator roles `catalog_editor`, `release_manager` and `auditor` are mapped to the capability names above. The F16 role matrix is not yet defined, so this mapping is a proposal to be confirmed with F16 and CTR-CAP-001.
- Whether feature owners are an F16 role or a per-feature grant is OPEN and linked to D10 (auth and portability).
