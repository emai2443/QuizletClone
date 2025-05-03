import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CreateFlashcard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      else router.replace('/auth/login');
    });
  }, []);

  const handleSave = async () => {
    if (!question || !answer) {
      Alert.alert('Both question and answer are required.');
      return;
    }

    // Debug: log session and user
    let session;
    if (supabase.auth.getSession) {
      session = (await supabase.auth.getSession()).data.session;
    } else if (supabase.auth.session) {
      session = supabase.auth.session();
    }
    console.log('Current session:', session);
    console.log('Current user:', session?.user);
    console.log('userId being used for insert:', userId);

    const { error } = await supabase.from('flashcards').insert([
      {
        user_id: userId,
        question,
        answer,
      },
    ]);

    if (error) Alert.alert('Error saving flashcard', error.message);
    else {
      Alert.alert('Flashcard saved');
      setQuestion('');
      setAnswer('');
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{ width: '100%', maxWidth: 400, padding: 24, paddingTop: 200 }}
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
          Create Flashcard
        </Text>
        <Text style={{ marginBottom: 4, color: '#374151' }}>Question</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            width: '100%',
          }}
          placeholder="Enter your question"
          onChangeText={setQuestion}
          value={question}
        />
        <Text style={{ marginBottom: 4, color: '#374151' }}>Answer</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            width: '100%',
          }}
          placeholder="Enter the answer"
          onChangeText={setAnswer}
          value={answer}
        />
        <Button title="Save Flashcard" onPress={handleSave} color="#3b82f6" />
      </View>
    </SafeAreaView>
  );
}
