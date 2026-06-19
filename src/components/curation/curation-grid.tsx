import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, type ViewToken } from 'react-native';

import { Spacing } from '@/constants/theme';

export type ClipPreviewItem = {
  id: string;
  title: string;
  creator: string;
  durationLabel: string;
  videoUri: string;
  thumbnailUri: string;
};

type CurationGridProps = {
  clips: ClipPreviewItem[];
};

export function CurationGrid({ clips }: CurationGridProps) {
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [autoPausedClipId, setAutoPausedClipId] = useState<string | null>(null);
  const [userPausedClipId, setUserPausedClipId] = useState<string | null>(null);
  const [visibleClipIds, setVisibleClipIds] = useState<Set<string>>(() => new Set());

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 35 }),
    [],
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ClipPreviewItem>[] }) => {
      const nextVisibleClipIds = new Set(
        viewableItems.map(({ item }) => item.id),
      );

      setVisibleClipIds(nextVisibleClipIds);
      setAutoPausedClipId(
        nextVisibleClipIds.has(activeClipId) ? null : activeClipId,
      );
    },
    [activeClipId],
  );

  const handleClipPress = useCallback(
    (clip: ClipPreviewItem) => {
      if (activeClipId === clip.id) {
        setUserPausedClipId((currentPausedClipId) =>
          currentPausedClipId === clip.id ? null : clip.id,
        );
        setAutoPausedClipId(null);
        return;
      }

      setActiveClipId(clip.id);
      setUserPausedClipId(null);
      setAutoPausedClipId(null);
    },
    [activeClipId],
  );


  return (
    <FlatList
      data={clips}
      keyExtractor={(clip) => clip.id}
      numColumns={3}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.contentContainer}
      initialNumToRender={12}
      maxToRenderPerBatch={6}
      removeClippedSubviews
      renderItem={({ item }) => {
        const isActive = activeClipId === item.id;
        const isPaused =
          userPausedClipId === item.id || autoPausedClipId === item.id;
        const isPlaying = isActive && !isPaused && activeClipIsVisible;

  const activeClipIsVisible =
    activeClipId !== null && visibleClipIds.has(activeClipId);

  return (
          <ClipPreviewCell
            clip={item}
            isActive={isActive}
            isPlaying={isPlaying}
            isPaused={isPaused}
            isVideoVisible={isActive && activeClipIsVisible}
            onPress={() => handleClipPress(item)}
          />
        );
      }}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      windowSize={7}
    />
  );
}

type ClipPreviewCellProps = {
  clip: ClipPreviewItem;
  isActive: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  isVideoVisible: boolean;
  onPress: () => void;
};

const ClipPreviewCell = ({
  clip,
  isActive,
  isPaused,
  isPlaying,
  isVideoVisible,
  onPress,
}: ClipPreviewCellProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    onPress={onPress}
    style={styles.cell}>
    <View style={styles.cellInner}>
      {isActive && isVideoVisible ? (
        <ActiveClipPreview clip={clip} isPaused={isPaused} />
      ) : (
        <Image
          source={{ uri: clip.thumbnailUri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      )}

      {isActive && (
        <View pointerEvents="none" style={styles.overlay}>
          <SymbolView
            name={{
              ios: isPlaying && !isPaused ? 'pause.fill' : 'play.fill',
              android: isPlaying && !isPaused ? 'pause' : 'play',
              web: isPlaying && !isPaused ? 'pause' : 'play',
            }}
            size={24}
            tintColor="#ffffff"
          />
        </View>
      )}
    </View>
  </Pressable>
);

type ActiveClipPreviewProps = {
  clip: ClipPreviewItem;
  isPaused: boolean;
};

function ActiveClipPreview({ clip, isPaused }: ActiveClipPreviewProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ActiveVideoPlayer clip={clip} shouldPlay={!isPaused} />
    </View>
  );
}

type ActiveVideoPlayerProps = {
  clip: ClipPreviewItem;
  shouldPlay: boolean;
};

function ActiveVideoPlayer({ clip, shouldPlay }: ActiveVideoPlayerProps) {
  return (
    <VideoPlayer
      clip={clip}
      shouldPlay={shouldPlay}
    />
  );
}

const VideoPlayer = ({ clip, shouldPlay }: ActiveVideoPlayerProps) => {
  const player = useVideoPlayer(clip.videoUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.staysActiveInBackground = false;
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, shouldPlay]);

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  return (
    <VideoView
      allowsPictureInPicture={false}
      contentFit="cover"
      nativeControls={false}
      player={player}
      requiresLinearPlayback
      showsTimecodes={false}
      style={StyleSheet.absoluteFill}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  columnWrapper: {
    gap: Spacing.one,
  },
  cell: {
    flex: 1,
    aspectRatio: 9 / 16,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  cellInner: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
});
