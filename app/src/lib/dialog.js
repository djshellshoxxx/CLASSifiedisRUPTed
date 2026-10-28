import { h } from './dom.js';

// Native <dialog> confirmation. Resolves true on confirm, false on cancel or Escape.
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    const dialog = h(
      'dialog',
      { class: 'dialog', 'aria-labelledby': 'dialog-title', 'aria-describedby': 'dialog-message' },
      h('h2', { id: 'dialog-title' }, title),
      h('p', { id: 'dialog-message' }, message),
      h(
        'div',
        { class: 'dialog-actions' },
        h('button', { type: 'button', class: 'btn', value: 'cancel', onClick: () => dialog.close('cancel') }, cancelLabel),
        h('button', { type: 'button', class: 'btn btn-danger', value: 'confirm', onClick: () => dialog.close('confirm') }, confirmLabel),
      ),
    );
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      const confirmed = dialog.returnValue === 'confirm';
      dialog.remove();
      resolve(confirmed);
    });
    dialog.showModal();
    dialog.querySelector('button[value="cancel"]').focus();
  });
}
