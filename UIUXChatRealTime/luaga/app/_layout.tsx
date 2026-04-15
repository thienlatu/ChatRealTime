import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from "../context/OAuth";
import axios from 'axios';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }} />
    </AuthProvider>
  );
}