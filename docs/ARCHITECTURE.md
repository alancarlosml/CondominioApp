# Arquitetura do CondominioApp

Este documento descreve a estrutura e convenções do projeto, alinhadas às práticas de desenvolvimento React Native/Expo e às skills do repositório.

## Estrutura de pastas (padrão)

```
CondominioApp/
├── app/                    # [Futuro] Expo Router – telas e layout (migração planejada)
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de interface (botões, inputs, etc.)
│   │   └── features/       # Componentes específicos de funcionalidades
│   ├── contexts/           # Contextos React (Auth, Condomínio, etc.)
│   ├── hooks/              # Custom hooks (useApi, useAuth, etc.)
│   ├── screens/            # Telas da aplicação
│   ├── services/           # API, haptics, notificações, etc.
│   ├── utils/              # Helpers (storage, permissões, errorHandler)
│   ├── constants/          # Tema, cores, espaçamentos
│   └── types/              # Tipos TypeScript / JSDoc (quando aplicável)
├── styles/                 # [Legado] Consolidar em src/constants ao migrar
├── services/               # [Legado] API movida para src/services
└── App.js                  # Entry point atual (React Navigation)
```

## Path alias

Use o alias `@/` para imports a partir de `src/`:

```javascript
// ✅ Preferido
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

// ❌ Evitar caminhos relativos longos a partir de src
import { theme } from '../../styles/theme';
```

## Navegação

- **Atual:** React Navigation (Stack + Tab) em `App.js`.
- **Futuro:** Migração para Expo Router com `app/(auth)/`, `app/(tabs)/` e grupos por fluxo (login, principal, etc.).

## Estado e provedores

- **AuthContext:** autenticação, usuário, token, unidades.
- **CondominioContext:** condomínio/unidade selecionados.
- Provedores devem ficar em `src/contexts/` (ou `src/providers/` quando padronizado). Envolver a árvore em `App.js` na ordem: GestureHandler → Auth → Condominio → Navigator.

## Serviços

- **API:** cliente HTTP em `src/services/api.js` com interceptors (token, logout, tratamento de erro).
- **Storage:** `src/utils/storage.js` – AsyncStorage (mobile) / localStorage (web).
- **Haptics:** `src/services/haptics.js` – feedback tátil (expo-haptics), quando disponível.

## Tema e estilos

- **Fonte única:** `src/constants/theme.js` (cores, spacing, borderRadius, fontSize, shadow).
- Use `StyleSheet.create()` nos componentes; evite estilos inline.
- Para cores e espaçamentos, importe de `@/constants/theme`.

## Boas práticas (skills)

1. **Componentes:** funcionais, com hooks; extrair lógica para custom hooks.
2. **Listas:** usar `keyExtractor` com id estável (nunca índice como key).
3. **Plataforma:** `Platform.select()` ou arquivos `.ios.js` / `.android.js` quando necessário.
4. **Erros:** Error Boundary na raiz; tratamento em chamadas async (try/catch + feedback ao usuário).
5. **Segurança:** não guardar dados sensíveis em AsyncStorage; preferir SecureStore para token em produção.
6. **Performance:** evitar estilos inline; memoizar callbacks e itens de lista quando fizer sentido.

## Setup após clonar / atualizar

```bash
npm install
```

O alias `@/` depende de `babel-plugin-module-resolver`. O Metro e o `tsconfig.json` já estão configurados para `@` → `src/`.

## Migração gradual

- Manter `App.js` e React Navigation até a migração para Expo Router.
- Novos módulos devem usar `@/` e ficar em `src/` conforme a estrutura acima.
- Reduzir uso de `styles/theme.js` e `services/api.js` na raiz em favor de `src/constants/theme` e `src/services/api`.
