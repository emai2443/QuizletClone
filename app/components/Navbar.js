import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export default function Navbar({ showMenu, onMenuPress, isMenuOpen }) {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#4d4d4d',
        backgroundColor: '#2d2d2d',
      }}
    >
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={{
          padding: 8,
          borderRadius: 8,
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
      </TouchableOpacity>

      {showMenu && (
        <TouchableOpacity
          onPress={onMenuPress}
          style={{
            padding: 8,
            borderRadius: 8,
          }}
        >
          <Ionicons 
            name={isMenuOpen ? "close" : "menu"} 
            size={24} 
            color="#60a5fa" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
} 