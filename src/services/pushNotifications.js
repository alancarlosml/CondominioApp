/**
 * Push / som / vibracao - vanilla, sem quebrar se expo-notifications nao instalado
 * MVP: cria canal Android + notificacao local sonora (haptics)
 * Fase 2: registrara ExponentPushToken via notificationsApi
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { haptics } from '@/services/haptics';
import logger from '@/utils/logger';

let Notifications = null;
let Device = null;

// Expo Go SDK 53+ removeu push remoto - só funciona em dev build. Em Expo Go, opera silencioso.
const isExpoGo = Constants.appOwnership === 'expo';
const isWeb = Platform.OS === 'web';

try {
  // Lazy require para nao quebrar bundling e evita erro no Expo Go / web
  if (!isWeb && !isExpoGo) {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } else if (!isWeb && isExpoGo) {
    // Tenta, mas se falhar silencia (SDK 53+)
    try {
      Notifications = require('expo-notifications');
      Device = require('expo-device');
    } catch (_) {
      Notifications = null;
      Device = null;
    }
  }
} catch (_) {
  // lib nao instalada - opera em modo polling silencioso
}

export async function setupNotificationChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificacoes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (e) {
    logger.warn('[push] canal android erro:', e?.message);
  }
}

export async function configureNotificationHandler() {
  if (!Notifications) return;
  // Silencia em Expo Go SDK 53+ onde remote notifications foi removido
  if (isExpoGo) {
    logger.debug('[push] Expo Go detectado - push remoto desabilitado, usando polling');
    return;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    await setupNotificationChannel();
  } catch (e) {
    // SDK 53+ no Expo Go lança erro - silenciar
    if (String(e?.message)?.includes('removed from Expo Go')) {
      logger.debug('[push] Expo Go - handler não suportado (usar dev build)');
      Notifications = null;
      return;
    }
    logger.warn('[push] handler erro:', e?.message);
  }
}

// Notificacao local imediata (usada para preview sonoro ou fallback sem backend)
export async function showLocalNotification({ title, body, data = {} }) {
  try {
    haptics.success();
  } catch (_) {}
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: null,
    });
  } catch (e) {
    logger.warn('[push] local notif erro:', e?.message);
  }
}

export function isPushAvailable() {
  return !!Notifications && !!Device;
}

export async function getExpoPushToken(projectId) {
  if (!Notifications || !Device) return null;
  try {
    if (!Device.isDevice) {
      logger.warn('[push] push so em device fisico');
      return null;
    }
    const perm = await Notifications.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token?.data || null;
  } catch (e) {
    logger.warn('[push] getExpoPushToken erro:', e?.message);
    return null;
  }
}
