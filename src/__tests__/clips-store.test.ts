/**
 * Unit tests for clips-store queue replay logic.
 * The store is reset between tests via the module factory.
 */

// Mock AsyncStorage so the persist middleware doesn't throw in Node
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { useClipsStore } from '@/stores/clips-store';

function getStore() {
  return useClipsStore.getState();
}

beforeEach(() => {
  useClipsStore.setState({ selections: {}, queue: [] });
});

describe('clips-store queue replay', () => {
  test('successful replay removes mutation from queue and keeps optimistic state', async () => {
    // Pre-populate an offline mutation
    useClipsStore.setState({
      selections: { clip1: 'selected' },
      queue: [{ id: 'mut1', clipId: 'clip1', state: 'selected', queuedAt: new Date().toISOString() }],
    });

    const apiFn = jest.fn().mockResolvedValue(undefined);
    await getStore().replayQueue(apiFn);

    expect(apiFn).toHaveBeenCalledWith('clip1', 'selected');
    expect(getStore().queue).toHaveLength(0);
    expect(getStore().selections.clip1).toBe('selected');
  });

  test('failed replay reverts optimistic state and sets error on mutation', async () => {
    useClipsStore.setState({
      selections: { clip2: 'selected' },
      queue: [{ id: 'mut2', clipId: 'clip2', state: 'selected', queuedAt: new Date().toISOString() }],
    });

    const apiFn = jest.fn().mockRejectedValue(new Error('404 Not Found'));
    await getStore().replayQueue(apiFn);

    // State reverted to opposite of what was queued
    expect(getStore().selections.clip2).toBe('deselected');
    // Error recorded on the mutation
    const failed = getStore().queue.find((m) => m.id === 'mut2');
    expect(failed?.error).toBe('Sync failed — changes reverted');
  });

  test('replays multiple mutations in order; partial failure reverts only failing items', async () => {
    useClipsStore.setState({
      selections: { clip3: 'selected', clip4: 'deselected' },
      queue: [
        { id: 'mut3', clipId: 'clip3', state: 'selected', queuedAt: new Date().toISOString() },
        { id: 'mut4', clipId: 'clip4', state: 'deselected', queuedAt: new Date().toISOString() },
      ],
    });

    const apiFn = jest.fn()
      .mockResolvedValueOnce(undefined)        // clip3 succeeds
      .mockRejectedValueOnce(new Error('500')); // clip4 fails

    await getStore().replayQueue(apiFn);

    // clip3 succeeded → removed from queue, state kept
    expect(getStore().queue.find((m) => m.id === 'mut3')).toBeUndefined();
    expect(getStore().selections.clip3).toBe('selected');

    // clip4 failed → still in queue with error, state reverted
    const failedMut = getStore().queue.find((m) => m.id === 'mut4');
    expect(failedMut?.error).toBe('Sync failed — changes reverted');
    expect(getStore().selections.clip4).toBe('selected'); // reverted from 'deselected'
  });

  test('replay on empty queue is a no-op', async () => {
    const apiFn = jest.fn();
    await getStore().replayQueue(apiFn);
    expect(apiFn).not.toHaveBeenCalled();
    expect(getStore().queue).toHaveLength(0);
  });

  test('toggleSelection offline queues mutation and applies optimistic update', () => {
    getStore().toggleSelection('clip5', false /* offline */);

    expect(getStore().selections.clip5).toBe('selected');
    const queued = getStore().queue.find((m) => m.clipId === 'clip5');
    expect(queued).toBeDefined();
    expect(queued?.state).toBe('selected');
  });

  test('toggleSelection online applies optimistic update without queuing', () => {
    getStore().toggleSelection('clip6', true /* online */);

    expect(getStore().selections.clip6).toBe('selected');
    expect(getStore().queue).toHaveLength(0);
  });
});
