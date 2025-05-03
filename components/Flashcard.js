import { Text, TouchableOpacity } from 'react-native';

export default function FlashcardCard({
  question,
  answer,
  showAnswer,
  onFlip,
}) {
  return (
    <TouchableOpacity
      className="border border-gray-300 rounded-lg p-6 mb-4 bg-gray-100"
      onPress={onFlip}
    >
      <Text className="text-lg text-center">
        {showAnswer ? answer : question}
      </Text>
      <Text className="text-sm text-center text-gray-500 mt-2">
        Tap to {showAnswer ? 'see question' : 'see answer'}
      </Text>
    </TouchableOpacity>
  );
}
