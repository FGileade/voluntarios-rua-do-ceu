# Voluntários Rua do Céu

Formulário público, responsivo e simples para cadastrar voluntários ativos e coletar opiniões sobre a aplicação da Rua do Céu.

## Dados coletados

- Nome, função, telefone/WhatsApp e e-mail
- Frente de trabalho
- Necessidades selecionadas para a aplicação
- Outra ideia ou sugestão

Os envios são gravados na coleção `voluntariosAtivos` do projeto Firebase `rua-do-ceu-app`. Nenhuma outra coleção é usada ou alterada por este formulário.

## Serviços

O site é estático e usa o Firebase Web SDK já configurado no projeto. Não usa Firebase Authentication, Cloud Functions, backend próprio, API paga nem ferramenta adicional. A disponibilidade depende das regras atuais do Firestore e das cotas/plano já configurados no projeto Firebase.

## Publicação

O repositório pode continuar ligado ao deploy automático existente na Vercel. Basta publicar as alterações na branch acompanhada pelo projeto.
