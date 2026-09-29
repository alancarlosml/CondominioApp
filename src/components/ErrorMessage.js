// src/components/ErrorMessage.js
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/constants/theme';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Reusable error message component
 * @param {Object} props
 * @param {Error|Object|string} props.error - Error object or error message string
 * @param {Function} props.onRetry - Optional retry callback
 * @param {string} props.title - Optional error title (default: 'Erro')
 * @param {string} props.variant - Display variant: 'inline' | 'card' | 'alert' (default: 'inline')
 */
export default function ErrorMessage({ 
  error, 
  onRetry, 
  title = 'Erro',
  variant = 'inline' 
}) {
  const message = typeof error === 'string' ? error : getErrorMessage(error);

  if (variant === 'card') {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (variant === 'alert') {
    return (
      <View style={styles.alert}>
        <Ionicons name="warning" size={20} color={theme.colors.error} />
        <Text style={styles.alertMessage}>{message}</Text>
      </View>
    );
  }

  // Default inline variant
  return (
    <View style={styles.inline}>
      <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
      <Text style={styles.inlineMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.inlineRetry}>
          <Text style={styles.inlineRetryText}>Tentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
  },
  inlineMessage: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
  inlineRetry: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  inlineRetryText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    ...theme.shadow.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
  cardMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  alertMessage: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    fontWeight: '500',
  },
});

