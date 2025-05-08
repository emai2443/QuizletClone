import { useRouter } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function RegisterSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#2d2d2d',
            padding: 32,
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#e5e7eb',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Registration Complete!
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#9ca3af',
              marginBottom: 24,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Please check your email for a confirmation link. Once you've confirmed your email, you can log in to your account.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#60a5fa',
              padding: 16,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={() => router.push('/auth/login')}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
} 