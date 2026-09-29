// src/screens/NotificacaoConfigScreen.js - Tela de preferencias por categoria
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { NOTIFICATION_CATEGORY } from '@/constants/notifications';
import { fetchPreferencias, savePreferencia } from '@/services/notificationsApi';
import { getErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

const CATEGORIA_META = {
  [NOTIFICATION_CATEGORY.ENCOMENDA]: { label: 'Encomendas', desc: 'Chegada de encomendas na portaria', icon: 'cube-outline' },
  [NOTIFICATION_CATEGORY.FATURA]: { label: 'Faturas', desc: 'Vencimento e novas faturas', icon: 'receipt-outline' },
  [NOTIFICATION_CATEGORY.ACESSO]: { label: 'Acessos', desc: 'Dependente entrou via facial', icon: 'people-outline' },
  [NOTIFICATION_CATEGORY.PORTAO]: { label: 'Portoes', desc: 'Abertura de portoes', icon: 'car-outline' },
  [NOTIFICATION_CATEGORY.VEICULO]: { label: 'Veiculos', desc: 'Cadastro e alertas de veiculos', icon: 'car-sport-outline' },
  [NOTIFICATION_CATEGORY.SISTEMA]: { label: 'Sistema', desc: 'Comunicados do condominio', icon: 'megaphone-outline' },
};

export default function NotificacaoConfigScreen({ navigation }) {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPreferencias();
      const arr = res.data?.preferencias || res.data || [];
      const map = {};
      (Array.isArray(arr) ? arr : []).forEach((p) => {
        map[p.categoria] = !!p.habilitado;
      });
      // default habilitado se nao vier do backend
      Object.values(NOTIFICATION_CATEGORY).forEach((cat) => {
        if (map[cat] === undefined) map[cat] = true;
      });
      setPrefs(map);
    } catch (e) {
      logger.warn('[config] load prefs erro:', getErrorMessage(e));
      const map = {};
      Object.values(NOTIFICATION_CATEGORY).forEach((cat) => (map[cat] = true));
      setPrefs(map);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (categoria) => {
    const novo = !prefs[categoria];
    setPrefs((prev) => ({ ...prev, [categoria]: novo }));
    setSaving(categoria);
    try {
      await savePreferencia(categoria, novo ? 1 : 0);
    } catch (e) {
      setPrefs((prev) => ({ ...prev, [categoria]: !novo }));
      Alert.alert('Erro', getErrorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificacoes</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Text style={styles.headerTitle}>Notificacoes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Escolha quais notificacoes deseja receber. Som e vibracao seguem o ajuste do sistema.</Text>

        {Object.values(NOTIFICATION_CATEGORY).map((cat) => {
          const meta = CATEGORIA_META[cat];
          const enabled = !!prefs[cat];
          return (
            <View key={cat} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={meta.icon} size={22} color={enabled ? theme.colors.primary : theme.colors.textLight} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{meta.label}</Text>
                <Text style={styles.rowDesc}>{meta.desc}</Text>
              </View>
              {saving === cat ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Switch
                  value={enabled}
                  onValueChange={() => toggle(cat)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
                  thumbColor={enabled ? theme.colors.primary : theme.colors.white}
                />
              )}
            </View>
          );
        })}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
          <Text style={styles.infoText}>Desativar uma categoria impede que o backend crie novas notificacoes dela para voce (economia de polling).</Text>
        </View>
      </ScrollView>
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: theme.spacing.lg },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginBottom: theme.spacing.lg, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.small,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.text },
  rowDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.info + '12',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  infoText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textLight, lineHeight: 18 },
});
