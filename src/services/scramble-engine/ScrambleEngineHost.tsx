import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { scrambleEngine } from './engine-client';
import { SCRAMBLE_ENGINE_HTML } from './engine-html.generated';

/**
 * Hidden WebView that runs cubing.js (see scripts/build-scramble-engine.mjs for why).
 * Mounted once in the root layout. It is invisible and ignores touches.
 */
export function ScrambleEngineHost() {
  // `object` works around the library typing its default generic as `undefined`.
  const webViewRef = useRef<WebView<object>>(null);

  useEffect(() => {
    // RN's postMessage arrives in the page as a `message` event.
    scrambleEngine.attach((message) => webViewRef.current?.postMessage(message));
  }, []);

  const onMessage = (event: WebViewMessageEvent) => scrambleEngine.receive(event.nativeEvent.data);

  const reload = () => {
    scrambleEngine.restart();
    webViewRef.current?.reload();
  };

  return (
    <View
      style={styles.hidden}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
    >
      <WebView<object>
        ref={webViewRef}
        source={{ html: SCRAMBLE_ENGINE_HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={onMessage}
        // The OS may kill the WebView's renderer to save memory; start a fresh one.
        onRenderProcessGone={reload}
        onContentProcessDidTerminate={reload}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  webView: { width: 1, height: 1, backgroundColor: 'transparent' },
});
