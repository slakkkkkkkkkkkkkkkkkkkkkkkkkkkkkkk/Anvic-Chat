import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '@/components/ui/Logo';
import CustomInput from '@/components/ui/CustomInput';
import CustomButton from '@/components/ui/CustomButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        let errorMessage = 'Erro desconhecido';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
        } else {
          errorMessage = error.message;
        }
        
        showAlert('Erro no Login', errorMessage);
      } else {
        // Navigation will be handled by AuthContext
        router.replace('/(tabs)/chats');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Erro', 'Erro de conexão. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Logo size={120} />
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <CustomInput
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <CustomButton
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

                    <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Não tem uma conta?{' '}
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  loginButton: {
    marginTop: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.textMuted,
    fontSize: 14,
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  registerLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});