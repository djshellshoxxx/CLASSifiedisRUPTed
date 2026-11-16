import { snap, type LocationView, type PublicLocationLevel } from '../../../packages/discovery/src/index.ts';
import { z } from '../../../packages/kernel/src/index.ts';

type PositionResult = { readonly ok: true; readonly cell5: string } | { readonly ok: false; readonly reason: 'unavailable' | 'cancelled' };
type PositionProvider = Pick<Geolocation, 'getCurrentPosition'>;

/** Only a snapped tile leaves the synchronous success callback. No raw point is retained, logged or returned. */
export function requestCoarsePosition(provider: PositionProvider | undefined, signal?: AbortSignal): Promise<PositionResult> {
  return new Promise(resolve => {
    if (!provider || signal?.aborted) { resolve({ ok: false, reason: signal?.aborted ? 'cancelled' : 'unavailable' }); return; }
    let completed = false;
    const finish = (result: PositionResult) => {
      if (completed) return;
      completed = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); resolve(result);
    };
    const abort = () => finish({ ok: false, reason: 'cancelled' });
    const timer = setTimeout(() => finish({ ok: false, reason: 'unavailable' }), 10_000);
    signal?.addEventListener('abort', abort, { once: true });
    try {
      provider.getCurrentPosition(position => {
        if (completed) return;
        const cell = snap(position.coords.latitude, position.coords.longitude, 'L2');
        finish(cell.ok ? { ok: true, cell5: cell.value } : { ok: false, reason: 'unavailable' });
      }, () => finish({ ok: false, reason: 'unavailable' }), { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 });
    } catch { finish({ ok: false, reason: 'unavailable' }); }
  });
}

interface LocationPorts {
  readonly container: HTMLElement;
  command(name: string, input: unknown): Promise<unknown>;
  query(name: string, input: unknown): Promise<unknown>;
  action(fn: () => Promise<void>): Promise<void>;
  message(text: string): void;
  applyToListing?(cell: string): void;
  applyToSearch?(cell: string): void;
  readonly geolocation?: PositionProvider;
}
const viewSchema = z.strictObject({ settingId: z.string().optional(), publicLevel: z.enum(['L0', 'L1', 'L2']),
  publicCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(),
  homeCell5: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{5}$/).optional(), revision: z.int().positive().optional() });

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}

