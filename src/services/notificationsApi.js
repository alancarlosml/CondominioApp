/**
 * API de notificacoes - padrao para todos os modulos
 * Endpoints vanilla PHP: morador/notificacoes.php etc.
 * @see docs/BACKEND_NOTIFICACOES_vanilla_php.txt
 */
import api from '@/services/api';

// Lista paginada - compat com NotificacoesScreen fallback
export function fetchNotificacoes(params = {}) {
  // params: { id_unidade, status, categoria, page, limit }
  return api.get('/notificacoes', { params });
}

// Fallback direto para arquivo PHP (quando baseURL = /morador)
export function fetchNotificacoesPhp(params = {}) {
  return api.get('/notificacoes.php', { params });
}

export function fetchUnreadCount(idUnidade) {
  return api.get('/notificacoes_unread_count.php', { params: { id_unidade: idUnidade } });
}

export function markAsRead(id) {
  // Tenta PATCH REST primeiro, fallback POST php
  return api.patch(`/notificacoes/${id}/read`).catch(() =>
    api.post('/notificacao_read.php', { id })
  );
}

export function markManyAsRead(ids) {
  return api.post('/notificacao_read.php', { ids });
}

export function markAllAsRead(idUnidade) {
  return api.post('/notificacao_read.php', { all: true, id_unidade: idUnidade });
}

export function fetchPreferencias() {
  return api.get('/notificacao_preferencias.php');
}

export function savePreferencias(preferencias) {
  // preferencias: [{categoria, habilitado}] ou {categoria, habilitado}
  if (Array.isArray(preferencias)) return api.put('/notificacao_preferencias.php', { preferencias });
  return api.put('/notificacao_preferencias.php', preferencias);
}

export function savePreferencia(categoria, habilitado, extras = {}) {
  return api.put('/notificacao_preferencias.php', { categoria, habilitado, ...extras });
}

export function registerPushToken({ token, platform, id_unidade, device_id }) {
  return api.post('/push_token.php', { token, platform, id_unidade, device_id });
}

export function unregisterPushToken(token) {
  return api.delete('/push_token.php', { data: { token } });
}
