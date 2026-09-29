# 📦 Diferença: Production vs Preview para Play Store

## 🎯 Resposta Rápida

**Para Play Store:** Use **`production`** ✅  
**Para testes/instalação direta:** Use **`preview`** ⚠️

---

## 📊 Comparação Detalhada

### 🔴 **PRODUCTION** (`--profile production`)

#### Formato do Arquivo:
- **Tipo:** `.aab` (Android App Bundle)
- **Tamanho:** Menor (otimizado pela Google)
- **Formato oficial da Play Store**

#### Características:
- ✅ **Formato exigido pela Play Store** (desde agosto de 2021)
- ✅ **Otimização automática** - Google gera APKs específicos para cada dispositivo
- ✅ **Menor tamanho de download** para usuários finais
- ✅ **Suporte a Dynamic Delivery** - recursos sob demanda
- ✅ **Auto-incremento de versão** (`autoIncrement: true`)
- ✅ **Pronto para produção**

#### Uso:
```bash
eas build --platform android --profile production
```

#### Quando usar:
- ✅ **SEMPRE** para subir na Google Play Store
- ✅ Para distribuição oficial
- ✅ Para releases finais

---

### 🟡 **PREVIEW** (`--profile preview`)

#### Formato do Arquivo:
- **Tipo:** `.apk` (Android Package)
- **Tamanho:** Maior (contém todas as configurações)
- **Formato para instalação direta**

#### Características:
- ⚠️ **NÃO aceito pela Play Store** (apenas para testes internos)
- ⚠️ **Arquivo único** - mesmo APK para todos os dispositivos
- ⚠️ **Tamanho maior** - não otimizado
- ✅ **Instalação direta** - pode instalar no dispositivo sem Play Store
- ✅ **Útil para testes** antes de publicar
- ✅ **Distribuição interna** (`distribution: "internal"`)

#### Uso:
```bash
eas build --platform android --profile preview
```

#### Quando usar:
- ✅ Para **testes internos** antes de publicar
- ✅ Para **instalação direta** em dispositivos (sem Play Store)
- ✅ Para **distribuição beta** via link direto
- ❌ **NÃO** para Play Store

---

## 📋 Tabela Comparativa

| Característica | Production | Preview |
|---------------|------------|---------|
| **Formato** | `.aab` | `.apk` |
| **Play Store** | ✅ Aceito | ❌ Não aceito |
| **Tamanho** | Menor (otimizado) | Maior |
| **Instalação Direta** | ❌ Não | ✅ Sim |
| **Otimização** | ✅ Automática | ❌ Não |
| **Versão** | Auto-incrementa | Manual |
| **Uso Principal** | Produção/Play Store | Testes/Interno |

---

## 🚀 Fluxo Recomendado

### 1. **Desenvolvimento e Testes Locais**
```bash
npx expo start
```
Testa no Expo Go ou dispositivo

### 2. **Teste com Preview (APK)**
```bash
eas build --platform android --profile preview
```
- Gera APK
- Instala em dispositivos de teste
- Valida funcionalidades
- **NÃO** sobe na Play Store

### 3. **Build de Produção (AAB)**
```bash
eas build --platform android --profile production
```
- Gera AAB
- **Sobe na Play Store**
- Distribuição oficial

---

## ⚠️ Importante: Play Store

### Desde Agosto de 2021:
A Google Play Store **EXIGE** arquivos `.aab` para novos apps e atualizações.

### Se tentar subir APK:
- ❌ **Será rejeitado** pela Play Store
- ❌ Mensagem: "You need to use a different package type. Your APK needs to be an Android App Bundle."

### Exceções:
- Apps muito antigos podem ainda usar APK (mas não recomendado)
- Testes internos podem usar APK (mas não para produção)

---

## 📱 Exemplo Prático

### Cenário 1: Testar antes de publicar
```bash
# 1. Gera APK para testes
eas build --platform android --profile preview

# 2. Baixa e instala em dispositivos de teste
# 3. Valida tudo funcionando

# 4. Gera AAB para Play Store
eas build --platform android --profile production

# 5. Sobe o AAB na Play Store
```

### Cenário 2: Publicar direto
```bash
# Gera AAB direto (se já testou localmente)
eas build --platform android --profile production

# Sobe na Play Store
```

---

## 🔍 Verificando seu `eas.json`

Seu arquivo atual:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"  // ← Gera APK
      }
    },
    "production": {
      "autoIncrement": true  // ← Gera AAB (padrão)
    }
  }
}
```

**Está correto!** ✅
- `preview` → APK (para testes)
- `production` → AAB (para Play Store)

---

## 💡 Dica: Testes na Play Store

Você pode usar **Production** para testes também:

1. **Internal Testing Track** na Play Store
   - Use o mesmo AAB de produção
   - Testa com usuários internos
   - Valida antes de liberar para todos

2. **Closed Testing / Open Testing**
   - Mesmo AAB de produção
   - Testa com beta testers
   - Feedback antes do release público

---

## ✅ Resumo Final

| Para Play Store | Comando |
|----------------|---------|
| ✅ **Produção Oficial** | `eas build --platform android --profile production` |
| ✅ **Testes Internos (Play Store)** | `eas build --platform android --profile production` (mesmo AAB) |
| ⚠️ **Testes Fora da Play Store** | `eas build --platform android --profile preview` |

---

## 🎯 Recomendação

**Para Play Store:** SEMPRE use `production` ✅

Mesmo para testes, use `production` e publique no track de "Internal Testing" da Play Store. Isso garante que você está testando exatamente o que será publicado.

---

**Última atualização:** 31/01/2026
