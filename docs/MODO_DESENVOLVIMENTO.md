# 🔧 Modo de Desenvolvimento - Login Mock

## Como Usar o Login Temporário para Testes

O app está configurado com um **modo de desenvolvimento** que permite fazer login sem precisar dos endpoints do backend.

### ✅ Como Testar Agora (Modo Mock Ativado)

1. **No Login**, digite qualquer CPF e senha (ex: `12345678900` / `123456`)
2. O app vai fazer login automaticamente e você terá acesso a todas as telas internas
3. Os dados são mockados baseados na estrutura do banco de dados

### 🔄 Como Mudar para Modo Real (Quando Tiver os Endpoints)

Quando você receber os endpoints do backend, siga estes passos:

#### 1. Desativar Modo Mock no AuthContext

Abra o arquivo: `src/contexts/AuthContext.js`

**Linha 9:** Mude de:
```javascript
const USE_MOCK_LOGIN = true;
```

Para:
```javascript
const USE_MOCK_LOGIN = false;
```

#### 2. Verificar Código Real no AuthContext

O código real já está implementado! O endpoint de login está configurado:
- **Endpoint:** `https://face.onestartup.com.br/api/login.php`
- **Método:** POST com FormData
- **Parâmetros:** `cpf` e `senha`
- **Resposta esperada:** `{ status: "success", usuario: {...} }`

Quando você desativar o modo mock (`USE_MOCK_LOGIN = false`), o app automaticamente usará o endpoint real.

#### 3. Desativar Modo Mock no CondominioContext

Abra o arquivo: `src/contexts/CondominioContext.js`

**Linha 11:** Mude de:
```javascript
const USE_MOCK_DATA = true;
```

Para:
```javascript
const USE_MOCK_DATA = false;
```

#### 4. Descomentar Código Real no CondominioContext

No mesmo arquivo `src/contexts/CondominioContext.js`, procure a seção:
```javascript
// ============================================================
// CÓDIGO REAL - DESCOMENTAR QUANDO TIVER OS ENDPOINTS
// ============================================================
```

Descomente todas as linhas dessa seção.

---

## 📋 Checklist para Ativar Modo Real

- [ ] Alterar `USE_MOCK_LOGIN = false` em `src/contexts/AuthContext.js`
- [x] ✅ Código real de login já implementado (usa CPF e FormData)
- [ ] Alterar `USE_MOCK_DATA = false` em `src/contexts/CondominioContext.js`
- [ ] Descomentar código real de condomínios em `src/contexts/CondominioContext.js`
- [ ] Verificar se a URL da API está correta em `services/api.js`
- [ ] Testar login com credenciais reais do backend

---

## 🧪 Testando com Diferentes Tipos de Usuário

No modo mock, você pode modificar o tipo de usuário editando a linha **79** em `src/contexts/AuthContext.js`:

```javascript
tipo_usuario: 'admin', // Opções: 'admin', 'supervisor', 'residente'
```

Isso permite testar diferentes permissões no app.

---

## 📝 Notas Importantes

- **Modo Mock:** Aceita qualquer CPF/senha e cria dados fictícios
- **Modo Real:** Usa o endpoint `https://face.onestartup.com.br/api/login.php` com CPF e senha
- **Formato CPF:** O campo de CPF aceita formatação automática (xxx.xxx.xxx-xx)
- **Autenticação:** O backend pode usar tokens JWT ou sessões PHP via cookies
- **Logs:** O console mostrará mensagens indicando se está usando mock ou API real

## 🔐 Endpoint de Login Implementado

O login real está configurado para:
- **URL:** `https://face.onestartup.com.br/api/login.php`
- **Método:** POST
- **Content-Type:** `multipart/form-data`
- **Body:** `cpf` (apenas números) e `senha`
- **Resposta:** `{ status: "success", usuario: {...} }`

⚠️ **Observação sobre Token:** O código verifica se o backend retorna token nos headers ou cookies. Se não retornar, usa sessão baseada em cookies (comum em backends PHP).

