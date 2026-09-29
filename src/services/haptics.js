/**
 * Serviço de feedback tátil – expo-haptics quando disponível.
 * No-op em web e quando o módulo não estiver instalado.
 * @see docs/ARCHITECTURE.md | react-native-architecture skill
 */
import { Platform } from 'react-native';

let Haptics = null;
try {
  if (Platform.OS !== 'web') {
    Haptics = require('expo-haptics');
  }
} catch (_) {
  // expo-haptics não instalado ou indisponível
}

export const haptics = {
  light: () => Haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () =>
    Haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
