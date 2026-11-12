import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export const lightColors = {
  navy: '#0A1A3F',
  navyDeep: '#070F2B',
  blue: '#1D4ED8',
  gold: '#FBBF24',
  background: '#F4F7FC',
  surface: '#FFFFFF',
  text: '#0B1530',
  muted: '#5B6B8C',
  border: '#E3E9F4',
  success: '#15803D',
  warning: '#92400E',
  danger: '#BE123C',
  paleBlue: '#EFF6FF',
  paleGold: '#FFFBEB',
  paleGreen: '#F0FDF4',
  paleRed: '#FFF1F2',
} as const;

export const darkColors = {
  navy: '#0A1A3F',
  navyDeep: '#070F2B',
  blue: '#7AA7FF',
  gold: '#FBBF24',
  background: '#0B1220',
  surface: '#141E2E',
  text: '#E8EEF8',
  muted: '#A4B1C5',
  border: '#2A374A',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#FDA4AF',
  paleBlue: '#172A49',
  paleGold: '#352B16',
  paleGreen: '#163225',
  paleRed: '#3A1D29',
} as const;

export type AppColors = { [Key in keyof typeof lightColors]: string };

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const preferenceKey = '@nmd-driver/theme-mode';
const defaultContext: ThemeContextValue = {
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: async () => {
    throw new Error('Theme settings are unavailable outside the app theme provider.');
  },
};
const ThemeContext = createContext<ThemeContextValue>(defaultContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const modeChangedRef = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(preferenceKey)
      .then((savedMode) => {
        if (
          !active
          || modeChangedRef.current
          || (savedMode !== 'system' && savedMode !== 'light' && savedMode !== 'dark')
        ) return;
        setModeState(savedMode);
      })
      .catch((error: unknown) => {
        console.error('Unable to load the saved appearance preference.', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    modeChangedRef.current = true;
    await AsyncStorage.setItem(preferenceKey, nextMode);
    setModeState(nextMode);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    setMode,
  }), [isDark, mode, setMode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export const colors = lightColors;
