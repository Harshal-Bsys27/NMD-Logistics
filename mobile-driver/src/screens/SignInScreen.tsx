import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import ActionButton from '../components/ActionButton';
import InlineError from '../components/InlineError';

export default function SignInScreen({
  error: appError,
  onError,
}: {
  error: string;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const webClientId = Config.GOOGLE_WEB_CLIENT_ID?.trim();

  useEffect(() => {
    if (!webClientId) return;
    GoogleSignin.configure({
      webClientId,
      scopes: ['email', 'profile'],
    });
  }, [webClientId]);

  const handleSignIn = async () => {
    setError('');
    onError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Enter your work email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    onError('');
    if (!webClientId) {
      setError('Google sign-in is not configured yet. Add GOOGLE_WEB_CLIENT_ID to mobile-driver/.env and configure Google in Supabase.');
      return;
    }

    setGoogleLoading(true);
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') return;
      if (!response.data.idToken) throw new Error('Google did not return an ID token. Check the Web client ID configuration.');

      const { error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });
      if (authError) throw authError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandMark}>
          <Text style={styles.brandInitial}>N</Text>
        </View>
        <Text style={styles.brand}>NMD LOGISTICS</Text>
        <Text style={styles.eyebrow}>DRIVER APP</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your NMD driver account.</Text>
          <InlineError
            message={error || appError}
            onDismiss={() => {
              setError('');
              onError('');
            }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            disabled={googleLoading || loading}
            onPress={() => handleGoogleSignIn()}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
              (googleLoading || loading) && styles.disabledButton,
            ]}
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Opening Google…' : 'Continue with Google'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR USE EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Work email</Text>
          <TextInput
            accessibilityLabel="Work email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              onSubmitEditing={() => handleSignIn()}
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              returnKeyType="go"
              secureTextEntry={!passwordVisible}
              style={styles.passwordInput}
              textContentType="password"
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={styles.showPassword}
            >
              <Text style={styles.showPasswordText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          <ActionButton label="Sign in" loading={loading} onPress={() => handleSignIn()} />
          <Text style={styles.accessNote}>
            Driver access only. Contact your administrator if you need an account or password reset.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  brandMark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: colors.gold,
    marginBottom: 12,
  },
  brandInitial: {
    color: colors.navy,
    fontSize: 31,
    fontWeight: '900',
  },
  brand: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
  },
  card: {
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: 22,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
  },
  passwordContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    paddingRight: 12,
  },
  passwordInput: {
    minWidth: 0,
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
  },
  showPassword: {
    padding: 8,
  },
  showPasswordText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  accessNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  googleButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  googleButtonPressed: {
    backgroundColor: colors.background,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleMark: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
