import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCondominio } from '@/contexts/CondominioContext';
import { NOTIFICATION_POLL_INTERVAL } from '@/constants/notifications';
import { fetchNotificacoes, fetchUnreadCount, markAllAsRead as apiMarkAll, markAsRead as apiMarkOne } from '@/services/notificationsApi';
import logger from '@/utils/logger';

const isWeb = Platform.OS === 'web';

const NotificationContext = createContext(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { selectedCondominio } = useCondominio();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const idUnidade = selectedCondominio?.id_tbl_unidade || null;

  const loadUnreadCount = useCallback(async () => {
    if (isWeb) return; // web sem backend CORS - evita spam de ERR_FAILED
    if (!isAuthenticated || !idUnidade) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetchUnreadCount(idUnidade);
      const count = res.data?.unreadCount ?? res.data?.unread_count ?? 0;
      setUnreadCount(Number(count) || 0);
    } catch (e) {
      // Silencia CORS/Network no web, só loga debug
      if (e?.code === 'ERR_NETWORK' || e?.message?.includes('CORS')) {
        logger.debug('[notif] unreadCount ignorado no web (CORS)');
        return;
      }
      logger.warn('[notif] unreadCount erro:', e?.message);
    }
  }, [isAuthenticated, idUnidade]);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (isWeb) {
      // No web backend sem CORS - não faz polling
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!isAuthenticated || !idUnidade) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (!silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchNotificacoes({ id_unidade: idUnidade, limit: 20, page: 1 });
      const list = Array.isArray(res.data) ? res.data : res.data?.notificacoes || res.data?.data || [];
      setNotifications(Array.isArray(list) ? list : []);
      if (typeof res.data?.unreadCount === 'number') setUnreadCount(res.data.unreadCount);
      else await loadUnreadCount();
    } catch (e) {
      if (e?.code === 'ERR_NETWORK' || e?.message?.includes('CORS') || e?.message?.includes('ERR_FAILED')) {
        logger.debug('[notif] refresh ignorado no web (CORS)');
      } else if (e?.response?.status === 404) {
        // Endpoint sem notificações p/ unidade ou rota inexistente: lista vazia, sem warning
        logger.debug('[notif] refresh 404 (sem notificações):', e?.response?.data?.mensagem || 'não encontrado');
        setNotifications([]);
      } else {
        logger.warn('[notif] refresh erro:', e?.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, idUnidade, loadUnreadCount]);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiMarkOne(id);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, status: 'read' } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      logger.warn('[notif] markAsRead erro:', e?.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!idUnidade) return;
    try {
      await apiMarkAll(idUnidade);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      setUnreadCount(0);
    } catch (e) {
      logger.warn('[notif] markAll erro:', e?.message);
    }
  }, [idUnidade]);

  // Polling + AppState foreground (desabilitado no web)
  useEffect(() => {
    if (isWeb) return;
    if (!isAuthenticated || !idUnidade) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    refresh({ silent: true });
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      refresh({ silent: true });
    }, NOTIFICATION_POLL_INTERVAL);

    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        refresh({ silent: true });
      }
      appStateRef.current = next;
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      sub?.remove();
    };
  }, [isAuthenticated, idUnidade, refresh]);

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead,
    markAllAsRead,
    loadUnreadCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
