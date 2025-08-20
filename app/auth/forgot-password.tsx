import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Logo from '../../components/ui/Logo';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';
import { Colors } from '../../constants/Colors';
import { authService } from '../../services/endpoints/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showAlert('Erro', 'Por favor, digite seu email');
      return;
    }

    if (!validateEmail(email.trim())) {
      showAlert('Erro', 'Por favor, digite um email válido');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await authService.resetPassword(email.trim());
      
      if (error) {
        let errorMessage = 'Erro desconhecido';
        
        if (error.message.includes('User not found')) {
          errorMessage = 'Email não encontrado em nossa base de dados';
        } else if (error.message.includes('Email rate limit')) {
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
        } else {
          errorMessage = error.message;
        }
        
        showAlert('Erro', errorMessage);
      } else {
        setEmailSent(true);
        showAlert(
          'Email Enviado!', 
          'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha'
        );
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showAlert('Erro', 'Erro de conexão. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Logo size={100} />
          </View>

          <View style={styles.successContent}>
            <MaterialIcons name="mark-email-read" size={80} color={Colors.primary} />
            <Text style={styles.successTitle}>Email Enviado!</Text>
            <Text style={styles.successMessage}>
              Enviamos um link de recuperação para{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            <Text style={styles.instructionsText}>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <CustomButton
              title="Voltar ao Login"
              onPress={navigateToLogin}
              style={styles.backToLoginButton}
            />

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendButtonText}>Enviar para outro email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Recuperar Senha</Text>
        </View>

        <View style={styles.logoContainer}>
          <Logo size={80} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="lock-reset" size={48} color={Colors.primary} />
          </View>

          <Text style={styles.subtitle}>Esqueceu sua senha?</Text>
          <Text style={styles.description}>
            Digite seu email e enviaremos um link para redefinir sua senha.
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              placeholder="Seu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomButton
              title="Enviar Link de Recuperação"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.resetButton}
            />
          </View>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Lembrou da senha?{' '}
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Fazer login</Text>
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
  contentContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    gap: 20,
  },
  resetButton: {
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
  // Success screen styles
  successContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  actionContainer: {
    paddingBottom: 20,
    gap: 16,
  },
  backToLoginButton: {
    marginBottom: 8,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});