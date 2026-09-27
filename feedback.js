/**
 * feedback.js - Sistema Global de Feedback com a Marca Rua do Céu
 * Segue o padrão e contrato oficial da skill feedback-modal-marca:
 * - notify({ type: 'success'|'error'|'attention'|'info', title, message, buttonLabel })
 * - requestConfirmation({ title, message, confirmLabel, cancelLabel, action })
 * - showLoading(message) / hideLoading()
 * - withLoading(action, message)
 */

let loadingCounter = 0;
let loadingLayer = null;
let modalLayer = null;
const queue = [];
let currentItem = null;
let isClosing = false;
let isProcessing = false;
let previousFocus = null;

const APPEARANCE = {
  success: {
    label: 'Sucesso',
    badgeClass: 'feedback-badge-success',
    iconBorder: '#10b981',
    iconSvg: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
  },
  error: {
    label: 'Erro',
    badgeClass: 'feedback-badge-error',
    iconBorder: '#ef4444',
    iconSvg: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  },
  attention: {
    label: 'Atenção',
    badgeClass: 'feedback-badge-attention',
    iconBorder: '#f59e0b',
    iconSvg: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  info: {
    label: 'Informação',
    badgeClass: 'feedback-badge-info',
    iconBorder: '#009EE0',
    iconSvg: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#009EE0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  },
  confirmation: {
    label: 'Confirmação',
    badgeClass: 'feedback-badge-attention',
    iconBorder: '#009EE0',
    iconSvg: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#009EE0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  }
};

function ensureLoadingLayer() {
  if (loadingLayer) return loadingLayer;
  loadingLayer = document.createElement('div');
  loadingLayer.className = 'brand-loading-layer';
  loadingLayer.setAttribute('role', 'status');
  loadingLayer.setAttribute('aria-live', 'polite');
  loadingLayer.setAttribute('aria-busy', 'false');
  loadingLayer.setAttribute('aria-hidden', 'true');
  loadingLayer.innerHTML = `
    <div class="brand-loading-backdrop"></div>
    <div class="brand-loading-content">
      <div class="brand-loading-ring">
        <img src="./logo.png" alt="Rua do Céu" class="brand-loading-logo" />
      </div>
      <p class="brand-loading-message" id="brand-loading-message">Carregando...</p>
    </div>
  `;
  document.body.appendChild(loadingLayer);
  return loadingLayer;
}

export function showLoading(msg = 'Carregando...') {
  loadingCounter += 1;
  const layer = ensureLoadingLayer();
  const textEl = document.getElementById('brand-loading-message');
  if (textEl) textEl.textContent = msg;
  layer.classList.add('brand-loading-layer--visible');
  layer.setAttribute('aria-busy', 'true');
  layer.setAttribute('aria-hidden', 'false');
}

export function hideLoading() {
  loadingCounter = Math.max(0, loadingCounter - 1);
  if (loadingCounter === 0 && loadingLayer) {
    loadingLayer.classList.remove('brand-loading-layer--visible');
    loadingLayer.setAttribute('aria-busy', 'false');
    loadingLayer.setAttribute('aria-hidden', 'true');
  }
}

export async function withLoading(action, msg = 'Carregando...') {
  showLoading(msg);
  try {
    return await action();
  } finally {
    hideLoading();
  }
}

function ensureModalLayer() {
  if (modalLayer) return modalLayer;
  modalLayer = document.createElement('div');
  modalLayer.className = 'global-feedback-layer hidden';
  modalLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(modalLayer);

  document.addEventListener('keydown', event => {
    if (!currentItem || isClosing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!isProcessing) dismissModal(false);
      return;
    }
    if (event.key === 'Tab' && modalLayer) {
      const focusables = modalLayer.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  return modalLayer;
}

function processQueue() {
  if (currentItem || !queue.length) return;
  currentItem = queue.shift();
  renderCurrentModal();
}

function renderCurrentModal() {
  const layer = ensureModalLayer();
  const item = currentItem;
  if (!item) return;

  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.style.overflow = 'hidden';

  const type = item.type || 'info';
  const appearance = APPEARANCE[type] || APPEARANCE.info;
  const isConfirmation = type === 'confirmation';
  const primaryText = isProcessing
    ? 'Processando...'
    : isConfirmation
      ? (item.confirmLabel || 'Confirmar')
      : (item.buttonLabel || 'Entendi');

  layer.className = 'global-feedback-layer';
  layer.setAttribute('aria-hidden', 'false');
  layer.innerHTML = `
    <div class="global-feedback-backdrop"></div>
    <div
      class="global-feedback-dialog global-feedback-dialog--entering"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-feedback-title"
      aria-describedby="global-feedback-message"
      tabindex="-1"
    >
      <header class="global-feedback-header">
        <div class="global-feedback-brand">
          <img src="./logo.png" alt="Rua do Céu" class="global-feedback-logo" />
          <div>
            <span class="global-feedback-brand-name">Rua do Céu</span>
            <span class="global-feedback-brand-label">Notificação Oficial</span>
          </div>
        </div>
        <button
          type="button"
          id="global-feedback-close-btn"
          aria-label="Fechar notificação"
          class="global-feedback-close"
          ${isProcessing ? 'disabled' : ''}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="global-feedback-content">
        <div class="global-feedback-icon" style="color: ${appearance.iconBorder};" aria-hidden="true">
          ${appearance.iconSvg}
        </div>
        <span class="global-feedback-type ${appearance.badgeClass}">${appearance.label}</span>
        <h2 id="global-feedback-title" class="global-feedback-title">${item.title}</h2>
        <p id="global-feedback-message" class="global-feedback-message">${item.message}</p>
      </div>

      <footer class="global-feedback-actions ${isConfirmation ? 'global-feedback-actions--confirmation' : ''}">
        ${isConfirmation ? `
          <button
            type="button"
            id="global-feedback-cancel-btn"
            class="global-feedback-button global-feedback-button--secondary"
            ${isProcessing ? 'disabled' : ''}
          >
            ${item.cancelLabel || 'Cancelar'}
          </button>
        ` : ''}
        <button
          type="button"
          id="global-feedback-primary-btn"
          class="global-feedback-button global-feedback-button--primary"
          ${isProcessing ? 'disabled' : ''}
        >
          ${isProcessing ? `
            <svg class="brand-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ` : ''}
          <span>${primaryText}</span>
        </button>
      </footer>
    </div>
  `;

  const primaryBtn = layer.querySelector('#global-feedback-primary-btn');
  const closeBtn = layer.querySelector('#global-feedback-close-btn');
  const cancelBtn = layer.querySelector('#global-feedback-cancel-btn');

  if (closeBtn) closeBtn.onclick = () => { if (!isProcessing) dismissModal(false); };
  if (cancelBtn) cancelBtn.onclick = () => { if (!isProcessing) dismissModal(false); };

  if (primaryBtn) {
    primaryBtn.onclick = async () => {
      if (isProcessing) return;
      if (item.action) {
        isProcessing = true;
        renderCurrentModal();
        try {
          await item.action();
          dismissModal(true);
        } catch (error) {
          isProcessing = false;
          dismissModal(false);
          notify({
            type: 'error',
            title: 'Não foi possível concluir',
            message: error?.message || 'Ocorreu um erro ao processar a ação.'
          });
        }
      } else {
        dismissModal(true);
      }
    };
    window.requestAnimationFrame(() => primaryBtn.focus());
  }
}

function dismissModal(confirmed = false) {
  if (!currentItem || isClosing) return;
  isClosing = true;
  const dialog = modalLayer?.querySelector('.global-feedback-dialog');
  if (dialog) {
    dialog.classList.remove('global-feedback-dialog--entering');
    dialog.classList.add('global-feedback-dialog--closing');
  }

  setTimeout(() => {
    if (currentItem?.resolve) {
      currentItem.resolve(confirmed);
    }
    currentItem = null;
    isClosing = false;
    isProcessing = false;

    if (!queue.length) {
      if (modalLayer) {
        modalLayer.className = 'global-feedback-layer hidden';
        modalLayer.setAttribute('aria-hidden', 'true');
        modalLayer.innerHTML = '';
      }
      document.body.style.overflow = '';
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    } else {
      processQueue();
    }
  }, 180);
}

export function notify({ type = 'info', title, message, buttonLabel = 'Entendi' }) {
  return new Promise(resolve => {
    queue.push({ type, title, message, buttonLabel, resolve });
    processQueue();
  });
}

export function requestConfirmation({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', action }) {
  return new Promise(resolve => {
    queue.push({ type: 'confirmation', title, message, confirmLabel, cancelLabel, action, resolve });
    processQueue();
  });
}
