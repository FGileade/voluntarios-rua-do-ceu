const storageKey = 'versiculo-do-dia-fechado';
const banner = document.getElementById('versiculo-banner');
const closeButton = document.getElementById('fechar-versiculo');
const textElement = document.getElementById('versiculo-texto');
const referenceElement = document.getElementById('versiculo-ref');
const progress = document.getElementById('versiculo-progress-fill');
const duration = 20000;

function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function wasDismissedToday(today) {
  try {
    return localStorage.getItem(storageKey) === today;
  } catch {
    return false;
  }
}

function rememberDismissal(today) {
  try {
    localStorage.setItem(storageKey, today);
  } catch {
    // O banner ainda pode ser fechado quando o armazenamento estiver indisponível.
  }
}

async function showDailyVerse() {
  const today = localDateKey();
  if (!banner || !closeButton || !textElement || !referenceElement || wasDismissedToday(today)) return;

  try {
    const response = await fetch('./versiculos.json');
    if (!response.ok) throw new Error('A lista de versículos não pôde ser carregada.');
    const verses = await response.json();
    if (!Array.isArray(verses) || verses.length === 0) return;

    const dateNumber = Number(today.replaceAll('-', ''));
    const verse = verses[dateNumber % verses.length];
    if (!verse?.texto || !verse?.ref) return;

    textElement.textContent = `“${verse.texto}”`;
    referenceElement.textContent = verse.ref;
    banner.hidden = false;

    if (progress) {
      progress.style.animation = 'none';
      progress.offsetHeight;
      progress.style.animation = '';
      progress.style.animationDuration = `${duration}ms`;
    }

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      banner.hidden = true;
      rememberDismissal(today);
      closeButton.removeEventListener('click', close);
      window.clearTimeout(timer);
    };
    const timer = window.setTimeout(close, duration);
    closeButton.addEventListener('click', close);
  } catch (error) {
    console.error('Erro ao carregar o versículo do dia.', error);
  }
}

showDailyVerse();
