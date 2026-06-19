# Curation / Clip Selection Screen

Screen path: `src/app/curation.tsx`

After AI processing finishes, users land on this screen to review every generated clip before anything is posted.

## Features

| Feature | Detail |
|---|---|
| 2-column clip grid | Thumbnails with duration (e.g. `0:45`) and viral score (e.g. `Score: 98`) |
| Viral badge | The highest-scoring clip in the current tab shows a red **VIRAL POTENTIAL** badge |
| Selection | Tap any card to toggle selection — teal border + semi-transparent checkmark overlay |
| Select All / Deselect All | Header button toggles every clip in the active tab |
| Selection count | Shown next to the Select All button while ≥ 1 clip is selected |
| Tab filter | **All Clips** · **High Virality** (top 6 by score) · **Recent** (newest first) |
| Post button | Fixed bottom bar; disabled (faded) when nothing is selected; shows count when active |

## Screen anatomy

```
┌─────────────────────────────────────┐
│  My Clips          2 selected  [Select All]  │  ← header
├─────────────────────────────────────┤
│  [All Clips]  [High Virality]  [Recent]      │  ← tab bar
├──────────────┬──────────────────────┤
│ ┌──────────┐ │ ┌──────────┐         │
│ │VIRAL     │ │ │          │         │
│ │POTENTIAL │ │ │          │  ← grid │
│ │    ✓     │ │ │          │         │
│ └──────────┘ │ └──────────┘         │
│  0:45  Sc:98 │  0:35  Sc:95         │
│    …         │    …                 │
├─────────────────────────────────────┤
│     [ Post Selected Clips (2) ]     │  ← bottom bar
└─────────────────────────────────────┘
```

## Navigation

The screen is a standalone Expo Router file route (`src/app/curation.tsx`). Navigate to it from wherever AI processing completes:

```ts
import { router } from 'expo-router';

// after AI job finishes
router.push('/curation');
```

## Extending with real data

The screen currently uses local mock data (`CLIPS` array). Replace it with an API call:

```ts
const { data: clips } = useSWR<Clip[]>(`/clips?videoId=${videoId}`, fetcher);
```

The `Clip` type needs at minimum:

```ts
type Clip = {
  id: string;
  duration: string;   // formatted, e.g. "0:45"
  score: number;      // 0–100 viral score
  createdAt: number;  // Unix ms timestamp
  thumbnailUrl?: string;
};
```

Swap the `<View style={styles.thumbnail}>` placeholder for `<Image source={{ uri: clip.thumbnailUrl }} …>` once real thumbnails are available.

## Design tokens

| Token | Value |
|---|---|
| Accent / teal | `#00D4AA` |
| Viral badge | `#FF4D6D` |
| Selection overlay | `#00D4AA44` (20 % opacity) |
| Disabled button | `#00D4AA55` (33 % opacity) |

Background and text colours come from `useTheme()` so the screen fully supports light and dark mode.
