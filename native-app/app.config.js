import 'dotenv/config';

export default {
  expo: {
    name: 'HomeReview',
    slug: 'homereview',
    version: '1.0.0',
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    splash: {
      image: '../public/hzlogo.png',
      backgroundColor: '#ffffff',
      resizeMode: 'contain',
    },
    // Add other Expo config as needed
  },
}; 