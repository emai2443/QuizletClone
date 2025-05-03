import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Dimensions, SafeAreaView, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ViewFlashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const router = useRouter();

  useEffect(() => {
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

      if (error) console.error(error);
      else setCards(data);
    };

    fetchCards();
  }, []);

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
              style={{ fontSize: 18, color: '#4b5563', textAlign: 'center' }}
            >
              No flashcards found.
            </Text>
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 16,
              color: '#1f2937',
              textAlign: 'center',
            }}
          >
            Set: {card.set_name}
          </Text>
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
        </View>
      </View>
    </SafeAreaView>
  );
}
