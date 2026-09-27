# Voluntários Rua do Céu

Formulário público e painel simples do gestor para cadastrar voluntários, consultar as respostas e baixar uma planilha Excel.

## Dados coletados

- Nome, função, telefone/WhatsApp e e-mail
- Frente de trabalho
- Necessidades selecionadas para a aplicação
- Outra ideia ou sugestão

Os envios são gravados na coleção `voluntariosAtivos` do projeto Firebase `rua-do-ceu-app`. Nenhuma outra coleção é usada ou alterada por este formulário.

## Acesso do gestor

Para acessar: clique em **Área do gestor** no rodapé e entre com `filipegileade@gmail.com`. O Firebase Authentication precisa ter o provedor **E-mail/senha** habilitado e uma conta confirmada para esse endereço. Se a conta não existir, crie-a no Firebase Authentication; ao tentar entrar com e-mail ainda não confirmado, o painel envia a mensagem de confirmação.

O trecho `firestore-voluntarios.fragment.rules` restringe a leitura das respostas à conta confirmada do gestor e valida os envios públicos. Ele é apenas um fragmento: mescle-o às regras ativas do Firestore. **Não substitua as regras completas do projeto Rua do Céu**, pois o banco é compartilhado. Verifique também se nenhuma regra ampla existente libera leitura pública da coleção.

Se o painel informar que não pode consultar os dados, ainda falta habilitar o provedor ou mesclar as regras de leitura do gestor.

## Excel e serviços

O arquivo `.xlsx` é gerado no navegador. Os dados não são enviados ao serviço da biblioteca de planilhas. O site não usa Cloud Functions, servidor próprio nem automação paga; depende do Firebase e da hospedagem já usados pelo projeto.

## Publicação

O repositório pode continuar ligado ao deploy automático existente na Vercel. Basta publicar as alterações na branch acompanhada pelo projeto.
