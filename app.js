import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { addDoc, collection, getDocs, getFirestore, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyC0QPpzGD9IzPAe83GUdoLbLCR7YhVXOnQ',
  authDomain: 'rua-do-ceu-app.firebaseapp.com',
  projectId: 'rua-do-ceu-app',
  storageBucket: 'rua-do-ceu-app.firebasestorage.app',
  messagingSenderId: '913845110106',
  appId: '1:913845110106:web:1b554626a109d8abe0df63',
});
const auth = getAuth(app);
const db = getFirestore(app);
const MANAGER_EMAIL = 'filipegileade@gmail.com';
const $ = selector => document.querySelector(selector);
const form = $('#volunteer-form');
const message = $('#form-message');
const submit = $('#submit-button');
let responses = [];

function setMessage(element, text, error = false) {
  element.textContent = text;
  element.className = `form-message ${error ? 'error' : 'success'}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function showArea(area) {
  $('#public-view').classList.toggle('hidden', area !== 'public');
  document.querySelectorAll('.manager-view').forEach(view => view.classList.add('hidden'));
  if (area !== 'public') $(`#${area}`).classList.remove('hidden');
  $('#open-manager').classList.toggle('hidden', area !== 'public');
}

function friendlyAuthError(error) {
  if (error.code === 'auth/operation-not-allowed') return 'Ative o provedor E-mail/senha no Firebase Authentication.';
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') return 'E-mail ou senha incorretos.';
  return 'Não foi possível entrar. Confira a conta e tente novamente.';
}

function dateText(value) {
  if (!value?.toDate) return 'Data indisponível';
  return value.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function loadResponses() {
  const container = $('#response-list');
  $('#response-count').textContent = 'Carregando respostas…';
  $('#download-responses').disabled = true;
  container.innerHTML = '<p class="helper">Carregando respostas…</p>';
  try {
    const result = await getDocs(query(collection(db, 'voluntariosAtivos'), orderBy('criadoEm', 'desc')));
    responses = result.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
    $('#response-count').textContent = `${responses.length} ${responses.length === 1 ? 'resposta' : 'respostas'}`;
    $('#download-responses').disabled = responses.length === 0;
    if (!responses.length) {
      container.innerHTML = '<p class="helper">Ainda não há respostas enviadas.</p>';
      return;
    }
    container.innerHTML = responses.map(person => {
      const needs = Array.isArray(person.recursosEssenciais) ? person.recursosEssenciais.join(', ') : '';
      return `<article class="response-card">
        <div class="response-card-head"><h3>${escapeHtml(person.nomeCompleto || 'Sem nome')}</h3><time>${escapeHtml(dateText(person.criadoEm))}</time></div>
        <p><strong>Função:</strong> ${escapeHtml(person.funcao || '—')}</p>
        <p><strong>Frente:</strong> ${escapeHtml(person.frenteTrabalho || '—')}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(person.telefoneWhatsApp || '—')}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(person.email || '—')}</p>
        <p><strong>Necessidades:</strong> ${escapeHtml(needs || 'Nenhuma selecionada')}</p>
        <p><strong>Outra sugestão:</strong> ${escapeHtml(person.outraSolicitacao || '—')}</p>
      </article>`;
    }).join('');
  } catch (error) {
    console.error('Falha ao carregar respostas.', error);
    responses = [];
    $('#response-count').textContent = 'Respostas indisponíveis';
    container.innerHTML = '<p class="form-message error">A conta entrou, mas as regras do Firestore ainda não permitem consultar os cadastros. Peça a configuração do acesso do gestor.</p>';
    setMessage($('#responses-message'), 'Não foi possível ler os dados.', true);
  }
}

$('#phone').addEventListener('input', event => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  event.target.value = digits.length > 10
    ? digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    : digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, first, last) => `(${ddd}) ${first}${last ? `-${last}` : ''}`);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  submit.disabled = true;
  message.textContent = '';

  const recursosEssenciais = [...document.querySelectorAll('input[name="essential"]:checked')].map(item => item.value);
  const outraSolicitacao = $('#other-request').value.trim();
  if (!recursosEssenciais.length && !outraSolicitacao) {
    setMessage(message, 'Selecione ao menos uma necessidade ou escreva uma sugestão.', true);
    submit.disabled = false;
    return;
  }

  try {
    await addDoc(collection(db, 'voluntariosAtivos'), {
      nomeCompleto: $('#fullName').value.trim(),
      funcao: $('#role').value,
      telefoneWhatsApp: $('#phone').value.trim(),
      email: $('#email').value.trim().toLowerCase(),
      frenteTrabalho: $('#work-front').value.trim(),
      recursosEssenciais,
      outraSolicitacao,
      ativo: true,
      status: 'pendente',
      origem: 'voluntarios-rua-do-ceu',
      criadoEm: serverTimestamp(),
    });
    form.reset();
    setMessage(message, 'Obrigado! Seu cadastro e sua opinião foram enviados.');
  } catch (error) {
    console.error('Falha ao salvar cadastro de voluntário.', error);
    setMessage(message, 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.', true);
  } finally {
    submit.disabled = false;
  }
});

