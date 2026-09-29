import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '@/constants/theme';
import { getStreamFeedUrl, supportsMjpegStream } from '@/utils/cameraFeed';

function escapeHtmlAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');
}

function buildMjpegHtml(streamUrl, objectFit) {
  const safeUrl = escapeHtmlAttr(streamUrl);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #000;
    overflow: hidden;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: ${objectFit};
    display: block;
    background: #000;
  }
</style>
</head>
<body>
  <img src="${safeUrl}" alt="" />
</body>
</html>`;
}

function getStreamOrigin(streamUrl) {
  try {
    const { origin } = new URL(streamUrl);
    return origin;
  } catch {
    return undefined;
  }
}

export default function CameraFeedStream({
  feedUrl,
  style,
  resizeMode = 'contain',
  iconSize = 64,
  iconColor = theme.colors.white,
  placeholderBackgroundColor = '#000',
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const streamUrl = useMemo(() => getStreamFeedUrl(feedUrl), [feedUrl]);
  const canStream = Boolean(streamUrl && supportsMjpegStream(feedUrl));

  const webViewSource = useMemo(() => {
    if (!streamUrl) return null;
    const objectFit = resizeMode === 'cover' ? 'cover' : 'contain';
    return {
      html: buildMjpegHtml(streamUrl, objectFit),
      baseUrl: getStreamOrigin(streamUrl),
    };
  }, [streamUrl, resizeMode]);

  if (!feedUrl || !canStream || failed) {
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
      <WebView
        source={webViewSource}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={false}
        domStorageEnabled={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        androidLayerType="hardware"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        onHttpError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
