import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Button,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import Navbar from '../components/Navbar';

export default function ViewFlashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFlashcardList, setShowFlashcardList] = useState(false);
  const router = useRouter();
  
  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const pageAnimation = useRef(new Animated.Value(0)).current;
  const flipRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  useEffect(() => {
    // Fade in animation when component mounts
    Animated.timing(pageAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    fetchCards();
  }, []);

  const handleNavigation = (route) => {
    // Fade out animation before navigation
    Animated.timing(pageAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      router.push(route);
    });
  };

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

  const handleFlip = () => {
    Animated.spring(flipAnimation, {
      toValue: showAnswer ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setShowAnswer((prev) => !prev);
  };

  const animateCardTransition = (direction) => {
    // Reset flip animation
    flipAnimation.setValue(0);
    setShowAnswer(false);

    // Set initial position for slide
    slideAnimation.setValue(0);

    // Animate the slide
    Animated.timing(slideAnimation, {
      toValue: direction === 'next' ? -1 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // After animation completes, update the index
      setIndex((prev) => {
        const newIndex = direction === 'next' 
          ? (prev + 1) % cards.length 
          : (prev - 1 + cards.length) % cards.length;
        return newIndex;
      });
      // Reset slide position
      slideAnimation.setValue(0);
    });
  };

  const toggleFlashcardList = () => {
    const toValue = showFlashcardList ? 0 : 1;
    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    setShowFlashcardList(!showFlashcardList);
  };

  // Get screen height for dynamic vertical offset
  const screenHeight = Dimensions.get('window').height;
  const verticalOffset = screenHeight * 0.12; // 12% from the top

  if (!cards.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <Navbar showMenu={false} />
        <Animated.View
          style={{
            flex: 1,
            opacity: pageAnimation,
          }}
        >
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
                backgroundColor: '#2d2d2d',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 2,
                paddingTop: 200,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: '#e5e7eb',
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                No flashcards found.
              </Text>
              <Button
                title="Create Your First Flashcard"
                onPress={() => handleNavigation('/flashcards/create')}
                color="#60a5fa"
              />
              <View style={{ height: 24 }} />
              <Button
                title="← Back to Home"
                onPress={() => handleNavigation('/')}
                color="#9ca3af"
              />
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const card = cards[index];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Navbar 
        showMenu={true} 
        onMenuPress={toggleFlashcardList} 
        isMenuOpen={showFlashcardList}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: pageAnimation,
        }}
      >
        {/* Flashcard List Overlay */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '80%',
            backgroundColor: '#2d2d2d',
            zIndex: 1000,
            transform: [
              {
                translateX: menuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            display: showFlashcardList ? 'flex' : 'none',
          }}
        >
          <View style={{ padding: 16 }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: 'bold', 
                color: '#e5e7eb' 
              }}>
                All Flashcards
              </Text>
            </View>
            <ScrollView>
              {cards.map((flashcard, idx) => (
                <View
                  key={flashcard.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#4d4d4d',
                    backgroundColor: idx === index ? '#3d3d3d' : 'transparent',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setIndex(idx);
                      toggleFlashcardList();
                    }}
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#e5e7eb',
                        marginBottom: 4,
                      }}
                    >
                      {flashcard.question}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#9ca3af',
                      }}
                      numberOfLines={1}
                    >
                      {flashcard.answer}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      confirmDelete(flashcard.id);
                    }}
                    disabled={isDeleting}
                    style={{
                      padding: 8,
                      marginLeft: 8,
                      borderRadius: 8,
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Overlay when menu is open */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            opacity: overlayAnimation,
            display: showFlashcardList ? 'flex' : 'none',
            pointerEvents: showFlashcardList ? 'auto' : 'none',
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={toggleFlashcardList}
          />
        </Animated.View>

        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 24,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 400,
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 32,
                backgroundColor: '#2d2d2d',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 2,
                position: 'relative',
                minHeight: 500,
              }}
            >
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <View style={{ alignItems: 'flex-start' }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#e5e7eb',
                    }}
                  >
                    Card {index + 1} of {cards.length}
                  </Text>
                </View>
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
              {/* Animated Flashcard */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleFlip}
                style={{
                  width: '100%',
                  minHeight: 200,
                  marginBottom: 24,
                  perspective: 1000,
                  position: 'relative',
                }}
              >
                {/* Background Card (Next/Previous) */}
                <View
                  style={{
                    width: '100%',
                    minHeight: 200,
                    backgroundColor: '#3d3d3d',
                    borderRadius: 12,
                    padding: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 1,
                    borderWidth: 1,
                    borderColor: '#4d4d4d',
                    position: 'absolute',
                    transform: [{ scale: 0.95 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#e5e7eb',
                      textAlign: 'center',
                      paddingVertical: 8,
                      opacity: 0.5,
                    }}
                  >
                    {cards[(index + 1) % cards.length].question}
                  </Text>
                </View>

                <Animated.View
                  style={{
                    width: '100%',
                    transform: [
                      {
                        translateX: slideAnimation.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [-400, 0, 400],
                        }),
                      },
                      {
                        scale: slideAnimation.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [0.95, 1, 0.95],
                        }),
                      },
                    ],
                  }}
                >
                  {/* Front of card (Question) */}
                  <Animated.View
                    style={{
                      width: '100%',
                      minHeight: 200,
                      backgroundColor: '#3d3d3d',
                      borderRadius: 12,
                      padding: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: '#4d4d4d',
                      position: 'absolute',
                      backfaceVisibility: 'hidden',
                      transform: [
                        { rotateY: flipAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg']
                        })}
                      ],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#e5e7eb',
                        textAlign: 'center',
                        paddingVertical: 8,
                      }}
                    >
                      {card.question}
                    </Text>
                  </Animated.View>

                  {/* Back of card (Answer) */}
                  <Animated.View
                    style={{
                      width: '100%',
                      minHeight: 200,
                      backgroundColor: '#34d399',
                      borderRadius: 12,
                      padding: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: '#4d4d4d',
                      position: 'absolute',
                      backfaceVisibility: 'hidden',
                      transform: [
                        { rotateY: flipAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['180deg', '360deg']
                        })}
                      ],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: '#ffffff',
                        textAlign: 'center',
                        paddingVertical: 8,
                      }}
                    >
                      {card.answer}
                    </Text>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 16,
              }}>
                <TouchableOpacity
                  onPress={() => animateCardTransition('previous')}
                  style={{
                    backgroundColor: '#3d3d3d',
                    padding: 12,
                    borderRadius: 8,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#e5e7eb', fontWeight: 'bold' }}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFlip}
                  style={{
                    backgroundColor: '#60a5fa',
                    padding: 12,
                    borderRadius: 8,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Flip Card</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => animateCardTransition('next')}
                  style={{
                    backgroundColor: '#3d3d3d',
                    padding: 12,
                    borderRadius: 8,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#e5e7eb', fontWeight: 'bold' }}>Next</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 24 }} />
            </View>
          </View>
        </ScrollView>

        {/* Floating Add Card Button */}
        <TouchableOpacity
          onPress={() => handleNavigation('/flashcards/create')}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: '#60a5fa',
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
