import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css'; // <- import tailwind base

export default function Layout() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack />
    </SafeAreaView>
  );
}
