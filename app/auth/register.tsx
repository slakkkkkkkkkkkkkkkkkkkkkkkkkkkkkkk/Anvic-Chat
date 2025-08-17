import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Logo from '@/components/ui/Logo';
import CustomInput from '@/components/ui/CustomInput';
import CustomButton from '@/components/ui/CustomButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validateForm = () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Erro', 'Por favor, preencha todos os campos');
      return false;
    }

    if (password !== confirmPassword) {
      showAlert('Erro', 'As senhas não coincidem');
      return false;
    }

    if (password.length < 6) {
      showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (username.trim().length < 3) {
      showAlert('Erro', 'O nome de usuário deve ter pelo menos 3 caracteres');
      return false;
    }

    // Check username format (only letters, numbers, underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      showAlert('Erro', 'Nome de usuário deve conter apenas letras, números e sublinhados');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const { error } = await signUp(
        email.trim(),
        password,
        name.trim(),
        username.trim().toLowerCase()
      );
      
      if (error) {
        let errorMessage = 'Erro desconhecido';
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Email')) {
          errorMessage = 'Email inválido';
        } else {
          errorMessage = error.message;
        }
        
        showAlert('Erro no Cadastro', errorMessage);
      } else {
        showAlert('Sucesso', 'Conta criada com sucesso! Faça login para continuar');
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Register error:', error);
      showAlert('Erro', 'Erro de conexão. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Criar Conta</Text>
        </View>

        <View style={styles.logoContainer}>
          <Logo size={80} />
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
          />

          <CustomInput
            placeholder="Nome de usuário"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
          />

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

          <CustomInput
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <CustomButton
            title="Criar Conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Já tem uma conta?{' '}
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Entre aqui</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  formContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  registerButton: {
    marginTop: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
});