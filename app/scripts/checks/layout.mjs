// Responsive, focus, touch-target, contrast and reduced-motion checks for the existing views.
// Start the demo first (`PORT=4183 node scripts/serve.mjs`), then run `BASE=http://localhost:4183/ node scripts/checks/layout.mjs`.
import { BASE, loadPlaywright, createChecker } from './lib.mjs';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const root = BASE.endsWith('/') ? BASE : `${BASE}/`;
const ROUTES = ['#/', '#/sell', '#/saved', '#/barter', '#/account', '#/listing/demo-001', '#/nope'];
const WIDTHS = [320, 390, 768, 1280];
const LONG_TITLE = 'x'.repeat(80);

const browser = await chromium.launch();

async function open(route, options = {}) {
  const { width = 1280, colorScheme, reducedMotion } = options;
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${root}${route}`);
  await page.waitForSelector('#main > *');
  return { page, context };
}

try {
  // 1. Horizontal overflow on every route at every width, measured after render.
  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      const { page, context } = await open(route, { width });
      const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      check(`no horizontal overflow on ${route} at ${width}px (scrollWidth ${metrics.scrollWidth}, innerWidth ${metrics.innerWidth})`, metrics.scrollWidth <= metrics.innerWidth);
      await context.close();
    }
  }

  // 1b. A title with no spaces must wrap or break instead of widening the page.
  const longTitleCases = [
    { route: '#/', selector: '.card h3 a', label: 'browse card title' },
    { route: '#/listing/demo-001', selector: 'main h1', label: 'detail title' },
  ];
  for (const width of WIDTHS) {
    for (const { route, selector, label } of longTitleCases) {
      const { page, context } = await open(route, { width });
      await page.evaluate(([sel, text]) => {
        document.querySelector(sel).textContent = text;
      }, [selector, LONG_TITLE]);
      const metrics = await page.evaluate((sel) => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        titleRight: document.querySelector(sel).getBoundingClientRect().right,
      }), selector);
      check(
        `80-letter unbroken ${label} does not overflow at ${width}px (scrollWidth ${metrics.scrollWidth}, title right ${Math.round(metrics.titleRight)}, innerWidth ${metrics.innerWidth})`,
        metrics.scrollWidth <= metrics.innerWidth && metrics.titleRight <= metrics.innerWidth,
      );
      await context.close();
    }
  }

  // 1c. Barter table scrolls inside its own container, not the page.
  for (const width of [320, 390]) {
    const { page, context } = await open('#/barter', { width });
    const info = await page.evaluate(() => {
      const table = document.querySelector('main table');
      let el = table?.parentElement ?? null;
      let scroller = null;
      while (el && el !== document.body) {
        if (['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) {
          scroller = el;
          break;
        }
        el = el.parentElement;
      }
      return {
        hasTable: Boolean(table),
        scroller: scroller ? { tag: scroller.tagName, overflowX: getComputedStyle(scroller).overflowX, clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth } : null,
      };
    });
    const scrolls = info.scroller && info.scroller.scrollWidth > info.scroller.clientWidth;
    check(
      `barter table scrolls in its own container at ${width}px (container ${info.scroller ? `${info.scroller.tag} overflow-x ${info.scroller.overflowX}, ${info.scroller.scrollWidth}>${info.scroller.clientWidth}` : 'none'})`,
      info.hasTable && Boolean(info.scroller) && scrolls,
    );
    await context.close();
  }

  // 1d. Filter form stacks into one column on narrow screens.
  for (const width of [320, 390]) {
    const { page, context } = await open('#/', { width });
    const boxes = await page.$$eval('.filters .field', (els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, bottom: r.bottom };
      }),
    );
    const stacked =
      boxes.length >= 2 &&
      boxes.every((box, i) => Math.abs(box.left - boxes[0].left) < 1 && (i === 0 || box.top >= boxes[i - 1].bottom - 1));
    check(`filter form stacks into one column at ${width}px (${boxes.length} fields)`, stacked);
    await context.close();
  }

  // 2. Focus is visible, reached by keyboard on each route: the skip link (outside main), the first link inside main, and the first button.
  // A route with no link or button inside main is SKIPped with the reason. SKIP is neither a pass nor a failure.
  let skipped = 0;
  const skip = (name, reason) => {
    skipped += 1;
    console.log(`SKIP ${name}: ${reason}`);
  };
  for (const route of ROUTES) {
    const { page, context } = await open(route);
    const inMain = await page.evaluate(() => ({
      links: document.querySelectorAll('#main a[href]').length,
      focusable: document.querySelectorAll('#main a[href], #main button:not([disabled]), #main input:not([disabled]), #main select:not([disabled]), #main textarea:not([disabled]), #main [tabindex]:not([tabindex="-1"])').length,
    }));
    // The view moves focus to <main> on render, so walk back to the first focusable element (the skip link) before tabbing forward.
    for (let i = 0; i < 30; i += 1) {
      const atSkipLink = await page.evaluate(() => document.activeElement?.classList.contains('skip-link') ?? false);
      if (atSkipLink) break;
      await page.keyboard.press('Shift+Tab');
    }
    const probe = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          focusVisible: el.matches(':focus-visible'),
          inMain: Boolean(el.closest('main')),
        };
      });
    let firstLink = null;
    let firstMainLink = null;
    let firstButton = null;
    let info = await probe();
    for (let i = 0; i < 40; i += 1) {
      if (info.tag === 'A' && !firstLink) firstLink = info;
      if (info.tag === 'A' && info.inMain && !firstMainLink) firstMainLink = info;
      if (info.tag === 'BUTTON' && !firstButton) firstButton = info;
      if (firstLink && firstMainLink && firstButton) break;
      await page.keyboard.press('Tab');
      info = await probe();
    }
    const visibleOutline = (info) => info.focusVisible && info.outlineStyle !== 'none' && parseFloat(info.outlineWidth) > 0;
    const describe = (info) => `"${info.label}" outline ${info.outlineStyle} ${info.outlineWidth}, focus-visible ${info.focusVisible}`;
    check(
      `focus visible on first link on ${route} (skip link, outside main): ${firstLink ? describe(firstLink) : 'no link reached'}`,
      Boolean(firstLink) && visibleOutline(firstLink),
    );
    if (inMain.links === 0) {
      skip(`focus visible on first link inside main on ${route}`, `no link inside main on this route (focusable controls inside main: ${inMain.focusable}, none is a link)`);
    } else {
      check(
        `focus visible on first link inside main on ${route}: ${firstMainLink ? describe(firstMainLink) : 'no link inside main reached by Tab'}`,
        Boolean(firstMainLink) && visibleOutline(firstMainLink),
      );
    }
    if (firstButton) {
      check(`focus visible on first button on ${route}: ${describe(firstButton)}`, visibleOutline(firstButton));
    } else {
      skip(`focus visible on first button on ${route}`, 'no button is reachable by Tab on this route; the first link inside main is checked above');
    }
    await context.close();
  }
  console.log(`${skipped} focus check(s) skipped with a reason (not counted as passes)`);

  // 3. Touch targets at 390px: visible buttons and links in main and header nav are at least 24x24 CSS px.
  for (const route of ROUTES) {
    const { page, context } = await open(route, { width: 390 });
    const result = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('main a, main button, header nav a')].filter((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0;
      });
      const small = nodes
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((box) => box.w < 24 || box.h < 24);
      return { total: nodes.length, small };
    });
    const names = result.small.map((box) => `"${box.label}" ${box.w}x${box.h}`).join('; ');
    check(
      `touch targets at least 24x24 on ${route} at 390px (${result.total} controls${names ? `; too small: ${names}` : ''})`,
      result.small.length === 0,
    );
    await context.close();
  }

  // 4. Text contrast in light and dark colour schemes, computed from the rendered colours.
  for (const colorScheme of ['light', 'dark']) {
    const found = { body: [], muted: [], placeholder: [] };
    for (const route of ROUTES) {
      const { page, context } = await open(route, { colorScheme });
      const samples = await page.evaluate(() => {
        const probe = (token) => {
          const span = document.createElement('span');
          span.style.color = `var(${token})`;
          document.body.append(span);
          const value = getComputedStyle(span).color;
          span.remove();
          return value;
        };
        const parse = (value) => {
          const [r, g, b, a = 1] = value.match(/[\d.]+/g).map(Number);
          return { r, g, b, a };
        };
        const background = (el) => {
          const layers = [];
          for (let node = el; node; node = node.parentElement) {
            const color = parse(getComputedStyle(node).backgroundColor);
            if (color.a > 0) layers.push(color);
            if (color.a >= 1) break;
          }
          let base = { r: 255, g: 255, b: 255, a: 1 };
          for (const layer of layers.reverse()) {
            base = {
              r: layer.r * layer.a + base.r * (1 - layer.a),
              g: layer.g * layer.a + base.g * (1 - layer.a),
              b: layer.b * layer.a + base.b * (1 - layer.a),
              a: 1,
            };
          }
          return base;
        };
        const bodyColor = probe('--text');
        const mutedColor = probe('--muted');
        const texts = [...document.querySelectorAll('main *, header *')].filter((el) =>
          [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()),
        );
        const placeholders = [...document.querySelectorAll('input[placeholder], textarea[placeholder]')].map((el) => ({
          color: getComputedStyle(el, '::placeholder').color,
          bg: background(el),
          label: `placeholder "${el.getAttribute('placeholder')}"`,
        }));
        return {
          bodyColor,
          mutedColor,
          placeholders,
          items: texts.map((el) => {
            const cs = getComputedStyle(el);
            return { color: cs.color, bg: background(el), label: (el.textContent || '').trim().slice(0, 40) };
          }),
        };
      });
      const luminance = ({ r, g, b }) => {
        const lin = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      };
      const ratio = (a, b) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      const parseRgb = (value) => {
        const [r, g, b] = value.match(/[\d.]+/g).map(Number);
        return { r, g, b };
      };
      for (const item of samples.items) {
        const text = parseRgb(item.color);
        const entry = { route, label: item.label, ratio: ratio(text, item.bg), color: item.color };
        if (item.color === samples.bodyColor) found.body.push(entry);
        if (item.color === samples.mutedColor) found.muted.push(entry);
      }
      for (const item of samples.placeholders) {
        found.placeholder.push({ route, label: item.label, ratio: ratio(parseRgb(item.color), item.bg), color: item.color });
      }
      await context.close();
    }
    for (const kind of ['body', 'muted', 'placeholder']) {
      const list = found[kind];
      const worst = list.reduce((min, entry) => (min === null || entry.ratio < min.ratio ? entry : min), null);
      check(
        `${kind} text contrast at least 4.5:1 in ${colorScheme} scheme (${list.length} elements; worst ${worst ? `${worst.ratio.toFixed(2)}:1 "${worst.label}" on ${worst.route}` : 'none found'})`,
        list.length > 0 && worst.ratio >= 4.5,
      );
    }
  }

  // 5. Reduced motion: the loading spinner does not animate under prefers-reduced-motion: reduce.
  {
    const { page, context } = await open('#/', { reducedMotion: 'no-preference' });
    const spinnerStyle = async () =>
      page.evaluate(async (url) => {
        const { loadingState } = await import(url);
        document.getElementById('main').append(loadingState('Checking motion'));
        const spinner = document.querySelector('.state-loading .spinner');
        const cs = getComputedStyle(spinner);
        const result = { animationName: cs.animationName, animationDuration: cs.animationDuration };
        document.querySelector('.state-loading').remove();
        return result;
      }, new URL('src/lib/dom.js', root).href);
    const normal = await spinnerStyle();
    check(`spinner animates without reduced-motion preference (animation-name ${normal.animationName}, duration ${normal.animationDuration})`, normal.animationName === 'spin');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await spinnerStyle();
    check(`spinner does not animate under prefers-reduced-motion: reduce (animation-name ${reduced.animationName}, duration ${reduced.animationDuration})`, reduced.animationName === 'none');
    await context.close();
  }
} finally {
  await browser.close();
}

finish();
