# F13.S01.M03 (PS-103) In-app notifications

## Implemented
- Commands: `notify.notification.create` (vault-internal: local principal or system consumers only), `notify.notification.mark_read`, `notify.notification.mark_all_read`.
- Queries: `notify.notification.list_mine` (newest first, cursor), `notify.notification.unread_count`.
- Events: `notify.notification.created` (also for collapses, `collapsed: true`), `notify.notification.read`.
- Subscribers: `notify.inapp_router` (all 48 routed event types, table in `routing.ts`, equal to the spec events_consumed list; test T05 compares them), `notify.inapp_preference_changed` (removes unread rows of categories now off, except security).
- Rules: dedupe by source event id (consumer inbox plus `notify.notification_seen`), collapse within 10 minutes on (template, collapse key), cap 500 (oldest read, then oldest unread non-security, security last and only after 30 days), per-source cap of 50 events per actor and day (hidden counter instead of rows), hidden counter for categories off in-app (security ignores the preference), events older than 30 days never create rows, urgent only for 3 security templates.
- Exports: `createNotification` (shared by command and router), `sweepNotifications(ctx)` (daily local sweep, 30 days), `renderNotification` (device-side render with generic fallback), `readDiagnostics(tx)`, `ROUTES`.

## Ports (`InAppOptions`)
- `localPrincipal()`, `isBlocked(did)` (F07.S02.M02, N7), `isThreadMuted(threadId)` (F08.S01.M02).
- Reads the in-app flag through `inAppEnabled` of `../../preferences/in/index.ts`.

## Payload contract with producers (N4)
Recipient DIDs are read from named payload fields (string, array or `{did}` objects): e.g. `sellerId`/`buyerId`, `partyIds` with `actorId`, `participantIds`, `parties` (N3 completion events), `outbidBidderId`, `winnerId`, `ownerId`/`renterId`, `providerId`/`clientId`, `accusedId`, `affectedUserId`, `appellantId`. The acting party is read from `buyerId`, `actorId`, `senderId` etc. as listed in `routing.ts`; collapse key from the field named in the spec (`offerListingId`, `offerId`, `threadId`, ...); optional reference ids must be UUIDv7 (`offerId`, `dealId`, `threadId`, ...). Producers must emit these field names; change `routing.ts` if they differ.

## Deviations
- `create` input has additive optional `actorDid` and `eventAt` (the spec input lacks the actor needed for V02, V05 and the per-source cap, and the event time needed for V08). When a notification is suppressed (category off, per-source cap, inbox full of protected rows) it returns `{ notificationId: null, created: false, collapsed: false, count: 0 }`.
- Router "no notification" outcomes (not the recipient, own action, blocked, duplicate, too old) are successful skips so the dispatcher does not retry or dead-letter them; malformed payloads (V01) return `VALIDATION_FAILED`, forged events (relay actor, or a security event not from the local principal or the system) return `FORBIDDEN`.
- `quote`, `meetup` and security routes have no or optional references because the reference-type registry has no matching type (`booking`/`thread` are used with the nearest opaque id).
- `mark_read` on an already-read row returns the stored read state regardless of the revision (idempotent); `CONFLICT_STATE` from the spec list is never returned.
- Per-day source counters and seen-event records are swept (seen) or left (day counters, 1 small record per actor and day).
- Template rendering is an exported helper; no text is stored. Local diagnostics are the `notify.notification_diag` counters; no logging of refs or content.

## Test rows not covered
- T11 load (1 000 events catch-up, p95 budgets): not claimed; no deterministic timing assertion.
- T12 traceability, T14 a11y.
- T13 export/import/backup: the export section machinery does not exist yet; no import path was written.
- Not implemented: "user can report a source from the notification screen" (UI), the user-enabled previews setting.

## Open questions
- Final producer payload field names for the DID roles (see contract above).
- Whether `notify.notification.create` should also be exposed to relay-derived local events (N17) or only through the router.

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 31 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
