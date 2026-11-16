# Research notes (ClassRup)

Compiled 2026-11-04. Verification legend:
- VERIFIED = fetched or executed in this session (npm registry, raw GitHub files, Node docs, OWASP raw, local tool runs).
- UNVERIFIED = written from prior knowledge. The sandbox proxy blocked www.rfc-editor.org, datatracker.ietf.org, www.w3.org, doi.org, wikipedia, atproto.com, devblogs.microsoft.com, h3geo.org, six-group.com, so RFC/W3C/DOI primary pages could not be fetched. Re-check these hosts before treating UNVERIFIED items as final. Where a W3C or spec source was readable via its raw GitHub repo, that was used and marked VERIFIED.

## A. Stack compatibility

Method: in a scratch dir, `npm install` of the full candidate set at exact pins (see planning/THIRD_PARTY_CANDIDATES.md) with Node v22.23.4. Result: install succeeded with zero ERESOLVE/peer errors. Source: https://registry.npmjs.org (via `npm view`). VERIFIED.

### TypeScript
- typescript@7.0.2 is `latest` dist-tag (7.1.0-beta is `beta`). It is the native (Go) compiler: package depends on per-platform `@typescript/typescript-<os>-<arch>` binaries (npm registry, VERIFIED). `tsc -v` printed `Version 7.0.2`. Repo microsoft/typescript-go README states the staging repo is closed, TS 7 is the port, and the command is `tsc` from RC onward. https://raw.githubusercontent.com/microsoft/typescript-go/main/README.md VERIFIED.
- Same README feature table: type checking "same errors as TS 6.0", build mode / project references "done", incremental "done", watch "done", emit "done", declaration emit "done", language service "in progress", **API "not ready"**. VERIFIED. News coverage says a stable programmatic API is expected in 7.1 and that tools like typescript-eslint cannot use 7.0 yet (https://infoq.com/news/2026/08/typescript-7-released/ via search summary, secondary, UNVERIFIED in detail).
- Executed locally with 7.0.2: `tsc --all` lists `--build/-b`, `--allowImportingTsExtensions` (help text: requires moduleResolution bundler and noEmit or emitDeclarationOnly), `--rewriteRelativeImportExtensions`, `--erasableSyntaxOnly`, `--composite`, `--noEmit`, `--isolatedDeclarations`, `--verbatimModuleSyntax`. A test with `erasableSyntaxOnly` and an `enum` produced `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`. VERIFIED.
- Gaps vs 5.9/6.0: (1) no stable JS API (tooling that imports `typescript`, e.g. typescript-eslint, ts-morph, some vite/vitest typecheck plugins, breaks or is unsupported); (2) intentional JS-file/JSDoc changes listed in https://raw.githubusercontent.com/microsoft/typescript-go/main/CHANGES.md (Closure features, constructor-function expandos removed; irrelevant if we write .ts) VERIFIED; (3) 6.0 deprecations become hard errors and strict/esnext defaults (secondary source, UNVERIFIED); (4) "tsconfig errors may not be as helpful", "not all resolution modes supported yet" (README, VERIFIED).
- Other lines: latest 5.9.x = 5.9.3; latest 6.x = 6.0.3 (npm versions list, VERIFIED).
- Recommendation: use `tsc` 7.0.2 only as a CLI typechecker (`tsc --noEmit`, `tsc -b`); do not depend on the TS JS API. If a lint/codegen tool needs the API, add `typescript@5.9.3` as a separate devDependency (pinned alias, e.g. `"typescript5": "npm:typescript@5.9.3"`) for that tool only.
- Runtime TS: Node 22 type stripping is enabled by default and warning-free from v22.18.0; stability 1.2 Release candidate; `--experimental-transform-types` added v22.7.0; enums/namespaces need that flag, so keep `erasableSyntaxOnly: true`. https://nodejs.org/docs/latest-v22.x/api/typescript.md (doc page v22.23.4) VERIFIED. Type-only imports must use `import type`/`type` modifier (same doc). Node requires explicit `.ts` extensions in imports, which pairs with `allowImportingTsExtensions` + `noEmit`.
- node:sqlite in Node 22: "Stability: 1.1 - Active development"; no longer behind `--experimental-sqlite` since v22.13.0; added v22.5.0. https://nodejs.org/docs/latest-v22.x/api/sqlite.html VERIFIED. Implication: acceptable for dev/MVP behind a storage interface; not stable API.

### Vite / Vitest / Preact / PWA
| Package | Finding (VERIFIED, npm registry) |
|---|---|
| vite@8.3.5 | MIT; engines node ^20.19.0 or >=22.12.0; uses rolldown ~1.2.14; optional peers incl. esbuild ^0.27/^0.28, yaml ^2.4.2, @types/node ^20.19 or >=22.12. Node 22.23.4 OK. |
| vitest@5.1.0 | peer vite ^6.4.0 \|\| ^7 \|\| ^8 -> OK with vite 8.3.5; engines node ^22.12.0 \|\| ^24 \|\| >=26; peer @types/node ^22 or >=24. |
| @preact/preset-vite@2.10.6 | peer vite 2.x..8.x, @babel/core 7.x -> OK with vite 8. |
| preact@11.1.1 | MIT; optional peer preact-render-to-string >=6.7.0 (peerDependenciesMeta optional). Not needed for CSR. |
| vite-plugin-pwa@2.0.0 | ESM; peer vite ^3.1..^8; peer workbox-build ^7.4.1 and workbox-window ^7.4.1 (workbox 7.4.1); engines node >=20.19.0; optional @vite-pwa/assets-generator. Not yet runtime-tested with vite build in this session (UNVERIFIED at build time; only install-time resolution verified). |
| idb@8.0.4 | ISC, ESM, no deps. |
| zod@4.6.7 | MIT, ESM. |
| yaml@2.9.1 | ISC, CJS, node >=14.6. |
| fast-check@4.10.2 | MIT, dep pure-rand ^8. |
| @playwright/test@1.63.0 | exists, Apache-2.0, depends playwright 1.63.0. Registry latest playwright is 1.64.1; preinstalled global is 1.63.0, so pin 1.63.0 to match chromium-1243 (browser build match assumed from task statement, not checked). |
| @axe-core/playwright | latest 4.14.0, MPL-2.0, peer playwright-core >=1.0.0, engines node >=22.12.0, dep axe-core ~4.14.0. MPL-2.0 is file-level copyleft: using unmodified as a devDependency for tests, not shipped to clients, imposes no obligations on app code; if we modify axe files and distribute them, those files must be published. (Reasoning on MPL-2.0 is general knowledge, UNVERIFIED against license text.) |
| hono@4.13.16 | MIT, ESM. @hono/node-server latest 2.1.6, MIT, peer hono ^4 \|\| ^5.0.0-0, node >=20. |
| web-push@3.6.7 | **MPL-2.0**, deps asn1.js, http_ece 1.2.0, https-proxy-agent, jws, minimist; supports VAPID. Server-only. Unmodified use is fine under MPL-2.0 (file-level). |
| canonicalize | latest 5.1.0 (2026-09-18), Apache-2.0, ESM, engines node >=22. Earlier line 2.1.0 also Apache-2.0. |

- Hono needed? Node 22 `node:http` suffices for a small JSON API (routing, problem+json, rate-limit middleware are about 100 lines). Hono + @hono/node-server adds two deps but gives typed routing, Web-standard Request/Response (portable to Workers/Deno). Decision proposal: start with no web framework behind a thin handler interface; adopt Hono if route count grows. Not a compatibility blocker either way.
- npm audit of the full set (dev + prod): 10 vulns (2 low, 8 moderate), all transitive via `workbox-build@7.4.1` (glob, minimatch, ejs/jake/filelist, deepmerge). `npm audit --omit=dev` reported 0 vulnerabilities. All are build-time only (vite-plugin-pwa generates the service worker; nothing from workbox-build ships to users except the generated SW). `npm audit fix --force` would not help since vite-plugin-pwa pins ^7.4.1. VERIFIED run. Mitigation: record accepted risk; or use `injectManifest`/hand-written SW to avoid workbox-build.
- Incompatibilities found: none at install/peer level. Caveat: TS 7 has no stable JS API; any tool needing it must use TS 5.9.3.

## B. Crypto libraries (noble, scure)

All VERIFIED from READMEs at https://github.com/paulmillr/noble-curves , noble-hashes, noble-ciphers (raw main README) and npm registry.
- Versions: @noble/curves, @noble/hashes, @noble/ciphers all 2.4.0 (latest). curves 2.4.0 depends on @noble/hashes 2.4.0 exactly. Node >=20.19.0.
- ESM-only since v2 (2025-08); v1 was ESM+CJS; imports need `.js` suffix e.g. `@noble/curves/ed25519.js`. Node 20.19+/22.12+ can `require()` ESM.
- Availability: Ed25519 (`ed25519.keygen/sign/verify`, option `zip215: false` for RFC 8032 strict), X25519 (`x25519`, plus ed25519->x25519 conversion `utils.toMontgomery*`) in curves. scrypt and argon2id (`@noble/hashes/scrypt.js`, `argon2.js`) in hashes. xchacha20poly1305 (`@noble/ciphers/chacha.js`, with `managedNonce`) in ciphers.
- Audit history (as stated in READMEs):
  - noble-curves: Trail of Bits at 0.7.3 (Feb 2023, abstract modules + secp256k1; funded by Ryan Shea); Kudelski at 1.2.0 (Sep 2023, scure-starknet related modules); Cure53 at 1.6.0 (Sep 2024, covers ed25519, ed448, bls12-381, bn254, hash-to-curve, montgomery, edwards; funded by OpenSats); **Trail of Bits with OpenAI at 2.3.0 (Aug 2026, "Patch the Planet", scope everything)**. Regular AI-assisted self-audits since Apr 2026.
  - noble-hashes: Cure53 at 1.0.0 (Jan 2022); scope excludes blake3, sha3-addons, sha1 and **argon2 (unaudited)**; funded by Ethereum Foundation. Self-audits since Apr 2026. README says argon2 cannot be fast in JS (no fast Uint64Array) and suggests scrypt instead.
  - noble-ciphers: Cure53 at 1.0.0/Sep 2024 report (nbl4), funded by OpenSats; "changes since audit" compare link 1.0.0..main, i.e. post-audit code is unaudited (2.x not covered by an independent audit per README). XChaCha20-Poly1305 recommended for random nonces.
  - Implication: Ed25519/X25519 on curves 2.x are within recent audits; argon2id is unaudited; ciphers 2.x unaudited by third party. Prefer scrypt for password-derived keys; document residual risk.
- OWASP Password Storage Cheat Sheet (current raw): Argon2id minimums: m=47104 KiB (46 MiB) t=1 p=1; m=19456 (19 MiB) t=2 p=1 (headline minimum); m=12288 t=3 p=1; (list continues for smaller m, higher t). scrypt (if Argon2id unavailable): N=2^17 (128 MiB) r=8 p=1; N=2^16 r=8 p=2; N=2^15 r=8 p=3; N=2^14 r=8 p=5; N=2^13 r=8 p=10. PBKDF2-HMAC-SHA256 600,000 if FIPS. https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md VERIFIED. Note this is for server-side password hashing; for client-side key wrapping in a browser, memory above ~64 MiB may hurt low-end phones (engineering judgement).

## C. Standards (sections from memory; hosts blocked, all UNVERIFIED unless stated)

- RFC 9562 UUIDs (May 2024, obsoletes RFC 4122). https://www.rfc-editor.org/rfc/rfc9562 . UUIDv7 = Section 5.7: 48-bit big-endian unix_ts_ms, 4-bit version (0111), 12-bit rand_a, 2-bit variant (10), 62-bit rand_b. Monotonicity: Section 6.2 (fixed-length dedicated counter, monotonic random, replace leftmost random bits with counter); clock rollback handling and counter rollover also in 6.2; Section 6.1 on clock sequence/timestamps. Ordering is by timestamp only to millisecond precision.
- RFC 8785 JSON Canonicalization Scheme (June 2020, Informational). https://www.rfc-editor.org/rfc/rfc8785 . Key points: UTF-16 code-unit sort of property names (Section 3.2.3), ES6 number serialization (3.2.2), no whitespace; I-JSON constraints (no duplicate keys, finite numbers; integers beyond 2^53 should be strings). Impl: npm `canonicalize` Apache-2.0 (VERIFIED license/version).
- RFC 8032 EdDSA (Jan 2017). https://www.rfc-editor.org/rfc/rfc8032 . Ed25519 sign/verify Section 5.1; key gen 5.1.5; signature 64 bytes, public key 32 bytes. Strict verification (reject non-canonical S) is in 5.1.7; noble `zip215:false` selects RFC8032 behavior (VERIFIED in noble README).
- did:key method (W3C CCG draft). Source read from https://raw.githubusercontent.com/w3c-ccg/did-method-key/main/index.html VERIFIED: format `did:key:MULTIBASE(base58-btc, MULTICODEC(public-key-type, raw-public-key-bytes))`; multibase value MUST start with `z`; ed25519-pub multicodec code `0xed` (varint bytes 0xed 0x01, giving `z6Mk...` prefix). Status: Community Group draft, not a W3C Recommendation.
- RFC 9457 Problem Details for HTTP APIs (July 2024, obsoletes RFC 7807). Media type `application/problem+json`; members type, title, status, detail, instance (Section 3.1); extension members Section 3.2. UNVERIFIED section numbers.
- Web Push: RFC 8030 Generic Event Delivery Using HTTP Push (Dec 2016); RFC 8291 Message Encryption for Web Push (Nov 2017, aes128gcm per RFC 8188); RFC 8292 VAPID (Nov 2017; `Authorization: vapid t=<JWT>, k=<key>`, ES256 P-256). All UNVERIFIED hosts; npm web-push implements VAPID (README not fetched).
- RFC 9421 HTTP Message Signatures: published Feb 2024, Proposed Standard (UNVERIFIED). Note: signs HTTP message components, not stored records; for federated records a signature over JCS bytes of the envelope is simpler.
- ISO 4217 minor units: maintenance agency SIX; list one URL https://www.six-group.com/en/products-services/financial-information/data-standards.html (landing page; XML list-one download path not verified) UNVERIFIED. Minor-unit values vary (0, 2, 3, and a few 4); store money as integer minor units + currency code.
- Node 22: type stripping default-on from v22.18.0 (VERIFIED, above). node:sqlite stability 1.1 (VERIFIED, above).

## D. WCAG 2.2 AA new criteria (read from w3c/wcag understanding docs, raw GitHub; VERIFIED intent text; numeric thresholds from memory)

Source: https://raw.githubusercontent.com/w3c/wcag/main/understanding/22/<sc>.html ; normative text https://www.w3.org/TR/WCAG22/ (not fetched).
| SC | Level | Requirement |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | A keyboard-focused item is not entirely hidden by author-created content (sticky headers, bottom nav, cookie bars). |
| 2.5.7 Dragging Movements | AA | Any drag action also has a single-pointer alternative (tap buttons for reorder, map pan, sliders). |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets at least 24x24 CSS px, or have enough spacing (24 px circle not intersecting another target); exceptions inline, essential, user-agent. (Number UNVERIFIED in text; the doc intent confirmed.) |
| 3.2.6 Consistent Help | A | Help mechanism (contact, chat, FAQ link) appears in the same relative place across pages where provided. (Level A, not AA.) |
| 3.3.7 Redundant Entry | A | Information already entered in the same process is auto-populated or selectable, not re-asked (exceptions: security, essential). (Level A.) |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive-function test (memorizing, transcribing, puzzles) to log in unless an alternative or mechanism exists; allow paste and password managers; passkeys/WebAuthn help. |
Design note: 44x44 (AAA 2.5.5) or Android 48dp is a better mobile default than 24 px. 2.4.11 matters for sticky bottom tab bars; use `scroll-padding`.

## E. Geoprivacy

- Geohash cell size (computed here from the algorithm: 5 bits per char, longitude gets ceil(5p/2) bits; sizes at the equator; width shrinks by cos(latitude)). VERIFIED by calculation, matches commonly published tables (UNVERIFIED against Wikipedia, blocked):
| Precision | Bits (lon+lat) | Cell width x height (equator) |
|---|---|---|
| 3 | 8+7 | ~156.5 km x ~155.5 km |
| 4 | 10+10 | ~39.1 km x ~19.4 km |
| 5 | 13+12 | ~4.9 km x ~4.9 km |
| 6 | 15+15 | ~1.22 km x ~0.61 km |
| 7 | 18+17 | ~153 m x ~152 m |
- Note: bits for p=3 are 8 lon + 7 lat; p=4 are 10+10; p=5 are 13+12; p=6 are 15+15; p=7 are 18+17. Precision 5 is a reasonable public listing granularity (~5 km); 6+ approaches neighborhood level.
- H3 average hex area (Uber H3 table, UNVERIFIED; docs host h3geo.org blocked, raw repo path 404): res 5 ~252.9 km2, res 6 ~36.1 km2, res 7 ~5.16 km2, res 8 ~0.737 km2. H3 pros: near-uniform area, 6 neighbors at equal distance; cons: C library/WASM dependency (h3-js), Uber-specific. Geohash pros: trivial string prefix queries, no dependency. Decision: geohash for MVP.
- Attack: Polakis, Argyros, Petsas, Marinos, Ioannidis, "Where's Wally? Precise User Discovery Attacks in Location Proximity Services", ACM CCS 2015, DOI 10.1145/2810103.2813605 (UNVERIFIED). Shows that proximity services returning rounded/ranked distances can be trilaterated to locate users precisely using a few queries from controlled positions, including against services that round distances. Related earlier: Li et al. "Yet another trilateration attack"-style and Qin et al. 2016 on Wechat/Momo (UNVERIFIED, from memory; do not cite without checking).
- Defenses (design guidance consistent with the above, UNVERIFIED as citation): store only snapped cell (geohash p5) server-side and never exact coordinates; return distance buckets (e.g. <2, 2-5, 5-10, 10+ km) not exact; add noise only if deterministic per (viewer,target) so averaging fails; per-account and per-device query rate limits plus global cap on distinct-origin queries per target; require auth and reputation age for proximity queries; do not allow arbitrary query origin coordinates (derive from the user's own cell); log anomalous sweep patterns.

## F. Barter cycle algorithms

All UNVERIFIED (hosts blocked); citations from memory.
- Abraham, Blum, Sandholm, "Clearing algorithms for barter exchange markets: enabling nationwide kidney exchanges", ACM EC 2007, DOI 10.1145/1250910.1250954. Result: with cycles unbounded the max-weight cycle cover is polynomial (assignment problem); with cycle length capped at L >= 3 the problem is NP-complete (cap 2 is polynomial via matching). They solve it with IP using cycle-based formulation (column generation for large instances) and a polynomial-size edge formulation compared.
- Johnson, "Finding all the elementary circuits of a directed graph", SIAM J. Comput. 4(1):77-84, 1975, DOI 10.1137/0204007. Time O((n+e)(c+1)) for c circuits, space O(n+e). The number of circuits can be exponential, so an unbounded enumeration is unsafe.
- Shapley & Scarf, "On cores and indivisibility", J. Math. Econ. 1(1):23-37, 1974, DOI 10.1016/0304-4068(74)90033-0. Introduces the housing market; Top Trading Cycles (attributed to David Gale) yields a core allocation, strategy-proof (Roth 1982) for strict preferences. Works with complete preference rankings and no length bound.
- Practical guidance: cap cycle length (3-5 is typical for kidney exchange; consumer barter should default 3-4), enumerate with bounded DFS (depth <= L, canonical start = smallest node id to avoid duplicates), prune by SCC decomposition first, per-category/region sharding, time-box the solver and return best-so-far, weight cycles by value fairness and trust. Use exact IP only for small instances; greedy/local search otherwise. Always pre-verify each participant's consent (atomicity: all-or-nothing escrow/confirmation).

## G. Auctions

- Roth & Ockenfels, "Last-Minute Bidding and the Rules for Ending Second-Price Auctions: Evidence from eBay and Amazon Auctions on the Internet", American Economic Review 92(4):1093-1103, 2002, DOI 10.1257/00028280260344632 (UNVERIFIED). Finding: eBay's hard close leads to much more last-minute bidding than Amazon's automatic extension ("soft close"), since sniping is rational against hard close with incremental bidders; a soft-close removes the incentive to snipe.
- Design: extend end time by N minutes (e.g., 2-5) when a bid arrives in the last window; cap total extensions or document no cap; show countdown with server time offset.
- Shill bidding detection survey/heuristics: Trevathan & Read, "Detecting shill bidding in online English auctions" (2009 book chapter), and surveys such as Kauffman & Wood (2005) "Running up the bid" (UNVERIFIED, citations from memory, DOIs not recorded). Heuristics: bidder-seller co-occurrence frequency, always-outbid-by-minimum, retracted bids, bid pairs with identical IP/device, new account with few wins, bids on one seller only.

## H. Rate limiting

- Token bucket: bucket of capacity B refilled at rate r; a request consumes tokens, allowing bursts up to B; classic description: Tanenbaum, Computer Networks, and https://en.wikipedia.org/wiki/Token_bucket (UNVERIFIED).
- GCRA (Generic Cell Rate Algorithm): ATM Forum TM 4.0 / ITU-T I.371; equivalent to a leaky bucket as a meter, stores a single timestamp (theoretical arrival time, TAT) per key, which is cheap to keep in a DB row. Accessible write-up: Brandur Leach, "Rate Limiting, Cells, and GCRA", https://brandur.org/rate-limiting (UNVERIFIED). Recommendation: GCRA, one row per key, atomic update; for SQLite single-writer this is trivial.

## I. Federation

- ActivityPub: W3C Recommendation, 23 January 2018 (date from memory, UNVERIFIED; the repo copy I read is the editor's draft with `specStatus: "ED"`: https://raw.githubusercontent.com/w3c/activitypub/gh-pages/index.html VERIFIED). Server-to-server delivery relies on ActivityStreams 2.0 JSON-LD; the spec itself does not mandate an HTTP authentication method: it mentions Linked Data Signatures and HTTP Signatures as options in its security discussion (lines ~783-792 of the same file, VERIFIED), which is why Mastodon-style deployments use draft Cavage HTTP Signatures rather than RFC 9421.
- AT Protocol: developed by Bluesky Social PBC; spec at https://atproto.com/specs/atp (README VERIFIED: https://raw.githubusercontent.com/bluesky-social/atproto/main/README.md). Lexicon schema language, XRPC over HTTP, DID-based identity, signed repos. Standards-body status UNVERIFIED (atproto.com blocked).
- Why custom signed envelopes for MVP (facts + judgement): ActivityPub requires JSON-LD processing, actor/inbox/outbox endpoints, WebFinger, and a signature scheme left to implementers; AT Protocol requires DID + PDS + relay architecture. Domain objects here (offers, bids, N-party cycle confirmations, escrow state) have no ActivityStreams vocabulary, would need custom extension terms anyway. A minimal envelope = JCS (RFC 8785) of {type, id UUIDv7, author did:key, created, body} + Ed25519 signature (RFC 8032) is small, testable with fast-check, and can later be wrapped as an ActivityPub object or atproto record. Keep the envelope schema extension-friendly.

## J. Sybil / reputation

- Douceur, "The Sybil Attack", IPTPS 2002, LNCS 2429, DOI 10.1007/3-540-45748-8_24 (UNVERIFIED). Without a trusted identity authority, a single entity can present multiple identities; resource testing does not stop it in practice. Implication for federation: identities are cheap, so rate limits, reputation aging, and web-of-trust weighting are needed; do not count raw account counts.
- Resnick & Zeckhauser, "Trust among strangers in Internet transactions: Empirical analysis of eBay's reputation system", Advances in Applied Microeconomics 11, 2002, DOI 10.1016/S0278-0984(02)11030-3 (UNVERIFIED). Finds reputation is mostly positive and informative mainly via negatives; sellers with better scores sell somewhat more/higher; participation in feedback is incomplete.
- Design: weight ratings by rater age and transaction value, require completed-trade proof for a rating, discount rating clusters, and show counts not only averages.

## Open items
1. Re-fetch RFCs, WCAG 2.2 text, DOIs, H3 table, SIX list, Wikipedia geohash once network allows those hosts; remove UNVERIFIED tags.
2. Test vite-plugin-pwa 2.0.0 with vite 8.3.5 in an actual build.
3. Confirm chromium-1243 corresponds to Playwright 1.63.0 (`npx playwright --version` / browsers path).
