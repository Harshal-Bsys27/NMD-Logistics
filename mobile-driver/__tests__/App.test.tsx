/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../src/lib/supabase';
import SignInScreen from '../src/screens/SignInScreen';

jest.mock('react-native-config', () => ({
  GOOGLE_WEB_CLIENT_ID: 'test-web-client-id',
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      type: 'success',
      data: { idToken: 'test-google-id-token' },
    }),
  },
}));

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

test('renders the driver sign-in screen', async () => {
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    screenRef.current = ReactTestRenderer.create(
      <SignInScreen error="" onError={jest.fn()} />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The sign-in screen did not render.');
  expect(screen.root.findAllByType(Text).some((node) => node.props.children === 'Welcome back')).toBe(true);
  expect(screen.root.findAllByType(Text).some((node) => node.props.children === 'Continue with Google')).toBe(true);
});

test('uses the native Google account picker and exchanges its token with Supabase', async () => {
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    screenRef.current = ReactTestRenderer.create(
      <SignInScreen error="" onError={jest.fn()} />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The sign-in screen did not render.');

  const googleButton = screen.root.findByProps({ accessibilityLabel: 'Continue with Google' });
  await ReactTestRenderer.act(async () => {
    googleButton.props.onPress();
  });

  expect(GoogleSignin.configure).toHaveBeenCalledWith({
    webClientId: 'test-web-client-id',
    scopes: ['email', 'profile'],
  });
  expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
  expect(jest.mocked(GoogleSignin.signOut).mock.invocationCallOrder[0])
    .toBeLessThan(jest.mocked(GoogleSignin.signIn).mock.invocationCallOrder[0]);
  expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
    provider: 'google',
    token: 'test-google-id-token',
  });
});
