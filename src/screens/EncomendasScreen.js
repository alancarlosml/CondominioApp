// src/screens/EncomendasScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useCondominio } from '@/contexts/CondominioContext';
import { confirmarEntrega, fetchEntregas } from '@/services/encomendasApi';
import { getErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

export default function EncomendasScreen({ navigation }) {
  const { selectedCondominio } = useCondominio();
  const [encomendas, setEncomendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 0, 1
  const [statusMap, setStatusMap] = useState({}); // { codigoHash: status }
  const statusMapRef = useRef({});

  useEffect(() => {
    statusMapRef.current = statusMap;
  }, [statusMap]);

  useEffect(() => {
    if (selectedCondominio?.id_tbl_unidade) {
      loadEncomendas();
    }
  }, [filter, selectedCondominio?.id_tbl_unidade]);

  const loadEncomendas = async () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      logger.warn('Nenhuma unidade selecionada');
      setEncomendas([]);
      return;
    }

    setLoading(true);
    try {
      const idUnidade = selectedCondominio.id_tbl_unidade;
      logger.debug('Carregando encomendas para unidade:', idUnidade);

      const response = await fetchEntregas(idUnidade);

      if (response.data && response.data.status === 'success' && response.data.entregas) {
        const currentStatusMap = statusMapRef.current;

        const entregasMapeadas = response.data.entregas.map((entrega) => {
          const status =
            entrega.status !== undefined
              ? parseInt(entrega.status, 10)
              : currentStatusMap[entrega.codigoHash] !== undefined
                ? currentStatusMap[entrega.codigoHash]
                : 0;

          return {
            id: entrega.id,
            codRastreio: entrega.codigoHash || entrega.id,
            remetente: entrega.empresa || 'Desconhecido',
            destinatario: entrega.nome_destinatario,
            entregador: entrega.nome_entregador,
            cpfEntregador: entrega.cpf_entregador,
            telefoneEntregador: entrega.telefone_entregador,
            fotoPath: entrega.foto_path,
            data: entrega.data_hora,
            status,
            codigoHash: entrega.codigoHash,
          };
        });

        let entregasFiltradas = entregasMapeadas;
        if (filter === 0) {
          entregasFiltradas = entregasMapeadas.filter((e) => e.status === 0);
        } else if (filter === 1) {
          entregasFiltradas = entregasMapeadas.filter((e) => e.status === 1);
        }

        setEncomendas(entregasFiltradas);
        logger.debug(`${entregasFiltradas.length} encomenda(s) carregada(s)`);
      } else {
        logger.warn('Resposta da API não contém entregas válidas');
        setEncomendas([]);
      }
    } catch (error) {
      logger.error('Erro ao carregar encomendas:', error);
      Alert.alert('Erro', getErrorMessage(error));
      setEncomendas([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { label: 'Aguardando Retirada', color: theme.colors.warning, icon: 'time-outline' };
      case 1:
        return { label: 'Retirada', color: theme.colors.success, icon: 'checkmark-circle-outline' };
      default:
        return { label: 'Desconhecido', color: theme.colors.textLight, icon: 'help-circle-outline' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const dateStr = dateString.replace(' ', 'T');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateString;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getImageUrl = (fotoPath) => {
    if (!fotoPath) return null;
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) return fotoPath;
    return `https://face.onestartup.com.br/api/${fotoPath}`;
  };

  const confirmarRetirada = async (codigoHash) => {
    if (!codigoHash) {
      Alert.alert('Erro', 'Código hash não encontrado');
      return;
    }

    Alert.alert('Confirmar retirada', 'Deseja confirmar a retirada desta encomenda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'default',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await confirmarEntrega(codigoHash, '1');

            if (response.data && response.data.status !== 'success') {
              logger.warn('Resposta da API não indica sucesso:', response.data);
            }

            setStatusMap((prev) => {
              const updated = { ...prev, [codigoHash]: 1 };
              statusMapRef.current = updated;
              return updated;
            });

            setEncomendas((prev) =>
              prev.map((e) => (e.codigoHash === codigoHash ? { ...e, status: 1 } : e))
            );

            Alert.alert('Sucesso', 'Retirada confirmada com sucesso!');

            await new Promise((resolve) => setTimeout(resolve, 200));

            if (filter === 0) {
              setFilter('all');
            } else {
              await loadEncomendas();
            }
          } catch (error) {
            logger.error('Erro ao confirmar retirada:', error);
            Alert.alert('Erro', getErrorMessage(error));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderEncomenda = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const imageUrl = getImageUrl(item.fotoPath);

    return (
      <View style={styles.encomendaCard} accessibilityLabel={`Encomenda ${item.codigoHash}`}>
        <View style={styles.encomendaHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.encomendaContent}>
          {imageUrl ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.encomendaImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name="cube" size={32} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.encomendaInfo}>
            <Text style={styles.rastreioLabel}>Cód. Hash</Text>
            <Text style={styles.rastreioValue} numberOfLines={1} ellipsizeMode="middle">
              {item.codigoHash || item.codRastreio}
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={14} color={theme.colors.textLight} />
              <Text style={styles.remetenteText}>{item.remetente}</Text>
            </View>

            {item.destinatario && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={14} color={theme.colors.textLight} />
                <Text style={styles.remetenteText}>Para: {item.destinatario}</Text>
              </View>
            )}

            {item.entregador && (
              <View style={styles.infoRow}>
                <Ionicons name="bicycle-outline" size={14} color={theme.colors.textLight} />
                <Text style={styles.remetenteText}>Entregador: {item.entregador}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textLight} />
              <Text style={styles.dateText}>{formatDate(item.data)}</Text>
            </View>
          </View>
        </View>

        {item.status === 0 && (
          <TouchableOpacity
            style={[styles.collectButton, loading && styles.collectButtonDisabled]}
            onPress={() => confirmarRetirada(item.codigoHash)}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityLabel="Confirmar retirada"
            accessibilityRole="button"
          >
            <Text style={styles.collectButtonText}>{loading ? 'Processando...' : 'Confirmar Retirada'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyList = () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Nenhuma unidade selecionada</Text>
          <Text style={styles.emptyText}>Selecione uma unidade para visualizar as encomendas</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color={theme.colors.textLight} />
        <Text style={styles.emptyTitle}>Nenhuma encomenda</Text>
        <Text style={styles.emptyText}>
          {filter === 0
            ? 'Você não tem encomendas pendentes'
            : filter === 1
              ? 'Você não tem encomendas retiradas'
              : 'Você não possui encomendas registradas'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encomendas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 0 && styles.filterTabActive]}
          onPress={() => setFilter(0)}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, filter === 0 && styles.filterTextActive]}>Pendentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 1 && styles.filterTabActive]}
          onPress={() => setFilter(1)}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, filter === 1 && styles.filterTextActive]}>Retiradas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={encomendas}
        keyExtractor={(item) => (item.codigoHash || item.id)?.toString()}
        renderItem={renderEncomenda}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEncomendas} colors={[theme.colors.primary]} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  filterTabActive: { backgroundColor: theme.colors.primary },
  filterText: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.textLight },
  filterTextActive: { color: theme.colors.white },
  listContent: { padding: theme.spacing.lg },
  encomendaCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.medium,
  },
  encomendaHeader: { marginBottom: theme.spacing.md },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  statusText: { fontSize: theme.fontSize.sm, fontWeight: '600' },
  encomendaContent: { flexDirection: 'row' },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  encomendaImage: { width: '100%', height: '100%' },
  encomendaInfo: { flex: 1 },
  rastreioLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textLight, marginBottom: 2 },
  rastreioValue: { fontSize: theme.fontSize.lg, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  remetenteText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  dateText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  collectButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  collectButtonDisabled: { backgroundColor: theme.colors.textLight, opacity: 0.6 },
  collectButtonText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl * 2 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
});
