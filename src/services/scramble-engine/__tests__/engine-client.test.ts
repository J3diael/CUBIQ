import { ScrambleEngineClient, ScrambleEngineError } from '../engine-client';

function setup(timeoutMs = 1000) {
  const client = new ScrambleEngineClient({ timeoutMs });
  const sent: { id: string; eventId: string }[] = [];
  client.attach((message) => sent.push(JSON.parse(message)));
  return { client, sent };
}

describe('ScrambleEngineClient', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('holds requests until the page is ready, then sends them', async () => {
    const { client, sent } = setup();
    const promise = client.generate('333');
    expect(sent).toHaveLength(0);

    client.receive(JSON.stringify({ type: 'ready' }));
    expect(client.getStatus()).toBe('ready');
    expect(sent).toEqual([{ type: 'scramble', id: 's1', eventId: '333' }]);

    client.receive(JSON.stringify({ type: 'scramble', id: 's1', scramble: "R U R' U'", ms: 12 }));
    await expect(promise).resolves.toBe("R U R' U'");
  });

  it('matches responses to requests by id', async () => {
    const { client } = setup();
    client.receive(JSON.stringify({ type: 'ready' }));
    const a = client.generate('333');
    const b = client.generate('222');
    client.receive(JSON.stringify({ type: 'scramble', id: 's2', scramble: 'B', ms: 1 }));
    client.receive(JSON.stringify({ type: 'scramble', id: 's1', scramble: 'A', ms: 1 }));
    await expect(a).resolves.toBe('A');
    await expect(b).resolves.toBe('B');
  });

  it('rejects one request on a request error', async () => {
    const { client } = setup();
    client.receive(JSON.stringify({ type: 'ready' }));
    const promise = client.generate('xyz');
    client.receive(JSON.stringify({ type: 'error', id: 's1', message: 'unsupported event: xyz' }));
    await expect(promise).rejects.toThrow('unsupported event: xyz');
    expect(client.getStatus()).toBe('ready');
  });

  it('fails everything when the page cannot start', async () => {
    const { client } = setup();
    const statuses: string[] = [];
    client.onStatusChange((s) => statuses.push(s));
    const promise = client.generate('333');
    client.receive(JSON.stringify({ type: 'error', message: 'Worker failed' }));
    await expect(promise).rejects.toBeInstanceOf(ScrambleEngineError);
    await expect(client.generate('333')).rejects.toThrow('Worker failed');
    expect(statuses).toEqual(['failed']);
  });

  it('times out requests that never answer', async () => {
    const { client } = setup(500);
    client.receive(JSON.stringify({ type: 'ready' }));
    const promise = client.generate('333');
    jest.advanceTimersByTime(501);
    await expect(promise).rejects.toThrow('timed out');
  });

  it('resends unanswered requests after the page restarts', () => {
    const { client, sent } = setup();
    client.receive(JSON.stringify({ type: 'ready' }));
    void client.generate('333');
    expect(sent).toHaveLength(1);
    client.restart();
    expect(client.getStatus()).toBe('starting');
    client.receive(JSON.stringify({ type: 'ready' }));
    expect(sent).toHaveLength(2);
    expect(sent[1]).toEqual(sent[0]);
  });

  it('ignores malformed messages', () => {
    const { client } = setup();
    expect(() => client.receive('not json')).not.toThrow();
    expect(() => client.receive(JSON.stringify({ type: 'mystery' }))).not.toThrow();
    expect(client.getStatus()).toBe('starting');
  });
});
