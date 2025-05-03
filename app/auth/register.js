import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const RATE_LIMIT_DELAY = 30000; // 30 seconds between attempts

  const showModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showModal('Please enter your email address');
      return false;
    }
    if (!emailRegex.test(email)) {
      showModal('Please enter a valid email address (e.g., user@example.com)');
      return false;
    }

    // Password validation
    if (!password) {
      showModal('Please create a password for your account');
      return false;
    }
    if (password.length < 8) {
      showModal(
        `Your password is ${password.length} characters long. It needs to be at least 8 characters.`
      );
      return false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      showModal('Please confirm your password by entering it again');
      return false;
    }
    if (password !== confirmPassword) {
      showModal(
        'The passwords you entered do not match. Please make sure they are identical.'
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Check rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;

    if (timeSinceLastAttempt < RATE_LIMIT_DELAY) {
      const remainingTime = Math.ceil(
        (RATE_LIMIT_DELAY - timeSinceLastAttempt) / 1000
      );
      showModal(`Please wait ${remainingTime} seconds before trying again.`);
      return;
    }

    setLastAttemptTime(now);
    setLoading(true);

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'quizlet-clone://auth/callback',
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          showModal(
            'This email address is already registered. Please try logging in instead.'
          );
        } else if (authError.message.includes('password')) {
          showModal(
            'The password you entered does not meet our security requirements. Please try a different password.'
          );
        } else if (authError.status === 429) {
          showModal(
            'Too many registration attempts. Please wait at least 30 seconds before trying again.'
          );
          // Reset the last attempt time to force a longer wait
          setLastAttemptTime(now - RATE_LIMIT_DELAY + 30000);
        } else {
          showModal(
            'Unable to create your account at this time. Please try again later.'
          );
        }
        return;
      }

      Alert.alert(
        'Account Created Successfully!',
        'Please check your email for a confirmation link before logging in.',
        [{ text: 'OK', onPress: () => router.push('/auth/login') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      if (error.status === 429) {
        showModal(
          'Too many registration attempts. Please wait at least 30 seconds before trying again.'
        );
        // Reset the last attempt time to force a longer wait
        setLastAttemptTime(now - RATE_LIMIT_DELAY + 30000);
      } else {
        showModal(
          'We encountered an unexpected error. Please try again in a few minutes.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: 'white',
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
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    boxShadow: 'none',
    fontSize: 16,
    width: '100%',
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  };

  const secondaryButtonStyle = {
    backgroundColor: '#f3f4f6',
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
            color: '#1f2937',
          }}
        >
          Create Account
        </Text>

        {Platform.OS === 'web' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
            style={inputContainerStyle}
          >
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
            <TextInput
              style={inputStyle}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={buttonStyle}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Register
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={secondaryButtonStyle}
              onPress={() => router.push('/auth/login')}
            >
              <Text
                style={{
                  color: '#3b82f6',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </form>
        ) : (
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
            <TextInput
              style={inputStyle}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={buttonStyle}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Register
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={secondaryButtonStyle}
              onPress={() => router.push('/auth/login')}
            >
              <Text
                style={{
                  color: '#3b82f6',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
              backgroundColor: 'white',
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
                color: '#1f2937',
              }}
            >
              Error
            </Text>
            <Text
              style={{
                fontSize: 16,
                marginBottom: 20,
                textAlign: 'center',
                color: '#4b5563',
              }}
            >
              {modalMessage}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
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

// Call this after a successful login
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
      // Optionally show a modal or log the error
      console.error('Profile creation error:', insertError);
    }
  }
}
