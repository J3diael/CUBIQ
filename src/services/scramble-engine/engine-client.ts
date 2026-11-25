/**
 * The app side of the scramble engine bridge. It turns WebView messages into
 * promises. It has no React or WebView imports, so it is unit tested directly.
 */

export type EngineMessage =
  | { type: 'ready' }
  | { type: 'scramble'; id: string; scramble: string; ms: number }
  | { type: 'error'; id?: string; message: string };

export type EngineStatus = 'starting' | 'ready' | 'failed';

export class ScrambleEngineError extends Error {
  override name = 'ScrambleEngineError';
}

interface Pending {
  resolve: (scramble: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface EngineClientOptions {
  /** Requests that take longer than this fail, so the UI never waits forever. */
  timeoutMs?: number;
}

export class ScrambleEngineClient {
  private status: EngineStatus = 'starting';
  private failure: string | null = null;
  private send: ((message: string) => void) | null = null;
  private pending = new Map<string, Pending>();
  /** Serialized request per pending id, kept so requests can be resent after a restart. */
  private requests = new Map<string, string>();
  /** Requests made before the page was ready, sent once it is. */
  private outbox: string[] = [];
  private nextId = 1;
  private readonly timeoutMs: number;
  private listeners = new Set<(status: EngineStatus) => void>();

  constructor(options: EngineClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getFailure(): string | null {
    return this.failure;
  }

  onStatusChange(listener: (status: EngineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Called by the WebView host once it can deliver messages to the page. */
  attach(send: (message: string) => void): void {
    this.send = send;
  }

  /** Called by the WebView host when the page is reloaded (e.g. Android killed the WebView). */
  restart(): void {
    this.setStatus('starting');
    this.failure = null;
    // Requests already sent to the old page are lost; resend them to the new one.
    this.outbox = [...this.requests.values()];
  }

  /** Feeds a raw message from the WebView. Unknown or malformed messages are ignored. */
  receive(raw: string): void {
    const message = parseMessage(raw);
    if (!message) return;

    if (message.type === 'ready') {
      this.setStatus('ready');
      const queued = this.outbox;
      this.outbox = [];
      queued.forEach((m) => this.send?.(m));
      return;
    }

    if (message.type === 'scramble') {
      this.settle(message.id, (p) => p.resolve(message.scramble));
      return;
    }

    if (message.id) {
      this.settle(message.id, (p) => p.reject(new ScrambleEngineError(message.message)));
    } else {
      // The page itself failed to start: fail everything waiting.
      this.failure = message.message;
      this.setStatus('failed');
      for (const id of [...this.pending.keys()]) {
        this.settle(id, (p) => p.reject(new ScrambleEngineError(message.message)));
      }
      this.outbox = [];
    }
  }

  /** Requests one scramble for a WCA event id, e.g. '333'. */
  generate(eventId: string): Promise<string> {
    if (this.status === 'failed') {
      return Promise.reject(
        new ScrambleEngineError(this.failure ?? 'Scramble engine failed to start'),
      );
    }
    const id = `s${this.nextId++}`;
    const message = JSON.stringify({ type: 'scramble', id, eventId });
    this.requests.set(id, message);

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.settle(id, (p) =>
          p.reject(new ScrambleEngineError(`Scramble for ${eventId} timed out`)),
        );
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });

      if (this.status === 'ready' && this.send) this.send(message);
      else this.outbox.push(message);
    });
  }

  private settle(id: string, fn: (pending: Pending) => void): void {
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    this.requests.delete(id);
    fn(pending);
  }

  private setStatus(status: EngineStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}

function parseMessage(raw: string): EngineMessage | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('type' in data)) return null;
    const message = data as Record<string, unknown>;
    switch (message.type) {
      case 'ready':
        return { type: 'ready' };
      case 'scramble':
        if (typeof message.id === 'string' && typeof message.scramble === 'string') {
          return {
            type: 'scramble',
            id: message.id,
            scramble: message.scramble,
            ms: typeof message.ms === 'number' ? message.ms : 0,
          };
        }
        return null;
      case 'error':
        return {
          type: 'error',
          id: typeof message.id === 'string' ? message.id : undefined,
          message: typeof message.message === 'string' ? message.message : 'Unknown error',
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** The single engine instance used by the app. */
export const scrambleEngine = new ScrambleEngineClient();
