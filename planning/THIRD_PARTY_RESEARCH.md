# Research evidence and dependency review — 2026-10-24

Status: platform constraint review only; no installed/pinned/audited dependency. Historical 2026-10-22 package versions/licenses remain in Git at `39ac847` and are **unverified candidates**, not current selections. Do not copy those versions into a lockfile or claim advisories checked. Product server framework/PostgreSQL/managed KMS choices are rejected for mandatory CLASS runtime by the current owner mandate.

## Accessible primary sources reviewed

| Source | Evidence relevant to this design | Engineering consequence |
|---|---|---|
| [IndexedDB 3.0](https://www.w3.org/TR/IndexedDB/) | local database operations and scoped transactions; W3C working draft | atomic local stores only, no network/global transaction; actual browser abort/tab/quota tests required |
| [WHATWG Storage](https://storage.spec.whatwg.org/) | persistence permission, quota and storage management | display persistence/backup status; no durable cloud recovery assumption |
| [W3C Push API](https://www.w3.org/TR/push-api/) | push involves sender/service outside inactive application; working draft | in-app baseline; optional chosen sender/service dependency and privacy contract, no guaranteed server-free background delivery |
| [RFC 8785](https://www.rfc-editor.org/info/rfc8785/) | informational canonical JSON format | candidate signed-byte format; interoperable vectors and numeric restrictions required before profile acceptance |

Read through the web research tool on 2026-10-24. Platform text is not a security audit. The local-authority, fail-closed and external-dependency policies are engineering inferences, not standards promises.

## Candidates needing evaluation before implementation

No versions are selected here. Evaluate browser-native IndexedDB/WebCrypto and a small reviewed storage/schema layer; standards-based canonicalization/signature library; established E2EE/device protocol rather than custom crypto; property testing and browser automation. Historical candidates include jose, noble, libsodium-wrappers, graphology, fast-check and Playwright, with release-specific license, integrity, maintenance, browser compatibility and advisory evidence still required. Node may be a build/test tool, not mandatory product server runtime.

Required decision record per selected dependency: exact package/version/source/lockfile integrity/license, alternatives and rationale, transitive notices/SBOM, current advisory check, supported browser matrix, known-answer or behavioral fixtures, size/cost and update/rollback plan. No purchase, external credential, release or production payment is authorized by research.

## Remaining sources and owner input

Root README/PROJECT_SPEC/registry/ADRs/module folders and this delegation are available requirements evidence. No accessible original-idea conversation link exists in those sources, so exhaustive private-idea coverage cannot be asserted. Target jurisdiction, coarse-region taxonomy, desired auction/promotion guarantees, peer/encryption/backup protocols and selected payment sources remain explicit decisions. Other historical standards links (WCAG, EdDSA, ActivityPub, OWASP) need focused source review when the corresponding leaf contract is written; this checkpoint does not imply all linked research has been evaluated.
