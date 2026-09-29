// src/screens/NotificacoesScreen.js - padrao via NotificationContext
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/constants/theme';
import { NOTIFICATION_CATEGORY } from '@/constants/notifications';
import { useNotification } from '@/contexts/NotificationContext';
import { formatNotificationDate, getNotificationVisual } from '@/utils/notificationMapper';

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: NOTIFICATION_CATEGORY.ENCOMENDA, label: 'Encomendas' },
  { key: NOTIFICATION_CATEGORY.FATURA, label: 'Faturas' },
  { key: NOTIFICATION_CATEGORY.ACESSO, label: 'Acessos' },
];

export default function NotificacoesScreen({ navigation, route }) {
  const { notifications, refreshing, refresh, markAsRead, markAllAsRead } = useNotification();
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      refresh({ silent: true });
    }, [refresh])
  );

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.categoria === filter || n.tipo === filter);

  const renderNotificacao = ({ item }) => {
    const visual = getNotificationVisual(item);
    const isUnread = item.status === 'unread';
    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.notificationUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: visual.color + '15' }]}>
          <Ionicons name={visual.icon} size={24} color={visual.color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.codNotificacao}>{item.codNotificacao || visual.label}</Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          {item.titulo ? <Text style={styles.notificationTitle}>{item.titulo}</Text> : null}
          <Text style={styles.notificationDescription}>{item.descricao}</Text>
          <View style={styles.notificationFooter}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.notificationDate}>{formatNotificationDate(item.data || item.data_criacao)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyTitle}>Nenhuma notificacao</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' ? 'Voce nao possui notificacoes no momento' : `Nenhuma notificacao em "${FILTERS.find((f) => f.key === filter)?.label}"`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {route?.name !== 'Avisos' ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
        <Text style={styles.headerTitle}>Notificacoes</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('NotificacaoConfig')}>
            <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={markAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotificacao}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refresh()} colors={[theme.colors.primary]} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.white },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, fontWeight: '600' },
  filterTextActive: { color: theme.colors.white },
  listContent: { padding: theme.spacing.lg },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.small,
  },
  notificationUnread: { borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  codNotificacao: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginLeft: theme.spacing.sm },
  notificationTitle: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  notificationDescription: { fontSize: theme.fontSize.md, color: theme.colors.text, marginBottom: theme.spacing.sm, lineHeight: 20 },
  notificationFooter: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  notificationDate: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl * 2 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
});
