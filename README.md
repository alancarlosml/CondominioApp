# 🚀 Guia Rápido - App Condomínio

**Versão Expo SDK:** 54.0.21  
**Status:** ✅ Funcionando corretamente após atualização do SDK

> **Nota:** O projeto foi atualizado do SDK 51 para SDK 54 para resolver problemas de compatibilidade com web e módulos nativos.

## Comandos para Iniciar o Projeto

### 1️⃣ Criar o projeto (se ainda não criou)
```bash
npx create-expo-app@latest CondominioApp
cd CondominioApp
```

### 2️⃣ Instalar todas as dependências de uma vez
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs axios

npx expo install react-native-safe-area-context react-native-screens
```

### 3️⃣ Configurar a estrutura de pastas
```bash
# Windows (PowerShell)
mkdir src
mkdir src\screens
mkdir src\services
mkdir src\styles

# Mac/Linux
mkdir -p src/screens src/services src/styles
```

### 4️⃣ Criar os arquivos
Copie os códigos dos artifacts para os seguintes arquivos:

**Configuração:**
- `src/styles/theme.js`
- `src/services/api.js`

**Telas:**
- `src/screens/LoginScreen.js`
- `src/screens/DashboardScreen.js`
- `src/screens/PortoesScreen.js`
- `src/screens/EncomendasScreen.js`
- `src/screens/ProfileScreen.js`
- `src/screens/VeiculosScreen.js`
- `src/screens/NotificacoesScreen.js`
- `src/screens/CFTVScreen.js`

**Raiz:**
- `App.js`

### 5️⃣ Configurar a URL da API
Edite `src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: 'https://face.onestartup.com.br/morador', // Sua URL aqui
  timeout: 10000,
});
```

### 6️⃣ Rodar o projeto

**Opção A: Usar Expo Go no celular (RECOMENDADO)**
```bash
npm run start
```
- O terminal deve mostrar `exp://192.168.x.x:8081` (IP da sua rede Wi‑Fi)
- **Não use** `npx expo start` — pode aparecer `127.0.0.1` e dar erro no celular
- Celular e PC precisam estar na **mesma rede Wi‑Fi**
- Escaneie o QR code com o app Expo Go (Android) ou Câmera (iOS)

**Opção B: Emulador Android/iOS**
```bash
npm run android  # Requer Android SDK configurado
npm run ios      # Requer Xcode no Mac
```

**Nota:** Para usar emuladores, você precisa instalar e configurar o Android Studio (Android) ou Xcode (iOS).

---

## 📱 Testando no Celular

### Android
1. Baixe "Expo Go" na Play Store
2. Abra o app
3. Escaneie o QR code

### iOS
1. Baixe "Expo Go" na App Store
2. Abra o app
3. Escaneie o QR code

---

## 🔧 Problemas Comuns

### ❌ Erro: "Failed to download remote update" no Expo Go

Isso acontece quando o celular não consegue acessar o PC (URL `127.0.0.1` ou rede diferente).

1. Pare o servidor (Ctrl+C)
2. Inicie com:
   ```bash
   npm run start:clear
   ```
3. Confirme no terminal: deve aparecer `exp://192.168.x.x:8081` — **não** `127.0.0.1`
4. Celular e PC na **mesma Wi‑Fi**
5. Use o app **Expo Go** (não o APK instalado da loja)
6. `--tunnel` só se LAN não funcionar (ngrok pode falhar em redes corporativas)

### ❌ Erro: "Cannot find module"
```bash
npm install
npm run start:clear
```

### ❌ Erro: "TypeError: Invalid URL"
```bash
npm config delete proxy
npm config delete https-proxy
npm config list
```

### ❌ Tela branca no app
1. Verifique se todos os arquivos foram criados
2. Verifique se os imports estão corretos
3. Limpe o cache: `npx expo start -c`

### ❌ Erro: "registerWebModule is not a function" no web
Este erro ocorre quando módulos Expo tentam se registrar no ambiente web.

**Soluções aplicadas:**
1. Polyfill em `web-polyfill.js` e `expo-modules-core-polyfill.js`
2. Configuração no `metro.config.js` e `babel.config.js`
3. Plugin Babel para substituir imports

**Se o erro persistir, tente:**

**Opção 1: Limpar tudo e reinstalar**
```bash
rm -rf node_modules .expo
npm install
npx expo start --web --clear
```

**Opção 2: Remover módulos problemáticos temporariamente**
Alguns módulos como `expo-splash-screen` podem causar esse erro no web. Se não precisar deles no web, você pode removê-los condicionalmente.

**Opção 3: Usar apenas mobile**
Se o erro for muito problemático, você pode desenvolver/testar apenas em Android/iOS e não usar a versão web:
```bash
npx expo start  # Use Expo Go no celular (mais fácil)
# ou
npx expo start --android  # Requer Android SDK
npx expo start --ios      # Requer Xcode (Mac)
```

---

## 🔧 Configuração do Android SDK (Opcional)

**Atenção:** Você só precisa disso se quiser usar o emulador Android. Para testar no celular com Expo Go, não é necessário!

### Para usar emulador Android:

1. **Instalar Android Studio**
   - Baixe em: https://developer.android.com/studio
   - Instale e abra o Android Studio
   - Complete o setup wizard

2. **Configurar variáveis de ambiente (Windows)**
   ```powershell
   # Adicionar ao PATH do sistema:
   # ANDROID_HOME = C:\Users\SeuUsuario\AppData\Local\Android\Sdk
   # PATH = %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
   
   # Ou execute no PowerShell (admin):
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
   ```

3. **Reiniciar terminal e testar**
   ```bash
   adb version  # Deve mostrar a versão do ADB
   npx expo start --android
   ```

**Dica:** Para desenvolvimento, usar Expo Go no celular real é muito mais rápido e fácil!

### ❌ Ícones não aparecem
```bash
npx expo install @expo/vector-icons
```

---

## 📋 Checklist de Implementação

- [ ] Criar projeto Expo
- [ ] Instalar dependências
- [ ] Criar estrutura de pastas
- [ ] Copiar arquivos de código
- [ ] Configurar URL da API
- [ ] Testar no celular/emulador
- [ ] Ajustar tema/cores (opcional)
- [ ] Conectar com backend
- [ ] Testar todas as funcionalidades

---

## 🎨 Personalizando Cores

Edite `src/styles/theme.js`:

```javascript
colors: {
  primary: '#007AFF',    // Azul - Mude para cor do seu condomínio
  secondary: '#2C3E50',  // Cinza escuro
  success: '#28A745',    // Verde
  error: '#DC3545',      // Vermelho
  warning: '#FFC107',    // Amarelo
}
```

---

## 🔐 Configurando Login

No seu backend PHP, crie um endpoint:

```php
// POST /login
{
  "cpf": "026.866.853-10",
  "senha": "sua_senha"
}

// Resposta esperada:
{
  "token": "jwt_token_aqui",
  "user": {
    "id": 1,
    "nome": "Marcus Costa",
    "email": "email@example.com"
  }
}
```

---

## 📦 Build para Produção

### Android (APK)
```bash
eas build --platform android
```

### iOS (IPA)
```bash
eas build --platform ios
```

**Nota:** Requer conta Expo EAS

---

## 🆘 Suporte

### Documentação Oficial
- Expo: https://docs.expo.dev
- React Navigation: https://reactnavigation.org
- React Native: https://reactnative.dev

### Debug
```bash
# Iniciar na rede local (recomendado)
npm run start

# Limpar cache e reiniciar
npm run start:clear

# Túnel (só se LAN não funcionar)
npm run start:tunnel
```

---
