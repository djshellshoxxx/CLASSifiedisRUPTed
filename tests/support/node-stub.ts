// Minimal DOM node fake for integration tests that stub `document` and mount PWA views against it.
// Superset of the per-test stubs: only the members a test reads or fires are meaningful; the rest are inert.

export class NodeStub {
  textContent = ''; id = ''; value = ''; hidden = false; type = ''; checked = false; disabled = false;
  children: unknown[] = []; parent: NodeStub | undefined;
  readonly listeners = new Map<string, (event: Event) => void>();
  readonly tag: string;
  constructor(tag = '') { this.tag = tag; }
  setAttribute() {}
  append(...children: unknown[]) { for (const child of children) { this.children.push(child); if (child instanceof NodeStub) child.parent = this; } }
  prepend(...children: unknown[]) { this.children.unshift(...children); }
  replaceChildren(...children: unknown[]) { this.children = []; this.append(...children); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
  addEventListener(type: string, listener: (event: Event) => void) { this.listeners.set(type, listener); }
  fire(type: string) { this.listeners.get(type)?.(new Event(type, { cancelable: true })); }
  click() { this.fire('click'); }
}
