import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import axios from 'axios';

// Expo Constantsから環境変数を取得
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Config Check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
if (supabaseUrl) {
  console.log('URL:', supabaseUrl.substring(0, 30) + '...');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ Invalid Supabase URL format. Must start with http:// or https://');
  throw new Error('Invalid Supabase URL format');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg =
    'Supabase環境変数が設定されていません。\n' +
    `URL: ${supabaseUrl ? '✅' : '❌'}\n` +
    `Key: ${supabaseAnonKey ? '✅' : '❌'}\n` +
    'アプリを再起動してください（npm start -c）';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

console.log('🔧 Creating Supabase client with axios...');

// axiosベースのfetch実装を作成
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString();

  console.log('🌐 Custom fetch called:', urlString.substring(0, 50) + '...');

  try {
    const response = await axios({
      url: urlString,
      method: (options?.method as any) || 'GET',
      headers: options?.headers as any,
      data: options?.body,
      validateStatus: () => true, // すべてのステータスコードを受け入れる
    });

    // Response互換のオブジェクトを返す
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers as any),
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response;
  } catch (error) {
    console.error('❌ Axios fetch error:', error);
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch as any,
  },
});

console.log('✅ Supabase client created successfully with axios');
