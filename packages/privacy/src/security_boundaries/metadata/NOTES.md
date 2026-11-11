# F10.S02.M03 Metadata minimization (PS-080)

Implemented: library only, no commands, queries or events. `stripImage`, `verifyImageClean`, `sanitizeImportedImage` (import quarantine path), `truncateIp`, `rateLimitKey` (async, WebCrypto SHA-256 via kernel `sha256Hex`),
`publicTime`, `orderKey`, `userAgentFamily`, `outboundLinkPolicy`. Error codes defined here: PRIVACY_METADATA_IMAGE_UNSUPPORTED, PRIVACY_METADATA_IMAGE_TOO_LARGE, PRIVACY_METADATA_GPS_PRESENT.

Image pipeline (N9): pure, bounds-checked container rebuild, no pixel decoding. JPEG keeps SOFn, DHT, DQT, DRI, DAC, SOS plus entropy data (verbatim), a thumbnail-free JFIF header and Adobe APP14; PNG keeps IHDR, PLTE, IDAT, tRNS, IEND with CRC check;
WebP keeps VP8/VP8L/ALPH and a VP8X with only the alpha flag. Everything else (APPn, COM, EXIF, XMP, IPTC, ICC, text chunks, MakerNote, thumbnails, trailing bytes after the end marker) is dropped. The output is parsed again and must have zero findings.

Ports for the composition root
- `StripOptions.downscale?: (input: { bytes, mime, width, height, orientation? }, maxSide: number) => Promise<Uint8Array>`: a codec that re-encodes oversized images. Its output is parsed and verified again.

Deviations from the spec (no codec is available in an isomorphic, dependency-free package)
- No re-encode, no downscale, no sRGB conversion, no HEIC conversion. Images with a side above `maxSide` (default 4096) are refused with PRIVACY_METADATA_IMAGE_TOO_LARGE unless a `downscale` port is supplied; above 16384 always TOO_LARGE.
- EXIF orientation is not applied (the tag is removed with the rest of EXIF); the value found is returned as `CleanImage.orientation` (1..8) so the caller can rotate. ICC profiles are dropped without conversion, so wide-gamut images may look different.
- PNG keeps tRNS (needed for transparency) although it is an ancillary chunk.
- `truncateIp`, `publicTime`, `userAgentFamily` return Result values (`IpNetwork` object, ISO string) instead of the bare strings shown in the spec example; the spec text is inconsistent (domain section lists IpNetwork). `rateLimitKey` is async.
- The 10 s worker timeout, concurrency caps (2 per client, 4 per relay), the relay upload limit and metrics are not implemented here; they belong to the caller (no clock, no worker, no state in this package).
- The 40-file corpus, exiftool and an image decoder are not in the repository. Tests generate 40 synthetic files and check them with an independent byte scan, not exiftool.

Test rows not covered
- T01, T02: not claimed (no codec to prove decoding or pixel tolerance, no exiftool); equivalent synthetic-corpus tests exist without the id.
- T10: not claimed (no worker to hang); a deterministic 1 000 mutation fuzz exists without the id.
- T11, T13, T14, T15, T16: not claimed (need relay logs, limiter integration with concurrency queue, a browser, load on devices, or the traceability tool).
- Claimed: T03, T04, T05, T06, T07, T08 (relay is a test double), T09, T12, T17.

Open questions
- Whether a codec port in the composition root (canvas or WASM) should own downscale and orientation, or whether this module should gain a dependency on one.

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 44 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
