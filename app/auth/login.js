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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showModal(error.message || 'Login failed. Please try again.');
        return;
      }

      const user = data.user;
      await ensureUserProfile(user);

      Alert.alert('Login Successful!', 'Welcome back!', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    } catch (err) {
      showModal('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
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
            style={buttonStyle}
            onPress={handleLogin}
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
                color: '#3b82f6',
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
