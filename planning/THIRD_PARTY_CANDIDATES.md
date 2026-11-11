# Third-party candidates

Checked 2026-11-04 against the npm registry (`npm view`), Node v22.23.4. A full install of all pins below in a scratch directory succeeded with no peer-dependency errors. Audit column = `npm audit` of that install (not a security review of source). Details and sources: RESEARCH_NOTES.md.

| Package | Exact version | License | Purpose | Peer deps checked | Audit status | Alternatives | Decision note |
|---|---|---|---|---|---|---|---|
| typescript | 7.0.2 | Apache-2.0 | Native Go `tsc` typechecker (`--noEmit`, `-b`) | yes: none; node >=16.20; erasableSyntaxOnly, allowImportingTsExtensions, rewriteRelativeImportExtensions, --build, noEmit confirmed in `tsc --all` | 0 vulns | typescript 5.9.3, 6.0.3 | Use as CLI only. No stable JS API; keep 5.9.3 aliased for any tool needing the API. |
| vite | 8.3.5 | MIT | Dev server and bundler (rolldown) | yes: node ^20.19 or >=22.12 OK; optional peers not needed | 0 vulns | esbuild, rsbuild | Accept. |
| vitest | 5.1.0 | MIT | Unit tests | yes: vite ^6.4/^7/^8 OK; @types/node ^22 OK; node ^22.12 OK | 0 vulns | node:test | Accept. |
| @preact/preset-vite | 2.10.6 | MIT | Preact JSX/HMR in Vite | yes: vite 2..8.x and @babel/core 7.x OK | 0 vulns | @vitejs/plugin-react | Accept. |
| preact | 11.1.1 | MIT | UI runtime | yes: preact-render-to-string optional, not needed | 0 vulns | solid, lit | Accept. |
| vite-plugin-pwa | 2.0.0 | MIT | Service worker and manifest | yes: vite ^8 OK; workbox-build and workbox-window ^7.4.1 (install 7.4.1); node >=20.19 | 10 moderate/low via workbox-build 7.4.1 transitive (glob, minimatch, ejs, jake, filelist, deepmerge); 0 with `--omit=dev`; build-time only | hand-written SW + injectManifest-free precache script | Accept with recorded risk; build not yet runtime-tested with vite 8. |
| workbox-build | 7.4.1 | MIT | SW generation (via plugin) | yes: required by plugin | source of the audit findings | none | Pin to satisfy plugin peer. |
| workbox-window | 7.4.1 | MIT | SW registration helpers | yes: required by plugin | 0 | native navigator.serviceWorker | Pin to satisfy plugin peer. |
| idb | 8.0.4 | ISC | IndexedDB promise wrapper | yes: none | 0 | Dexie, raw IDB | Accept. |
| zod | 4.6.7 | MIT | Schema validation | yes: none | 0 | valibot, ajv | Accept. |
| yaml | 2.9.1 | ISC | YAML parse for content/spec tooling | yes: none (also satisfies vite optional peer ^2.4.2) | 0 | js-yaml | Accept. |
| fast-check | 4.10.2 | MIT | Property-based tests | yes: dep pure-rand ^8 only | 0 | jsverify | Accept. |
| @playwright/test | 1.63.0 | Apache-2.0 | E2E tests | yes: playwright 1.63.0 exact; matches preinstalled global 1.63.0 (chromium-1243 match assumed, not checked) | 0 | Cypress | Pin 1.63.0 (latest is 1.64.1) to match installed browsers. |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | Accessibility checks in E2E | yes: playwright-core >=1.0.0; node >=22.12 | 0 | pa11y, Lighthouse | Test-only devDependency, unmodified, not shipped; MPL-2.0 is file-level copyleft, no impact on app code. |
| hono | 4.13.16 | MIT | HTTP router (optional) | yes: none | 0 | node:http, fastify | Optional. node:http on Node 22 suffices for MVP; adopt later if routing grows. |
| @hono/node-server | 2.1.6 | MIT | Node adapter for Hono (optional) | yes: hono ^4 or ^5, node >=20 | 0 | node:http | Only if hono is adopted. |
| web-push | 3.6.7 | MPL-2.0 | Server Web Push + VAPID | yes: no peers; node >=16 | 0 (prod) | hand-rolled RFC 8291/8292 with @noble | Server-side only, unmodified use fine under MPL-2.0 file-level copyleft. |
| canonicalize | 5.1.0 | Apache-2.0 | RFC 8785 JCS | yes: none; node >=22, ESM | 0 | write ~40 lines in-house + test vectors | Accept; vendor-test against RFC 8785 vectors. |
| @noble/curves | 2.4.0 | MIT | Ed25519, X25519 | yes: depends on @noble/hashes 2.4.0 exact; node >=20.19; ESM-only | 0; independent audits: Cure53 1.6.0 (Sep 2024), Trail of Bits+OpenAI 2.3.0 (Aug 2026), earlier ToB/Kudelski | tweetnacl, node:crypto Ed25519 | Accept; import with `.js` suffix. |
| @noble/hashes | 2.4.0 | MIT | scrypt, hashes, HKDF | yes: none; node >=20.19; ESM-only | 0; Cure53 audit at 1.0.0 (2022); argon2 NOT audited | node:crypto scrypt (server) | Prefer scrypt; avoid argon2 in JS. |
| @noble/ciphers | 2.4.0 | MIT | XChaCha20-Poly1305 | yes: none; node >=20.19; ESM-only | 0; Cure53 audit Sep 2024 (1.x), no third-party audit of 2.x stated | WebCrypto AES-GCM | Accept with residual-risk note. |
| @types/node | 22.12.0 (or latest 22.x) | MIT | Node typings | yes: satisfies vite and vitest peer | 0 | none | Match Node 22 runtime. |

Overall result: no incompatible combination found. Only caveat is TypeScript 7 lacking a stable programmatic API.
