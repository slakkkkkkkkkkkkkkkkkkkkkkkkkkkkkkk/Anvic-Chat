import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { biometricService } from '@/services/biometric';

interface BiometricPromptProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onFallback?: () => void;
}

export default function BiometricPrompt({ 
  visible, 
  onSuccess, 
  onCancel, 
  onFallback 
}: BiometricPromptProps) {
  const [authenticating, setAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      loadBiometricType();
      startPulseAnimation();
    }
  }, [visible]);

  const loadBiometricType = async () => {
    const typeDesc = await biometricService.getBiometricTypeDescription();
    setBiometricType(typeDesc);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBiometricAuth = async () => {
    setAuthenticating(true);
    
    try {
      const result = await biometricService.authenticateWithBiometric();
      
      if (result.success) {
        onSuccess();
      } else {
        if (Platform.OS === 'web') {
          console.log(`Erro de autenticação: ${result.error}`);
        } else {
          Alert.alert('Falha na Autenticação', result.error || 'Não foi possível autenticar');
        }
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      if (Platform.OS === 'web') {
        console.log('Erro interno na autenticação');
      } else {
        Alert.alert('Erro', 'Erro interno na autenticação');
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (biometricType.includes('Face') || biometricType.includes('Facial')) {
      return 'face';
    } else if (biometricType.includes('Touch') || biometricType.includes('Digital')) {
      return 'fingerprint';
    }
    return 'security';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Anvic</Text>
            <Text style={styles.subtitle}>Autenticação Necessária</Text>
          </View>

          <Animated.View 
            style={[
              styles.biometricContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <MaterialIcons 
              name={getBiometricIcon() as any} 
              size={80} 
              color={Colors.primary} 
            />
          </Animated.View>

          <Text style={styles.instructionText}>
            Use {biometricType} para acessar o Anvic
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleBiometricAuth}
              disabled={authenticating}
            >
              <MaterialIcons 
                name={getBiometricIcon() as any} 
                size={20} 
                color={Colors.text} 
              />
              <Text style={styles.primaryButtonText}>
                {authenticating ? 'Autenticando...' : `Usar ${biometricType}`}
              </Text>
            </TouchableOpacity>

            {onFallback && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onFallback}
              >
                <MaterialIcons name="lock" size={20} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Usar Senha</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    margin: 20,
    minWidth: 300,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 8,
  },
  biometricContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  instructionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});