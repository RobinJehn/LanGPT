import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused?: boolean;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarIconStyle: {
          marginBottom: -3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => {
            const iconName = focused ? "chatbox" : "chatbox-outline";
            return <TabBarIcon name={iconName} color={color} focused={focused} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile-settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => {
            const iconName = focused ? "person" : "person-outline";
            return <TabBarIcon name={iconName} color={color} focused={focused} />;
          },
        }}
      />
    </Tabs>
  );
}
