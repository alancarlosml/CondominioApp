// src/screens/PortoesScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CameraFeedImage from '@/components/CameraFeedImage';
import SwipeButton from '@/components/SwipeButton';
import { theme } from '@/constants/theme';
import { useCondominio } from '@/contexts/CondominioContext';
import {
  fetchAparelhos,
  fetchCameras,
  getIdCondomino,
  openGate,
} from '@/services/deviceApi';
import logger from '@/utils/logger';

export default function PortoesScreen({ route, navigation }) {
  const { selectedCondominio } = useCondominio();
  const [gateStatus, setGateStatus] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  const [loading, setLoading] = useState(false);
  const [loadingAparelhos, setLoadingAparelhos] = useState(true);
  const [aparelho, setAparelho] = useState(null);
  const [cameraFeed, setCameraFeed] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const isVehicle = route.params?.type !== 'pedestrian';
  const gateType = isVehicle ? 'Veículo' : 'Pedestre';

  // Carregar aparelho do portão
  const loadAparelho = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_condominio) {
      setLoadingAparelhos(false);
      return;
    }

    setLoadingAparelhos(true);
    try {
      const idCondominio = selectedCondominio.id_tbl_condominio;
      logger.debug(`🚪 Carregando aparelhos para portão ${gateType}...`);

      const response = await fetchAparelhos(idCondominio);

      if (response.data && Array.isArray(response.data)) {
        // Filtra pelo tipo de portão (veículo ou pedestre)
        const searchTerm = isVehicle ? 'veículo' : 'pedestre';
        const aparelhoEncontrado = response.data.find(ap => 
          ap.local?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ap.local?.toLowerCase().includes(isVehicle ? 'veiculo' : 'pedestre')
        );

        if (aparelhoEncontrado) {
          setAparelho(aparelhoEncontrado);
          logger.debug('✅ Aparelho encontrado:', aparelhoEncontrado.local);
        } else {
          // Se não encontrou pelo tipo, pega o primeiro disponível se for veículo
          // ou o segundo se for pedestre
          const index = isVehicle ? 0 : 1;
          if (response.data[index]) {
            setAparelho(response.data[index]);
            logger.debug('✅ Aparelho selecionado por índice:', response.data[index].local);
          } else if (response.data[0]) {
            setAparelho(response.data[0]);
            logger.debug('✅ Aparelho selecionado (único disponível):', response.data[0].local);
          }
        }
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar aparelho:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar as informações do portão.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoadingAparelhos(false);
    }
  }, [selectedCondominio?.id_tbl_condominio, isVehicle, gateType, navigation]);

  // Carregar câmera vinculada ao portão
  const loadCamera = useCallback(async () => {
    if (!selectedCondominio?.id_tbl_condominio || !aparelho?.hash2) return;

    try {
      const idCondominio = selectedCondominio.id_tbl_condominio;
      const response = await fetchCameras(idCondominio);

      if (response.data?.cameras) {
        const cameraVinculada = response.data.cameras.find(
          (cam) =>
            cam.id_aparelho === aparelho.hash2 ||
            String(cam.id_aparelho) === String(aparelho.id_tbl_aparelho)
        );
        if (cameraVinculada?.feedUrl) {
          setCameraFeed(cameraVinculada.feedUrl);
          logger.debug('📹 Câmera vinculada encontrada');
        }
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar câmera:', error);
    }
  }, [selectedCondominio?.id_tbl_condominio, aparelho?.hash2]);

  useEffect(() => {
    loadAparelho();
  }, [loadAparelho]);

  useEffect(() => {
    if (aparelho) {
      loadCamera();
    }
  }, [aparelho, loadCamera]);

  useEffect(() => {
    if (gateStatus === 'opening' || gateStatus === 'closing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [gateStatus, animatedValue]);

  const handleOpenGate = async () => {
    if (!aparelho) {
      Alert.alert('Erro', 'Nenhum aparelho configurado para este portão');
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

    setLoading(true);
    setGateStatus('opening');

    try {
      const payload = {
        hash2: aparelho.hash2,
        id_tbl_aparelho: idAparelho,
        id_tbl_condomino: idCondomino,
        // O servidor deve usar este identificador para tornar a operação
        // idempotente. Nunca confirme a abertura somente pelo app.
        command_id: createCommandId(),
      };

      logger.debug('Solicitando abertura do portão:', {
        id_tbl_aparelho: payload.id_tbl_aparelho,
        command_id: payload.command_id,
      });
      logger.debug('📍 Local:', aparelho.local);

      const response = await openGate(payload);

      const data = response.data || {};
      logger.debug('Resposta do servidor recebida');

      if (data.status !== 'success') {
        throw new Error(data.mensagem || data.message || 'O servidor não confirmou o comando de abertura.');
      }

      // Só exibe "aberto" quando o controlador confirma explicitamente o
      // estado. "success" sozinho apenas confirma o recebimento no servidor.
      if (data.confirmed === true || data.gate_status === 'open') {
        setGateStatus('open');
        Alert.alert('Portão aberto', data.mensagem || 'A abertura foi confirmada pelo controlador.');
      } else {
        setGateStatus('closed');
        Alert.alert(
          'Solicitação enviada',
          data.mensagem || 'O servidor recebeu o comando, mas o estado físico do portão ainda não foi confirmado.'
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
      setGateStatus('closed');

      Alert.alert('Erro', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const createCommandId = () => {
    const random = Math.random().toString(36).slice(2, 12);
    return `gate-${Date.now()}-${random}`;
  };

  const getStatusInfo = () => {
    switch (gateStatus) {
      case 'open':
        return {
          text: 'Portão Aberto',
          color: theme.colors.success,
          icon: 'checkmark-circle',
        };
      case 'opening':
        return {
          text: 'Solicitando abertura...',
          color: theme.colors.warning,
          icon: 'hourglass',
        };
      case 'closing':
        return {
          text: 'Fechando...',
          color: theme.colors.warning,
          icon: 'hourglass',
        };
      default:
        return {
          text: 'Portão Fechado',
          color: theme.colors.error,
          icon: 'close-circle',
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (loadingAparelhos) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Portão {gateType}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando informações do portão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!aparelho) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Portão {gateType}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Portão não configurado</Text>
          <Text style={styles.emptyText}>
            Não há aparelho configurado para o portão de {gateType.toLowerCase()} neste condomínio.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Portão {gateType}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
        <Text style={styles.localText}>{aparelho.local}</Text>
      </View>

      <View style={styles.content}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraFeedImage
            feedUrl={cameraFeed}
            style={styles.cameraImage}
            resizeMode="cover"
            iconSize={64}
          />
          {!cameraFeed && (
            <View style={styles.cameraPlaceholderOverlay}>
              <Text style={styles.cameraPlaceholderText}>
                {aparelho.modelo || 'Câmera'}
              </Text>
            </View>
          )}
          
          {(gateStatus === 'opening' || gateStatus === 'closing') && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.white} />
            </View>
          )}
        </View>

        {/* Gate Icon */}
        <View style={styles.gateIconContainer}>
          <Ionicons
            name={isVehicle ? 'car' : 'walk'}
            size={80}
            color={statusInfo.color}
          />
        </View>

        {/* Swipe Button - Estilo iPhone */}
        <View style={styles.swipeContainer}>
          <SwipeButton
            onSwipeComplete={handleOpenGate}
            label="Deslize para abrir o portão"
            icon="chevron-forward"
            color={theme.colors.success}
            disabled={loading || gateStatus === 'open' || gateStatus === 'opening'}
            completedLabel={gateStatus === 'opening' ? "Abrindo portão..." : "Portão aberto!"}
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            O portão fechará automaticamente
          </Text>
        </View>
      </View>
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
  statusContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  localText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  cameraContainer: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    ...theme.shadow.medium,
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
  },
  cameraPlaceholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    pointerEvents: 'none',
  },
  cameraPlaceholderText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateIconContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  swipeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
  },
});
