// src/screens/CFTVScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';
import { theme } from '@/constants/theme';
import logger from '@/utils/logger';

// Suporte a rotação via hook

export default function CFTVScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const response = await api.get('/cameras');
      setCameras(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      logger.warn('Erro ao carregar câmeras:', error?.message || error);
      // Mock data
      setCameras([
        {
          id: 5,
          nome: 'Portão Principal',
          localizacao: 'Entrada',
          status: 'online',
          imageUrl: null,
        },
        {
          id: 6,
          nome: 'Garagem',
          localizacao: 'Subsolo',
          status: 'online',
          imageUrl: null,
        },
        {
          id: 7,
          nome: 'Piscina',
          localizacao: 'Área de Lazer',
          status: 'offline',
          imageUrl: null,
        },
        {
          id: 8,
          nome: 'Playground',
          localizacao: 'Área Externa',
          status: 'online',
          imageUrl: null,
        },
      ]);
    }
  };

  const handleOpenCamera = (camera) => {
    setSelectedCamera(camera);
    setModalVisible(true);
  };

  const renderCamera = (camera) => {
    const isOnline = camera.status === 'online';

    return (
      <TouchableOpacity
        key={camera.id}
        style={styles.cameraCard}
        onPress={() => handleOpenCamera(camera)}
        activeOpacity={0.7}
      >
        <View style={styles.cameraPreview}>
          {camera.imageUrl ? (
            <Image source={{ uri: camera.imageUrl }} style={styles.cameraImage} />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons
                name="videocam"
                size={40}
                color={isOnline ? theme.colors.primary : theme.colors.textLight}
              />
            </View>
          )}
          
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
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraName}>{camera.nome}</Text>
            <Ionicons name="expand-outline" size={18} color={theme.colors.primary} />
          </View>
          
          <View style={styles.cameraLocation}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.cameraLocationText}>{camera.localizacao}</Text>
          </View>

          <Text style={styles.cameraId}>Câmera ID {camera.id}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Câmeras (CFTV)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Toque em uma câmera para visualizar em tela cheia
          </Text>
        </View>

        <View style={styles.camerasGrid}>
          {cameras.map((camera) => renderCamera(camera))}
        </View>
      </ScrollView>

      {/* Modal Full Screen Camera */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={theme.colors.white} />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalCameraName}>{selectedCamera?.nome}</Text>
              <Text style={styles.modalCameraLocation}>{selectedCamera?.localizacao}</Text>
            </View>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.modalCameraView}>
            {selectedCamera?.imageUrl ? (
              <Image
                source={{ uri: selectedCamera.imageUrl }}
                style={styles.modalCameraImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalCameraPlaceholder}>
                <Ionicons name="videocam" size={80} color={theme.colors.white} />
                <Text style={styles.modalPlaceholderText}>
                  Câmera ID {selectedCamera?.id}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modalControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="refresh" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="camera" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
  },
  camerasGrid: {
    gap: theme.spacing.md,
  },
  cameraCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.medium,
  },
  cameraPreview: {
    width: '100%',
    height: 200,
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
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.white,
  },
  cameraInfo: {
    padding: theme.spacing.lg,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cameraName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cameraLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  cameraLocationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  cameraId: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
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
  modalCameraLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: 2,
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
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
