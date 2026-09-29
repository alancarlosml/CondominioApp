# 📱 Configurar Informações do App no Google Play Console

## 🎯 O que você precisa configurar

Após fazer upload do AAB, você precisa preencher as informações do app para que apareçam corretamente na Play Store:

1. ✅ **Nome do app** (atualmente está mostrando o package name)
2. ✅ **Ícone do app** (512x512px)
3. ✅ **Descrição curta e completa**
4. ✅ **Screenshots** (obrigatório)
5. ✅ **Imagem de destaque** (1024x500px)
6. ✅ **Classificação de conteúdo**
7. ✅ **Política de privacidade**

---

## 📋 Passo a Passo Completo

### 1️⃣ Acessar a Seção de Conteúdo do App

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Selecione seu app (`CondominioApp` ou o nome que você criou)
3. No menu lateral esquerdo, vá em **"Crescer"** ou **"Grow"**
4. Clique em **"Conteúdo do app"** ou **"Store listing"**

### 2️⃣ Configurar Nome do App

1. Na seção **"Nome do app"**:
   - Digite: `CondominioApp` (ou o nome que preferir)
   - Máximo: 50 caracteres
   - Este é o nome que aparece na Play Store

### 3️⃣ Configurar Ícone do App

1. Na seção **"Ícone do app"**:
   - **Tamanho**: 512x512 pixels
   - **Formato**: PNG (sem transparência)
   - **Fundo**: Deve ser opaco (não transparente)
   
2. **Se você já tem um ícone**:
   - Verifique se está em `assets/images/logo-one-startup.png`
   - Se necessário, redimensione para 512x512px
   - Faça upload no Google Play Console

3. **Se precisar criar/redimensionar**:
   - Use ferramentas online como: https://www.iloveimg.com/resize-image
   - Ou use o Photoshop/GIMP
   - Ou me avise que posso ajudar a verificar o ícone atual

### 4️⃣ Configurar Descrições

#### Descrição Curta (até 80 caracteres)
- Aparece nos resultados de busca
- Exemplo: `App para moradores de condomínios. Acesse portões, encomendas e mais.`

#### Descrição Completa (até 4000 caracteres)
- Descrição detalhada do app
- Use formatação HTML básica (negrito, listas, etc.)
- Exemplo:
```
<strong>CondominioApp</strong> - O aplicativo completo para moradores de condomínios.

<strong>Funcionalidades:</strong>
• Acesso remoto aos portões
• Controle de encomendas
• Gestão de veículos
• Notificações importantes
• Visualização de câmeras CFTV
• Perfil do morador

<strong>Como usar:</strong>
1. Faça login com suas credenciais
2. Selecione seu condomínio e unidade
3. Acesse todas as funcionalidades disponíveis

<strong>Segurança:</strong>
Seus dados estão protegidos com criptografia de ponta a ponta.
```

### 5️⃣ Configurar Screenshots (OBRIGATÓRIO)

Você precisa de pelo menos **2 screenshots** para telefones:

1. **Tamanho**: 
   - Mínimo: 320px de altura
   - Máximo: 3840px de altura
   - Largura: proporção 16:9 ou 9:16
   - Recomendado: 1080x1920px (portrait) ou 1920x1080px (landscape)

2. **Como obter screenshots**:
   - Execute o app no emulador ou dispositivo
   - Tire screenshots das telas principais
   - Ou use ferramentas como: https://www.appstorescreenshot.com/

3. **Telas recomendadas para screenshots**:
   - Tela de login
   - Dashboard principal
   - Tela de portões
   - Tela de encomendas
   - Tela de perfil

4. **Upload**:
   - Arraste e solte ou clique em "Upload"
   - Adicione pelo menos 2 screenshots

### 6️⃣ Configurar Imagem de Destaque

1. **Tamanho**: 1024x500 pixels
2. **Formato**: PNG ou JPG
3. **Uso**: Aparece no topo da página do app na Play Store
4. **Dica**: Pode ser um banner com o logo e nome do app

