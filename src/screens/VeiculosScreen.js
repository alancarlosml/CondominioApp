// src/screens/VeiculosScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useCondominio } from '@/contexts/CondominioContext';
import { createVeiculo, deleteVeiculo, fetchVeiculos, updateVeiculo } from '@/services/veiculosApi';
import { getErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

const TIPO_OPTIONS = ['Carro', 'Moto', 'Caminhonete', 'SUV', 'Outro'];

export default function VeiculosScreen({ navigation }) {
  const { selectedCondominio } = useCondominio();
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState(null);
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('');

  useEffect(() => {
    if (selectedCondominio?.id_tbl_unidade) loadVeiculos();
  }, [selectedCondominio?.id_tbl_unidade]);

  useFocusEffect(
    useCallback(() => {
      if (selectedCondominio?.id_tbl_unidade) loadVeiculos();
    }, [selectedCondominio?.id_tbl_unidade])
  );

  const loadVeiculos = async () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      setVeiculos([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetchVeiculos(selectedCondominio.id_tbl_unidade);
      if (Array.isArray(response.data)) {
        setVeiculos(response.data);
        logger.debug(`${response.data.length} veículo(s) carregado(s)`);
      } else {
        logger.warn('Resposta da API não contém veículos válidos');
        setVeiculos([]);
      }
    } catch (error) {
      logger.error('Erro ao carregar veículos:', error);
      Alert.alert('Erro', getErrorMessage(error));
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (veiculo) => {
    setEditingVeiculo(veiculo);
    setPlaca(veiculo.placa || '');
    setTipo(veiculo.tipo || '');
    setModalVisible(true);
  };

  const openNewModal = () => {
    setEditingVeiculo(null);
    setPlaca('');
    setTipo('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingVeiculo(null);
    setPlaca('');
    setTipo('');
  };

  const validatePlaca = (p) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p);

  const handleSave = async () => {
    if (!placa || !tipo) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (!validatePlaca(placa.toUpperCase())) {
      Alert.alert('Erro', 'Placa inválida. Use formato ABC1234 ou ABC1D23');
      return;
    }
    if (!selectedCondominio?.id_tbl_unidade) {
      Alert.alert('Erro', 'Nenhuma unidade selecionada');
      return;
    }
    if (!selectedCondominio?.id_condomino) {
      Alert.alert('Erro', 'ID do condômino não encontrado');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        placa: placa.toUpperCase(),
        tipo,
        id_tbl_condomino: selectedCondominio.id_condomino,
        id_tbl_unidade: selectedCondominio.id_tbl_unidade,
      };
      if (editingVeiculo) {
        await updateVeiculo(editingVeiculo.id_tbl_veiculo, payload);
        Alert.alert('Sucesso', 'Veículo atualizado com sucesso!');
      } else {
        await createVeiculo(payload);
        Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!');
      }
      closeModal();
      await loadVeiculos();
    } catch (error) {
      logger.error('Erro ao salvar veículo:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (veiculo) => {
    try {
      setLoading(true);
      await deleteVeiculo(veiculo.id_tbl_veiculo);
      Alert.alert('Sucesso', 'Veículo excluído com sucesso!');
      await loadVeiculos();
    } catch (error) {
      logger.error('Erro ao excluir veículo:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (veiculo) => {
    Alert.alert('Excluir Veículo', `Deseja realmente excluir o veículo ${veiculo.placa}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => executeDelete(veiculo) },
    ]);
  };

  const formatPlaca = (text) => {
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    setPlaca(cleaned.substring(0, 7));
  };

  const renderVeiculo = ({ item }) => (
    <View style={styles.veiculoCard} accessibilityLabel={`Veículo ${item.placa}`}>
      <View style={styles.veiculoIcon}>
        <Ionicons name="car" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.veiculoInfo}>
        <Text style={styles.veiculoPlaca}>{item.placa}</Text>
        <Text style={styles.veiculoTipo}>{item.tipo}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
          accessibilityLabel="Editar veículo"
          accessibilityRole="button"
        >
          <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          accessibilityLabel="Excluir veículo"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => {
    if (!selectedCondominio?.id_tbl_unidade) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Nenhuma unidade selecionada</Text>
          <Text style={styles.emptyText}>Selecione uma unidade para visualizar os veículos</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={64} color={theme.colors.textLight} />
        <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
        <Text style={styles.emptyText}>Toque no botão + para adicionar um novo veículo</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Veículos</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={veiculos}
        keyExtractor={(item) => item.id_tbl_veiculo?.toString() || item.id?.toString()}
        renderItem={renderVeiculo}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadVeiculos} colors={[theme.colors.primary]} />}
      />

      <TouchableOpacity
        style={styles.fabButton}
        onPress={openNewModal}
        activeOpacity={0.8}
        accessibilityLabel="Adicionar veículo"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}</Text>
              <TouchableOpacity onPress={closeModal} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Placa *</Text>
                <TextInput
                  style={styles.input}
                  value={placa}
                  onChangeText={formatPlaca}
                  placeholder="ABC1234"
                  autoCapitalize="characters"
                  maxLength={7}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo/Modelo *</Text>
                <View style={styles.tipoGrid}>
                  {TIPO_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.tipoChip, tipo === opt && styles.tipoChipActive]}
                      onPress={() => setTipo(opt)}
                    >
                      <Text style={[styles.tipoChipText, tipo === opt && styles.tipoChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: theme.spacing.sm }]}
                  value={tipo}
                  onChangeText={setTipo}
                  placeholder="Ou digite: Toyota Corolla"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : editingVeiculo ? 'Atualizar Veículo' : 'Salvar Veículo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  listContent: { padding: theme.spacing.lg },
  veiculoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  veiculoIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  veiculoInfo: { flex: 1 },
  veiculoPlaca: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
  veiculoTipo: { fontSize: theme.fontSize.md, color: theme.colors.textLight },
  actionButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl * 2 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
  fabButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.large,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text },
  modalBody: { padding: theme.spacing.lg },
  inputGroup: { marginBottom: theme.spacing.lg },
  label: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  tipoChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipoChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tipoChipText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.textLight },
  tipoChipTextActive: { color: theme.colors.white },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: theme.colors.white, fontSize: theme.fontSize.lg, fontWeight: 'bold' },
});
