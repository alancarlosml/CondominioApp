# 🔐 Resolver Erro de Assinatura - Google Play Console

## ❌ Erro Encontrado

```
Seu Android App Bundle foi assinado com uma chave incorreta.
Esperada: SHA1: 2B:4E:66:AE:F4:5D:D3:C8:4A:86:0A:75:DE:2B:54:8B:95:90:0A:6F
Usada:    SHA1: 97:8D:97:C4:3A:7F:2B:B4:8A:1C:D7:BE:BF:3C:7B:E4:5E:13:C5:8B
```

## 🔍 Entendendo o Problema

O Google Play Console registra a **primeira chave de assinatura** usada no app e exige que todas as versões subsequentes usem a **mesma chave**. Isso é uma medida de segurança.

### Possíveis Cenários:

1. **App já existia na conta antiga**: A chave esperada (`2B:4E:66...`) foi usada na conta anterior
2. **Primeiro upload na nova conta**: Você fez upload de um AAB que já tinha uma chave, e agora o Google Play espera essa chave
3. **EAS gerou nova chave**: O EAS Build gerou uma nova keystore automaticamente, diferente da esperada

## ✅ Soluções Possíveis

### Solução 1: Usar a Chave Esperada pelo Google Play (Recomendado)

Se você tem acesso à keystore que gerou a chave `2B:4E:66:AE:F4:5D:D3:C8:4A:86:0A:75:DE:2B:54:8B:95:90:0A:6F`:

#### Opção A: Configurar EAS para usar keystore existente

1. **Baixar a keystore da conta antiga** (se tiver acesso):
   ```bash
   eas credentials
   ```
   - Selecione Android
   - Selecione "production"
   - Escolha "Download existing credentials"

2. **Fazer upload da keystore para o EAS**:
   ```bash
   eas credentials
   ```
   - Selecione Android
   - Selecione "production"
   - Escolha "Upload keystore"
   - Forneça o arquivo `.jks` ou `.keystore`
   - Forneça as senhas (keystore password e key password)

#### Opção B: Usar credenciais locais

Se você tem a keystore localmente, configure o EAS para usar:

1. **Criar arquivo de configuração local** (não recomendado para produção, mas possível):
   - Coloque a keystore em um local seguro
   - Configure o EAS para usar credenciais locais

### Solução 2: Resetar o App no Google Play Console (Se for Novo)

Se este é um **app completamente novo** na nova conta e você ainda não publicou:

1. **Deletar o app** no Google Play Console:
   - Vá para "Configurações do app" → "Avançado"
   - Role até "Excluir app"
   - ⚠️ **ATENÇÃO**: Isso só funciona se o app ainda não foi publicado!

2. **Criar novo app** com o mesmo package name

3. **Fazer upload do novo AAB** (com a chave que o EAS gerou)

### Solução 3: Usar a Chave que o EAS Gerou (Se possível)

Se o Google Play aceitar resetar a chave (geralmente não aceita, mas pode tentar):

1. **Verificar qual chave o EAS está usando**:
   ```bash
   eas credentials
   ```
   - Selecione Android
   - Selecione "production"
   - Veja as informações da keystore

2. **Se a chave atual do EAS for `97:8D:97:C4...`**, você pode tentar:
   - Deletar o app no Google Play (se ainda não publicado)
   - Criar novo app
   - Fazer upload com a nova chave

## 🎯 Solução Recomendada (Passo a Passo)

### Cenário: Você tem acesso à conta antiga ou à keystore

1. **Verificar credenciais no EAS**:
   ```bash
   eas credentials
   ```

2. **Se a keystore esperada não estiver no EAS**:
   - Baixe da conta antiga (se possível)
   - Ou use a keystore local se tiver

3. **Fazer upload da keystore correta**:
   ```bash
   eas credentials
   ```
   - Android → production → Upload keystore
   - Forneça o arquivo `.jks` ou `.keystore`
   - Forneça as senhas

4. **Gerar novo build**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Fazer upload do novo AAB** no Google Play Console

### Cenário: App é novo e pode ser deletado

1. **Deletar o app** no Google Play Console:
   - Configurações → Avançado → Excluir app

2. **Criar novo app** com o mesmo package name

3. **Gerar build** (EAS vai usar a chave que gerou):
   ```bash
   eas build --platform android --profile production
   ```

4. **Fazer upload** do novo AAB

## 🔧 Comandos Úteis

### Ver credenciais atuais:
```bash
eas credentials
```

### Ver informações detalhadas:
```bash
eas credentials --platform android --profile production
```

### Listar builds anteriores:
```bash
eas build:list
```

### Ver detalhes de um build:
```bash
eas build:view [BUILD_ID]
```

## ⚠️ Importante

1. **Nunca perca a keystore**: Se você perder a keystore, não poderá mais atualizar o app no Google Play
2. **Backup**: Sempre faça backup da keystore em local seguro
3. **Mesma chave**: Todas as atualizações devem usar a mesma chave de assinatura
4. **Primeira versão**: A primeira versão define qual chave será usada para sempre

## 📞 Próximos Passos

1. ✅ Identificar qual cenário se aplica ao seu caso
2. ⏳ Verificar credenciais no EAS: `eas credentials`
3. ⏳ Baixar/obter a keystore com SHA1 `2B:4E:66:AE:F4:5D:D3:C8:4A:86:0A:75:DE:2B:54:8B:95:90:0A:6F`
4. ⏳ Fazer upload da keystore correta no EAS
5. ⏳ Gerar novo build: `eas build --platform android --profile production`
6. ⏳ Fazer upload do novo AAB no Google Play Console

---

**Última atualização**: Resolução de erro de assinatura
**SHA1 Esperada**: `2B:4E:66:AE:F4:5D:D3:C8:4A:86:0A:75:DE:2B:54:8B:95:90:0A:6F`
**SHA1 Atual**: `97:8D:97:C4:3A:7F:2B:B4:8A:1C:D7:BE:BF:3C:7B:E4:5E:13:C5:8B`