### 7️⃣ Configurar Classificação de Conteúdo

1. Clique em **"Classificação de conteúdo"** ou **"Content rating"**
2. Responda o questionário sobre o conteúdo do app
3. Perguntas típicas:
   - O app tem conteúdo de usuários gerados? (Provavelmente não)
   - O app permite compras? (Depende do seu caso)
   - O app tem conteúdo de mídia? (Se tiver câmeras, sim)
   - Etc.
4. Após responder, você receberá uma classificação (ex: "Para todos")

### 8️⃣ Configurar Política de Privacidade

1. **URL da Política de Privacidade** (obrigatório):
   - Você precisa ter uma página web com sua política de privacidade
   - Pode ser um arquivo HTML hospedado no seu site
   - Ou usar serviços como: https://www.privacypolicygenerator.info/

2. **Conteúdo mínimo da política**:
   - Quais dados são coletados
   - Como os dados são usados
   - Como os dados são armazenados
   - Direitos do usuário
   - Contato para dúvidas

3. **Se você não tem site**:
   - Pode criar uma página simples no GitHub Pages
   - Ou usar serviços gratuitos de hospedagem
   - Ou me avise que posso ajudar a criar um template

### 9️⃣ Preencher Informações Adicionais

#### Categoria
- Selecione: **Produtividade** ou **Estilo de vida** (depende do foco)

#### Contato
- Email de suporte
- Telefone (opcional)
- Site (opcional)

#### Preço e distribuição
- **Gratuito** ou **Pago**
- **Países**: Selecione onde o app estará disponível (recomendo começar com Brasil)

---

## ✅ Checklist Completo

Antes de publicar, verifique:

- [ ] Nome do app configurado
- [ ] Ícone do app (512x512px) enviado
- [ ] Descrição curta preenchida (até 80 caracteres)
- [ ] Descrição completa preenchida (até 4000 caracteres)
- [ ] Pelo menos 2 screenshots enviados
- [ ] Imagem de destaque (1024x500px) enviada
- [ ] Classificação de conteúdo concluída
- [ ] URL da política de privacidade preenchida
- [ ] Categoria selecionada
- [ ] Email de suporte configurado
- [ ] Preço e distribuição configurados

---

## 🚀 Após Preencher Tudo

1. **Salvar rascunho**: Clique em "Salvar" para guardar as alterações
2. **Revisar**: Vá em "Revisar versão" para ver se está tudo ok
3. **Publicar**: Quando tudo estiver completo, você pode publicar

---

## 📍 Localização no Google Play Console

```
Google Play Console
  └─ Seu App
      ├─ Crescer (Grow)
      │   └─ Conteúdo do app (Store listing) ← AQUI
      │       ├─ Nome do app
      │       ├─ Ícone
      │       ├─ Descrições
      │       ├─ Screenshots
      │       └─ Imagem de destaque
      │
      ├─ Política e programas
      │   └─ Classificação de conteúdo ← AQUI
      │
      └─ Configuração do app
          ├─ Detalhes do app
          │   └─ Contato ← AQUI
          └─ Preço e distribuição ← AQUI
```

---

## 💡 Dicas Importantes

1. **Nome do app**: Escolha um nome que seja fácil de encontrar e lembrar
2. **Ícone**: Deve ser reconhecível mesmo em tamanho pequeno
3. **Screenshots**: Mostre as funcionalidades principais do app
4. **Descrição**: Use palavras-chave relevantes para melhorar a busca
5. **Política de privacidade**: É obrigatória, não pule esta etapa

---

## 🆘 Precisa de Ajuda?

Se precisar de ajuda com:
- Criar/redimensionar imagens
- Escrever descrições
- Criar política de privacidade
- Configurar outras seções

Me avise que posso ajudar! 🚀

---

**Última atualização**: Configuração de informações do app na Play Store
