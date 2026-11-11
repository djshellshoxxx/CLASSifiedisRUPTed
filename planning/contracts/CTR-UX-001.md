# CTR-UX-001 — Accessibility, localization and UX states

**Status:** APPROVED. **Owner:** F14 (accessibility and localization).

- **UX-1** WCAG 2.2 Level AA for all screens; targets ≥ 44 × 44 CSS px (exceeds 2.5.8 minimum 24 px); focus never obscured (2.4.11); dragging always has single-pointer alternative (2.5.7); no cognitive-function test for login (3.3.8) — key-based login and passkey-style flows only.
- **UX-2** Every async view has explicit states: loading, empty, error (localized from `messageKey`, with retry when retryable), offline-pending, conflict, and success. Status changes are announced via `aria-live="polite"`; destructive confirmations via accessible dialog.
- **UX-3** Strings live in message catalogs `packages/i18n/messages/<locale>.json` with `{name}` placeholders and plural forms via `Intl.PluralRules`; numbers/money/dates via `Intl.NumberFormat`/`Intl.DateTimeFormat`. Default locale `en`; layouts use CSS logical properties for RTL.
- **UX-4** Money is always displayed with currency code or symbol plus the precision source (e.g. “≈ 42.10 EUR, quote from <source> at 10:15”).
