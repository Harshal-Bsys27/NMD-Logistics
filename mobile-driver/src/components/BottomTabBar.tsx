import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme';

export type WorkspaceTab = 'deliveries' | 'history' | 'proofs' | 'profile' | 'settings';

interface BottomTabBarProps {
  activeTab: WorkspaceTab;
  onSelect: (tab: WorkspaceTab) => void;
}

const tabs: { id: WorkspaceTab; label: string; icon: string }[] = [
  { id: 'deliveries', label: 'Deliveries', icon: '▣' },
  { id: 'history', label: 'History', icon: '↻' },
  { id: 'proofs', label: 'Proofs', icon: '✓' },
  { id: 'profile', label: 'Profile', icon: '●' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function BottomTabBar({ activeTab, onSelect }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(tab.id)}
            style={styles.tab}
          >
            <Text style={[styles.icon, selected && styles.selectedIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 7,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  icon: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '700',
  },
  selectedIcon: {
    color: colors.blue,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.blue,
    fontWeight: '800',
  },
});
