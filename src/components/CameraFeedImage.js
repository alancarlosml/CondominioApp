import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theme } from '@/constants/theme';
import { isZoneMinderFeed, normalizeFeedUrl } from '@/utils/cameraFeed';
import logger from '@/utils/logger';

const MODES = ['single', 'jpeg'];

export default function CameraFeedImage({
  feedUrl,
  style,
  resizeMode = 'cover',
  iconSize = 32,
  showPlaceholder = true,
  iconColor = theme.colors.textLight,
  placeholderBackgroundColor = theme.colors.border,
}) {
  const [modeIndex, setModeIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [displayUri, setDisplayUri] = useState(null);
  const hasFrameRef = useRef(false);

  const prefetchAndApply = useCallback(async (nextUri) => {
    if (!nextUri) return false;
    try {
      await Image.prefetch(nextUri);
      setDisplayUri(nextUri);
      hasFrameRef.current = true;
      return true;
    } catch (error) {
      logger.warn('Prefetch câmera falhou, mantendo frame anterior:', error?.message);
      return false;
    }
  }, []);

  useEffect(() => {
    hasFrameRef.current = false;
    setFailed(false);
    setDisplayUri(null);
    setModeIndex(0);

    if (!feedUrl) return undefined;

    let cancelled = false;
    const initialUri = normalizeFeedUrl(feedUrl, null, MODES[0]);

    (async () => {
      try {
        if (!initialUri) throw new Error('URI inválida');
        await Image.prefetch(initialUri);
        if (cancelled) return;
        setDisplayUri(initialUri);
        hasFrameRef.current = true;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feedUrl]);

  const handleError = (event) => {
    const mode = MODES[modeIndex];
    const willRetryMode =
      !hasFrameRef.current &&
      isZoneMinderFeed(feedUrl) &&
      modeIndex < MODES.length - 1;

    logger.warn(`Falha Image câmera (mode=${mode}):`, event?.nativeEvent?.error);

    if (willRetryMode) {
      const nextMode = modeIndex + 1;
      setModeIndex(nextMode);
      prefetchAndApply(normalizeFeedUrl(feedUrl, null, MODES[nextMode]));
      return;
    }

    if (!hasFrameRef.current) {
      setFailed(true);
    }
  };

  if (!feedUrl || (failed && !displayUri)) {
    if (!showPlaceholder) return null;
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: placeholderBackgroundColor },
          style,
        ]}
      >
        <Ionicons name="videocam" size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={styles.image}
          resizeMode={resizeMode}
          onError={handleError}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: placeholderBackgroundColor },
          ]}
        >
          <Ionicons name="videocam" size={iconSize} color={iconColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
