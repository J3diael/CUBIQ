import { ScrambleQueue } from '../scramble-queue';

function deferredGenerator() {
  let count = 0;
  const calls: { resolve: (s: string) => void; reject: (e: Error) => void }[] = [];
  const generate = jest.fn(
    () =>
      new Promise<string>((resolve, reject) => {
        calls.push({ resolve, reject });
      }),
  );
  const answerNext = async () => {
    count += 1;
    calls.shift()?.resolve(`scramble-${count}`);
    // Let the queue's async loop continue.
    await Promise.resolve();
    await Promise.resolve();
  };
  return { generate, calls, answerNext };
}

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('ScrambleQueue', () => {
  it('fills up to the target size in the background', async () => {
    let n = 0;
    const queue = new ScrambleQueue({
      generate: async () => `s${++n}`,
      targetSize: 3,
      now: () => 42,
    });
    queue.prefill('333');
    await flush();
    expect(queue.size('333')).toBe(3);
  });

  it('hands out each scramble once, in order, and refills', async () => {
    let n = 0;
    const queue = new ScrambleQueue({
      generate: async () => `s${++n}`,
      targetSize: 2,
      now: () => 7,
    });
    queue.prefill('333');
    await flush();
    await expect(queue.take('333')).resolves.toMatchObject({
      puzzleId: '333',
      notation: 's1',
      generatedAt: 7,
    });
    await expect(queue.take('333')).resolves.toMatchObject({ notation: 's2' });
    await flush();
    expect(queue.size('333')).toBe(2);
    await expect(queue.take('333')).resolves.toMatchObject({ notation: 's3' });
  });

  it('waits for generation when empty, serving the waiting caller first', async () => {
    const { generate, answerNext } = deferredGenerator();
    const queue = new ScrambleQueue({ generate, targetSize: 1 });
    const taken = queue.take('333');
    await answerNext();
    await expect(taken).resolves.toMatchObject({ notation: 'scramble-1' });
  });

  it('generates one scramble at a time', async () => {
    const { generate, calls, answerNext } = deferredGenerator();
    const queue = new ScrambleQueue({ generate, targetSize: 3 });
    queue.prefill('333');
    await flush();
    expect(calls).toHaveLength(1);
    await answerNext();
    await flush();
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('rejects waiting callers when generation fails but recovers on the next take', async () => {
    let fail = true;
    const queue = new ScrambleQueue({
      generate: async () => {
        if (fail) throw new Error('engine down');
        return 'ok';
      },
      targetSize: 1,
    });
    await expect(queue.take('333')).rejects.toThrow('engine down');
    fail = false;
    await expect(queue.take('333')).resolves.toMatchObject({ notation: 'ok' });
  });

  it('keeps separate queues per puzzle', async () => {
    const queue = new ScrambleQueue({ generate: async (id) => `for-${id}`, targetSize: 1 });
    await expect(queue.take('222')).resolves.toMatchObject({
      puzzleId: '222',
      notation: 'for-222',
    });
    await expect(queue.take('333')).resolves.toMatchObject({
      puzzleId: '333',
      notation: 'for-333',
    });
  });

  it('restores saved scrambles and removes each one from storage when it is used', async () => {
    const stored = new Map<
      string,
      { id: string; puzzleId: '333'; notation: string; generatedAt: number }
    >([['a', { id: 'a', puzzleId: '333', notation: 'saved-1', generatedAt: 1 }]]);
    const persistence = {
      load: () => [...stored.values()],
      add: (s: { id: string; puzzleId: '333'; notation: string; generatedAt: number }) =>
        stored.set(s.id, s),
      remove: (id: string) => stored.delete(id),
    };
    let n = 0;
    const queue = new ScrambleQueue({
      generate: async () => `fresh-${++n}`,
      targetSize: 2,
      persistence,
    });
    await expect(queue.take('333')).resolves.toMatchObject({ id: 'a', notation: 'saved-1' });
    expect(stored.has('a')).toBe(false);
    await flush();
    expect([...stored.values()].map((s) => s.notation)).toEqual(['fresh-1', 'fresh-2']);
  });

  it('keeps working when storage fails', async () => {
    const queue = new ScrambleQueue({
      generate: async () => 'ok',
      targetSize: 1,
      persistence: {
        load: () => {
          throw new Error('disk');
        },
        add: () => {
          throw new Error('disk');
        },
        remove: () => {
          throw new Error('disk');
        },
      },
    });
    await expect(queue.take('333')).resolves.toMatchObject({ notation: 'ok' });
  });
});
