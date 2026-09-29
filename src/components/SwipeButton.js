// src/components/SwipeButton.js
// Componente de slider estilo iPhone para ações de portão
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '@/constants/theme';
import logger from '@/utils/logger';

const BUTTON_WIDTH = 60;
const BUTTON_HEIGHT = 60;
const BORDER_WIDTH = 2; // Largura da borda do container

/**
 * SwipeButton - Componente estilo slider do iPhone
 * @param {Object} props
 * @param {Function} props.onSwipeComplete - Callback quando swipe é completado
 * @param {string} props.label - Texto do botão
 * @param {string} props.icon - Nome do ícone (Ionicons)
 * @param {string} props.color - Cor do botão
 * @param {boolean} props.disabled - Se o botão está desabilitado
 * @param {string} props.completedLabel - Texto quando completado
 */
export default function SwipeButton({
  onSwipeComplete,
  label = 'Deslize para abrir',
  icon = 'chevron-forward',
  color = theme.colors.success,
  disabled = false,
  completedLabel = 'Abrindo...',
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [isCompleted, setIsCompleted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Calcula threshold baseado na largura do container
  const swipeThreshold = containerWidth > 0 
    ? (containerWidth - BUTTON_WIDTH - (BORDER_WIDTH * 2)) * 0.75 
    : 200; // Fallback inicial

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && containerWidth !== width) {
      setContainerWidth(width);
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
    }
  );

  const onHandlerStateChange = (event) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Previne movimento para a esquerda além da origem
      if (translationX < 0) {
        translateX.setValue(0);
      }
      // Limita movimento máximo à direita
      const maxX = containerWidth > 0 ? containerWidth - BUTTON_WIDTH - (BORDER_WIDTH * 2) : 300;
      if (translationX > maxX) {
        translateX.setValue(maxX);
      }
    }

    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      const maxX = containerWidth > 0 ? containerWidth - BUTTON_WIDTH - (BORDER_WIDTH * 2) : 300;
      if (translationX >= swipeThreshold && !isCompleted && !disabled) {
        // Swipe completado - anima até o final
        const finalX = maxX;
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: finalX,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsCompleted(true);
          if (onSwipeComplete) {
            Promise.resolve(onSwipeComplete()).catch((err) => {
              logger.error('SwipeButton: falha ao executar ação:', err?.message || err);
            });
          }
          setTimeout(() => {
            resetButton();
          }, 1500);
        });
      } else {
        // Swipe não completado - volta para origem
        resetButton();
      }
    }
  };

  const resetButton = () => {
    setIsCompleted(false);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animação do ícone quando próximo do threshold
  const maxX = containerWidth > 0 ? containerWidth - BUTTON_WIDTH - (BORDER_WIDTH * 2) : 300;
  const iconScale = translateX.interpolate({
    inputRange: [0, swipeThreshold * 0.7, swipeThreshold],
    outputRange: [1, 1.1, 1.3],
    extrapolate: 'clamp',
  });

  const buttonStyle = {
    transform: [{ translateX }],
    opacity: disabled ? 0.5 : opacity,
  };

  const iconStyle = {
    transform: [{ scale: iconScale }],
  };

  const progressScale = translateX.interpolate({
    inputRange: [0, maxX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container} onLayout={onLayout} accessibilityRole="button" accessibilityLabel={label}>
      <Animated.View
        style={[
          styles.progressBackground,
          {
            backgroundColor: color,
            transform: [{ scaleX: progressScale }],
          },
        ]}
      />

      {/* Texto estático */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>
          {isCompleted ? completedLabel : label}
        </Text>
      </View>

      {/* Botão deslizável */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-1000, 5]} // Primeiro negativo, segundo positivo. Só permite deslizar para direita (mínimo 5px)
        failOffsetY={[-10, 10]} // Falha se deslizar verticalmente
        enabled={!disabled && !isCompleted}
      >
        <Animated.View style={[styles.swipeButton, buttonStyle]}>
          <Animated.View style={iconStyle}>
            <Ionicons name={icon} size={24} color={theme.colors.white} />
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadow.medium,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  labelText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  swipeButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2, // Círculo perfeito (metade da altura)
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'absolute',
    left: BORDER_WIDTH, // Perfeitamente alinhado com a borda interna
    top: BORDER_WIDTH, // Perfeitamente alinhado com a borda interna
    ...theme.shadow.medium,
  },
});

