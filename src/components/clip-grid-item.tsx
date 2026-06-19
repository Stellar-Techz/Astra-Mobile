import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type Clip = {
  id: string;
  uri: string;
  thumbnailColor?: string; // placeholder color when no real thumbnail
};

type Props = {
  clip: Clip;
  isActive: boolean;
  onPress: (id: string) => void;
  size: number;
};

export function ClipGridItem({ clip, isActive, onPress, size }: Props) {
  const theme = useTheme();

  const player = useVideoPlayer(clip.uri, (p) => {
    p.muted = true;
    p.loop = true;
    p.audioMixingMode = 'mixWithOthers';
  });

  // Keep a stable ref to the player for cleanup
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Release the player when the component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      playerRef.current.release();
    };
  }, []);

  return (
    <Pressable
      onPress={() => onPress(clip.id)}
      style={[styles.cell, { width: size, height: size }]}>
      {/* Thumbnail / placeholder */}
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: clip.thumbnailColor ?? theme.backgroundElement },
        ]}
      />

      {/* Video renders only when active to save resources */}
      {isActive && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls={false}
          contentFit="cover"
        />
      )}

      {/* Play/pause overlay icon */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.iconBackground}>
          <ThemedText style={styles.iconText}>{isActive ? '⏸' : '▶'}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    overflow: 'hidden',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
  },
});
