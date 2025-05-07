import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import Navbar from '../components/Navbar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MAX_WIDTH = Math.min(400, SCREEN_WIDTH * 0.95);
const FORM_PADDING = SCREEN_WIDTH < 375 ? 12 : 24;

export default function CreateFlashcard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentCards, setRecentCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRecentCards();
  }, []);

  const fetchRecentCards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecentCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
      Alert.alert('Error', 'Failed to load flashcards');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCreate = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Error', 'Please fill in both question and answer fields');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { error } = await supabase.from('flashcards').insert([
        {
          question: question.trim(),
          answer: answer.trim(),
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      setQuestion('');
      setAnswer('');
      setSuccessModalVisible(true);
      fetchRecentCards(); // Refresh the list after creating
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => handleDelete(id),
          style: 'destructive',
        },
      ]
    );
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchRecentCards(); // Refresh the list after deleting
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      Alert.alert('Error', 'Failed to delete flashcard');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Navbar showMenu={false} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: FORM_PADDING,
            alignItems: 'center',
            minHeight: SCREEN_HEIGHT - 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Create Flashcard Form */}
          <View
            style={{
              marginBottom: 24,
              width: '100%',
              maxWidth: CARD_MAX_WIDTH,
              alignSelf: 'center',
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
              Create New Flashcard
            </Text>
            <TextInput
              style={{
                backgroundColor: '#2d2d2d',
                color: '#e5e7eb',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 16,
                minHeight: 44,
              }}
              placeholder="Question"
              placeholderTextColor="#9ca3af"
              value={question}
              onChangeText={setQuestion}
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={{
                backgroundColor: '#2d2d2d',
                color: '#e5e7eb',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 16,
                minHeight: 44,
              }}
              placeholder="Answer"
              placeholderTextColor="#9ca3af"
              value={answer}
              onChangeText={setAnswer}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              style={{
                backgroundColor: '#60a5fa',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                opacity: loading ? 0.7 : 1,
                minHeight: 44,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}
                >
                  Create Flashcard
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Recent Flashcards List */}
          <View
            style={{
              marginTop: 24,
              width: '100%',
              maxWidth: CARD_MAX_WIDTH,
              alignSelf: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#e5e7eb',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Your Flashcards
            </Text>
            {loadingCards ? (
              <ActivityIndicator color="#60a5fa" />
            ) : recentCards.length > 0 ? (
              <View
                style={{
                  backgroundColor: '#2d2d2d',
                  borderRadius: 12,
                  padding: 16,
                  maxHeight: SCREEN_HEIGHT * 0.5,
                }}
              >
                <ScrollView
                  style={{ maxHeight: SCREEN_HEIGHT * 0.45 }}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={{ gap: 12 }}>
                    {recentCards.map((card) => (
                      <View
                        key={card.id}
                        style={{
                          backgroundColor: '#1a1a1a',
                          padding: 16,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: 44,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: '#e5e7eb',
                              fontSize: 16,
                              marginBottom: 4,
                            }}
                          >
                            {card.question}
                          </Text>
                          <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                            {card.answer}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => confirmDelete(card.id)}
                          disabled={isDeleting}
                          style={{
                            padding: 8,
                            marginLeft: 8,
                            opacity: isDeleting ? 0.5 : 1,
                            minHeight: 44,
                            minWidth: 44,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {isDeleting ? (
                            <ActivityIndicator color="#ef4444" />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={24}
                              color="#ef4444"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
                No flashcards yet. Create your first one!
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={successModalVisible}
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setSuccessModalVisible(false)}
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
                  backgroundColor: '#18181b',
                  padding: 25,
                  borderRadius: 15,
                  width: '90%',
                  maxWidth: CARD_MAX_WIDTH,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
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
                    minHeight: 44,
                    minWidth: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => setSuccessModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#e5e7eb" />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    textAlign: 'center',
                    color: '#e5e7eb',
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
                    color: '#9ca3af',
                  }}
                >
                  Your flashcard has been saved successfully.
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                    minHeight: 44,
                  }}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.push('/flashcards/view');
                  }}
                >
                  <Text
                    style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}
                  >
                    View All Flashcards
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
