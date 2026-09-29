/**
 * Normaliza URLs de feed de câmera para uso com <Image> no iOS/Android.
 * ZoneMinder (nph-zms) sem mode retorna MJPEG stream — incompatível com <Image>.
 */

const STREAM_MODES = /mode=(?:stream|mjpeg)/i;
const ZMS_URL = /nph-zms|\/zms/i;
const MODE_PARAM = /[?&]mode=/i;

/**
 * @param {string} feedUrl
 * @param {number} [cacheBust]
 * @param {'single'|'jpeg'} [modeOverride] — single retorna image/jpeg; jpeg retorna MJPEG stream
 */
export function normalizeFeedUrl(feedUrl, cacheBust, modeOverride = 'single') {
  if (!feedUrl || typeof feedUrl !== 'string') return null;

  let url = feedUrl.trim();

  if (ZMS_URL.test(url)) {
    if (STREAM_MODES.test(url)) {
      url = url.replace(STREAM_MODES, `mode=${modeOverride}`);
    } else if (MODE_PARAM.test(url)) {
      url = url.replace(/mode=[^&]*/i, `mode=${modeOverride}`);
    } else {
      url += `${url.includes('?') ? '&' : '?'}mode=${modeOverride}`;
    }
  } else if (STREAM_MODES.test(url)) {
    url = url.replace(STREAM_MODES, `mode=${modeOverride}`);
  }

  if (cacheBust != null) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${cacheBust}`;
  }

  return url;
}

export function isRefreshableFeed(feedUrl) {
  if (!feedUrl) return false;
  return (
    ZMS_URL.test(feedUrl) ||
    /mode=jpeg|mode=single|\.jpe?g|snapshot/i.test(feedUrl)
  );
}

export function isZoneMinderFeed(feedUrl) {
  return Boolean(feedUrl && ZMS_URL.test(feedUrl));
}

/** URL MJPEG contínuo (multipart/x-mixed-replace) para WebView */
export function getStreamFeedUrl(feedUrl) {
  return normalizeFeedUrl(feedUrl, null, 'jpeg');
}

export function supportsMjpegStream(feedUrl) {
  if (!feedUrl) return false;
  return isZoneMinderFeed(feedUrl) || /mode=jpeg|\.mjpe?g|multipart/i.test(feedUrl);
}
