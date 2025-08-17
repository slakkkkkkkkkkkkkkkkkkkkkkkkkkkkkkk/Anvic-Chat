import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Logo from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/chats');
        } else {
          router.replace('/auth/login');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Logo size={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});