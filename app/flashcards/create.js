import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
  const [showNotification, setShowNotification] = useState(false);
  const notificationOpacity = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    fetchRecentCards();
  }, []);

  const fetchRecentCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cards:', error);
        throw error;
      }

      setRecentCards(data || []);
    } catch (error) {
      console.error('Error in fetchRecentCards:', error);
      Alert.alert('Error', 'Failed to load flashcards');
    } finally {
      setLoadingCards(false);
    }
  };

  const showSuccessNotification = () => {
    setShowNotification(true);
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.delay(2000),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowNotification(false);
    });
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
      showSuccessNotification();
      fetchRecentCards(); // Refresh the list after creating
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId) => {
    console.log('handleDelete called with cardId:', cardId);

    if (!cardId) {
      console.log('Delete attempted with invalid cardId');
      Alert.alert('Error', 'Invalid flashcard ID. Please try again.', [
        { text: 'OK' },
      ]);
      return;
    }

    setIsDeleting(true);
    try {
      // Log the current user and session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      console.log('User error:', userError);

      if (userError) {
        console.error('User error:', userError);
        throw new Error('Failed to get current user');
      }

      if (!user) {
        console.error('No user found');
        throw new Error('No user logged in');
      }

      // First check if the card still exists
      console.log('Checking if card exists:', cardId);
      const { data: existingCard, error: checkError } = await supabase
        .from('flashcards')
        .select('id, user_id, question')
        .eq('id', cardId)
        .single();

      console.log('Existing card check:', {
        existingCard,
        checkError,
        cardId,
        currentUserId: user.id,
      });

      if (checkError) {
        console.error('Error checking card existence:', checkError);
        throw new Error(
          `Failed to verify flashcard existence: ${checkError.message}`
        );
      }

      if (!existingCard) {
        console.log('Card not found:', cardId);
        Alert.alert('Error', 'This flashcard no longer exists.', [
          { text: 'OK' },
        ]);
        return;
      }

      // Verify ownership
      if (existingCard.user_id !== user.id) {
        console.log('Permission denied:', {
          cardUserId: existingCard.user_id,
          currentUserId: user.id,
          cardQuestion: existingCard.question,
        });
        throw new Error('You do not have permission to delete this flashcard');
      }

      console.log('Attempting to delete card:', {
        cardId,
        userId: user.id,
        cardQuestion: existingCard.question,
      });

      const { data: deleteData, error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id)
        .select();

      console.log('Delete response:', { deleteData, error });

      if (error) {
        console.error('Delete error:', error);
        if (error.code === '23503') {
          throw new Error(
            'This flashcard is referenced by other data and cannot be deleted.'
          );
        } else if (error.code === '42501') {
          throw new Error(
            'You do not have permission to delete this flashcard. Please check your Supabase policies.'
          );
        } else {
          throw new Error(`Failed to delete flashcard: ${error.message}`);
        }
      }

      console.log('Card deleted successfully:', {
        cardId,
        userId: user.id,
        cardQuestion: existingCard.question,
      });

      // Remove the deleted card from the local state
      setRecentCards((prevCards) => {
        const newCards = prevCards.filter((card) => card.id !== cardId);
        console.log('Updated cards list:', newCards);
        return newCards;
      });

      Alert.alert('Success', 'Flashcard deleted successfully', [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Error in handleDelete:', error);
      Alert.alert(
        'Error',
        error.message ||
          'An unexpected error occurred while deleting the flashcard. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (cardId) => {
    console.log('Delete button clicked for card:', cardId);
    if (isDeleting) {
      console.log('Delete already in progress');
      Alert.alert(
        'Please Wait',
        'A deletion is already in progress. Please wait.',
        [{ text: 'OK' }]
      );
      return;
    }
    handleDelete(cardId);
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
            <TextInput
              style={{
                backgroundColor: '#2d2d2d',
                color: '#e5e7eb',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 16,
                minHeight: 44,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}
                >
                  Add Card
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
                  maxHeight: SCREEN_HEIGHT * 0.35,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <ScrollView
                  style={{ maxHeight: SCREEN_HEIGHT * 0.3 }}
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
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                          style={{
                            padding: 8,
                            marginLeft: 8,
                            minHeight: 44,
                            minWidth: 44,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={24}
                            color="#ef4444"
                          />
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
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
                width: '100%',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              onPress={() => router.push('/flashcards/view')}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                View All Cards
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Success Notification */}
        {showNotification && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              backgroundColor: '#10b981',
              padding: 16,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: notificationOpacity,
              transform: [
                {
                  translateY: notificationOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text
              style={{
                color: 'white',
                marginLeft: 8,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              Card added successfully!
            </Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
