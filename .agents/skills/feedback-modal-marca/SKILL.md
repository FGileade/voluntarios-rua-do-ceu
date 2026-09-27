---
name: feedback-modal-marca
description: Implanta em qualquer aplicação web (React/Vite/Next, com adaptações para Vue e HTML puro) um sistema global de avisos, confirmações e loading com a identidade visual da marca — modal personalizado com logo substituindo alert()/confirm()/prompt()/toasts genéricos, e um overlay de loading com a logo animada para ações assíncronas como login, cadastro ou qualquer envio de formulário. A skill primeiro LÊ o projeto (framework, estilo, ícones, logo, cores, idioma, avisos existentes) e adapta os componentes à identidade visual encontrada. Use sempre que o usuário pedir alertas personalizados, modal de confirmação com logo, padronizar mensagens de sucesso/erro/atenção, trocar alert/confirm nativos, "aviso com a marca", "notificação oficial", "loading personalizado com a logo", "animação de carregamento no login", tela de carregamento com o ícone do app, ou replicar o padrão de feedback do Força Fight em outro app, mesmo sem citar o nome da skill.
---

# Feedback modal com a marca

Padrão extraído do app Força Fight: um `FeedbackProvider` (fila + API por hook) que expõe três frentes — `GlobalFeedbackModal` (portal com logo, ícone por tipo, foco preso, Esc, animação) para avisos e confirmações, e `BrandLoadingOverlay` (portal em tela cheia com a logo animada) para ações assíncronas imediatas como login/cadastro. Toda tela chama `notify()`, `requestConfirmation()` ou `showLoading()`/`withLoading()` em vez de `alert()`/`confirm()`/spinners genéricos, então o usuário final vê sempre a mesma identidade visual da marca, em qualquer estado — sucesso, erro, confirmação ou carregamento.

O valor da skill está em **não copiar cegamente**: cada aplicação tem sua logo, paleta, idioma, biblioteca de ícones e estrutura de pastas. Reconheça isso primeiro, adapte depois.

## Fluxo

### 1. Reconhecer a aplicação
Rode a partir da raiz do projeto de destino (somente leitura):

```bash
node <caminho-da-skill>/scripts/detect-project.mjs
```

O JSON devolve: framework/bundler/TypeScript, Tailwind, biblioteca de ícones, pontos de entrada e CSS global, logo candidatas, nome do app, cores (manifest e variáveis CSS), fontes, idioma, maior `z-index`, chamadas nativas de `alert/confirm/prompt` e sistemas de aviso já existentes. Leia também `AGENTS.md`/`CLAUDE.md` e `skills/` do projeto se existirem: regras locais (idioma, padrão de commit, histórico) prevalecem sobre esta skill.

Se o script não puder rodar (sem Node), colete os mesmos dados manualmente com Glob/Grep/Read.

### 2. Decidir o que adaptar (e o que perguntar)
Monte os valores da marca a partir do perfil. Só pergunte ao usuário o que for genuinamente ambíguo:

| Valor | De onde vem | Pergunte quando |
|---|---|---|
| `BRAND_NAME` | `brand.shortName` ou `appName` | nome longo demais para o cabeçalho (>25 caracteres) |
| `BRAND_LABEL` | texto fixo por idioma (`pt-BR`: "Notificação oficial"; `en`: "Official notice") | nunca; use o padrão |
| `LOGO_SRC` | `logoCandidates` (prefira nome contendo "logo") | vários candidatos plausíveis ou nenhum |
| `ACCENT` / `ACCENT_SOFT` | cor secundária/de destaque da marca | não há paleta clara |
| `PRIMARY` / `PRIMARY_HOVER` | cor primária da marca, se contrastar com branco; senão vermelho `#dc2626` | contraste insuficiente |
| `SURFACE_FROM/TO`, `BACKDROP` | escuro neutro por padrão; se o app é claro, gere superfície clara e ajuste textos no CSS | app claro (exige revisar cores de texto) |
| `Z_INDEX` | maior z-index do projeto + 100 | sem dados: 1000 |
| `MONO_FONT` | `--font-mono` do projeto, ou `ui-monospace, monospace` | nunca |

Detalhes de derivação de cores e casos especiais: `references/adaptacao.md`. Não invente logo nem cor: se não houver dados confiáveis, pergunte.

### 3. Gerar os arquivos
Crie um `valores.json` (formato no cabeçalho de `scripts/render-templates.mjs`) e rode:

```bash
node <caminho-da-skill>/scripts/render-templates.mjs valores.json
```

