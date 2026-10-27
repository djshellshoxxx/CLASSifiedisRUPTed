// Small DOM helpers. Text is always set as text nodes, never as HTML.

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      node.className = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

// Shared state blocks so every view handles loading, error and empty the same way.
export function loadingState(label = 'Loading…') {
  return h('div', { class: 'state state-loading', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), label);
}

export function errorState(message, { onRetry } = {}) {
  return h(
    'div',
    { class: 'state state-error', role: 'alert' },
    h('p', {}, message),
    onRetry ? h('button', { type: 'button', class: 'btn', onClick: onRetry }, 'Try again') : null,
  );
}

export function emptyState(message, action = null) {
  return h('div', { class: 'state state-empty' }, h('p', {}, message), action);
}

export function announce(message) {
  const region = document.getElementById('status');
  if (!region) return;
  region.textContent = '';
  // Re-setting after a tick makes repeated identical messages announce again.
  setTimeout(() => {
    region.textContent = message;
  }, 20);
}
