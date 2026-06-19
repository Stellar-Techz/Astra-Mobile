import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ClipSelectionState = 'selected' | 'deselected';

export interface QueuedMutation {
  id: string;
  clipId: string;
  state: ClipSelectionState;
  /** ISO timestamp */
  queuedAt: string;
  error?: string;
}

interface ClipsStore {
  /** clipId → selected state */
  selections: Record<string, ClipSelectionState>;
  queue: QueuedMutation[];
  /** Optimistically toggle clip selection; queues a mutation when offline */
  toggleSelection: (clipId: string, isOnline: boolean) => void;
  /** Replay queued mutations against the API; revert failures */
  replayQueue: (
    apiFn: (clipId: string, state: ClipSelectionState) => Promise<void>,
  ) => Promise<void>;
  /** Mark a queued mutation as failed with an error message */
  setMutationError: (mutationId: string, error: string) => void;
  /** Remove a mutation from the queue (after success) */
  removeMutation: (mutationId: string) => void;
}

export const useClipsStore = create<ClipsStore>()(
  persist(
    (set, get) => ({
      selections: {},
      queue: [],

      toggleSelection(clipId, isOnline) {
        const current = get().selections[clipId] ?? 'deselected';
        const next: ClipSelectionState = current === 'selected' ? 'deselected' : 'selected';

        // Optimistic update
        set((s) => ({ selections: { ...s.selections, [clipId]: next } }));

        if (!isOnline) {
          const mutation: QueuedMutation = {
            id: `${clipId}-${Date.now()}`,
            clipId,
            state: next,
            queuedAt: new Date().toISOString(),
          };
          set((s) => ({ queue: [...s.queue, mutation] }));
        }
      },

      async replayQueue(apiFn) {
        const { queue } = get();
        if (queue.length === 0) return;

        for (const mutation of queue) {
          try {
            await apiFn(mutation.clipId, mutation.state);
            get().removeMutation(mutation.id);
          } catch {
            // Revert optimistic update and surface error
            const reverted: ClipSelectionState =
              mutation.state === 'selected' ? 'deselected' : 'selected';
            set((s) => ({
              selections: { ...s.selections, [mutation.clipId]: reverted },
            }));
            get().setMutationError(mutation.id, 'Sync failed — changes reverted');
          }
        }
      },

      setMutationError(mutationId, error) {
        set((s) => ({
          queue: s.queue.map((m) => (m.id === mutationId ? { ...m, error } : m)),
        }));
      },

      removeMutation(mutationId) {
        set((s) => ({ queue: s.queue.filter((m) => m.id !== mutationId) }));
      },
    }),
    {
      name: 'clips-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
