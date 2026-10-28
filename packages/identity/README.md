# @classrup/identity (F07)

Pseudonymous accounts, challenge-response sessions, recovery and key rotation, profiles, portable identity, counterparty-verified reputation and trust evidence. Area `identity`, ID prefixes `acct ses dev rcv prof rep tev chl`.

```ts
const identity = createIdentity(deps, { interactions, blocks, relations, rateLimit, notifier });
identity.authenticate(bearerToken); // Actor | undefined, for the relay
identity.accountLookup;             // kernel AccountLookup port
identity.operations;                // 39 operations
```

## Module map

| Module | Code | Tests |
|---|---|---|
| F07.S01.M01 pseudonyms | `src/accounts/pseudonyms.ts`, `naming.ts`, `model.ts` | `test/accounts.test.ts` |
| F07.S01.M02 sessions | `src/accounts/sessions.ts` | `test/sessions.test.ts` |
| F07.S01.M03 recovery | `src/accounts/recovery.ts`, `devices.ts` | `test/recovery.test.ts` |
| F07.S02.M01 portable | `src/profiles/portable.ts` | `test/profiles.test.ts` |
| F07.S02.M02 profiles | `src/profiles/profiles.ts` | `test/profiles.test.ts` |
| F07.S03.M01 reputation | `src/trust/reputation.ts` | `test/trust.test.ts` |
| F07.S03.M02 evidence | `src/trust/evidence.ts` | `test/trust.test.ts` |

`test/contract.test.ts` checks that every emitted event is declared in `MODULES`, that events and public DTOs hold no secrets or contact/location keys, and that flags/permissions line up.

## Operations

C = command, Q = query, P = anonymous-safe (`public`). Permission is `<area>.<aggregate>:<action>`.

| Operation | Kind | Permission |
|---|---|---|
| identity.account.register | C P | identity.account:register |
| identity.account.me | Q | identity.account:read |
| identity.account.lookup | Q P | identity.account:lookup |
| identity.account.set_status | C | identity.account:set_status (admin, system) |
| identity.account.deactivate | C | identity.account:deactivate |
| identity.account.grant_role / revoke_role | C | identity.account:grant_role (admin, system) |
| identity.account.erase | C | identity.account:erase (system) |
| identity.device.add / revoke | C | identity.device:add / revoke |
| identity.device.list | Q | identity.device:read |
| identity.session.challenge | C P | identity.session:challenge |
| identity.session.login | C P | identity.session:login |
| identity.session.list | Q | identity.session:read |
| identity.session.revoke / revoke_all | C | identity.session:revoke |
| identity.session.expire_due | C | identity.session:expire (system) |
| identity.recovery.issue | C | identity.recovery:issue |
| identity.recovery.status | Q | identity.recovery:read |
| identity.recovery.recover | C P | identity.recovery:recover |
| identity.profile.update | C | identity.profile:update |
| identity.profile.get | Q P | identity.profile:read |
| identity.portable.document | Q | identity.portable:export |
| identity.portable.verify | Q P | identity.portable:verify |
| identity.portable.import | C | identity.portable:import |
| identity.feedback.submit | C | identity.feedback:submit |
| identity.feedback.edit | C | identity.feedback:edit (rater) |
| identity.feedback.remove | C | identity.feedback:remove (moderator, admin, system) |
| identity.feedback.list | Q P | identity.feedback:read |
| identity.reputation.get | Q P | identity.reputation:read |
| identity.evidence.claim / attest | C | identity.evidence:claim / attest |
| identity.evidence.revoke | C | identity.evidence:revoke (owner, moderator, admin, system) |
| identity.evidence.list_public | Q P | identity.evidence:read |
| identity.evidence.list_mine | Q | identity.evidence:read_own |
| identity.evidence.expire_due | C | identity.evidence:expire (system) |
| identity.attester.register / revoke / list | C / C / Q | identity.attester:manage (admin, system) |

## Collections and events

Collections: `identity_accounts` (devices embedded), `identity_pseudonyms`, `identity_challenges`, `identity_sessions`, `identity_recovery_sets`, `identity_profiles`, `identity_feedback`, `identity_feedback_index`, `identity_reputations`, `identity_evidence`, `identity_attesters`.

Events (payloads hold ids and public data only): `identity.account.{registered,status_changed,role_granted,role_revoked,erased}`, `identity.device.{added,revoked}`, `identity.session.{created,revoked,expired}`, `identity.recovery.{codes_issued,completed}`, `identity.profile.updated`, `identity.portable.imported`, `identity.feedback.{submitted,edited,removed}`, `identity.evidence.{claimed,attested,revoked,expired}`, `identity.attester.{registered,revoked}`.

Flags: `identity.pseudonyms|sessions|recovery|profiles|portable|reputation|evidence`.

## Ports

Provided: `AccountLookup` (`identity.accountLookup`), `authenticate(token)`, F10 hooks `accounts.exportData(accountId)` and `accounts.erase(ctx, { accountId })`.

Consumed (all optional, safe defaults): `InteractionVerifier` (default denies every rating), `BlockPort`, `RelationPort` (default: nobody is a participant), `RateLimitPort`, `NotifyPort` (security alerts on device and recovery changes).

## Protocol notes

- Login: `sessions.issueChallenge` -> client signs `signEnvelope(deviceKey, 'auth-challenge', { challengeId, nonce, accountId })` -> `sessions.login`. Token format `ses_<ulid>.<secret>`.
- Device binding: every key bound to an account ships a proof `signEnvelope(key, 'device-binding', { purpose, subject, signingKeyId, boxKeyId })` with purpose `register` (subject = lower-cased pseudonym), `recover` or `add_device` (subject = account id).
- Key changes and recovery re-issue: `signEnvelope(activeKey, 'device-rotation', { action, accountId, target, keyEpoch })`; `keyEpoch` increments on every change, so a captured signature cannot be replayed.
- Portable document: `portable.document` -> client signs with context `portable-identity` -> `portable.verify` / `portable.import`.
- Attestation: attester signs `{ accountId, kind, issuedAt, expiresAt? }` with context `identity-attestation`; the holder submits it with `evidence.attest`.

## Limits

- Idempotency records keep responses for 24 h, including one-time secrets of register, login and recovery; use an encrypted idempotency store or omit `Idempotency-Key` for those calls.
- `sessions.expire_due`, `evidence.expire_due` must be scheduled by the relay. `authenticate` is not a command and slides the idle window with a 60 s write granularity.
- Device key reuse across accounts is not prevented. No rename flow. Per-IP throttling is the relay's job.
- Feedback authored by an erased account is kept under the erased pseudonym (reported as retained).
- Tests run only in-memory; collection scans (`list(filter)`) are used for per-account listings.
