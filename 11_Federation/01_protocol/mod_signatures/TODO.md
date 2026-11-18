# TODO — F11.S01.M03 signatures

**Status:** SPEC-DRAFT-COMPLETE (pending approval).

- [x] Define ownership and directory contract.
- [x] Enumerate the ten canonical process specifications (PS-085-01 to PS-085-10).
- [x] Expand each process spec to developer-ready requirements and tests.
- [ ] F16 confirms signing library, version and constant-time, strict Ed25519 verification (PS-085-02 R05; ADR pending).
- [ ] Register `fed.signature` and `fed.signing_key` schemas in CTR-SCH-001 (PENDING).
- [ ] F16 confirms dual control for `federation_key.revoke` and compromise marking (PS-085-05).
- [ ] F10 reviews verification log fields (`key_id`, `event_id`, code only) under PS-085-07.
- [ ] Publish golden signing-input vectors (PS-085-09 R01) and reconcile with CTR-FED-001 examples.
- [ ] Confirm 60 s key-cache TTL and 5 s revocation propagation with F15 (PS-085-03 R03).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
