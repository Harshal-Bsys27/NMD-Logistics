import 'react-native-url-polyfill/auto';
import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Config.SUPABASE_URL?.trim();
const supabaseAnonKey = Config.SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in mobile-driver/.env.');
}

const sessionStorage = {
  async getItem(key: string) {
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  },
  async setItem(key: string, value: string) {
    await Keychain.setGenericPassword('supabase-session', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string) {
    await Keychain.resetGenericPassword({ service: key });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    persistSession: true,
    storage: sessionStorage,
  },
});
