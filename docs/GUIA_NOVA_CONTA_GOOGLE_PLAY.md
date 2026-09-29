# 📱 Guia: Configurar App para Nova Conta do Google Play

## ✅ O que foi feito

1. **Package Name Atualizado**: O package name foi alterado de `com.onestartuptech.condominioapp` para `com.onestartuptech.condominioapp.new`
   - Isso resolve o conflito com o package name já existente no Google Play
   - O novo package name é único e pode ser usado na sua nova conta

## 📋 Passo a Passo Completo

### 1️⃣ Verificar Configurações Atuais

O arquivo `app.json` já foi atualizado com o novo package name:
- **Android Package**: `com.onestartuptech.condominioapp.new`
- **iOS Bundle ID**: `com.onestartuptech.condominioapp.new` (caso publique no iOS também)

### 2️⃣ Verificar Credenciais do EAS

Certifique-se de que está logado na conta correta do Expo/EAS:

```bash
# Verificar conta atual
eas whoami

# Se necessário, fazer login novamente
eas login
```

### 3️⃣ Limpar Builds Antigos (Opcional mas Recomendado)

Para garantir que não há cache de builds antigos:

```bash
# Limpar cache do Expo
npx expo start --clear

# Ou limpar completamente
rm -rf node_modules
npm install
```

### 4️⃣ Gerar Novo Build de Produção

Agora você precisa gerar um novo AAB com o novo package name:

```bash
# Build para produção (Android)
eas build --platform android --profile production
```

**Importante**: 
- Este comando vai gerar um novo AAB com o package name `com.onestartuptech.condominioapp.new`
- O build pode levar alguns minutos
- Você receberá um link para download do AAB quando estiver pronto

### 5️⃣ Criar Novo App no Google Play Console

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Faça login com sua **nova conta**
3. Clique em **"Criar app"** ou **"Create app"**
4. Preencha as informações:
   - **Nome do app**: CondominioApp (ou o nome que preferir)
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: App
   - **Gratuito ou pago**: Selecione conforme sua necessidade
5. Aceite os termos e clique em **"Criar app"**

### 6️⃣ Fazer Upload do Novo AAB

1. No Google Play Console, vá para **"Produção"** ou **"Produção"** no menu lateral
2. Clique em **"Criar nova versão"** ou **"Create new release"**
3. Na seção **"Pacotes de apps"**, clique em **"Enviar"** ou **"Upload"**
4. Selecione o **novo arquivo AAB** que você baixou do EAS (o que tem o package name `.new`)
5. Aguarde o upload e a verificação

### 7️⃣ Preencher Informações Obrigatórias

Antes de publicar, você precisa preencher:

1. **Conteúdo do app**:
   - Descrição curta
   - Descrição completa
   - Screenshots (mínimo 2 para telefones)
   - Ícone (512x512px)
   - Imagem de destaque (1024x500px)

2. **Classificação de conteúdo**: Responda o questionário

3. **Preço e distribuição**: Configure países e preço

4. **Política de privacidade**: URL da sua política de privacidade

### 8️⃣ Revisar e Publicar

1. Revise todas as informações
2. Clique em **"Revisar versão"**
3. Se tudo estiver correto, clique em **"Iniciar lançamento para produção"**

## ⚠️ Observações Importantes

### Sobre o Package Name

- O package name **não pode ser alterado** depois que o app é publicado no Google Play
- Se você quiser usar um package name diferente de `com.onestartuptech.condominioapp.new`, edite o `app.json` **antes** de fazer o build
- Formato recomendado: `com.suaempresa.nomeapp` (exemplo: `com.onestartuptech.condominioapp.v2`)

### Sobre o EAS Project ID

- O `projectId` no `app.json` (`19c12117-3f58-4d4f-ba8c-ae2524c37481`) está vinculado à organização `onestartuptech`
- Se você mudou de organização no Expo, pode precisar atualizar o `projectId`
- Para verificar: `eas project:info`

### Sobre Builds Anteriores

- O AAB antigo (com package name `com.onestartuptech.condominioapp`) **não funcionará** na nova conta
- Você **deve** gerar um novo build com o novo package name
- Não tente fazer upload do AAB antigo

## 🔧 Comandos Úteis

```bash
# Ver informações do projeto EAS
eas project:info

# Ver builds anteriores
eas build:list

# Ver detalhes de um build específico
eas build:view [BUILD_ID]

# Fazer build local (mais rápido para testes)
eas build --platform android --profile production --local
```

## ❓ Problemas Comuns

### Erro: "Package name already exists"
- **Solução**: Use um package name diferente. Edite o `app.json` e gere um novo build.

### Erro: "Manifest conflicts"
- **Solução**: Isso geralmente acontece quando o package name já está em uso. O novo package name resolve isso.

### Erro: "Invalid project ID"
- **Solução**: Verifique se está logado na conta correta do Expo: `eas whoami`

### ⚠️ Erro: "Android App Bundle foi assinado com uma chave incorreta"
- **Problema**: O Google Play espera uma chave de assinatura específica, mas o EAS está usando outra.
- **Solução**: Veja o guia completo em `docs/RESOLVER_ERRO_ASSINATURA.md`
- **Resumo rápido**:
  1. Verifique credenciais: `eas credentials`
  2. Se você tem a keystore correta, faça upload: `eas credentials` → Upload keystore
  3. Se o app é novo e não publicado, pode deletar e criar novamente
  4. Gere novo build após configurar a chave correta

## 📞 Próximos Passos

1. ✅ Package name atualizado no `app.json`
2. ⏳ Gerar novo build com `eas build --platform android --profile production`
3. ⏳ Criar novo app no Google Play Console
4. ⏳ Fazer upload do novo AAB
5. ⏳ Preencher informações obrigatórias
6. ⏳ Publicar o app

---

**Última atualização**: Configuração para nova conta do Google Play Console
**Package Name Atual**: `com.onestartuptech.condominioapp.new`
