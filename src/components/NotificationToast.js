import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getNotificationVisual } from '@/utils/notificationMapper';

export default function NotificationToast({ visible, notification, onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && notification) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(() => {
        hide();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, notification]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide?.());
  };

  if (!visible || !notification) return null;
  const visual = getNotificationVisual(notification);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={[styles.icon, { backgroundColor: visual.color + '15' }]}>
        <Ionicons name={visual.icon} size={20} color={visual.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{notification.titulo || notification.descricao}</Text>
        <Text style={styles.body} numberOfLines={1}>{notification.descricao}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    ...theme.shadow.medium,
    zIndex: 999,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  title: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 2 },
});