/** Offline cell entry with optional, explicitly requested one-shot GPS. Saving never publishes a location. */
export function mountLocationPreferences(ports: LocationPorts) {
  let active = true;
  let generation = 0;
  let inputGeneration = 0;
  let dirty = false;
  let entryMode: 'map_tile' | 'device_gps_once' = 'map_tile';
  let saved: LocationView = { publicLevel: 'L0' };
  let positionRequest: AbortController | undefined;
  const heading = node('h2', 'Your approximate area'); heading.id = 'location-preferences-title';
  ports.container.setAttribute('aria-labelledby', heading.id);
  const form = node('form'); form.setAttribute('aria-label', 'Location preferences');
  const cellLabel = node('label', 'Home area tile (5-character geohash)');
  const cell = node('input'); cell.id = 'location-home-cell'; cellLabel.htmlFor = cell.id;
  cell.type = 'text'; cell.maxLength = 5; cell.pattern = '[0123456789bcdefghjkmnpqrstuvwxyz]{5}'; cell.autocomplete = 'off'; cell.spellcheck = false;
  const help = node('p', 'Enter a coarse geohash tile, or use your device position once. Only the approximately 5 km tile is kept; no address or exact coordinates are saved. Tile dimensions vary by latitude.');
  help.id = 'location-help'; cell.setAttribute('aria-describedby', help.id);
  const levelLabel = node('label', 'Area visible when you copy it to a new listing');
  const level = node('select'); level.id = 'location-public-level'; levelLabel.htmlFor = level.id;
  for (const [value, text] of [['L0', 'Hidden'], ['L1', 'Region (coarser tile)'], ['L2', 'Area (approximately 5 km tile)']]) {
    const option = node('option', text); option.value = value!; level.append(option);
  }
  const preview = node('p'); preview.id = 'location-preview'; preview.setAttribute('aria-live', 'polite');
  const status = node('p'); status.id = 'location-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  function run(fn: () => Promise<void>) { if (active) void ports.action(async () => { if (active) await fn(); }); }
  function button(text: string, id: string, fn: () => Promise<void>) {
    const button = node('button', text); button.id = id; button.type = 'button'; button.addEventListener('click', () => run(fn)); return button;
  }
  function previewInput() {
    const valid = /^[0123456789bcdefghjkmnpqrstuvwxyz]{5}$/.test(cell.value);
    preview.textContent = level.value === 'L0' ? 'Visible area: hidden.' : !valid ? 'Choose a valid area tile to preview the visible region.'
      : `Visible area tile: ${cell.value.slice(0, level.value === 'L1' ? 4 : 5)}. This is a region, not an exact position.`;
  }
  function edited() {
    inputGeneration++; dirty = true;
    positionRequest?.abort(); positionRequest = undefined;
    updateCopyButtons(); previewInput();
    status.textContent = 'Unsaved area preferences. Save before copying an area.';
  }
  cell.addEventListener('input', () => { entryMode = 'map_tile'; edited(); });
  level.addEventListener('change', edited);
  const gps = button('Use device position once', 'location-gps-once', async () => {
    const request = ++generation;
    const inputs = inputGeneration;
    positionRequest?.abort(); const controller = new AbortController(); positionRequest = controller;
    status.textContent = 'Waiting for a device position. Manual tile entry remains available.';
    const result = await requestCoarsePosition(ports.geolocation ?? globalThis.navigator?.geolocation, controller.signal);
    if (!active || request !== generation || inputs !== inputGeneration) return;
    positionRequest = undefined;
    if (!result.ok) { status.textContent = 'Device location is unavailable. Enter an area tile manually.'; return; }
    cell.value = result.cell5; entryMode = 'device_gps_once'; inputGeneration++; dirty = true; updateCopyButtons(); previewInput();
    status.textContent = 'Device position reduced to an area tile. Choose visibility and save to keep it.';
  });
  const submit = node('button', 'Save area preferences'); submit.type = 'submit'; submit.id = 'location-save';
  const clear = button('Clear saved area', 'location-clear', async () => {
    if (saved.revision === undefined) return;
    const submittedInputs = inputGeneration;
    await ports.command('discovery.location.clear_home', { expectedRevision: saved.revision });
    if (!active) return; await refresh(inputGeneration !== submittedInputs);
    if (active) ports.message('Saved area cleared. Existing signed listings and previous downloads are unchanged.');
  });
  const useListing = button('Use visible area for new listing', 'location-use-listing', async () => {
    if (!dirty && saved.publicCell !== undefined) { ports.applyToListing?.(saved.publicCell); ports.message('Visible area copied to the new-listing form. Review before publishing.'); }
  });
  const useSearch = button('Use saved area for regional search', 'location-use-search', async () => {
    if (!dirty && saved.homeCell5 !== undefined) { ports.applyToSearch?.(saved.homeCell5); ports.message('Saved area copied to the regional search form. Apply the filter to search.'); }
  });
  function updateCopyButtons() {
    useListing.hidden = dirty || saved.publicCell === undefined || !ports.applyToListing;
    useSearch.hidden = dirty || saved.homeCell5 === undefined || !ports.applyToSearch;
  }
  updateCopyButtons();
  const actions = node('div'); actions.className = 'actions'; actions.append(gps, submit, clear, useListing, useSearch);
  form.append(cellLabel, cell, help, levelLabel, level, preview, actions);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const home = cell.value;
    const publicLevel = level.value as PublicLocationLevel;
    const selectedEntry = entryMode;
    const revision = saved.revision ?? 0;
    const submittedInputs = inputGeneration;
    run(async () => {
      await ports.command('discovery.location.set_home', { ...(home ? { cell5: home } : {}), publicLevel,
        entryMode: selectedEntry, expectedRevision: revision, ...(selectedEntry === 'device_gps_once' ? { fromGpsOnce: true } : {}) });
      if (!active) return; await refresh(inputGeneration !== submittedInputs);
      if (active) ports.message('Area preferences saved privately. Existing listings are unchanged; use the copy buttons when needed.');
    });
  });
  ports.container.replaceChildren(heading,
    node('p', 'These preferences stay in your encrypted vault and encrypted backup. Saving does not publish or change any listing. You may change the home tile three times in a rolling 24 hours; hiding and clearing remain available.'),
    form, status);
  async function refresh(preserveDraft = false) {
    if (!active) return;
    const request = ++generation;
    const inputs = inputGeneration;
    const result = await ports.query('discovery.location.get_own', { includeHomeCell: true });
    if (!active || request !== generation) return;
    saved = viewSchema.parse(result);
    if (!preserveDraft && inputs === inputGeneration) {
      cell.value = saved.homeCell5 ?? ''; level.value = saved.publicLevel; entryMode = 'map_tile'; dirty = false;
    }
    clear.hidden = saved.homeCell5 === undefined;
    updateCopyButtons();
    previewInput(); status.textContent = dirty ? 'Unsaved area preferences. Save before copying an area.'
      : saved.homeCell5 ? 'Saved area loaded from this vault.' : 'No home area is saved.';
  }
  return { refresh, destroy() { active = false; generation++; positionRequest?.abort(); positionRequest = undefined;
    saved = { publicLevel: 'L0' }; cell.value = ''; ports.container.replaceChildren(); } };
}
