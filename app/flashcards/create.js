import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import Navbar from '../components/Navbar';

export default function CreateFlashcard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentCards, setRecentCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
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
      const { data: { user } } = await supabase.auth.getUser();
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
        { text: 'Delete', onPress: () => handleDelete(id), style: 'destructive' },
      ]
    );
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Navbar showMenu={false} />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 32 }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e5e7eb', marginBottom: 16 }}>
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
            }}
            placeholder="Question"
            placeholderTextColor="#9ca3af"
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <TextInput
            style={{
              backgroundColor: '#2d2d2d',
              color: '#e5e7eb',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 16,
            }}
            placeholder="Answer"
            placeholderTextColor="#9ca3af"
            value={answer}
            onChangeText={setAnswer}
            multiline
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
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                Create Flashcard
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#e5e7eb', marginBottom: 16 }}>
            Your Flashcards
          </Text>
          {loadingCards ? (
            <ActivityIndicator color="#60a5fa" />
          ) : recentCards.length > 0 ? (
            <View style={{ 
              backgroundColor: '#2d2d2d', 
              borderRadius: 12,
              padding: 16,
            }}>
              <ScrollView 
                style={{ maxHeight: 400 }}
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
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#e5e7eb', fontSize: 16, marginBottom: 4 }}>
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
                        }}
                      >
                        {isDeleting ? (
                          <ActivityIndicator color="#ef4444" />
                        ) : (
                          <Ionicons name="trash-outline" size={24} color="#ef4444" />
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
    </View>
  );
}
