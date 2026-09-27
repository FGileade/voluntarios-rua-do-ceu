const localStorageKey = 'versiculo-do-dia-fechado';
const hojeStr = new Date().toDateString();
const AUTO_CLOSE_MS = 20000;

// Verificar se já fechou hoje
if (localStorage.getItem(localStorageKey) !== hojeStr) {
  fetch("./versiculos.json")
    .then(r => r.json())
    .then(versiculos => {
      const hoje = new Date();
      const indice = (
        hoje.getFullYear() * 1000 +
        hoje.getMonth() * 100 +
        hoje.getDate()
      ) % versiculos.length;

      const versiculo = versiculos[indice];

      const banner = document.getElementById("versiculo-banner");
      const textoEl = document.getElementById("versiculo-texto");
      const refEl = document.getElementById("versiculo-ref");
      const botaoFechar = document.getElementById("fechar-versiculo");
      const progressFill = document.getElementById("versiculo-progress-fill");

      if (banner && textoEl && refEl && botaoFechar) {
        textoEl.textContent = `“${versiculo.texto}”`;
        refEl.textContent = versiculo.ref;
        banner.style.display = "block";

        // Sincroniza a duração da barra de progresso com o fechamento automático
        if (progressFill) {
          progressFill.style.animationDuration = `${AUTO_CLOSE_MS / 1000}s`;
        }

        const fecharBanner = () => {
          banner.style.display = "none";
          localStorage.setItem(localStorageKey, hojeStr);
        };

        // Fechamento manual
        botaoFechar.addEventListener("click", fecharBanner);

        // Fechamento automático (a barra de progresso visualiza essa contagem)
        setTimeout(() => {
          if (banner.style.display !== "none") {
            fecharBanner();
          }
        }, AUTO_CLOSE_MS);
      }
    })
    .catch(err => console.error("Erro ao carregar versículo:", err));
}
