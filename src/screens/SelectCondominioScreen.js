// src/screens/SelectCondominioScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCondominio } from '@/contexts/CondominioContext';
import { theme } from '@/constants/theme';

export default function SelectCondominioScreen({ navigation }) {
  const { condominios, selectedCondominio, loading, selectCondominio, loadCondominios } = useCondominio();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCondominios();
  }, []);

  // Removido log de debug com dados sensíveis - usar logger se necessário
  useEffect(() => {}, [condominios, selectedCondominio]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCondominios();
    setRefreshing(false);
  };

  const handleSelectCondominio = (condominio) => {
    selectCondominio(condominio);
    // Navigate back or to home
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const renderCondominio = ({ item }) => {
    // Verifica se está selecionado usando id_tbl_cond_usuario (mais confiável) ou id como fallback
    const isSelected = selectedCondominio?.id_tbl_cond_usuario === item.id_tbl_cond_usuario 
      || (selectedCondominio?.id === item.id && !item.id_tbl_cond_usuario);
    const hasImage = item.foto || item.imagem;

    return (
      <TouchableOpacity
        style={[styles.condominioCard, isSelected && styles.condominioCardSelected]}
        onPress={() => handleSelectCondominio(item)}
        activeOpacity={0.7}
      >
        <View style={styles.condominioContent}>
          {hasImage ? (
            <Image
              source={{ uri: hasImage }}
              style={styles.condominioImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.condominioImagePlaceholder}>
              <Ionicons name="business" size={32} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.condominioInfo}>
            <Text style={styles.condominioName}>{item.nome}</Text>
            {item.cidade && (
              <View style={styles.condominioLocation}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textLight} />
                <Text style={styles.condominioLocationText}>
                  {item.cidade}
                  {item.uf && `, ${item.uf}`}
                </Text>
              </View>
            )}
            {item.sindico && (
              <Text style={styles.condominioSindico}>Síndico: {item.sindico}</Text>
            )}
          </View>

          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyTitle}>Nenhum condomínio encontrado</Text>
      <Text style={styles.emptyText}>
        Você não está vinculado a nenhum condomínio no momento.
      </Text>
    </View>
  );

  if (loading && condominios.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner fullScreen message="Carregando condomínios..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecionar Condomínio</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
        <Text style={styles.infoText}>
          {condominios.length === 1
            ? 'Você está vinculado a um condomínio.'
            : `Você está vinculado a ${condominios.length} condomínios. Selecione qual deseja gerenciar.`}
        </Text>
      </View>

      <FlatList
        data={condominios}
        keyExtractor={(item, index) => {
          // Usa id_tbl_cond_usuario como chave primária (único para cada unidade/condomínio)
          // Se não existir, usa uma combinação de id_tbl_condominio e index como fallback
          return item.id_tbl_cond_usuario?.toString() 
            || `${item.id_tbl_condominio}_${index}` 
            || `condominio_${index}`;
        }}
        renderItem={renderCondominio}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  condominioCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.small,
  },
  condominioCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  condominioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  condominioImage: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  condominioImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  condominioInfo: {
    flex: 1,
  },
  condominioName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  condominioLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  condominioLocationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  condominioSindico: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  selectedBadge: {
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

