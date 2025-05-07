// app/index.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = Math.min(420, SCREEN_WIDTH * 0.98);
const BUTTON_SIZE = Math.max(120, Math.min(180, SCREEN_WIDTH * 0.38));
const BUTTON_ICON_SIZE = Math.max(32, Math.min(44, SCREEN_WIDTH * 0.13));
const BUTTON_FONT_SIZE = Math.max(15, Math.min(18, SCREEN_WIDTH * 0.045));
const H_PADDING = SCREEN_WIDTH < 375 ? 12 : 24;

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error) {
          console.error('Auth error:', error);
          router.replace('/auth/login');
        } else if (!user) {
          router.replace('/auth/login');
        } else {
          setUserEmail(user.email);
          setLoading(false);
          // Start fade in animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        if (isMounted) {
          router.replace('/auth/login');
        }
      }
    };

    checkUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
        }}
      >
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={{ marginTop: 16, color: '#e5e7eb' }}>
          Checking authentication...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
        }}
      >
        <Text style={{ color: '#ef4444', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
          }}
          style={{
            backgroundColor: '#60a5fa',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          alignItems: 'center',
          paddingHorizontal: H_PADDING,
          paddingTop: Platform.OS === 'ios' ? 24 : 16,
        }}
      >
        <View
          style={{
            marginBottom: 24,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#e5e7eb',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Welcome{userEmail ? `, ${userEmail}` : ''}!
          </Text>
          <Text style={{ fontSize: 16, color: '#9ca3af', textAlign: 'center' }}>
            Create and manage your flashcards
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 24,
            paddingTop: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/flashcards/create')}
            style={{
              backgroundColor: '#60a5fa',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: 20,
                borderRadius: 16,
                marginBottom: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={BUTTON_ICON_SIZE}
                color="#ffffff"
              />
            </View>
            <Text
              style={{
                fontSize: BUTTON_FONT_SIZE,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
              }}
            >
              Create Flashcard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/flashcards/view')}
            style={{
              backgroundColor: '#2d2d2d',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                padding: 20,
                borderRadius: 16,
                marginBottom: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="book-outline"
                size={BUTTON_ICON_SIZE}
                color="#60a5fa"
              />
            </View>
            <Text
              style={{
                fontSize: BUTTON_FONT_SIZE,
                fontWeight: 'bold',
                color: '#e5e7eb',
                textAlign: 'center',
              }}
            >
              View Flashcards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: 20,
                borderRadius: 16,
                marginBottom: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={BUTTON_ICON_SIZE}
                color="#ffffff"
              />
            </View>
            <Text
              style={{
                fontSize: BUTTON_FONT_SIZE,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
