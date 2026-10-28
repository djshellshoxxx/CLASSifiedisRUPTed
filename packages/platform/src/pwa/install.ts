/** F15.S01.M03 installability: web app manifest builder/validator and the install-prompt state machine. */
import { assertTransition, conflict, DAY, validationError } from '@classrup/kernel';

export interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  readonly purpose?: string;
}

export interface WebManifest {
  readonly id: string;
  readonly name: string;
  readonly short_name: string;
  readonly description: string;
  readonly lang: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  readonly start_url: string;
  readonly scope: string;
  readonly display: string;
  readonly orientation: string;
  readonly theme_color: string;
  readonly background_color: string;
  readonly categories: readonly string[];
  readonly icons: readonly ManifestIcon[];
}

export interface ManifestInput {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly themeColor: string;
  readonly backgroundColor: string;
  readonly lang?: string;
  readonly dir?: WebManifest['dir'];
  readonly startUrl?: string;
  readonly scope?: string;
  readonly icons?: readonly ManifestIcon[];
}

export interface ManifestIssue {
  readonly path: string;
  readonly message: string;
}

export const DEFAULT_ICONS: readonly ManifestIcon[] = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const LANG_RE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const ICON_TYPES = new Set(['image/png', 'image/webp', 'image/svg+xml']);

const purposes = (icon: ManifestIcon): string[] => (icon.purpose ?? 'any').split(/\s+/).filter(Boolean);
const hasIcon = (icons: readonly ManifestIcon[], size: string, purpose: string): boolean => icons.some((i) => i.sizes === size && purposes(i).includes(purpose));

function iconIssues(icons: readonly ManifestIcon[]): ManifestIssue[] {
  const issues: ManifestIssue[] = [];
  if (!hasIcon(icons, '192x192', 'any')) issues.push({ path: 'icons', message: 'a 192x192 icon is required' });
  if (!hasIcon(icons, '512x512', 'any')) issues.push({ path: 'icons', message: 'a 512x512 icon is required' });
  if (!hasIcon(icons, '512x512', 'maskable') && !hasIcon(icons, '192x192', 'maskable')) issues.push({ path: 'icons', message: 'a maskable icon is required' });
  icons.forEach((icon, n) => {
    if (!icon.src.startsWith('/') || icon.src.startsWith('//')) issues.push({ path: `icons.${n}.src`, message: 'icon src must be a same-origin absolute path' });
    if (!ICON_TYPES.has(icon.type)) issues.push({ path: `icons.${n}.type`, message: 'unsupported icon type' });
  });
  return issues;
}

export function validateManifest(m: WebManifest): ManifestIssue[] {
  const issues: ManifestIssue[] = [];
  const need = (ok: boolean, path: string, message: string): void => {
    if (!ok) issues.push({ path, message });
  };
  need(m.name.length >= 1 && m.name.length <= 45, 'name', 'name must be 1-45 characters');
  need(m.short_name.length >= 1 && m.short_name.length <= 12, 'short_name', 'short_name must be 1-12 characters');
  need(m.description.length <= 300, 'description', 'description must be at most 300 characters');
  need(m.display === 'standalone', 'display', 'display must be standalone');
  need(m.scope.startsWith('/') && m.scope.endsWith('/') && !m.scope.startsWith('//'), 'scope', 'scope must be an absolute path ending in /');
  need(m.start_url.startsWith('/') && !m.start_url.startsWith('//'), 'start_url', 'start_url must be an absolute path');
  need(m.start_url.startsWith(m.scope) || `${m.start_url}/` === m.scope, 'start_url', 'start_url must be inside scope');
  need(COLOR_RE.test(m.theme_color), 'theme_color', 'theme_color must be a hex color');
  need(COLOR_RE.test(m.background_color), 'background_color', 'background_color must be a hex color');
  need(LANG_RE.test(m.lang), 'lang', 'lang must be a BCP 47 tag');
  need(['ltr', 'rtl', 'auto'].includes(m.dir), 'dir', 'dir must be ltr, rtl or auto');
  return [...issues, ...iconIssues(m.icons)];
}

/** Builds a manifest and throws `MANIFEST.INVALID` listing every problem (values are not echoed). */
export function buildManifest(input: ManifestInput): WebManifest {
  const manifest: WebManifest = {
    id: '/',
    name: input.name,
    short_name: input.shortName,
    description: input.description,
    lang: input.lang ?? 'en',
    dir: input.dir ?? 'ltr',
    start_url: input.startUrl ?? '/',
    scope: input.scope ?? '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: input.themeColor,
    background_color: input.backgroundColor,
    categories: ['shopping', 'lifestyle'],
    icons: input.icons ?? DEFAULT_ICONS,
  };
  const issues = validateManifest(manifest);
  if (issues.length > 0) throw validationError('MANIFEST.INVALID', 'web app manifest is invalid', { issues: issues.map((i) => `${i.path}: ${i.message}`) });
  return manifest;
}

export type InstallPhase = 'unsupported' | 'available' | 'prompted' | 'accepted' | 'dismissed';

export interface InstallState {
  readonly phase: InstallPhase;
  readonly dismissedAt?: number;
  readonly acceptedAt?: number;
}

export type InstallEvent =
  /** The browser offered install (beforeinstallprompt fired). */
  | { readonly type: 'prompt_available' }
  /** Our UI called prompt() on the deferred event. */
  | { readonly type: 'prompt_shown' }
  | { readonly type: 'choice'; readonly outcome: 'accepted' | 'dismissed' }
  /** appinstalled fired or the app runs in standalone mode. */
  | { readonly type: 'installed' };

export const INSTALL_COOLDOWN_MS = 14 * DAY;

export const INSTALL_TRANSITIONS: Readonly<Record<InstallPhase, readonly InstallPhase[]>> = {
  unsupported: ['available', 'accepted'],
  available: ['prompted', 'accepted'],
  prompted: ['accepted', 'dismissed'],
  dismissed: ['available', 'accepted'],
  accepted: [],
};

export const initialInstallState = (): InstallState => ({ phase: 'unsupported' });

export function cooldownRemainingMs(state: InstallState, now: number): number {
  return state.phase === 'dismissed' && state.dismissedAt !== undefined ? Math.max(0, state.dismissedAt + INSTALL_COOLDOWN_MS - now) : 0;
}

/** Pure reducer. Invalid sequences throw `INSTALL.INVALID_TRANSITION`; benign repeats are no-ops. */
export function reduceInstall(state: InstallState, event: InstallEvent, now: number): InstallState {
  switch (event.type) {
    case 'prompt_available':
      if (state.phase === 'unsupported') return { phase: 'available' };
      // A dismissed user is not asked again until the cooldown has passed.
      if (state.phase === 'dismissed' && cooldownRemainingMs(state, now) === 0) return { phase: 'available' };
      return state;
    case 'prompt_shown':
      assertTransition('INSTALL', state.phase, 'prompted', INSTALL_TRANSITIONS);
      return { phase: 'prompted' };
    case 'choice':
      if (state.phase !== 'prompted') throw conflict('INSTALL.INVALID_TRANSITION', 'no install prompt is open', { from: state.phase });
      return event.outcome === 'accepted' ? { phase: 'accepted', acceptedAt: now } : { phase: 'dismissed', dismissedAt: now };
    case 'installed':
      return state.phase === 'accepted' ? state : { phase: 'accepted', acceptedAt: now };
  }
}

/** The install button may be shown only while the browser offers install and the user is not in cooldown. */
export const canShowInstallPrompt = (state: InstallState): boolean => state.phase === 'available';
