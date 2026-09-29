// src/screens/CamerasScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import CameraFeedImage from '@/components/CameraFeedImage';
import CameraFeedStream from '@/components/CameraFeedStream';
import SwipeButton from '@/components/SwipeButton';
import { theme } from '@/constants/theme';
import { useCondominio } from '@/contexts/CondominioContext';
import {
  fetchAparelhos,
  fetchCameras,
  findAparelhoForCamera,
  getIdCondomino,
  openGate,
} from '@/services/deviceApi';
import logger from '@/utils/logger';

// Removido Dimensions estático para suporte a rotação

export default function CamerasScreen({ navigation }) {
  const { selectedCondominio } = useCondominio();
  const [cameras, setCameras] = useState([]);
  const [aparelhos, setAparelhos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openingGate, setOpeningGate] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadCameras = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_condominio) {
      logger.warn('⚠️ Nenhum condomínio selecionado');
      setCameras([]);
      return;
    }

    setLoading(true);
    try {
      const idCondominio = selectedCondominio.id_tbl_condominio;
      logger.debug('📹 Carregando câmeras para condomínio:', idCondominio);

      const response = await fetchCameras(idCondominio);

      if (response.data?.cameras && Array.isArray(response.data.cameras)) {
        setCameras(response.data.cameras);
        logger.debug(`✅ ${response.data.cameras.length} câmera(s) carregada(s)`);
      } else {
        logger.warn('⚠️ Resposta da API não contém câmeras válidas');
        setCameras([]);
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar câmeras:', {
        message: error.message,
        status: error.response?.status ?? error.status,
        code: error.code,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCondominio?.id_tbl_condominio]);

  const loadAparelhos = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_condominio) {
      logger.warn('⚠️ Nenhum condomínio selecionado para carregar aparelhos');
      setAparelhos([]);
      return;
    }

    try {
      const idCondominio = selectedCondominio.id_tbl_condominio;
      logger.debug('🔌 Carregando aparelhos para condomínio:', idCondominio);

      const response = await fetchAparelhos(idCondominio);

      if (response.data && Array.isArray(response.data)) {
        setAparelhos(response.data);
        logger.debug(`✅ ${response.data.length} aparelho(s) carregado(s)`);
      } else {
        logger.warn('⚠️ Resposta da API não contém aparelhos válidos');
        setAparelhos([]);
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar aparelhos:', error);
      setAparelhos([]);
    }
  }, [selectedCondominio?.id_tbl_condominio]);

  const getAparelhoByHash = useCallback(
    (hash) => findAparelhoForCamera(aparelhos, hash),
    [aparelhos]
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedCondominio?.id_tbl_condominio) {
        loadCameras();
        loadAparelhos();
      }
    }, [selectedCondominio?.id_tbl_condominio, loadCameras, loadAparelhos])
  );

  const handleOpenGate = useCallback(async () => {
    if (!selectedCamera?.id_aparelho) {
      Alert.alert('Erro', 'Esta câmera não possui um aparelho vinculado');
      return;
    }

    const aparelho = getAparelhoByHash(selectedCamera.id_aparelho);
    if (!aparelho) {
      Alert.alert('Erro', 'Aparelho não encontrado');
      return;
    }

    const idCondomino = getIdCondomino(selectedCondominio);
    if (!idCondomino) {
      Alert.alert('Erro', 'Unidade não identificada. Selecione novamente sua unidade.');
      return;
    }

    const idAparelho = parseInt(aparelho.id_tbl_aparelho, 10);
    if (!Number.isInteger(idAparelho) || idAparelho <= 0) {
      Alert.alert('Erro', 'Portão indisponível. Atualize a tela e tente novamente.');
      return;
    }

    setOpeningGate(true);

    try {
      const payload = {
        hash2: aparelho.hash2,
        id_tbl_aparelho: idAparelho,
        id_tbl_condomino: idCondomino,
        command_id: createCommandId(),
      };

      logger.debug('Solicitando abertura do portão:', {
        id_tbl_aparelho: payload.id_tbl_aparelho,
        command_id: payload.command_id,
      });

      const response = await openGate(payload);

      const data = response.data || {};
      logger.debug('Resposta do servidor recebida');

      if (data.status !== 'success') {
        throw new Error(data.mensagem || data.message || 'O servidor não confirmou o comando de abertura.');
      }

      if (data.confirmed === true || data.gate_status === 'open') {
        Alert.alert(
          'Portão aberto',
          data.mensagem || 'A abertura foi confirmada pelo controlador.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Solicitação enviada',
          data.mensagem || 'O servidor recebeu o comando, mas o estado físico do portão ainda não foi confirmado.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMessage =
        error.gateErrorMessage ||
        error.response?.data?.mensagem ||
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        'Não foi possível abrir o portão. Tente novamente.';

      logger.error('❌ Erro ao abrir portão:', {
        message: errorMessage,
        status: error.response?.status ?? error.status,
        code: error.code,
        serverBody: error.response?.data,
      });

      Alert.alert('Erro', errorMessage, [{ text: 'OK' }]);
    } finally {
      setOpeningGate(false);
    }
  }, [
    selectedCamera,
    getAparelhoByHash,
    selectedCondominio,
  ]);

  const createCommandId = () => {
    const random = Math.random().toString(36).slice(2, 12);
    return `gate-${Date.now()}-${random}`;
  };

  const handleOpenCamera = useCallback(async (camera) => {
    setSelectedCamera(camera);
    setModalVisible(true);

    if (!selectedCondominio?.id_tbl_condominio) return;

    try {
      const response = await fetchCameras(selectedCondominio.id_tbl_condominio);
      const camerasList = response.data?.cameras;

      if (!Array.isArray(camerasList)) return;

      const updated = camerasList.find(
        (c) =>
          String(c.id_tbl_cftv) === String(camera.id_tbl_cftv) ||
          String(c.monitorId) === String(camera.monitorId)
      );

      if (updated) {
        setSelectedCamera(updated);
        setCameras(camerasList);
      }
    } catch (error) {
      logger.warn('⚠️ Não foi possível atualizar token da câmera:', error.message);
    }
  }, [selectedCondominio?.id_tbl_condominio]);

  const renderCamera = useCallback(({ item }) => {
    const isOnline = item.status === 'online';

    return (
      <TouchableOpacity
        style={styles.cameraCard}
        onPress={() => handleOpenCamera(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cameraPreview}>
          <CameraFeedImage
            feedUrl={item.feedUrl}
            style={styles.cameraImage}
            resizeMode="cover"
            iconSize={32}
          />
          
          <View style={[styles.statusBadge, { 
            backgroundColor: isOnline ? theme.colors.success : theme.colors.error 
          }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.cameraInfo}>
          <View style={styles.cameraNameRow}>
            <Text style={styles.cameraName} numberOfLines={1}>
              Monitor {item.monitorId}
            </Text>
            {item.id_aparelho && getAparelhoByHash(item.id_aparelho) && (
              <View style={styles.gateIndicator}>
                <Ionicons name="lock-open-outline" size={14} color={theme.colors.success} />
              </View>
            )}
          </View>
          {item.id_aparelho && getAparelhoByHash(item.id_aparelho) && (
            <Text style={styles.cameraGateInfo} numberOfLines={1}>
              {getAparelhoByHash(item.id_aparelho)?.local || 'Portão vinculado'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [aparelhos, getAparelhoByHash, handleOpenCamera]);

  const renderEmptyList = () => {
    if (!selectedCondominio?.id_tbl_condominio) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Nenhum condomínio selecionado</Text>
          <Text style={styles.emptyText}>
            Selecione um condomínio para visualizar as câmeras
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={64} color={theme.colors.textLight} />
        <Text style={styles.emptyTitle}>Nenhuma câmera disponível</Text>
        <Text style={styles.emptyText}>
          Não há câmeras cadastradas para este condomínio
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Câmeras</Text>
          <Text style={styles.headerSubtitle}>{cameras.length} {cameras.length === 1 ? 'câmera' : 'câmeras'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading && cameras.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando câmeras...</Text>
        </View>
      ) : (
        <FlatList
          data={cameras}
          keyExtractor={(item) => item.id_tbl_cftv?.toString() || item.monitorId?.toString()}
          renderItem={renderCamera}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={renderEmptyList}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadCameras}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Full Screen Camera */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <GestureHandlerRootView style={styles.modalGestureRoot}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={theme.colors.white} />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalCameraName}>
                Monitor {selectedCamera?.monitorId}
              </Text>
            </View>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.modalCameraView}>
            <CameraFeedStream
              feedUrl={selectedCamera?.feedUrl}
              style={styles.modalCameraImage}
              resizeMode="contain"
              iconSize={80}
              iconColor={theme.colors.white}
              placeholderBackgroundColor="rgba(255,255,255,0.08)"
            />
            {!selectedCamera?.feedUrl && (
              <Text style={styles.modalPlaceholderText}>
                Monitor {selectedCamera?.monitorId}
              </Text>
            )}
          </View>

          <View style={styles.modalFooter}>
            <View style={[styles.modalStatusBadge, { 
              backgroundColor: selectedCamera?.status === 'online' 
                ? theme.colors.success 
                : theme.colors.error 
            }]}>
              <View style={styles.modalStatusDot} />
              <Text style={styles.modalStatusText}>
                {selectedCamera?.status === 'online' ? 'Online' : 'Offline'}
              </Text>
            </View>

            {/* Botão de abrir portão - só aparece se câmera tiver aparelho vinculado */}
            {selectedCamera?.id_aparelho && getAparelhoByHash(selectedCamera.id_aparelho) && (
              <View style={styles.gateControlContainer}>
                <View style={styles.gateInfoBadge}>
                  <Ionicons name="lock-open-outline" size={16} color={theme.colors.white} />
                  <Text style={styles.gateInfoText}>
                    {getAparelhoByHash(selectedCamera.id_aparelho)?.local || 'Portão vinculado'}
                  </Text>
                </View>
                
                <SwipeButton
                  onSwipeComplete={handleOpenGate}
                  label="Deslize para abrir o portão"
                  icon="chevron-forward"
                  color={theme.colors.success}
                  disabled={openingGate}
                  completedLabel={openingGate ? "Abrindo portão..." : "Portão aberto!"}
                />

                <View style={styles.gateInfoCard}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.colors.white} />
                  <Text style={styles.gateInfoCardText}>
                    O portão fechará automaticamente
                  </Text>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cameraCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.medium,
  },
  cameraPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.white,
  },
  cameraInfo: {
    padding: theme.spacing.md,
  },
  cameraNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cameraName: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  gateIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  cameraGateInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
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
  },
  modalGestureRoot: {
    flex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  modalCameraName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  modalCameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCameraImage: {
    width: '100%',
    height: '100%',
  },
  modalCameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.md,
    opacity: 0.8,
  },
  modalPlaceholderSubtext: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
    opacity: 0.6,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  modalStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
  },
  modalStatusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
  },
  // Gate Control Styles
  gateControlContainer: {
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  gateInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
  },
  gateInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    fontWeight: '500',
  },
  gateInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
    opacity: 0.7,
  },
  gateInfoCardText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
  },
});

