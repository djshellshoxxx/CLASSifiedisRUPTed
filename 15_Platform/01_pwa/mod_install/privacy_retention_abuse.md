# PS-115-07 — Privacy, retention and abuse: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-07.R01** The module collects no analytics and sends nothing to any server (CTR-OBS-001 OBS-7); install and update counters remain on the device.
- **PS-115-07.R02** The persistent-storage explanation says that data lives on this device, that clearing site data or browser eviction can delete it, and that export is the backup, with a reminder after 30 days, or after 7 days when persistent storage is denied (F15.S01.M01 exportOverdueThresholdDays).
- **PS-115-07.R03** The install prompt must not nag or dark-pattern the user.

## Specification

**Data classification**
- classrup.install.v1 in localStorage: P0 counters and timestamps.
- Manifest, icons and release manifest: P0 public static files.

**Retention**
- Preferences kept until site data is cleared; reset when the user chooses Reset app settings.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious update from a compromised static host | Limit stated: whoever controls the origin controls the code at the next cold start, and Later only defers benign updates in live tabs. Controls: release manifest signed by a release key pinned in the installed build and checked before Update is offered (V07), the 'Unverified build, do not close or update' warning persisted across restarts, and reproducible builds with published checksums that self-hosters and users can compare |
| T02 | Phishing clone of the install card or fake update banner | banner is rendered by the app shell only, never from remote content; no external links or scripts in the component |
| T03 | Repeated install prompts used as a nuisance | gating V04, at most once per session, and the 3-dismissal cap |
| T04 | Page script activates a waiting worker without the user | applyUpdate() requires navigator.userActivation.isActive; SKIP_WAITING needs the waiting worker's one-time nonce; a same-origin script can still call the browser APIs directly, which is why V07 and the warning exist |

**Abuse controls**
- Install card is capped at once per session and 3 lifetime dismissals; update banner at most once per 24 h after Later.
- No remote content is rendered by the install or update components.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02, PS-115-07.R03 | install gate with sessions 1 and 2, completedActions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d, card already shown this session, storage unavailable | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE; no exception without storage |
| TEST-PS-115-09.T07 | abuse | PS-115-04.R02, PS-115-07.R01 | record all network requests during install and update flows | only same-origin static GETs (including /release-manifest.json); no analytics or relay requests |
| TEST-PS-115-09.T10 | e2e | PS-115-07.R02 | install on a browser that grants and one that denies persist(), with the last export 8 days old | explanation text shown in both; on denial F15.S01.M01 get_status reports exportOverdueThresholdDays 7 and exportOverdue true and the reminder is shown; on grant the threshold is 30 and no reminder |
| TEST-PS-115-09.T18 | e2e | PS-115-02.R02, PS-115-07.R03 | eligible user starts one session and navigates through 10 screens, dismissing nothing | install card shown exactly once in the session; shown again only in a later session |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
