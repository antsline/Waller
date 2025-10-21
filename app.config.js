const dotenv = require('dotenv');

// .envファイルを読み込み
dotenv.config();

module.exports = ({ config }) => {
  console.log('📋 app.config.js - Loading environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

  return {
    ...config,
    name: 'Waller',
    slug: 'waller',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'waller',
    userInterfaceStyle: 'automatic',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.waller.app',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            'supabase.co': {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionRequiresForwardSecrecy: true,
              NSIncludesSubdomains: true,
            },
          },
        },
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff',
      },
      package: 'com.waller.app',
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
};
