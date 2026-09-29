// src/screens/DashboardScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCondominio } from '@/contexts/CondominioContext';
import NotificationBadge from '@/components/NotificationBadge';
import { useNotification } from '@/contexts/NotificationContext';
import { fetchEntregas } from '@/services/encomendasApi';
import { fetchMoradores } from '@/services/moradoresApi';
import { fetchVeiculos } from '@/services/veiculosApi';
import logger from '@/utils/logger';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { selectedCondominio, hasMultipleCondominios } = useCondominio();
  const { unreadCount } = useNotification();
  const [encomendasCount, setEncomendasCount] = useState(0);
  const [loadingEncomendas, setLoadingEncomendas] = useState(false);
  const [veiculosCount, setVeiculosCount] = useState(0);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
  const [moradoresCount, setMoradoresCount] = useState(0);
  const [loadingMoradores, setLoadingMoradores] = useState(false);
  const encomendasRequestRef = useRef(0);
  const veiculosRequestRef = useRef(0);
  const moradoresRequestRef = useRef(0);

  const loadEncomendasCount = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      setEncomendasCount(0);
      return;
    }

    const requestId = ++encomendasRequestRef.current;
    setLoadingEncomendas(true);

    try {
      const idUnidade = selectedCondominio.id_tbl_unidade;
      logger.debug('📦 Dashboard: Carregando quantidade de encomendas para unidade:', idUnidade);

      const response = await fetchEntregas(idUnidade);

      if (requestId !== encomendasRequestRef.current) return;

      if (response.data?.status === 'success' && response.data.entregas) {
        setEncomendasCount(response.data.entregas.length);
        logger.debug(`✅ Dashboard: ${response.data.entregas.length} encomenda(s) encontrada(s)`);
      } else {
        setEncomendasCount(0);
        logger.warn('⚠️ Dashboard: Resposta da API não contém entregas válidas');
      }
    } catch (error) {
      if (requestId !== encomendasRequestRef.current) return;
      logger.warn('⚠️ Dashboard: Erro ao carregar encomendas:', error.message || error);
    } finally {
      if (requestId === encomendasRequestRef.current) {
        setLoadingEncomendas(false);
      }
    }
  }, [selectedCondominio?.id_tbl_unidade]);

  const loadVeiculosCount = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      setVeiculosCount(0);
      return;
    }

    const requestId = ++veiculosRequestRef.current;
    setLoadingVeiculos(true);

    try {
      const idUnidade = selectedCondominio.id_tbl_unidade;
      logger.debug('🚗 Dashboard: Carregando quantidade de veículos para unidade:', idUnidade);

      const response = await fetchVeiculos(idUnidade);

      if (requestId !== veiculosRequestRef.current) return;

      if (Array.isArray(response.data)) {
        setVeiculosCount(response.data.length);
        logger.debug(`✅ Dashboard: ${response.data.length} veículo(s) encontrado(s)`);
      } else {
        setVeiculosCount(0);
        logger.warn('⚠️ Dashboard: Resposta da API não contém veículos válidos');
      }
    } catch (error) {
      if (requestId !== veiculosRequestRef.current) return;
      logger.warn('⚠️ Dashboard: Erro ao carregar veículos:', error.message || error);
    } finally {
      if (requestId === veiculosRequestRef.current) {
        setLoadingVeiculos(false);
      }
    }
  }, [selectedCondominio?.id_tbl_unidade]);

  const loadMoradoresCount = useCallback(async () => {
    const idCondominio = selectedCondominio?.id_tbl_condominio || selectedCondominio?.id;
    const unidade = selectedCondominio?.unidade_usuario || selectedCondominio?.apartamento || selectedCondominio?.unidade;
    if (!idCondominio || !unidade) {
      setMoradoresCount(0);
      return;
    }
    const requestId = ++moradoresRequestRef.current;
    setLoadingMoradores(true);
    try {
      logger.debug('👥 Dashboard: Carregando quantidade de pessoas para unidade:', unidade);
      const response = await fetchMoradores(idCondominio, unidade);
      if (requestId !== moradoresRequestRef.current) return;
      const data = response.data;
      if (data?.moradores && Array.isArray(data.moradores)) {
        setMoradoresCount(data.moradores.length);
        logger.debug(`✅ Dashboard: ${data.moradores.length} pessoa(s) encontrada(s)`);
      } else if (Array.isArray(data)) {
        setMoradoresCount(data.length);
      } else {
        setMoradoresCount(0);
      }
    } catch (error) {
      if (requestId !== moradoresRequestRef.current) return;
      const isCors = error?.code === 'ERR_NETWORK' || error?.message?.includes('CORS');
      // No web com CORS, silencia para não poluir logs
      if (isCors) {
        logger.debug('Dashboard moradores ignorado no web (CORS)');
      } else {
        logger.warn('⚠️ Dashboard: Erro ao carregar pessoas:', error.message || error);
      }
    } finally {
      if (requestId === moradoresRequestRef.current) setLoadingMoradores(false);
    }
  }, [selectedCondominio?.id_tbl_condominio, selectedCondominio?.id, selectedCondominio?.unidade_usuario, selectedCondominio?.apartamento, selectedCondominio?.unidade]);

  useFocusEffect(
    useCallback(() => {
      if (selectedCondominio?.id_tbl_unidade) {
        loadEncomendasCount();
        loadVeiculosCount();
        loadMoradoresCount();
      } else {
        setEncomendasCount(0);
        setVeiculosCount(0);
        setMoradoresCount(0);
      }
    }, [selectedCondominio?.id_tbl_unidade, loadEncomendasCount, loadVeiculosCount, loadMoradoresCount])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.nome}</Text>
          </View>
          {hasMultipleCondominios && selectedCondominio && (
            <TouchableOpacity
              style={styles.condominioSelector}
              onPress={() => navigation.navigate('SelectCondominio')}
            >
              <Ionicons name="business-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.condominioSelectorText} numberOfLines={1}>
                {selectedCondominio.nome} - Unidade {selectedCondominio.unidade_usuario}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Avisos')}
          accessibilityLabel="Notificações"
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          <NotificationBadge count={unreadCount} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.gateActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Portoes', { type: 'vehicle' })} activeOpacity={0.8}>
              <Ionicons name="car-outline" size={25} color={theme.colors.white} />
              <Text style={styles.primaryActionText}>Portão de veículos</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Portoes', { type: 'pedestrian' })} activeOpacity={0.8}>
              <Ionicons name="walk-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.secondaryActionText}>Portão de pedestres</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Para você</Text>
          <TouchableOpacity style={styles.summaryRow} onPress={() => navigation.navigate('Encomendas')} activeOpacity={0.7}>
            <View style={[styles.summaryIcon, { backgroundColor: `${theme.colors.success}18` }]}><Ionicons name="cube-outline" size={23} color={theme.colors.success} /></View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Encomendas</Text>
              <Text style={styles.summaryDescription}>{loadingEncomendas ? 'Atualizando...' : `${encomendasCount} recebimento${encomendasCount === 1 ? '' : 's'} na unidade`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo da unidade</Text>
          <View style={styles.unitSummary}>
            <TouchableOpacity style={styles.unitItem} onPress={() => navigation.navigate('MeusVeiculos')}>
              <Ionicons name="car-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.unitNumber}>{loadingVeiculos ? '...' : veiculosCount}</Text>
              <Text style={styles.unitLabel}>Veículos</Text>
            </TouchableOpacity>
            <View style={styles.unitDivider} />
            <TouchableOpacity style={styles.unitItem} onPress={() => navigation.navigate('MeusMoradores')}>
              <Ionicons name="people-outline" size={22} color={theme.colors.info} />
              <Text style={styles.unitNumber}>{loadingMoradores ? '...' : moradoresCount}</Text>
              <Text style={styles.unitLabel}>Moradores</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  condominioSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
    maxWidth: '90%',
    ...theme.shadow.small,
  },
  condominioSelectorText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.small,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  gateActions: {
    gap: theme.spacing.sm,
  },
  primaryAction: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow.small,
  },
  primaryActionText: {
    flex: 1,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginLeft: theme.spacing.md,
  },
  secondaryAction: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginLeft: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.small,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  summaryContent: { flex: 1 },
  summaryTitle: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text },
  summaryDescription: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 3 },
  unitSummary: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadow.small,
  },
  unitItem: { flex: 1, alignItems: 'center' },
  unitDivider: { width: 1, backgroundColor: theme.colors.border },
  unitNumber: { fontSize: theme.fontSize.xl, fontWeight: '800', color: theme.colors.text, marginTop: theme.spacing.xs },
  unitLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 2 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  infoCardNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
  },
  infoCardLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  activityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
});
