import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ViewFlashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
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

    if (error) {
      console.error('Error fetching cards:', error);
      Alert.alert('Error', 'Failed to fetch flashcards');
    } else {
      setCards(data || []);
      // Reset index if current index is out of bounds
      if (data && data.length > 0 && index >= data.length) {
        setIndex(0);
      }
    }
  };

  const confirmDelete = (cardId) => {
    console.log('Delete button clicked for card:', cardId);
    handleDelete(cardId); // call directly without Alert
    if (isDeleting) {
      console.log('Delete already in progress');
      Alert.alert(
        'Please Wait',
        'A deletion is already in progress. Please wait.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Delete cancelled'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete confirmed for card:', cardId);
            handleDelete(cardId);
          },
        },
      ]
    );
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
        .select(); // Add select to get the deleted data

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
      setCards((prevCards) => {
        const newCards = prevCards.filter((card) => card.id !== cardId);
        console.log('Updated cards list:', newCards);
        return newCards;
      });

      // If we deleted the current card, adjust the index
      if (cards.length > 1) {
        setIndex((prevIndex) => {
          const newIndex =
            prevIndex >= cards.length - 1 ? cards.length - 2 : prevIndex;
          console.log('Updated index:', newIndex);
          return newIndex;
        });
      } else {
        // If this was the last card, reset to empty state
        console.log('No cards left, resetting to empty state');
        setCards([]);
      }

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

  const nextCard = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % cards.length);
  };

  // Get screen height for dynamic vertical offset
  const screenHeight = Dimensions.get('window').height;
  const verticalOffset = screenHeight * 0.12; // 12% from the top

  if (!cards.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              alignItems: 'center',
              padding: 32,
              backgroundColor: 'white',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
              paddingTop: 200,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: '#4b5563',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              No flashcards found.
            </Text>
            <Button
              title="Create Your First Flashcard"
              onPress={() => router.push('/flashcards/create')}
              color="#3b82f6"
            />
            <View style={{ height: 24 }} />
            <Button
              title="← Back to Home"
              onPress={() => router.replace('/')}
              color="#6b7280"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[index];

  // Flip card handler
  const handleFlip = () => setShowAnswer((prev) => !prev);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 200,
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
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#1f2937',
                }}
              >
                Set: {card.set_name}
              </Text>
              <TouchableOpacity
                onPress={() => confirmDelete(card.id)}
                disabled={isDeleting}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>
            {/* Clickable Clean Flashcard */}
            <View
              style={{
                width: '100%',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
              onTouchEnd={handleFlip}
            >
              {showAnswer ? (
                <Text
                  style={{
                    fontSize: 18,
                    color: '#10b981',
                    fontWeight: '600',
                    textAlign: 'center',
                    paddingVertical: 8,
                  }}
                >
                  {card.answer}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: 0,
                    textAlign: 'center',
                    paddingVertical: 8,
                  }}
                >
                  {card.question}
                </Text>
              )}
            </View>
            <View style={{ height: 24 }} />
            <Button title="Next Card" onPress={nextCard} color="#3b82f6" />
            <View style={{ height: 24 }} />
            <Button
              title="← Back to Home"
              onPress={() => router.replace('/')}
              color="#6b7280"
            />
          </View>

          {/* All Flashcards Container */}
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              marginTop: 32,
              marginBottom: 32,
              paddingHorizontal: 24,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 16,
                color: '#1f2937',
              }}
            >
              All Flashcards
            </Text>
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              {cards.map((flashcard, idx) => (
                <TouchableOpacity
                  key={flashcard.id}
                  onPress={() => setIndex(idx)}
                  style={{
                    padding: 16,
                    borderBottomWidth: idx === cards.length - 1 ? 0 : 1,
                    borderBottomColor: '#e5e7eb',
                    backgroundColor: idx === index ? '#f3f4f6' : 'white',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: 4,
                        }}
                      >
                        {flashcard.question}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#6b7280',
                        }}
                        numberOfLines={1}
                      >
                        {flashcard.answer}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDelete(flashcard.id)}
                      disabled={isDeleting}
                      style={{
                        padding: 8,
                        marginLeft: 8,
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ef4444"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
