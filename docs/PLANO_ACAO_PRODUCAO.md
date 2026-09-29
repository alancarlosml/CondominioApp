# 🚀 Plano de Ação para Produção

## ⚠️ STATUS ATUAL: NÃO PRONTO PARA PRODUÇÃO

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│  SEGURANÇA          ████░░░░░░  40%  ❌ CRÍTICO        │
│  ROBUSTEZ           ██████░░░░  60%  ⚠️  MELHORAR      │
│  USABILIDADE        ████████░░  80%  ✅ BOM            │
│  QUALIDADE          ██░░░░░░░░  20%  ❌ CRÍTICO        │
│  COMPLIANCE         █░░░░░░░░░  10%  ❌ CRÍTICO        │
└─────────────────────────────────────────────────────────┘

SCORE GERAL: 42/100 ⚠️
```

---

## 🎯 AÇÕES IMEDIATAS (Esta Semana)

### 1. Desativar Modo Mock ⏱️ 5 minutos
```bash
# Arquivo: src/contexts/CondominioContext.js
# Linha 11: Mudar USE_MOCK_DATA de true para false
```

**Arquivo a editar:**
- `src/contexts/CondominioContext.js` linha 11

**Ação:**
```javascript
// ANTES:
const USE_MOCK_DATA = true;

// DEPOIS:
const USE_MOCK_DATA = false;
```

---

### 2. Implementar Sistema de Logging Seguro ⏱️ 2 horas

**Criar arquivo:** `src/utils/logger.js`
```javascript
const isDev = __DEV__;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    // Erros sempre logam, mas sanitizados
    if (isDev) {
      console.error(...args);
    } else {
      // Em produção, enviar para serviço de monitoramento
      // Sentry.captureException(...args);
    }
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
};
```

**Substituir todos os console.log por logger.log**

---

### 3. Configurar Variáveis de Ambiente ⏱️ 1 hora

**Instalar:**
```bash
npx expo install expo-constants
```

**Criar arquivo:** `.env.production`
```
EXPO_PUBLIC_API_URL=https://face.onestartup.com.br/morador
EXPO_PUBLIC_API_TIMEOUT=10000
```

**Criar arquivo:** `.env.development`
```
EXPO_PUBLIC_API_URL=https://face.onestartup.com.br/morador
EXPO_PUBLIC_API_TIMEOUT=15000
```

**Atualizar:** `src/services/api.js`
```javascript
import Constants from 'expo-constants';

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl || 'https://face.onestartup.com.br/morador',
  timeout: parseInt(Constants.expoConfig?.extra?.apiTimeout || '10000', 10),
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Atualizar:** `app.json`
```json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.EXPO_PUBLIC_API_URL,
      "apiTimeout": process.env.EXPO_PUBLIC_API_TIMEOUT
    }
  }
}
```

---

### 4. Migrar Tokens para SecureStore ⏱️ 2 horas

**Instalar:**
```bash
npx expo install expo-secure-store
```

**Criar arquivo:** `src/utils/secureStorage.js`
```javascript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Storage from './storage';

const SECURE_KEYS = ['token', 'refresh_token'];

export const secureSetItem = async (key, value) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback para web (localStorage)
        await Storage.setItem(key, value);
      }
    } else {
      await Storage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Error setting secure item ${key}:`, error);
    throw error;
  }
};

export const secureGetItem = async (key) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      } else {
        return await Storage.getItem(key);
      }
    } else {
      return await Storage.getItem(key);
    }
  } catch (error) {
    console.error(`Error getting secure item ${key}:`, error);
    return null;
  }
};

export const secureRemoveItem = async (key) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        await Storage.removeItem(key);
      }
    } else {
      await Storage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing secure item ${key}:`, error);
    throw error;
  }
};
```

**Atualizar:** `src/services/api.js` e `src/contexts/AuthContext.js` para usar `secureStorage`

---

### 5. Implementar Validação de CPF ⏱️ 1 hora

**Criar arquivo:** `src/utils/validators.js`
```javascript
/**
 * Valida CPF verificando dígitos verificadores
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} - true se CPF é válido
 */
export const validateCPF = (cpf) => {
  // Remove formatação
  const numbers = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

/**
 * Valida força da senha
 * @param {string} password - Senha a validar
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
```

**Atualizar:** `src/screens/LoginScreen.js` e `src/contexts/AuthContext.js`

---

### 6. Implementar Rate Limiting no Login ⏱️ 1 hora

**Atualizar:** `src/screens/LoginScreen.js`
```javascript
import { useState, useRef } from 'react';

export default function LoginScreen({ navigation }) {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const blockUntilRef = useRef(null);
  
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
  
  const handleLogin = async () => {
    // Verifica se está bloqueado
    if (isBlocked) {
      const remaining = Math.ceil((blockUntilRef.current - Date.now()) / 1000 / 60);
      Alert.alert(
        'Conta temporariamente bloqueada',
        `Muitas tentativas falhadas. Tente novamente em ${remaining} minutos.`
      );
      return;
    }
    
    // ... resto do código de login ...
    
    if (!result.success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        blockUntilRef.current = Date.now() + BLOCK_DURATION;
        Alert.alert(
          'Conta bloqueada',
          'Muitas tentativas falhadas. Sua conta foi bloqueada por 15 minutos.'
        );
      } else {
        Alert.alert(
          'Erro',
          `${result.error}\n\nTentativas restantes: ${MAX_ATTEMPTS - newAttempts}`
        );
      }
      return;
    }
    
    // Reset em caso de sucesso
    setFailedAttempts(0);
    setIsBlocked(false);
  };
}
```

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 - Correções Críticas
- **Dia 1-2:** Desativar mock, implementar logging seguro, variáveis de ambiente
- **Dia 3-4:** Migrar para SecureStore, validar CPF, rate limiting
- **Dia 5:** Testes e validação das correções

### Semana 2 - Segurança e Robustez
- **Dia 1-2:** SSL pinning, tratamento offline
- **Dia 3-4:** Validação de API, tratamento de erros
- **Dia 5:** Testes de segurança

### Semana 3 - Qualidade e Compliance
- **Dia 1-2:** Testes unitários básicos
- **Dia 3:** Política de privacidade e termos
- **Dia 4-5:** Testes E2E críticos

### Semana 4 - Finalização
- **Dia 1-2:** Analytics e monitoramento
- **Dia 3:** Otimizações finais
- **Dia 4-5:** Testes finais e preparação para release

---

## ✅ CHECKLIST RÁPIDO

Antes de fazer build de produção, verificar:

- [ ] `USE_MOCK_DATA = false` em CondominioContext
- [ ] `USE_MOCK_LOGIN = false` em AuthContext
- [ ] Todos os console.log substituídos por logger
- [ ] Variáveis de ambiente configuradas
- [ ] Tokens usando SecureStore
- [ ] Validação de CPF implementada
- [ ] Rate limiting no login
- [ ] Testes básicos passando
- [ ] Política de privacidade adicionada
- [ ] Build de produção testado em dispositivo real

---

## 🚨 NÃO FAÇA BUILD DE PRODUÇÃO SE:

- ❌ Modo mock ainda estiver ativado
- ❌ Console.logs ainda estiverem no código
- ❌ Tokens ainda estiverem em AsyncStorage
- ❌ Não houver validação de CPF
- ❌ Não houver rate limiting
- ❌ Não houver testes básicos

---

**Última atualização:** 31/01/2026
