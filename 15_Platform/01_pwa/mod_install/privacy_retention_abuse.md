# PS-115-07 — Privacy, retention and abuse: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-07.R01** The module collects no analytics and sends nothing to any server (CTR-OBS-001 OBS-7); install and update counters remain on the device.
- **PS-115-07.R02** The persistent-storage explanation says that data lives on this device, that clearing site data or browser eviction can delete it, and that export is the backup.
- **PS-115-07.R03** The install prompt must not nag or dark-pattern the user.

## Specification

**Data classification**
- classrup.install.v1 in localStorage: P0 counters and timestamps.
- Manifest and icons: P0 public static files.

**Retention**
- Preferences kept until site data is cleared; reset when the user chooses Reset app settings.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious update from a compromised static host | assets are content-hashed, the worker only updates from its own origin, users can keep the current version with Later, release builds are reproducible and checksums published for self-hosters |
| T02 | Phishing clone of the install card or fake update banner | banner is rendered by the app shell only, never from remote content; no external links or scripts in the component |
| T03 | Repeated install prompts used as a nuisance | gating V04 and the 3-dismissal cap |

**Abuse controls**
- Install card is capped at once per session and 3 lifetime dismissals; update banner at most once per 24 h after Later.
- No remote content is rendered by the install or update components.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T07 | abuse | PS-115-04.R02, PS-115-07.R01 | record all network requests during install and update flows | only same-origin static GETs; no analytics or relay requests |
| TEST-PS-115-09.T10 | e2e | PS-115-07.R02 | install on a browser that grants and one that denies persist() | explanation text shown in both; denial shows the warning and 7-day export reminder |
| TEST-PS-115-09.T11 | a11y | PS-115-07.R03, PS-115-08.R02 | install card, iOS sheet and update banner scanned with axe | zero serious issues; targets ≥ 44 px; CLS contribution 0 |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
