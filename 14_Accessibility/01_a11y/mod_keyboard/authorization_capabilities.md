# PS-109-05 — authorization and capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-109-05. **Owner:** [14_Accessibility/01_a11y/mod_keyboard](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_keyboard. **Consumers:** F16 (capability model, CTR-CAP-001), F07 (identity, account state, cascade deletion), F10 (export and deletion rights), F15 (typed error envelope); client keyboard runtime (must handle FORBIDDEN without exposing internals).

## Purpose and scope
Define which actor may perform which action on which keyboard resource, the capability names that enforce it, and how grants are revoked. Authorization is enforced by the relay on every request. The client never treats its own checks as authorization.

**Business outcome:** only the account owner can read or change their keyboard preferences; operators see aggregate counts only; the owner can always export or delete their data.

**Exclusions:** no administrator read of individual profiles, including for support; no delegation to other accounts; no authorization for the feature actions that shortcuts trigger (each owning module enforces its own, A-KBD-11).

## Requirements
- **PS-109-05.R01** — Outcome: every request is allowed or denied by the matrix below before any read or write, and denial reveals no profile existence.
- **PS-109-05.R02** — Cases: normal (owner reads and writes); invalid (other account's profile id); expired (capability grant expired, treated as not granted); duplicate (not applicable); concurrent (revocation during a queued write, see R05); offline (client holds no authority offline; queued writes are checked on replay); adversarial (forged account_id in body, token for suspended account, operator token used on owner routes).
- **PS-109-05.R03** — Budgets: authorization check adds at most 10 ms p95 (PS-109-08); denial responses are identical in shape and timing class for "not owned" and "not found".
- **PS-109-05.R04** — Capability names (CTR-CAP-001, proposed and to be registered by F16; see Open decisions):
  - `kbd.profile.read` — read own profile and revisions list
  - `kbd.profile.write` — update, reset, rollback own profile
  - `kbd.profile.delete` — delete own profile
  - `kbd.profile.export` — export own profile through F10 (no separate route in this module)
  - `kbd.catalog.read` — read catalog (granted to anonymous and authenticated callers)
  - `kbd.profile.cascade_delete` — service identity only; used by F07 account deletion
  - `kbd.metrics.read` — operator; aggregate counts only, never per-profile rows
- **PS-109-05.R05** — Revocation (CTR-CAP-001): revoking `kbd.profile.write` makes subsequent writes return `KEYBOARD_FORBIDDEN`; the device removes that queued write as ABANDONED with reason `forbidden` and keeps local values as unsaved drafts only until the user discards them. Revoking `kbd.profile.read` for an owner is not used; account suspension (F07) is the mechanism.
- **PS-109-05.R06** — Owner-only visibility: no role other than the owner and the `cascade_delete` service may read profile content. Operators with `kbd.metrics.read` see counts keyed by event type and outcome.

## Capability and permission matrix
Legend: ALLOW = granted by listed capability; DENY-NF = `KEYBOARD_PROFILE_NOT_FOUND`; DENY-F = `KEYBOARD_FORBIDDEN`; DENY-U = `KEYBOARD_UNAUTHENTICATED`.

| Actor \ Action | Get profile | Update | Reset | Delete | Rollback | List revisions | Export (F10) | Catalog read | Aggregate metrics |
|---|---|---|---|---|---|---|---|---|---|
| Owner (active) | ALLOW `kbd.profile.read` | ALLOW `kbd.profile.write` | ALLOW `kbd.profile.write` | ALLOW `kbd.profile.delete` | ALLOW `kbd.profile.write` | ALLOW `kbd.profile.read` | ALLOW `kbd.profile.export` | ALLOW `kbd.catalog.read` | DENY-F |
| Owner (suspended, F07) | ALLOW `kbd.profile.read` | DENY-F | DENY-F | ALLOW `kbd.profile.delete` | DENY-F | ALLOW `kbd.profile.read` | ALLOW `kbd.profile.export` | ALLOW `kbd.catalog.read` | DENY-F |
| Other authenticated account | DENY-NF | DENY-NF | DENY-NF | DENY-NF | DENY-NF | DENY-NF | DENY-NF | ALLOW `kbd.catalog.read` | DENY-F |
| Anonymous | DENY-U | DENY-U | DENY-U | DENY-U | DENY-U | DENY-U | DENY-U | ALLOW `kbd.catalog.read` | DENY-U |
| Operator | DENY-F | DENY-F | DENY-F | DENY-F | DENY-F | DENY-F | DENY-F | ALLOW `kbd.catalog.read` | ALLOW `kbd.metrics.read` |
| Service: F07 cascade | DENY-F | DENY-F | DENY-F | ALLOW `kbd.profile.cascade_delete` | DENY-F | DENY-F | DENY-F | DENY-F | DENY-F |

Notes:
- "Owner (suspended)" can still delete and export, because deletion and portability are not blocked by suspension (D10 and privacy rules in PS-109-07).
- Operators are denied profile content even for support; a support case may be handled only by F07 and F10 processes, not this module.
- Catalog reads are public reference data and contain no account data.

## Enforcement details
- The relay derives the actor from the authenticated session and ignores any `account_id` in a body (adversarial case).
- Ownership check: `profile.account_id == caller.account_ref`, evaluated inside the same transaction as the write (PS-109-06 concurrency).
- Operator tokens are rejected on owner routes with `KEYBOARD_FORBIDDEN` before lookup, so operator access cannot reveal profile existence.
- Capability checks are logged as outcome codes only (PS-109-08).

## Open decisions
- A-KBD-10 (owner-only visibility; no admin read). A-KBD-11 (client shortcut dispatch does not bypass feature authorization). Capability names are proposed and must be registered in CTR-CAP-001 by F16 (see Open decisions in this file and the report to the lead). D10 (auth and portability) OPEN.

## Acceptance criteria
- Every cell of the matrix has one test in PS-109-09 covering the listed outcome.
- An other-account request and a non-existent profile request return byte-identical error bodies, except `request_id`.
- No route in this module returns profile contents to an operator token.
