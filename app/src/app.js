import { h, clear, errorState } from './lib/dom.js';
import { LISTINGS } from './data/fixtures.js';
import { createListingRepository, createSavedRepository, createDraftStore } from './data/repositories.js';
import { createSafeStorage, defaultStorage } from './data/storage.js';
import { renderBrowse } from './views/browse.js';
import { renderDetail } from './views/detail.js';
import { renderEditor } from './views/editor.js';
import { renderSaved } from './views/saved.js';
import { renderAccount } from './views/account.js';
import { renderBarter } from './views/barter.js';

const ROUTES = [
  { name: 'browse', href: '#/', label: 'Browse', match: (parts) => parts.length === 0 },
  { name: 'sell', href: '#/sell', label: 'Sell', match: (parts) => parts[0] === 'sell' },
  { name: 'saved', href: '#/saved', label: 'Saved', match: (parts) => parts[0] === 'saved' },
  { name: 'barter', href: '#/barter', label: 'Barter', match: (parts) => parts[0] === 'barter' },
  { name: 'account', href: '#/account', label: 'Account', match: (parts) => parts[0] === 'account' },
];

export function parseRoute(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'listing' && parts[1]) return { name: 'detail', id: parts[1] };
  const route = ROUTES.find((candidate) => candidate.match(parts));
  return { name: route?.name ?? 'notfound' };
}

export function createApp(root, { storage = createSafeStorage(defaultStorage()), seed = LISTINGS } = {}) {
  const services = {
    listings: createListingRepository(seed),
    saved: createSavedRepository(storage),
    drafts: createDraftStore(storage),
  };

  const shell = h(
    'div',
    { class: 'shell' },
    h('a', { class: 'skip-link', href: '#main' }, 'Skip to content'),
    h(
      'header',
      { class: 'site-header' },
      h('a', { class: 'brand', href: '#/' }, 'ClassRup'),
      h('nav', { 'aria-label': 'Primary' }, ROUTES.map((route) => h('a', { href: route.href, dataset: { route: route.name } }, route.label))),
    ),
    h('div', { class: 'demo-banner', role: 'note' }, 'Demo mode: synthetic data, no server, nothing is published or paid.'),
    h('main', { id: 'main', tabindex: '-1' }),
    h('div', { id: 'status', class: 'sr-only', 'aria-live': 'polite' }),
  );
  root.replaceChildren(shell);
  const main = shell.querySelector('main');

  function render() {
    const route = parseRoute(location.hash);
    for (const link of shell.querySelectorAll('nav a')) {
      const active = link.dataset.route === route.name;
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    try {
      switch (route.name) {
        case 'browse':
          renderBrowse(main, { listings: services.listings.list(), saved: services.saved });
          break;
        case 'detail':
          renderDetail(main, { id: route.id, listings: services.listings, saved: services.saved });
          break;
        case 'sell':
          renderEditor(main, services);
          break;
        case 'saved':
          renderSaved(main, { listings: services.listings, saved: services.saved });
          break;
        case 'barter':
          renderBarter(main, services);
          break;
        case 'account':
          renderAccount(main, services);
          break;
        default:
          clear(main).append(errorState('That page does not exist.'), h('a', { class: 'btn', href: '#/' }, 'Go to browse'));
      }
    } catch (error) {
      console.error(error);
      clear(main).append(errorState('Something went wrong while showing this page. Try again.', { onRetry: render }));
    }
    main.focus({ preventScroll: false });
  }

  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/';
  render();
  return { render, services };
}
