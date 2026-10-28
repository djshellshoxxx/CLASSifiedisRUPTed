# TODO — F08.S01.M03 mod_attachments

**Status:** PARTIAL — Metadata, 10MB cap, mime allowlist, 24h pending expiry; JPEG/PNG strippers fuzzed. Blob upload/storage is relay-side; WebP and PDF metadata stripping not implemented.

## Implemented
- [x] Metadata registration: sha256 hash, size <= 10MB, mime allowlist, per-actor pending quota
- [x] Attach to exactly one message; 24h unsent-expiry sweeper; purge events carry attachment ids for blob GC
- [x] Client JPEG stripper (APP1/XMP, IPTC, COM, unknown APPn; keeps JFIF, ICC, Adobe) and PNG stripper (tEXt/zTXt/iTXt/eXIf/tIME)
- [x] Fuzz properties: never throws, never grows input

## Code and tests
- Code: `packages/comms/src/messaging/attachments.ts`, `packages/comms/src/messaging/strip.ts`
- Tests: `packages/comms/test/attachments.test.ts`

## Remaining
- [ ] WebP and PDF metadata stripping (stripMetadata returns unsupported_mime)
- [ ] Blob upload/download endpoint and storage (relay app)
- [ ] Malware scanning hook
