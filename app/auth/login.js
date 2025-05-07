import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

// Profile creation helper
async function ensureUserProfile(user) {
  if (!user) return;

  // Check if profile exists
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    // Insert profile now that the user is authenticated
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
      },
    ]);
    if (insertError) {
      console.error('Profile creation error:', insertError);
    }
  }
}

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (params.error === 'verification_failed') {
      showModal('Email verification failed. Please try again or contact support.');
    } else if (params.message === 'email_verified') {
      showModal('Email verified successfully! You can now log in.');
    }
  }, [params]);

  const showModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('Please enter both email and password.');
      return;
    }

    setLoading(true);
    console.log('Attempting login with email:', email);

    try {
      console.log('Calling Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error details:', error);
        showModal(error.message || 'Login failed. Please try again.');
        return;
      }

      console.log('Login successful, user data:', data);
      const user = data.user;
      await ensureUserProfile(user);

      console.log('User profile ensured, redirecting to home...');
      router.replace('/');
    } catch (err) {
      console.error('Unexpected login error:', err);
      showModal('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: '#1a1a1a',
  };

  const formStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 150 : 200,
  };

  const inputContainerStyle = {
    width: '100%',
    maxWidth: 400,
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: '#4d4d4d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
    backgroundColor: '#2d2d2d',
    color: '#e5e7eb',
  };

  const buttonStyle = {
    backgroundColor: '#60a5fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  };

  const secondaryButtonStyle = {
    backgroundColor: '#3d3d3d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  };

  return (
    <SafeAreaView style={containerStyle}>
      <View style={formStyle}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 32,
            textAlign: 'center',
            color: '#e5e7eb',
          }}
        >
          Login
        </Text>
        <View style={inputContainerStyle}>
          <TextInput
            style={inputStyle}
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            style={[
              buttonStyle,
              loading && { opacity: 0.7 }
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                Login
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={secondaryButtonStyle}
            onPress={() => router.push('/auth/register')}
          >
            <Text
              style={{
                color: '#60a5fa',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Back to Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        >
          <View
            style={{
              backgroundColor: '#2d2d2d',
              padding: 25,
              borderRadius: 15,
              width: '90%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 10,
                textAlign: 'center',
                color: '#e5e7eb',
              }}
            >
              Error
            </Text>
            <Text
              style={{
                fontSize: 16,
                marginBottom: 20,
                textAlign: 'center',
                color: '#9ca3af',
              }}
            >
              {modalMessage}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#60a5fa',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
