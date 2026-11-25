/**
 * Runs inside the hidden WebView (a browser environment, not React Native).
 * Starts cubing.js's search worker from an inline Blob and answers scramble
 * requests from the app over the WebView message bridge.
 *
 * Protocol (JSON strings):
 *   app → page: { type: 'scramble', id: string, eventId: string }
 *   page → app: { type: 'ready' }
 *             | { type: 'scramble', id, scramble: string, ms: number }
 *             | { type: 'error', id?: string, message: string }
 */
import { wrap, type Remote } from 'comlink';

interface InsideAPI {
  randomScrambleStringForEvent(eventId: string): Promise<string>;
  setScramblePrefetchLevel(level: 'auto' | 'none' | 'immediate'): void;
  setDebugMeasurePerf(measure: boolean): void;
}

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
  }
}

function send(message: object) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

function startWorker(): Promise<Remote<InsideAPI>> {
  const source = document.getElementById('cubing-worker')?.textContent;
  if (!source) throw new Error('Worker source missing from page');
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  const worker = new Worker(url);
  return new Promise((resolve, reject) => {
    worker.addEventListener('error', (e) => reject(new Error(e.message || 'Worker failed')), {
      once: true,
    });
    worker.addEventListener(
      'message',
      (e) => {
        if (e.data === 'comlink-exposed') resolve(wrap<InsideAPI>(worker));
        else reject(new Error(`Unexpected worker message: ${String(e.data)}`));
      },
      { once: true },
    );
  });
}

const apiPromise = startWorker().then(async (api) => {
  // The app keeps its own queue, so cubing's internal prefetch would only compete with it.
  await api.setScramblePrefetchLevel('none');
  await api.setDebugMeasurePerf(false);
  return api;
});

apiPromise.then(
  () => send({ type: 'ready' }),
  (error: unknown) => send({ type: 'error', message: String(error) }),
);

async function handle(raw: unknown) {
  if (typeof raw !== 'string') return;
  let request: { type?: string; id?: string; eventId?: string };
  try {
    request = JSON.parse(raw);
  } catch {
    return;
  }
  if (request.type !== 'scramble' || !request.id || !request.eventId) return;
  const started = performance.now();
  try {
    const api = await apiPromise;
    const scramble = await api.randomScrambleStringForEvent(request.eventId);
    send({
      type: 'scramble',
      id: request.id,
      scramble,
      ms: Math.round(performance.now() - started),
    });
  } catch (error) {
    send({ type: 'error', id: request.id, message: String(error) });
  }
}

// Android delivers injected messages on document, iOS on window.
window.addEventListener('message', (e) => void handle(e.data));
document.addEventListener('message', (e) => void handle((e as MessageEvent).data));
