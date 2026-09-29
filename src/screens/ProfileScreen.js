// src/screens/ProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';
import { getAvailableMenuItems, getUserTypeDisplay } from '../utils/permissions';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [imageError, setImageError] = useState(false);

  // URL base para as imagens
  const IMAGE_BASE_URL = 'https://face.onestartup.com.br/imagens/';
  
  // URL completa da foto do usuário
  const userPhotoUrl = user?.foto 
    ? `${IMAGE_BASE_URL}${user.foto}` 
    : null;

  // Reseta o erro de imagem quando o usuário ou foto mudar
  useEffect(() => {
    setImageError(false);
  }, [user?.foto]);

  const menuItems = useMemo(() => {
    // Veículos e notificações agora possuem áreas próprias na navegação principal.
    return getAvailableMenuItems(user?.tipo_usuario).filter(
      (item) => item.id !== 'vehicles' && item.id !== 'notifications'
    );
  }, [user?.tipo_usuario]);

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          logger.debug('Usuário confirmou logout');
          const result = await logout();
          if (result.success) {
            logger.info('Logout concluído com sucesso');
          } else {
            logger.error('Erro no logout:', result.error);
            Alert.alert('Erro', result.error || 'Não foi possível fazer logout');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {userPhotoUrl && !imageError ? (
                <Image
                  source={{ uri: userPhotoUrl }}
                  style={styles.avatarImage}
                  onError={() => {
                    logger.warn('Erro ao carregar imagem do usuário');
                    setImageError(true);
                  }}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.nome?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.userName}>{user?.nome}</Text>
          <View style={styles.userTypeRow}>
            <Text style={styles.userType}>{getUserTypeDisplay(user?.tipo_usuario)}</Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              <Text style={styles.editProfileText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>

            {user?.cpf && (
              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={18} color={theme.colors.textLight} />
                <Text style={styles.infoText}>CPF: {user.cpf}</Text>
              </View>
            )}
            {user?.telefone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                <Text style={styles.infoText}>{user.telefone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  userType: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  editProfileText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  menuSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    ...theme.shadow.small,
  },
  logoutText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
