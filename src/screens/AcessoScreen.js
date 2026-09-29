import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const ACCESS_ITEMS = [
  { id: 'cameras', title: 'Câmeras', description: 'Acompanhe os acessos em tempo real', icon: 'videocam-outline', color: '#7C3AED', screen: 'Cameras', permission: PERMISSIONS.VIEW_CCTV },
  { id: 'people', title: 'Moradores', description: 'Pessoas autorizadas na sua unidade', icon: 'people-outline', color: '#0EA5E9', screen: 'MeusMoradores', permission: PERMISSIONS.VIEW_MORADORES },
  { id: 'vehicles', title: 'Veículos', description: 'Veículos vinculados à sua unidade', icon: 'car-outline', color: '#F59E0B', screen: 'MeusVeiculos', permission: PERMISSIONS.VIEW_VEHICLES },
];

export default function AcessoScreen({ navigation }) {
  const { user } = useAuth();
  const items = useMemo(() => ACCESS_ITEMS.filter((item) => hasPermission(user?.tipo_usuario, item.permission)), [user?.tipo_usuario]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Acesso</Text>
        <Text style={styles.subtitle}>Entrada, segurança e autorizações</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.primaryCard}>
          <View style={styles.primaryIcon}><Ionicons name="key" size={26} color={theme.colors.white} /></View>
          <View style={styles.primaryContent}>
            <Text style={styles.primaryTitle}>Abrir um portão</Text>
            <Text style={styles.primaryText}>Escolha o acesso e confirme a abertura com segurança.</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Portoes')} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Abrir</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Gerenciar acesso</Text>
        <View style={styles.menuCard}>
          {items.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, index === items.length - 1 && styles.menuItemLast]} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}><Ionicons name={item.icon} size={23} color={item.color} /></View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
  title: { fontSize: theme.fontSize.xxl, fontWeight: '800', color: theme.colors.text },
  subtitle: { marginTop: 4, fontSize: theme.fontSize.md, color: theme.colors.textLight },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  primaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, ...theme.shadow.medium },
  primaryIcon: { width: 48, height: 48, borderRadius: theme.borderRadius.md, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  primaryContent: { flex: 1, marginHorizontal: theme.spacing.md },
  primaryTitle: { color: theme.colors.white, fontSize: theme.fontSize.lg, fontWeight: '700' },
  primaryText: { color: theme.colors.white, opacity: 0.85, fontSize: theme.fontSize.sm, marginTop: 3, lineHeight: 18 },
  primaryButton: { backgroundColor: theme.colors.white, paddingHorizontal: theme.spacing.md, paddingVertical: 10, borderRadius: theme.borderRadius.md },
  primaryButtonText: { color: theme.colors.primary, fontWeight: '700' },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  menuCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, ...theme.shadow.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 46, height: 46, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text },
  menuDescription: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 3 },
});
