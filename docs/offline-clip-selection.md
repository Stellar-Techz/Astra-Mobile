# Offline Clip Selection

**Labels:** `feature` `offline` `hard`

Users on flaky connections can select/deselect clips optimistically — the UI updates immediately and syncs to the server when connectivity is restored. A banner informs users when they are offline.

---

## How it works

1. **Connectivity monitoring** — `@react-native-community/netinfo` watches the network state via `useNetworkStatus`.
2. **Offline banner** — `<OfflineBanner>` slides in from the top when offline:
   > *You're offline — changes will sync when reconnected*
3. **Optimistic updates** — `useClipsStore.toggleSelection(clipId, isOnline)` updates the local Zustand store immediately regardless of connectivity.
4. **Mutation queue** — When offline, each toggle is also pushed to a `queue: QueuedMutation[]` array persisted with `AsyncStorage`.
5. **Queue replay** — On reconnect, `useNetworkStatus` calls `replayQueue(apiFn)`, which iterates the queue and calls the real API for each pending mutation.
6. **Failure revert** — If a mutation fails during replay (e.g. clip deleted server-side), the UI reverts that clip's state and records an inline error on the mutation entry.
7. **Persistence** — The store (selections + queue) survives app restarts via `zustand/middleware/persist` backed by `AsyncStorage`.

---

## Files

| File | Role |
|---|---|
| `src/stores/clips-store.ts` | Zustand store — optimistic toggle, queue, replay, revert |
| `src/hooks/use-network-status.ts` | NetInfo listener; triggers `replayQueue` on reconnect |
| `src/components/offline-banner.tsx` | Animated amber banner (slides in/out) |
| `src/__tests__/clips-store.test.ts` | Unit tests for queue replay logic |

---

## Dependencies

Both packages are already in `package.json`:

```
@react-native-community/netinfo  12.0.1
@react-native-async-storage/async-storage  2.2.0
```

No additional installation is required.

---

## Usage

### 1. Wrap your screen with the banner

```tsx
import { OfflineBanner } from '@/components/offline-banner';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toggleSelectionApi } from '@/lib/api';

export default function CurationScreen() {
  const isOnline = useNetworkStatus(toggleSelectionApi);

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      {/* rest of screen */}
    </>
  );
}
```

### 2. Toggle a clip

```tsx
const toggleSelection = useClipsStore((s) => s.toggleSelection);

// Inside a press handler:
toggleSelection(clipId, isOnline);
// → UI updates immediately; mutation queued if offline
```

### 3. Show inline errors for failed mutations

```tsx
const queue = useClipsStore((s) => s.queue);
const failedMutation = queue.find((m) => m.clipId === clip.id && m.error);

{failedMutation && <Text style={styles.error}>{failedMutation.error}</Text>}
```

---

## API contract

`replayQueue` expects an async function matching:

```ts
(clipId: string, state: 'selected' | 'deselected') => Promise<void>
```

Throw any error to signal failure — the store will revert and record the error.

---

## Tests

```bash
npm test
```

Six test cases in `src/__tests__/clips-store.test.ts`:

| # | Scenario |
|---|---|
| 1 | Successful replay removes mutation and keeps optimistic state |
| 2 | Failed replay reverts state and records error on mutation |
| 3 | Partial failure — only failing items are reverted |
| 4 | Empty queue is a no-op |
| 5 | `toggleSelection` offline queues mutation + applies optimistic update |
| 6 | `toggleSelection` online applies optimistic update without queuing |

---

## Acceptance criteria status

| Criterion | Status |
|---|---|
| `@react-native-community/netinfo` monitors connectivity | ✅ `use-network-status.ts` |
| Teal/amber banner slides in when offline | ✅ `offline-banner.tsx` (amber-700) |
| Clip selection updated in Zustand immediately | ✅ `toggleSelection` in `clips-store.ts` |
| Pending mutations queued and replayed on reconnect | ✅ `replayQueue` triggered by `useNetworkStatus` |
| Failed mutation reverts UI and shows inline error | ✅ `setMutationError` + state revert in `replayQueue` |
| Offline queue persisted across app restarts | ✅ `zustand/persist` with `AsyncStorage` |
| ≥ 3 unit tests for queue replay | ✅ 6 tests (3 replay + 3 toggle) |
