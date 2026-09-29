// src/components/LoadingSpinner.js
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

/**
 * Reusable loading spinner component
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Spinner size: 'small' | 'large' (default: 'large')
 * @param {string} props.color - Spinner color (default: theme primary color)
 * @param {boolean} props.fullScreen - Whether to show full screen overlay (default: false)
 */
export default function LoadingSpinner({ 
  message, 
  size = 'large', 
  color = theme.colors.primary,
  fullScreen = false 
}) {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});

