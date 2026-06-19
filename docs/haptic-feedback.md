# Haptic Feedback – UX Accessibility

**Labels:** UX · accessibility · intermediate

## Description

Key actions (clip selection, posting, minting, payouts) trigger haptic feedback to give tactile confirmation on physical devices.

## Implementation

### Dependency

`expo-haptics ~56.0.3` is already listed in `package.json` alongside `expo-device` which is used to gate haptics to physical devices only.

### Hook – `src/hooks/use-haptics.ts`

A single `useHaptics()` hook exposes four methods:

| Method | Haptic type | When to call |
|---|---|---|
| `selection()` | `ImpactFeedbackStyle.Light` | Toggling clip selection |
| `action()` | `ImpactFeedbackStyle.Medium` | Primary CTA press ("Post", "Upload", "Finalize & Post") |
| `success()` | `NotificationFeedbackType.Success` | Completed mint or payout |
| `error()` | `NotificationFeedbackType.Error` | Failed operation |

All methods are **no-ops on simulators and web** (`Platform.OS === 'web'` or `!Device.isDevice`).

### Usage example

```tsx
import { useHaptics } from '@/hooks/use-haptics';

function ClipCard({ selected, onToggle }) {
  const haptics = useHaptics();

  const handleToggle = () => {
    haptics.selection();
    onToggle();
  };

  return <Pressable onPress={handleToggle} />;
}
```

```tsx
// Primary CTA
const haptics = useHaptics();

const handlePost = async () => {
  haptics.action();
  try {
    await postClips();
    haptics.success();
  } catch {
    haptics.error();
  }
};
```

## Acceptance Criteria

- [x] `expo-haptics` added to dependencies
- [x] Light impact haptic fires when toggling clip selection → `haptics.selection()`
- [x] Medium impact haptic fires on primary CTA press → `haptics.action()`
- [x] Success notification haptic fires on completed mint or payout → `haptics.success()`
- [x] Error notification haptic fires on failure states → `haptics.error()`
- [x] Haptics are only triggered on physical devices (no-op in simulator/web)
