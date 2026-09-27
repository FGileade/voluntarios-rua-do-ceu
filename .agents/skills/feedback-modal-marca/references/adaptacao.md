# Adaptação por aplicação

Leia quando o perfil do projeto fugir do padrão React + Vite + Tailwind + lucide-react.

## Derivar as cores da marca
- Fontes, em ordem de confiança: variáveis CSS de marca (`--theme-primary`, `--brand-*`), `theme_color`/`background_color` do manifest, `@theme` do Tailwind, cores dominantes da logo.
- `PRIMARY` (botão de confirmação): cor primária da marca **se** tiver contraste ≥ 4.5:1 com texto branco; senão escureça até atingir. `PRIMARY_HOVER` é ~10% mais clara; `PRIMARY_SHADOW` é a primária em `rgba(..., 0.3)` mais escura.
- `ACCENT` (borda da logo, brilho): cor secundária/de destaque. `ACCENT_SOFT` é uma versão mais clara para o rótulo; `ACCENT_GLOW` é `rgba(accent, 0.08)`; `ACCENT_HOVER_BORDER` é `rgba(accent, 0.7)`.
- Superfície: o template é escuro (`#111827` → `#020617`, backdrop `rgba(2, 6, 23, 0.86)`). Para app claro, gere gradiente claro (ex.: `#ffffff` → `#f1f5f9`), backdrop `rgba(15, 23, 42, 0.55)` e **reveja no CSS** as cores de texto (`#f8fafc`, `#cbd5e1`, `#fff`) e bordas translúcidas, que assumem fundo escuro.
- As cores por tipo (verde/vermelho/âmbar/azul) ficam em `feedbackAppearance` no modal, com classes Tailwind. Sem Tailwind, troque por classes próprias no CSS gerado.
- Se o mesmo vermelho for usado como primária e como cor de erro, a confirmação e o erro ficam indistinguíveis: prefira manter o ícone/rótulo diferenciando os tipos.

## Logo
- Prefira arquivo com "logo" no nome, em `public/` (referência absoluta `/arquivo.png`). Em bundlers que exigem import (CRA, assets em `src/`), use `import logo from '...'` e passe `{logo}` no `src`.
- O template usa moldura circular com `object-fit: cover`. Logo retangular ou com texto: troque para `object-fit: contain`, remova `border-radius: 9999px` e ajuste a largura.
- Sem logo, não invente: pergunte ao usuário ou omita o `<img>` e mantenha só nome + rótulo.

## Sem Tailwind
O CSS gerado (`.global-feedback-*`) é independente. Só o `feedbackAppearance` e os `className="h-5 w-5"` dos ícones usam utilitários: substitua por `width/height` inline e classes próprias (`.global-feedback-tone-success { color: ... }`).

## Sem lucide-react
Troque os imports (`AlertTriangle`, `CheckCircle2`, `CircleX`, `HelpCircle`, `Info`, `Loader2`, `X`) pelos equivalentes da biblioteca detectada, ou por SVGs inline. Mantenha `aria-hidden`.

## JavaScript sem TypeScript
Passe `"typescript": false` no `valores.json` (gera `.jsx`) e remova as anotações de tipo dos arquivos gerados (`interface`, `type`, genéricos, `as`).

## Next.js
Componentes com hooks/portal precisam de `'use client'` na primeira linha. App Router: crie um `Providers.tsx` client que envolva `{children}` e use-o em `app/layout.tsx`. Pages Router: envolva em `_app.tsx`. Importe o CSS no layout/`_app`.

## Vue / Nuxt
Não há hooks: implemente `useFeedback()` como composable com `reactive` para a fila, um componente `GlobalFeedbackModal.vue` com `<Teleport to="body">` montado uma vez em `App.vue`, e reaproveite `feedback.css` sem mudanças. Mantenha a mesma API (`notify`, `requestConfirmation` retornando Promise).

## HTML puro
Exponha `window.Feedback = { notify, requestConfirmation }` em um script único que injeta o markup do modal no `body` e reutiliza `feedback.css`. Mantenha a lógica de fila, foco preso e Esc do `FeedbackContext`.

## Acessibilidade e comportamento a preservar (em qualquer stack)
`role="dialog"`, `aria-modal`, `aria-labelledby/describedby`; foco inicial no botão primário; Tab preso no modal; Esc fecha (exceto processando); foco devolvido ao elemento anterior; scroll do body bloqueado enquanto aberto; fila (um aviso por vez); `prefers-reduced-motion`; em telas ≤ 480 px o modal vira bottom sheet com botões empilhados.

## Idioma
Textos padrão: pt-BR (`Sucesso, Erro, Atenção, Informação, Confirmação, Entendi, Cancelar, Confirmar, Processando..., Fechar notificação, Notificação oficial`), en (`Success, Error, Attention, Information, Confirmation, Got it, Cancel, Confirm, Processing..., Close notification, Official notice`), es (`Éxito, Error, Atención, Información, Confirmación, Entendido, Cancelar, Confirmar, Procesando..., Cerrar notificación, Aviso oficial`). Mensagem de erro genérica em `getErrorMessage` também deve ser traduzida.

