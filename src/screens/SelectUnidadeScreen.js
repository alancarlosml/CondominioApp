// src/screens/SelectUnidadeScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCondominio } from '@/contexts/CondominioContext';
import { theme } from '@/constants/theme';
import * as Storage from '@/utils/storage';
import logger from '@/utils/logger';

export default function SelectUnidadeScreen({ navigation }) {
  const { unidades } = useAuth();
  const { selectCondominio } = useCondominio();
  const [selectedUnidadeId, setSelectedUnidadeId] = useState(null);

  useEffect(() => {
    // Carrega unidade selecionada do storage se existir
    loadSelectedUnidade();
  }, []);

  const loadSelectedUnidade = async () => {
    try {
      const saved = await Storage.getJSONItem('selectedUnidade');
      if (saved) {
        setSelectedUnidadeId(saved.id_tbl_cond_usuario);
      }
    } catch (error) {
      logger.error('Erro ao carregar unidade selecionada:', error);
    }
  };

  const handleSelectUnidade = async (unidade) => {
    try {
      await Storage.setJSONItem('selectedUnidade', unidade);
      setSelectedUnidadeId(unidade.id_tbl_cond_usuario);

      const condominioData = {
        id: unidade.id_tbl_condominio,
        id_tbl_condominio: unidade.id_tbl_condominio,
        id_tbl_cond_usuario: unidade.id_tbl_cond_usuario,
        nome: unidade.nome_condominio || unidade.nome,
        cnpj: unidade.cnpj,
        unidade_usuario: unidade.unidade_usuario,
        id_condominio: unidade.id_condominio,
        id_condomino: unidade.id_condomino,
        bloco: unidade.bloco,
        apartamento: unidade.apartamento,
        id_tbl_unidade: unidade.id_tbl_unidade,
      };

      selectCondominio(condominioData);
      navigation.replace('Home');
    } catch (error) {
      logger.error('Erro ao selecionar unidade:', error);
    }
  };

  const renderUnidade = ({ item }) => {
    const isSelected = selectedUnidadeId === item.id_tbl_cond_usuario;
    const hasImage = item.foto;

    return (
      <TouchableOpacity
        style={[styles.unidadeCard, isSelected && styles.unidadeCardSelected]}
        onPress={() => handleSelectUnidade(item)}
        activeOpacity={0.7}
      >
        <View style={styles.unidadeContent}>
          {hasImage ? (
            <Image
              source={{ uri: hasImage }}
              style={styles.unidadeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.unidadeImagePlaceholder}>
              <Ionicons name="business" size={32} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.unidadeInfo}>
            <Text style={styles.condominioName}>{item.nome_condominio || item.nome}</Text>
            <View style={styles.unidadeBadge}>
              <Ionicons name="home" size={14} color={theme.colors.primary} />
              <Text style={styles.unidadeText}>
                {item.bloco && item.apartamento 
                  ? `Bloco ${item.bloco} - Apt ${item.apartamento}`
                  : `Unidade ${item.unidade_usuario}`}
              </Text>
            </View>
            {item.cnpj && (
              <Text style={styles.cnpjText}>CNPJ: {item.cnpj}</Text>
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
      <Ionicons name="home-outline" size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyTitle}>Nenhuma unidade encontrada</Text>
      <Text style={styles.emptyText}>
        Você não está vinculado a nenhuma unidade no momento.
      </Text>
    </View>
  );

  if (!unidades || unidades.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selecionar Unidade</Text>
          <View style={{ width: 24 }} />
        </View>
        {renderEmptyList()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecionar Unidade</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
        <Text style={styles.infoText}>
          {unidades.length === 1
            ? 'Você está vinculado a uma unidade.'
            : `Você está vinculado a ${unidades.length} unidades. Selecione qual deseja acessar.`}
        </Text>
      </View>

      <FlatList
        data={unidades}
        keyExtractor={(item) => item.id_tbl_cond_usuario?.toString() || `${item.id_condominio}_${item.unidade_usuario}`}
        renderItem={renderUnidade}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
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
  unidadeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.small,
  },
  unidadeCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  unidadeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  unidadeImage: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  unidadeImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  unidadeInfo: {
    flex: 1,
  },
  condominioName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  unidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  unidadeText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  cnpjText: {
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