$('#open-manager').addEventListener('click', () => showArea('manager-login-view'));
document.querySelectorAll('.back-to-form').forEach(button => button.addEventListener('click', () => showArea('public')));
$('#refresh-responses').addEventListener('click', loadResponses);

$('#manager-login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#manager-login-button');
  button.disabled = true;
  setMessage($('#manager-login-message'), '');
  try {
    const credential = await signInWithEmailAndPassword(auth, $('#manager-email').value.trim(), $('#manager-password').value);
    if (credential.user.email?.toLowerCase() !== MANAGER_EMAIL) {
      await signOut(auth);
      setMessage($('#manager-login-message'), 'Esta conta não está autorizada como Gestor.', true);
      return;
    }
    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setMessage($('#manager-login-message'), 'Enviamos uma confirmação para o e-mail do Gestor. Confirme-a e entre novamente.', true);
      return;
    }
    showArea('manager-dashboard-view');
    await loadResponses();
  } catch (error) {
    setMessage($('#manager-login-message'), friendlyAuthError(error), true);
  } finally {
    button.disabled = false;
  }
});

$('#manager-sign-out').addEventListener('click', async () => {
  await signOut(auth);
  showArea('public');
});

$('#download-responses').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    const rows = [
      ['Nome completo', 'Função', 'Telefone / WhatsApp', 'E-mail', 'Frente de trabalho', 'Necessidades do aplicativo', 'Outra solicitação', 'Status', 'Data do cadastro'],
      ...responses.map(person => [
        person.nomeCompleto || '',
        person.funcao || '',
        person.telefoneWhatsApp || '',
        person.email || '',
        person.frenteTrabalho || '',
        Array.isArray(person.recursosEssenciais) ? person.recursosEssenciais.join('; ') : '',
        person.outraSolicitacao || '',
        person.status || '',
        person.criadoEm?.toDate ? person.criadoEm.toDate().toLocaleString('pt-BR') : '',
      ]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 32 }, { wch: 24 }, { wch: 48 }, { wch: 48 }, { wch: 16 }, { wch: 22 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Respostas');
    XLSX.writeFileXLSX(workbook, 'respostas-voluntarios-rua-do-ceu.xlsx');
    setMessage($('#responses-message'), 'Arquivo Excel baixado.');
  } catch (error) {
    console.error('Falha ao gerar arquivo Excel.', error);
    setMessage($('#responses-message'), 'Não foi possível gerar o Excel. Verifique a conexão e tente novamente.', true);
  } finally {
    button.disabled = responses.length === 0;
  }
});

onAuthStateChanged(auth, async user => {
  if (!user || user.email?.toLowerCase() !== MANAGER_EMAIL || !user.emailVerified) return;
  showArea('manager-dashboard-view');
  await loadResponses();
});
