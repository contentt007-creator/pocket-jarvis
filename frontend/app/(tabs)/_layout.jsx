import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

function TabIcon({ name, focused }) {
  return (
    <View style={styles.iconWrap}>
      {focused && <View style={styles.activeDot} />}
      <Ionicons
        name={name}
        size={22}
        color={focused ? colors.primary : colors.textSoft}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        headerShown: false,
        headerStyle: { backgroundColor: colors.bg, shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontSize: 18, fontWeight: '800', color: colors.text },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'flag' : 'flag-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jarvis"
        options={{
          title: 'AI',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'sparkles' : 'sparkles-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    height: Platform.OS === 'ios' ? 86 : 70,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: spacing.xs,
    ...shadows.lg,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabItem: { paddingTop: 4 },
  label: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeDot: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
