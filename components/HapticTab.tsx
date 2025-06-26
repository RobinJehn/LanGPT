import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const handlePressIn = (ev: any) => {
    if (Platform.OS === 'ios') {
      // Add a soft haptic feedback when pressing down on the tabs.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    props.onPressIn?.(ev);
  };

  return (
    <PlatformPressable
      {...props}
      onPressIn={handlePressIn}
      style={props.style}
      accessibilityRole="button"
      accessibilityState={{ selected: props.accessibilityState?.selected }}
    />
  );
}
