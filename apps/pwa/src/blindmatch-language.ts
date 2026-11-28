import {
  createI18n, LANGUAGE_NAMES, PSEUDO_LOCALES, SHIPPED_LOCALES,
  type Params,
} from '../../../packages/i18n/src/internationalization/languages/index.ts';
import { blindMatchEnglish, loadBlindMatchCatalog, type BlindMatchMessage } from '../../../packages/i18n/src/internationalization/languages/blindmatch/index.ts';

export type { BlindMatchMessage };
type Label = BlindMatchMessage | (() => string);

/** Only text nodes still in the panel can be translated. Discarded private rows
 * and status messages are neither retained nor recreated on a language change. */
export function mountBlindMatchLanguage(panel: HTMLElement) {
  const doc = panel.ownerDocument;
  const view = doc.defaultView;
  const bindings = new WeakMap<Text, Label>();
  const announcement = doc.createElement('p');
  announcement.setAttribute('role', 'status');
  announcement.className = 'note';
  const select = doc.createElement('select');
  select.id = 'blindmatch-language';
  const control = doc.createElement('label');
  let mounted = true;
  let request = 0;
  let lastSelection = '';
  let failed = false;
  panel.lang = 'en';
  panel.dir = 'ltr';
  const i18n = createI18n({
    en: blindMatchEnglish, supported: [...SHIPPED_LOCALES, ...PSEUDO_LOCALES],
    loadCatalog: loadBlindMatchCatalog,
  });
  const translate = (key: BlindMatchMessage, params?: Params) => i18n.t(`blindmatch.${key}`, params);
  const render = (label: Label) => typeof label === 'function' ? label() : translate(label);

  function message(element: HTMLElement, label: Label): void {
    const text = doc.createTextNode(render(label));
    bindings.set(text, label);
    element.replaceChildren(text);
  }
  message(control, 'language');
  const automatic = doc.createElement('option');
  automatic.value = '';
  message(automatic, () => i18n.t('language.automatic'));
  select.append(automatic);
  for (const locale of SHIPPED_LOCALES) {
    const option = doc.createElement('option');
    option.value = locale;
    option.lang = locale;
    option.textContent = LANGUAGE_NAMES[locale]!;
    select.append(option);
  }
  control.append(select);

  async function update(announce: boolean): Promise<void> {
    const ticket = ++request;
    const selectedValue = select.value;
    const preferred = selectedValue || view?.navigator.languages || [];
    const result = await i18n.setLocale(preferred);
    if (!mounted || ticket !== request || result.status === 'superseded') return;
    if (result.status === 'failed') {
      failed = true;
      select.value = lastSelection;
      message(announcement, 'languageFailed');
      return;
    }
    lastSelection = selectedValue;
    if (failed) {
      announcement.replaceChildren();
      failed = false;
    }
    if (panel.lang === i18n.locale) return;
    panel.lang = i18n.locale;
    panel.dir = i18n.dir;
    const walker = doc.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      const binding = bindings.get(text);
      if (binding === undefined) continue;
      const next = render(binding);
      if (text.data !== next) text.data = next;
    }
    announcement.textContent = announce
      ? i18n.t('language.changed', { language: LANGUAGE_NAMES[i18n.locale] ?? i18n.locale }) : '';
  }
  const selected = () => { void update(true); };
  const browserChanged = () => { if (!select.value) void update(true); };
  select.addEventListener('change', selected);
  view?.addEventListener('languagechange', browserChanged);
  void update(false);

  return {
    control, announcement, message, translate,
    resultCount: (count: number) => i18n.tp('blindmatch.complete', count),
    destroy() {
      mounted = false;
      select.removeEventListener('change', selected);
      view?.removeEventListener('languagechange', browserChanged);
      panel.removeAttribute('lang');
      panel.removeAttribute('dir');
    },
  };
}
