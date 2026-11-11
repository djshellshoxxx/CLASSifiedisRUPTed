# PS-114-07 — Privacy, retention and abuse: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-07.R01** No personal data, relay access token, vault record, P1 or higher content, or exact location is ever stored in Cache Storage; only build assets and verified public P0 images in per-principal partitions are cached.
- **PS-114-07.R02** Cached public images are limited to 200 entries and 30 days per partition, are unbound on vault lock and principal switch, are deleted on Erase vault, and are deleted on version change of the cache name.
- **PS-114-07.R03** The worker scope is limited to the application path and refuses to cache cross-origin opaque responses.
- **PS-114-07.R04** A relay cannot substitute or alter a cached or displayed image, because bytes are verified against the content address before caching and before display, and the cache is keyed by content address independent of the relay.

## Specification

**Data classification**
- classrup-precache-v{buildId}: P0 build assets.
- classrup-img-v1-<partition>: P0 public listing images verified against their content address; metadata (EXIF, GPS) is stripped in the author's vault by F10.S02.M03 before content addressing (N9), so a relay cannot add location data without breaking the hash. Which images a principal viewed is kept per partition and never shared across principals.
- Bound relay origins and partition id: in worker memory only, dropped on lock, principal switch and worker restart.

**Retention**
- Precache: replaced at each release; deleted by activation cleanup.
- Public images: 30 days maximum or 200 entries per partition; unbound by CLEAR_USER_CACHES on vault lock and principal switch; partition deleted on Erase vault.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Private or vault response cached and later readable on a shared device | NetworkOnly for every request to a user-selected relay origin except verified public media, private-response guard plugin, tests that no Cache Storage entry exists after relay command flows |
| T02 | Cache poisoning with attacker-controlled content on a public image | only 200 CORS image responses whose SHA-256 equals the content address are stored or shown (V08); responses ≤ 5 MiB |
| T03 | Stale or malicious worker pinned after a bad release | hashed immutable assets, hourly update check, kill file with release sequence and killed build ids fetched network-only with no-store, replacement by the known-good build, and the signed release manifest check of F15.S01.M03 |
| T04 | Worker scope hijack via path confusion | worker served from the app root with Service-Worker-Allowed unset, scope '/', navigation denylist on /__media/ |
| T05 | Principal B on a shared profile learns which listings principal A viewed | per-principal partitions; only the bound partition is readable; unbound on lock and switch, deleted on erase |
| T06 | Malicious relay swaps a listing photo (bait-and-switch) or serves one with GPS data | content-address verification before caching and display; mismatches discarded and counted; cache keyed by content address, so revalidating against the same relay is never relied on |

**Abuse controls**
- Cache limits (200 images per partition, 30 days, 5 MiB per image) bound local storage use from a hostile feed of image URLs.
- No background fetch loop; update and kill-file checks at most hourly so the worker cannot be used to amplify requests to a relay; media fetched only from bound relay origins.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T08 | abuse | PS-114-05.R01, PS-114-05.R02, PS-114-07.R01 | unlock vault, call a relay query with a relay access token, open a mailbox and private media, then inspect all Cache Storage keys | no relay command, mailbox or private media entry and no Authorization-bearing request cached; no vault data in Cache Storage |
| TEST-PS-114-09.T09 | abuse | PS-114-05.R03, PS-114-07.R02 | P1 views 5 images, vault locks; P2 unlocks and views 2; P1 unlocks and runs Erase vault | after lock P1's partition is not served; P2 sees only its own 2 entries; erase deletes P1's partition; P2's partition intact |
| TEST-PS-114-09.T12 | integration | PS-114-07.R03, PS-114-07.R02 | media route fed a cross-origin opaque response and a 6 MiB image | neither is stored |
| TEST-PS-114-09.T18 | abuse | PS-114-07.R04, PS-114-02.R02, PS-114-09.R03 | stub relay r2 returns different bytes for img1's content address, first with no worker and then with the worker | image neither cached nor displayed, neutral image frame shown, digest_mismatch counted; r1 then supplies the correct bytes which are cached once under the content-address key |
| TEST-PS-114-09.T20 | integration | PS-114-07.R02, PS-114-03.R04 | 201 distinct images viewed, then clock advanced 31 days and 3 new images viewed | at most 200 entries after the first step; after the advance only the 3 fresh entries remain |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
