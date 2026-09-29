import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const UPCOMING = [
  { id: 'booking', title: 'Reservas', icon: 'calendar-outline' },
  { id: 'requests', title: 'Ocorrências', icon: 'chatbox-ellipses-outline' },
  { id: 'documents', title: 'Documentos', icon: 'document-text-outline' },
];

export default function ServicosScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Serviços</Text>
        <Text style={styles.subtitle}>Tudo o que você precisa do condomínio</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Encomendas')} activeOpacity={0.7}>
            <View style={styles.menuIcon}><Ionicons name="cube-outline" size={24} color={theme.colors.success} /></View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Encomendas</Text>
              <Text style={styles.menuDescription}>Acompanhe recebimentos e retiradas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Em breve</Text>
        <View style={styles.upcomingGrid}>
          {UPCOMING.map((item) => (
            <View key={item.id} style={styles.upcomingCard}>
              <Ionicons name={item.icon} size={23} color={theme.colors.textLight} />
              <Text style={styles.upcomingTitle}>{item.title}</Text>
            </View>
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
  menuCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, ...theme.shadow.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md },
  menuIcon: { width: 48, height: 48, borderRadius: theme.borderRadius.md, backgroundColor: '#16A34A18', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text },
  menuDescription: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 3 },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  upcomingGrid: { flexDirection: 'row', gap: theme.spacing.sm },
  upcomingCard: { flex: 1, minHeight: 88, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', opacity: 0.65, borderWidth: 1, borderColor: theme.colors.border },
  upcomingTitle: { marginTop: theme.spacing.sm, fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.textLight },
});