Isso cria `GlobalFeedbackModal`, `BrandLoadingOverlay`, `FeedbackContext` e `feedback.css` a partir de `assets/`, sem sobrescrever arquivos existentes. Depois:

- **Importe o CSS** no ponto de entrada ou cole no CSS global do projeto.
- **Envolva a aplicação** com `<FeedbackProvider>` no ponto de entrada. Todo componente que use `useFeedback()` precisa estar dentro dele; se o próprio componente raiz usa o hook, o provider deve ficar acima dele (ex.: em `main.tsx`), e não dentro.
- **Adapte a stack** se diferir do padrão React + lucide: sem lucide, troque os ícones por SVGs inline ou pela biblioteca detectada; Vue/HTML puro seguem `references/adaptacao.md`.
- **Traduza os textos** do modal (`Sucesso`, `Erro`, `Atenção`, `Informação`, `Confirmação`, `Entendi`, `Cancelar`, `Processando...`) para o idioma detectado.
- Se já existe um sistema de avisos (`existingFeedback.provider` ou libs como sweetalert/toastify), **não crie um segundo em paralelo**: proponha migrar o existente para esta API e confirme com o usuário.

### 4. Migrar as chamadas nativas
Use a lista `filesWithNativeCalls` do perfil. Padrões de troca:

```tsx
const { notify, requestConfirmation } = useFeedback();

// alert('Salvo!')
notify({ type: 'success', title: 'Salvo', message: 'Os dados foram salvos.' });

// if (!confirm('Excluir?')) return;
const ok = await requestConfirmation({ title: 'Excluir item', message: 'Esta ação não pode ser desfeita.', confirmLabel: 'Excluir' });
if (!ok) return;

// confirmação com ação assíncrona (mostra "Processando..." e vira modal de erro se lançar)
await requestConfirmation({ title: '...', message: '...', action: async () => { await apagar(id); } });

// loading com a logo em ação imediata (sem nada a confirmar antes) — ex.: clicar em "Entrar"
const { withLoading } = useFeedback();

const handleLogin = async () => {
  try {
    await withLoading(() => signIn(email, senha), 'Entrando...');
  } catch (error) {
    notify({ type: 'error', title: 'Não foi possível entrar', message: getErrorMessage(error) });
  }
};
```

Escolha o `type` pelo significado (validação = `attention`, falha = `error`, conclusão = `success`), escreva título curto e mensagem que diga o que aconteceu e o que fazer. `prompt()` não tem equivalente direto: sinalize ao usuário e proponha um modal com campo de texto em vez de trocar às cegas. Para spinners/loadings genéricos já existentes no projeto (botão desabilitado com `Loader2`, `isLoading && <Spinner />`, libs como react-spinners), troque por `showLoading()`/`hideLoading()`/`withLoading()` nos fluxos que bloqueiam a tela inteira (login, cadastro, checkout); loading *inline* dentro de um botão ou campo específico pode continuar como está — o overlay é para ações que travam a interação com toda a aplicação. Migre em blocos pequenos e rode o type-check/build do projeto ao final de cada bloco.

### 5. Verificar
- Type-check e build do projeto passam.
- Nenhum `alert(`/`confirm(` nativo restante nos arquivos migrados (rode o detector de novo).
- Abra o app e dispare um sucesso, um erro e uma confirmação: logo carrega, contraste legível, Esc fecha, Tab não escapa do modal, layout ok em 375 px.
- Dispare um `showLoading()`/`withLoading()` (ex.: no botão de login): overlay cobre a tela inteira, logo anima (pulso + anel girando), some sozinho ao terminar a ação, e não trava o app se a ação lançar erro (o `finally` do `withLoading` sempre chama `hideLoading`).
- Respeite as regras do projeto para registro (histórico, commit) se houver.

## Contrato da API (não mude entre aplicações)
- `notify({ type: 'success'|'error'|'attention'|'info', title, message, buttonLabel? })`
- `requestConfirmation({ title, message, confirmLabel?, cancelLabel?, action? }): Promise<boolean>`
- `showLoading(message?)` / `hideLoading()` — controle manual do overlay de loading; chamadas aninhadas só escondem o overlay quando a última `hideLoading()` correspondente roda.
- `withLoading(action, message?): Promise<T>` — açúcar sintático para `showLoading` + `action()` + `hideLoading()` num `try/finally`; use para qualquer ação assíncrona que deva travar a tela inteira (login, cadastro, checkout).

Manter o mesmo contrato permite reaproveitar código e a própria skill entre projetos.

