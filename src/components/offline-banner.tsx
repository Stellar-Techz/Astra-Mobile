import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 40;

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-BANNER_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? -BANNER_HEIGHT : 0, { duration: 300 });
  }, [isOnline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle, { paddingTop: insets.top }]}>
      <Text style={styles.text}>You're offline — changes will sync when reconnected</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#B45309', // amber-700
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  text: {
    color: '#FFFBEB',
    fontSize: 12,
    fontWeight: '600',
  },
});
