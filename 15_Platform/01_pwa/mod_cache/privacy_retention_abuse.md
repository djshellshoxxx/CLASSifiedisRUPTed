# PS-114-07 — Privacy, retention and abuse: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-07.R01** No personal data, session token, P2 or higher content, or exact location is ever stored in Cache Storage; only build assets and public images are cached.
- **PS-114-07.R02** Cached public images are limited to 200 entries and 30 days and are deleted on sign-out and on version change of the cache name.
- **PS-114-07.R03** The worker scope is limited to the application path and refuses to cache cross-origin opaque responses.

## Specification

**Data classification**
- classrup-precache-v{buildId}: P0 build assets.
- classrup-img-v1: P0 public listing images (EXIF location stripped server side by the upload pipeline, so cached images carry no L3+ location).

**Retention**
- Precache: replaced at each release; deleted by activation cleanup.
- Public images: 30 days maximum or 200 entries; cleared by CLEAR_USER_CACHES on sign-out.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Private response cached and later readable on a shared device | NetworkOnly for /api/ and /media/private/, private-response guard plugin, tests that no Cache Storage entry exists after authenticated flows |
| T02 | Cache poisoning with attacker-controlled content on a public image URL | only same-origin or CORS 200 responses with image content types are stored; revalidation replaces content; CSP img-src restricts origins; response sizes ≤ 5 MiB |
| T03 | Stale or malicious worker pinned after a bad release | hashed immutable assets, update check hourly, kill-switch file /sw-kill.json fetched network-first with 3 s timeout that makes the worker unregister itself, and F15.S01.M03 update prompt |
| T04 | Worker scope hijack via path confusion | worker served from the app root with Service-Worker-Allowed unset, scope '/', denylist on /api/ and /media/private/ |

**Abuse controls**
- Cache limits (200 images, 30 days, 5 MiB per image) bound local storage use from a hostile feed of image URLs.
- No background fetch loop; update check at most hourly so the worker cannot be used to amplify requests to the relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T08 | abuse | PS-114-05.R01, PS-114-05.R02, PS-114-07.R01 | sign in, fetch listing API with Authorization, view private media, then inspect all Cache Storage keys | no entry for /api/ or /media/private/ and no Authorization-bearing request cached |
| TEST-PS-114-09.T09 | abuse | PS-114-05.R03, PS-114-07.R02 | sign out | CLEAR_USER_CACHES deletes classrup-img-v1 and the session token is discarded afterward |
| TEST-PS-114-09.T12 | integration | PS-114-07.R03, PS-114-07.R02 | image route fed a cross-origin opaque response and a 6 MiB image | neither is stored |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
