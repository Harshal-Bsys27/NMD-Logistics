import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme, type ThemeMode } from '../theme';
import InlineError from '../components/InlineError';

const themeOptions: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'system', label: 'System default', description: 'Follow your phone appearance setting' },
  { value: 'light', label: 'Light', description: 'Use the light appearance' },
  { value: 'dark', label: 'Dark', description: 'Use the dark appearance' },
];

export default function SettingsScreen() {
  const { mode, isDark, colors, setMode } = useAppTheme();
  const styles = createStyles(colors);
  const [error, setError] = useState('');
  const [savingMode, setSavingMode] = useState<ThemeMode | null>(null);

  const changeMode = async (nextMode: ThemeMode) => {
    if (nextMode === mode) return;
    setSavingMode(nextMode);
    setError('');
    try {
      await setMode(nextMode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the appearance setting.');
    } finally {
      setSavingMode(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>NMD LOGISTICS</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalize your driver app</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <InlineError message={error} />

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App theme</Text>
          <Text style={styles.cardDescription}>
            Choose how NMD Driver looks on this device.
          </Text>
          <View accessibilityRole="radiogroup" style={styles.options}>
            {themeOptions.map((option) => {
              const selected = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: selected, disabled: savingMode !== null }}
                  disabled={savingMode !== null}
                  onPress={() => changeMode(option.value)}
                  style={[styles.option, selected && styles.selectedOption]}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, selected && styles.selectedText]}>
                      {option.label}
                      {savingMode === option.value ? ' · Saving…' : ''}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text accessibilityRole="text" style={styles.currentTheme}>
            Currently using {isDark ? 'dark' : 'light'} appearance.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Application</Text>
            <Text style={styles.aboutValue}>NMD Driver</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.1</Text>
          </View>
          <View style={styles.separator} />
          <Text style={styles.aboutNote}>
            Settings are saved on this device. Your account and delivery data continue to use your NMD sign-in.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  brand: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  subtitle: {
    color: '#D5DCEE',
    fontSize: 13,
    marginTop: 5,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 15,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cardDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -7,
  },
  options: {
    gap: 8,
  },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectedOption: {
    borderColor: colors.blue,
    backgroundColor: colors.paleBlue,
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedText: {
    color: colors.blue,
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 11,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.muted,
    borderRadius: 10,
  },
  radioSelected: {
    borderColor: colors.blue,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  currentTheme: {
    color: colors.muted,
    fontSize: 11,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  aboutLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  aboutValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  aboutNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
