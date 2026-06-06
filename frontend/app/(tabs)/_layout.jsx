import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

function TabIcon({ name, focused, color }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Ionicons name={name} size={22} color={focused ? '#534AB7' : color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#534AB7',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
        headerTitleStyle: { fontSize: 18, fontWeight: '800', color: '#111827' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'flag' : 'flag-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="jarvis" options={{ title: 'Jarvis', headerTitle: '💜 Jarvis', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'sparkles' : 'sparkles-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 36, height: 28, borderRadius: 10 },
  iconActive: { backgroundColor: '#F5F3FF' },
});
