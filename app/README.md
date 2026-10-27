# ClassRup framework demo (app/)

Mock-backed, zero-dependency PWA shell. Synthetic data only. Not production: no auth, no server, no payments, nothing is published.

## Run

    cd app
    npm start            # http://localhost:4173/  (PORT=... to change the port)
    npm test             # unit tests (node:test)
    npm run smoke        # browser smoke journeys; needs npm start running
    npm run check:browser  # every file in scripts/checks/*.mjs; needs npm start running

Status, verification and open gaps: [STATUS.md](STATUS.md).

Browser checks use Playwright, which this app does not install (it has no dependencies). They load it
from the environment. If it is not found, install it or set `NODE_PATH` to a folder that contains
`playwright`. Point a run at another server with `BASE=http://localhost:4173/`.

## Layout

- `src/domain/listings.js`: validation, filter, sort, pagination (pure, tested).
- `src/lib/money.js`: integer minor-unit parsing and formatting.
- `src/data/repositories.js`: replaceable repository interfaces (listings, saved, drafts). Swap these for real service adapters.
- `src/data/storage.js`: never-throwing storage adapter with in-memory fallback.
- `src/data/fixtures.js`: synthetic listings, demo profile, read-only barter fixtures.
- `src/views/*`: browse, listing detail, editor (draft + simulated submit), saved, account, barter (read-only).
- `src/lib/dom.js`, `src/lib/dialog.js`: DOM helpers, shared loading/error/empty states, confirm dialog.

## Mock boundaries

- Submitted listings live in memory for the page session only.
- "Message seller" is simulated; nothing is sent.
- Barter views show fixtures; no matching, consent, expiry or settlement exists.
- No real authentication or permissions; the account page is a fixed demo profile.
- No service worker: installable manifest only, no offline behaviour.
- Localization: English strings only; no i18n framework was added.
