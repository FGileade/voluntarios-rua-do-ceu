# Voluntários Rua do Céu - Registro de Histórico

**Data:** 27 de setembro de 2026 | **Horário:** 03:56  
**Repositório:** [https://github.com/FGileade/voluntarios-rua-do-ceu](https://github.com/FGileade/voluntarios-rua-do-ceu)  
**Produção Vercel:** [https://voluntariosruadoceu.vercel.app](https://voluntariosruadoceu.vercel.app)  
**Firebase:** Projeto `rua-do-ceu-app` | Coleção `voluntariosAtivos`  
**Gestor Autorizado:** `filipegileade@gmail.com`

---

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura e Stack Técnica](#arquitetura-e-stack-técnica)
3. [Segurança e Regras do Firestore](#segurança-e-regras-do-firestore)
4. [Identidade Visual e Skill feedback-modal-marca](#identidade-visual-e-skill-feedback-modal-marca)
5. [Funcionalidades de Gestão (Edição e Exclusão)](#funcionalidades-de-gestão-edição-e-exclusão)
6. [Estrutura do Repositório](#estrutura-do-repositório)
7. [Como Rodar Localmente](#como-rodar-localmente)
8. [Histórico de Implantações e Commits](#histórico-de-implantações-e-commits)

---

## Visão Geral
Aplicação web progressiva para cadastro público de voluntários ativos da **Rua do Céu**, mapeamento das necessidades operacionais do projeto e disponibilização de um painel de administração privativo para o gestor oficial, permitindo consulta de respostas, exportação direta para `.xlsx` e manutenção completa (edição e exclusão).

---

## Arquitetura e Stack Técnica
- **Frontend:** HTML5 semântico, CSS3 (com gradientes oficiais, responsividade mobile-first e suporte a `prefers-reduced-motion`) e Vanilla JavaScript ES Modules.
- **Backend as a Service:** Firebase Authentication v12.1.0 (Email/Password) + Cloud Firestore v12.1.0.
- **Exportação:** [SheetJS](https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs) processado localmente no navegador (Zero custos de servidor / serverless).
- **Hospedagem & CI/CD:** Vercel integrada ao branch `main` do GitHub com HTTPS e revalidação instantânea.

---

## Segurança e Regras do Firestore
O banco de dados é compartilhado com o ecossistema principal do app Rua do Céu. Para garantir integridade total:
1. Foi realizado backup versionado de `firestore.rules` antes de qualquer intervenção.
2. Nenhuma regra de coleções existentes (`tenants`, `users`, `events`, `dracmas`, etc.) foi alterada.
3. As regras da coleção `voluntariosAtivos` garantem:
   - **`create`**: Envio anônimo condicionado à validação de esquema estrito (campos permitidos, tamanho mínimo, opções restritas e `serverTimestamp`).
   - **`get` e `list`**: Acesso permitido apenas para `filipegileade@gmail.com` com e-mail confirmado.
   - **`update` e `delete`**: Permitido exclusivamente para `filipegileade@gmail.com` com e-mail confirmado.
4. Regras implantadas com sucesso via Firebase CLI (`firebase deploy --only firestore:rules --project rua-do-ceu-app`).

---

## Identidade Visual e Skill feedback-modal-marca
A aplicação implementa os componentes da skill oficial `feedback-modal-marca`:
- **`BrandLoadingOverlay`**: Tela cheia com fundo translúcido e desfoque (*blur*), anel de rotação nas cores oficiais e a logomarca da Rua do Céu em animação pulsante. Utilizado durante o envio de cadastro e a autenticação do gestor.
- **`GlobalFeedbackModal`**: Modal oficial para confirmações e notificações de sucesso/erro/atenção, com armadilha de foco (*focus trap*), fechamento por Esc e suporte total a leitores de tela.

---

## Funcionalidades de Gestão (Edição e Exclusão)
- **Editar:** Botão individual em cada card do painel que abre modal com todos os campos pré-carregados (inclusive necessidades marcadas e máscara de telefone), atualizando o Firestore via `updateDoc`.
- **Excluir:** Botão com confirmação oficial de dois passos (*requestConfirmation*) que executa a exclusão definitiva via `deleteDoc` e recarrega a listagem em tempo real.

---

## Estrutura do Repositório
```text
voluntariosruadoceu/
├── .agents/skills/                   # Skills Antigravity
├── historico/                        # Histórico de sessões
├── app.js                            # Lógica da aplicação e integração Firebase
├── feedback.js                       # Sistema oficial de modal e overlay com a marca
├── firestore-voluntarios.fragment.rules # Fragmento com as regras de segurança
├── index.html                        # Estrutura HTML da aplicação
├── logo.png                          # Logomarca oficial
├── README.md                         # Documentação do projeto
├── styles.css                        # Folha de estilos unificada
├── vercel.json                       # Configuração de rotas da Vercel
├── versiculo-do-dia.js               # Widget do Versículo do Dia
└── versiculos.json                   # Banco de 60 versículos bíblicos
```

---

## Como Rodar Localmente
Basta servir os arquivos estáticos com qualquer servidor web HTTP:
```bash
# Com Python
python -m http.server 8080

# Ou com Node.js / npx serve
npx serve .
```

---

## Histórico de Implantações e Commits
- `feat: adicionar animacao de login e confirmacao de envio com a skill feedback-modal-marca`
- `feat: permitir editar e excluir cadastros pelo gestor autorizado`
- Regras do Firestore implantadas e validadas diretamente no projeto `rua-do-ceu-app`.
