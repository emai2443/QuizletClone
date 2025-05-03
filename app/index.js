// app/index.js
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!isMounted) return;
      if (error) {
        setError('Failed to fetch user. Please try again.');
        setLoading(false);
      } else if (!user) {
        router.replace('/auth/login');
      } else {
        setUserEmail(user.email);
        setLoading(false);
      }
    });
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
          backgroundColor: 'white',
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, color: '#4b5563' }}>
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
          backgroundColor: 'white',
        }}
      >
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
        <Button
          title="Retry"
          onPress={() => {
            setLoading(true);
            setError(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // Get screen height for dynamic vertical offset
  const screenHeight = Dimensions.get('window').height;
  const verticalOffset = screenHeight * 0.12; // 12% from the top

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'white',
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: verticalOffset,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 32,
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 24,
              color: '#1f2937',
              textAlign: 'center',
            }}
          >
            Welcome{userEmail ? `, ${userEmail}` : ''}!
          </Text>
          <Button
            title="Create Flashcard"
            onPress={() => router.push('/flashcards/create')}
            color="#3b82f6"
          />
          <View style={{ height: 16 }} />
          <Button
            title="View Flashcards"
            onPress={() => router.push('/flashcards/view')}
            color="#3b82f6"
          />
          <View style={{ height: 32 }} />
          <Button title="Logout" onPress={handleLogout} color="#ef4444" />
        </View>
      </View>
    </SafeAreaView>
  );
}
