import { useEffect } from 'react';

import { scrambleEngine } from './engine-client';
import { SCRAMBLE_ENGINE_HTML } from './engine-html.generated';

/**
 * Browser preview version: the same engine page in a hidden iframe, so scrambles
 * also work with `npm run web`. The phone uses the WebView version.
 */
export function ScrambleEngineHost() {
  useEffect(() => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    const frameWindow = iframe.contentWindow as (Window & { ReactNativeWebView?: unknown }) | null;
    if (!frameWindow) return;

    // Give the page the same bridge object a WebView provides.
    frameWindow.ReactNativeWebView = {
      postMessage: (message: string) => scrambleEngine.receive(message),
    };
    scrambleEngine.attach((message) =>
      frameWindow.dispatchEvent(new MessageEvent('message', { data: message })),
    );
    frameWindow.document.open();
    frameWindow.document.write(SCRAMBLE_ENGINE_HTML);
    frameWindow.document.close();

    return () => iframe.remove();
  }, []);

  return null;
}
