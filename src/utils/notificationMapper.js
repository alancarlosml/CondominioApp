/**
 * Mapeador categoria/tipo -> icone, cor, label
 * Centraliza logica hoje dispersa em NotificacoesScreen.getNotificationIcon()
 * @see src/constants/notifications.js
 */
import { theme } from '@/constants/theme';
import { NOTIFICATION_CATEGORY } from '@/constants/notifications';

export function getNotificationVisual(item) {
  const categoria = (item?.categoria || item?.tipo || '').toLowerCase();
  const tipo = (item?.tipo || '').toLowerCase();
  const prioridade = (item?.prioridade || '').toLowerCase();

  // Prioridade critica sobrepoe cor
  if (prioridade === 'critica') {
    return { icon: 'alert-circle', color: theme.colors.error, label: 'Critica' };
  }

  // Mapeamento por categoria
  switch (categoria) {
    case NOTIFICATION_CATEGORY.ENCOMENDA:
    case 'encomenda':
      return { icon: 'cube', color: theme.colors.primary, label: 'Encomenda' };
    case NOTIFICATION_CATEGORY.FATURA:
    case 'fatura':
      if (tipo.includes('overdue')) return { icon: 'alert-circle', color: theme.colors.error, label: 'Fatura vencida' };
      if (tipo.includes('due')) return { icon: 'calendar', color: theme.colors.warning, label: 'Fatura a vencer' };
      return { icon: 'receipt-outline', color: theme.colors.warning, label: 'Fatura' };
    case NOTIFICATION_CATEGORY.ACESSO:
    case 'acesso':
      if (tipo.includes('facial')) return { icon: 'face-recognition', color: theme.colors.info, label: 'Acesso facial' };
      return { icon: 'people', color: theme.colors.info, label: 'Acesso' };
    case NOTIFICATION_CATEGORY.PORTAO:
    case 'portao':
      return { icon: 'car', color: theme.colors.success, label: 'Portao' };
    case NOTIFICATION_CATEGORY.VEICULO:
    case 'veiculo':
      return { icon: 'car-outline', color: theme.colors.success, label: 'Veiculo' };
    case NOTIFICATION_CATEGORY.SISTEMA:
    case 'sistema':
      return { icon: 'megaphone-outline', color: theme.colors.secondary, label: 'Sistema' };
    default:
      // fallback legado por tipo antigo (importante/aviso)
      if (tipo === 'importante' || prioridade === 'alta') return { icon: 'alert-circle', color: theme.colors.error, label: 'Importante' };
      if (tipo === 'aviso') return { icon: 'information-circle', color: theme.colors.info, label: 'Aviso' };
      return { icon: 'notifications', color: theme.colors.textLight, label: 'Notificacao' };
  }
}

export function formatNotificationDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
  if (dOnly === tOnly) return `Hoje as ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  if (dOnly === yOnly) return `Ontem as ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
