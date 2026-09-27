import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC0QPpzGD9IzPAe83GUdoLbLCR7YhVXOnQ',
  authDomain: 'rua-do-ceu-app.firebaseapp.com',
  projectId: 'rua-do-ceu-app',
  storageBucket: 'rua-do-ceu-app.firebasestorage.app',
  messagingSenderId: '913845110106',
  appId: '1:913845110106:web:1b554626a109d8abe0df63',
  measurementId: 'G-JXFS1LVYX4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const form = document.querySelector('#volunteer-form');
const button = document.querySelector('#submit-button');
const message = document.querySelector('#form-message');
const phone = document.querySelector('#phone');

phone.addEventListener('input', () => {
  const digits = phone.value.replace(/\D/g, '').slice(0, 11);
  phone.value = digits.length > 10 ? digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3') : digits.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => b ? `(${a}) ${b}${c ? `-${c}` : ''}` : a ? `(${a}` : '');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = ''; message.className = 'form-message';
  if (!form.reportValidity()) return;
  button.disabled = true; button.textContent = 'Cadastrando...';
  const data = Object.fromEntries(new FormData(form));
  try {
    await addDoc(collection(db, 'voluntariosAtivos'), {
      nomeCompleto: data.fullName.trim(),
      funcao: data.role,
      telefoneWhatsApp: data.phone,
      email: data.email.trim().toLowerCase(),
      ativo: true,
      criadoEm: serverTimestamp(),
      origem: 'voluntarios-rua-do-ceu'
    });
    form.reset();
    message.textContent = 'Voluntário cadastrado com sucesso.'; message.classList.add('success');
  } catch (error) {
    console.error(error);
    message.textContent = 'Não foi possível salvar o cadastro. Verifique as permissões do Firebase.'; message.classList.add('error');
  } finally { button.disabled = false; button.innerHTML = 'Cadastrar voluntário <span aria-hidden="true">→</span>'; }
});
