# Contratos críticos para segurança

Estas rotas são requisitos para o app operar de forma confiável. O backend é a fonte de verdade: o app não concede acesso, decide vínculo de morador nem afirma que um portão abriu.

## Login

`POST /api/login2.php`

O endpoint deve aceitar CPF e senha somente por HTTPS, aplicar limite de tentativas no servidor e responder, em caso de sucesso:

```json
{
  "status": "success",
  "access_token": "token-opaco-ou-jwt-de-curta-duracao",
  "expires_in": 900,
  "dados": [
    {
      "id_tbl_condomino": 12,
      "id_tbl_condominio": 5,
      "id_tbl_unidade": 71,
      "nome_condomino": "Nome do morador"
    }
  ]
}
```

O token é obrigatório. Não use sessão criada pelo cliente, nem espere que o aplicativo leia `Set-Cookie`. O backend deve validar o token em todas as rotas autenticadas e devolver `401` quando expirado.

## Abertura de portão

`PUT /api/api_aparelho.php`

Request mínimo:

```json
{
  "id_tbl_aparelho": 10,
  "command_id": "gate-1730000000000-abc123"
}
```

O backend deve ignorar identidade, nome, condomínio e unidade enviados pelo app. Ele deve extraí-los do token e verificar morador ativo, vínculo atual com a unidade, regra de horário, permissão para o portão e estado do dispositivo.

`command_id` deve ser único por tentativa e persistido com o resultado. Requisições repetidas com o mesmo identificador não podem acionar o relé de novo.

Respostas:

```json
{ "status": "success", "confirmed": true, "gate_status": "open", "mensagem": "Abertura confirmada" }
```

Ou, quando o comando foi aceito mas ainda não há telemetria física:

```json
{ "status": "success", "confirmed": false, "mensagem": "Comando aceito" }
```

O servidor deve registrar em auditoria `command_id`, morador autenticado, unidade, portão, horário, dispositivo, resultado e motivo de falha. Nunca retorne IP privado, credenciais ou detalhes da rede do controlador ao app.

## Sessão e notificações

Implemente refresh token rotativo ou exija novo login após expiração. `POST /auth/logout` deve revogar a sessão quando possível. O token de acesso deve expirar em poucos minutos; o refresh token precisa ser revogável e armazenado somente no armazenamento seguro do aparelho.

O endpoint de push deve vincular o Expo Push Token à sessão, unidade e instalação, sem aceitar esses vínculos como verdade apenas pelo JSON do cliente. Remova tokens no logout, invalide tokens rejeitados pela Expo e nunca envie CPF, imagem facial ou detalhes sensíveis no conteúdo do push.
