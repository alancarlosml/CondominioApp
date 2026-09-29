# 📱 Guia de Build para Android - Passo a Passo

## ✅ Pré-requisitos

1. **Conta Expo** (gratuita): https://expo.dev/signup
2. **EAS CLI instalado** (vamos instalar agora)
3. **Projeto configurado** (já está ✅)

---

## 🚀 Passo a Passo

### 1️⃣ Instalar EAS CLI

Abra o terminal na pasta do projeto e execute:

```bash
npm install -g eas-cli
```

Ou se preferir usar npx (sem instalar globalmente):

```bash
npx eas-cli --version
```

### 2️⃣ Fazer Login no Expo

```bash
eas login
```

Digite seu email e senha da conta Expo. Se não tiver conta, crie em: https://expo.dev/signup

### 3️⃣ Configurar o Projeto (Primeira vez)

Se for a primeira vez fazendo build, configure o projeto:

```bash
eas build:configure
```

Isso vai perguntar algumas coisas. Responda:
- **Android:** Sim
- **iOS:** Não (ou Sim se quiser também)
- Deixe os valores padrão para o resto

### 4️⃣ Escolher Tipo de Build

Você tem 3 opções no `eas.json`:

#### Opção A: Build de Produção (AAB - Para Google Play Store)
```bash
eas build --platform android --profile production
```

**Resultado:** Arquivo `.aab` (Android App Bundle) - formato recomendado pela Google Play Store

#### Opção B: Build Preview (APK - Para testes/instalação direta)
```bash
eas build --platform android --profile preview
```

**Resultado:** Arquivo `.apk` - pode instalar diretamente no dispositivo

#### Opção C: Build de Desenvolvimento (APK com Dev Client)
```bash
eas build --platform android --profile development
```

**Resultado:** APK com cliente de desenvolvimento (para desenvolvimento)

---

## 📦 Recomendação para Produção

Para subir na **Google Play Store**, use:

```bash
eas build --platform android --profile production
```

Isso vai gerar um arquivo `.aab` que é o formato exigido pela Play Store.

---

## ⏱️ Tempo de Build

- **Primeira vez:** 15-30 minutos (precisa configurar ambiente)
- **Próximas vezes:** 10-20 minutos

O build roda na nuvem do Expo, então você pode fechar o terminal.

---

## 📥 Como Baixar o Arquivo

### Opção 1: Via Terminal (após build completar)
O EAS vai mostrar um link para download.

### Opção 2: Via Dashboard Web
1. Acesse: https://expo.dev/accounts/[seu-usuario]/projects/condominioapp/builds
2. Clique no build mais recente
3. Baixe o arquivo `.aab` ou `.apk`

---

## 🔐 Credenciais (Primeira vez)

Na primeira vez, o EAS vai perguntar sobre credenciais:

**Para Android:**
- **Keystore:** O EAS pode gerar automaticamente (recomendado)
- Responda "Yes" quando perguntar se quer que o EAS gerencie

Isso é seguro e facilita muito o processo.

---

## 📋 Checklist Antes do Build

Antes de compilar, verifique:

- [x] Modo mock desativado (`USE_MOCK_DATA = false`)
- [x] Logs de produção configurados
- [x] Variáveis de ambiente configuradas em `app.json`
- [ ] Versão atualizada em `app.json` (se necessário)
- [ ] Testado localmente com `expo start`

---

## 🔄 Atualizar Versão do App

Se quiser atualizar a versão antes do build, edite `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",  // Incremente aqui
    "android": {
      "versionCode": 2  // Incremente aqui também
    }
  }
}
```

O `autoIncrement: true` no `eas.json` já faz isso automaticamente, mas você pode fazer manualmente também.

---

## 🎯 Comandos Rápidos

### Build de Produção (AAB)
```bash
eas build --platform android --profile production
```

### Build Preview (APK)
```bash
eas build --platform android --profile preview
```

### Ver builds anteriores
```bash
eas build:list
```

### Ver status do build atual
```bash
eas build:view
```

---

## ⚠️ Problemas Comuns

### Erro: "Not logged in"
```bash
eas login
```

### Erro: "Project not configured"
```bash
eas build:configure
```

### Erro: "No credentials found"
Deixe o EAS gerar automaticamente quando perguntar.

### Build falhando
Verifique os logs:
```bash
eas build:view
```

---

## 📱 Após o Build

### Para Google Play Store:
1. Baixe o arquivo `.aab`
2. Acesse Google Play Console: https://play.google.com/console
3. Crie uma nova versão do app
4. Faça upload do arquivo `.aab`
5. Preencha as informações necessárias
6. Envie para revisão

### Para Instalação Direta (APK):
1. Baixe o arquivo `.apk`
2. Transfira para o dispositivo Android
3. Ative "Fontes desconhecidas" nas configurações
4. Abra o arquivo `.apk` e instale

---

## 🔍 Verificar Build Atual

Para ver o status do build em andamento:

```bash
eas build:list
```

Isso mostra todos os builds e seus status.

---

## 📚 Documentação Oficial

- EAS Build: https://docs.expo.dev/build/introduction/
- Android Build: https://docs.expo.dev/build/android/
- Google Play: https://support.google.com/googleplay/android-developer

---

**Última atualização:** 31/01/2026
