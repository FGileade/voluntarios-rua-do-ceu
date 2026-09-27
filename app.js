import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { addDoc, collection, getFirestore, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyC0QPpzGD9IzPAe83GUdoLbLCR7YhVXOnQ',
  authDomain: 'rua-do-ceu-app.firebaseapp.com',
  projectId: 'rua-do-ceu-app',
  storageBucket: 'rua-do-ceu-app.firebasestorage.app',
  messagingSenderId: '913845110106',
  appId: '1:913845110106:web:1b554626a109d8abe0df63',
});
const db = getFirestore(app);
const form = document.querySelector('#volunteer-form');
const message = document.querySelector('#form-message');
const submit = document.querySelector('#submit-button');

document.querySelector('#phone').addEventListener('input', event => {
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
  const outraSolicitacao = document.querySelector('#other-request').value.trim();
  if (!recursosEssenciais.length && !outraSolicitacao) {
    message.textContent = 'Selecione ao menos uma necessidade ou escreva uma sugestão.';
    message.className = 'form-message error';
    submit.disabled = false;
    return;
  }

  try {
    await addDoc(collection(db, 'voluntariosAtivos'), {
      nomeCompleto: document.querySelector('#fullName').value.trim(),
      funcao: document.querySelector('#role').value,
      telefoneWhatsApp: document.querySelector('#phone').value.trim(),
      email: document.querySelector('#email').value.trim().toLowerCase(),
      frenteTrabalho: document.querySelector('#work-front').value.trim(),
      recursosEssenciais,
      outraSolicitacao,
      ativo: true,
      status: 'pendente',
      origem: 'voluntarios-rua-do-ceu',
      criadoEm: serverTimestamp(),
    });
    form.reset();
    message.textContent = 'Obrigado! Seu cadastro e sua opinião foram enviados.';
    message.className = 'form-message success';
  } catch (error) {
    console.error('Falha ao salvar cadastro de voluntário.', error);
    message.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
    message.className = 'form-message error';
  } finally {
    submit.disabled = false;
  }
});
