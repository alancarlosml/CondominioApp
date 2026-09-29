/**
 * Constantes padrao de notificacoes - use em todos os modulos.
 * Backend ENUM: tbl_notificacao.categoria / tipo / prioridade
 * @see docs/BACKEND_NOTIFICACOES_vanilla_php.txt
 */

export const NOTIFICATION_CATEGORY = {
  ENCOMENDA: 'encomenda',
  FATURA: 'fatura',
  ACESSO: 'acesso',
  PORTAO: 'portao',
  VEICULO: 'veiculo',
  SISTEMA: 'sistema',
};

export const NOTIFICATION_TYPE = {
  // encomenda
  ENCOMENDA_CREATED: 'encomenda_created',
  ENCOMENDA_RETIRADA: 'encomenda_retirada',
  // fatura
  FATURA_CREATED: 'fatura_created',
  FATURA_DUE_SOON_3D: 'fatura_due_soon_3d',
  FATURA_DUE_TODAY: 'fatura_due_today',
  FATURA_OVERDUE: 'fatura_overdue',
  FATURA_PAID: 'fatura_paid',
  // acesso / facial
  FACIAL_DEPENDENT_ENTERED: 'facial_dependent_entered',
  ACESSO_LIBERADO: 'acesso_liberado',
  // portao / veiculo
  PORTAO_OPENED: 'portao_opened',
  VEICULO_CREATED: 'veiculo_created',
  // sistema
  COMUNICADO: 'comunicado',
};

export const NOTIFICATION_PRIORITY = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
};

export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
};

export const DEFAULT_PREFS = [
  { categoria: NOTIFICATION_CATEGORY.ENCOMENDA, habilitado: true },
  { categoria: NOTIFICATION_CATEGORY.FATURA, habilitado: true },
  { categoria: NOTIFICATION_CATEGORY.ACESSO, habilitado: true },
  { categoria: NOTIFICATION_CATEGORY.PORTAO, habilitado: true },
  { categoria: NOTIFICATION_CATEGORY.VEICULO, habilitado: true },
  { categoria: NOTIFICATION_CATEGORY.SISTEMA, habilitado: true },
];

// Polling padrao (ms) - usado no NotificationContext
export const NOTIFICATION_POLL_INTERVAL = 60 * 1000;
export const NOTIFICATION_PAGE_LIMIT = 20;
