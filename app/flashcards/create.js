import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CreateFlashcard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [userId, setUserId] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
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
      setSuccessModalVisible(true);
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
        <View style={{ height: 24 }} />
        <Button
          title="← Back to Home"
          onPress={() => router.replace('/')}
          color="#6b7280"
        />
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSuccessModalVisible(false)}>
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
              onStartShouldSetResponder={() => true}
            >
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 15,
                  top: 15,
                  padding: 5,
                  zIndex: 1,
                }}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  color: '#1f2937',
                  marginTop: 10,
                }}
              >
                Flashcard Created!
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  marginBottom: 20,
                  textAlign: 'center',
                  color: '#4b5563',
                }}
              >
                Your flashcard has been saved successfully.
              </Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.push('/flashcards/view');
                  }}
                >
                  <Text
                    style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}
                  >
                    View Flashcards
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.replace('/');
                  }}
                >
                  <Text
                    style={{
                      color: '#3b82f6',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                  >
                    Back to Home
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
