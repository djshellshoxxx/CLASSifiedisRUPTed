# PS-110-07 — Privacy, retention and abuse: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-07.R01** Nothing is collected, and announcement text is held in memory only until cleared after 5 s.
- **PS-110-07.R02** Alt text written by authors is public content under the privacy class of the listing and is limited to 140 characters of plain text.
- **PS-110-07.R03** Live regions never include secrets such as recovery codes or key material.

## Specification

**Data classification**
- Announcement text: transient, mirrors visible UI text.
- Alt text: P0 when the listing is public, otherwise follows the listing class.

**Retention**
- None for announcements; alt text follows the owning record retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Announcement flood by remote content causing denial of service for screen reader users | rate limit 1 per 2 s per region, de-duplication, polite default |
| T02 | Alt text used for spam or tracking links | plain text only, 140 characters, links not rendered, spam heuristics of the owning feature apply |
| T03 | Secrets spoken aloud in a shared space | secret fields use password type and are never announced; recovery code reveal requires an explicit action |

**Abuse controls**
- At most 3 assertive announcements per minute per page; further ones are downgraded to polite.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-05.R03, PS-110-07.R02 | icon-only button without name; photo without alt; alt of 141 characters; decorative photo | V03 and V04 raised; decorative accepted; no tracking links rendered |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R02, PS-110-07.R01, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
