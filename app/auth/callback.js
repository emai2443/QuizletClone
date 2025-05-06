import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) {
          console.error('Error confirming email:', error);
          router.replace('/auth/login?error=verification_failed');
        } else {
          router.replace('/auth/login?message=email_verified');
        }
      } catch (err) {
        console.error('Unexpected error during email confirmation:', err);
        router.replace('/auth/login?error=verification_failed');
      }
    };

    if (params.code) {
      handleEmailConfirmation();
    } else {
      router.replace('/auth/login');
    }
  }, [params.code]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
} 