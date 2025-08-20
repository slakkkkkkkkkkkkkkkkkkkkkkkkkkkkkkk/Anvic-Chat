import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  lastAuthTime: number;
  sessionDuration: number; // em minutos
}

class BiometricService {
  private static readonly CONFIG_KEY = 'anvic_biometric_config';
  private static readonly DEFAULT_SESSION_DURATION = 30; // 30 minutos

  // Verificar se biometria está disponível
  async isBiometricAvailable(): Promise<{
    available: boolean;
    type: string;
    enrolled: boolean;
  }> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let type = 'none';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        type = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        type = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        type = 'iris';
      }

      return {
        available: compatible,
        type,
        enrolled,
      };
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
      return { available: false, type: 'none', enrolled: false };
    }
  }

  // Configurar biometria
  async configureBiometric(
    enabled: boolean,
    sessionDuration: number = BiometricService.DEFAULT_SESSION_DURATION
  ): Promise<boolean> {
    try {
      if (enabled) {
        const { available, enrolled, type } = await this.isBiometricAvailable();
        
        if (!available || !enrolled) {
          throw new Error('Biometria não disponível ou não configurada');
        }

        // Testar autenticação
        const result = await this.authenticateWithBiometric();
        if (!result.success) {
          return false;
        }

        const config: BiometricConfig = {
          enabled: true,
          type: type as 'fingerprint' | 'face' | 'iris' | 'none',
          lastAuthTime: Date.now(),
          sessionDuration,
        };

        await AsyncStorage.setItem(BiometricService.CONFIG_KEY, JSON.stringify(config));
        return true;
      } else {
        // Desativar biometria
        const config: BiometricConfig = {
          enabled: false,
          type: 'none',
          lastAuthTime: 0,
          sessionDuration: 0,
        };

        await AsyncStorage.setItem(BiometricService.CONFIG_KEY, JSON.stringify(config));
        return true;
      }
    } catch (error) {
      console.error('Erro ao configurar biometria:', error);
      return false;
    }
  }

  // Autenticar com biometria
  async authenticateWithBiometric(): Promise<{
    success: boolean;
    error?: string;
    biometricType?: string;
  }> {
    try {
      const { available, enrolled, type } = await this.isBiometricAvailable();

      if (!available) {
        return { success: false, error: 'Biometria não disponível' };
      }

      if (!enrolled) {
        return { success: false, error: 'Nenhuma biometria cadastrada' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Anvic - Autenticação Biométrica',
        subtitle: 'Use sua biometria para acessar o app',
        fallbackLabel: 'Usar senha',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Atualizar último tempo de autenticação
        await this.updateLastAuthTime();
        return { success: true, biometricType: type };
      } else {
        return { 
          success: false, 
          error: result.error === 'user_cancel' ? 'Cancelado pelo usuário' : 'Falha na autenticação'
        };
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Verificar se precisa de autenticação
  async needsAuthentication(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return false;
      }

      const now = Date.now();
      const sessionExpiry = config.lastAuthTime + (config.sessionDuration * 60 * 1000);
      
      return now > sessionExpiry;
    } catch (error) {
      console.error('Erro ao verificar necessidade de autenticação:', error);
      return true; // Por segurança, solicitar autenticação
    }
  }

  // Obter configuração atual
  async getConfig(): Promise<BiometricConfig> {
    try {
      const configData = await AsyncStorage.getItem(BiometricService.CONFIG_KEY);
      if (!configData) {
        return {
          enabled: false,
          type: 'none',
          lastAuthTime: 0,
          sessionDuration: BiometricService.DEFAULT_SESSION_DURATION,
        };
      }

      return JSON.parse(configData) as BiometricConfig;
    } catch (error) {
      console.error('Erro ao obter configuração:', error);
      return {
        enabled: false,
        type: 'none',
        lastAuthTime: 0,
        sessionDuration: BiometricService.DEFAULT_SESSION_DURATION,
      };
    }
  }

  // Atualizar último tempo de autenticação
  private async updateLastAuthTime(): Promise<void> {
    try {
      const config = await this.getConfig();
      config.lastAuthTime = Date.now();
      await AsyncStorage.setItem(BiometricService.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao atualizar tempo de autenticação:', error);
    }
  }

  // Invalidar sessão (logout ou timeout)
  async invalidateSession(): Promise<void> {
    try {
      const config = await this.getConfig();
      config.lastAuthTime = 0;
      await AsyncStorage.setItem(BiometricService.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao invalidar sessão:', error);
    }
  }

  // Obter texto descritivo da biometria
  async getBiometricTypeDescription(): Promise<string> {
    try {
      const { type, available, enrolled } = await this.isBiometricAvailable();

      if (!available) {
        return 'Biometria não disponível';
      }

      if (!enrolled) {
        return 'Nenhuma biometria cadastrada';
      }

      switch (type) {
        case 'face':
          return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento Facial';
        case 'fingerprint':
          return Platform.OS === 'ios' ? 'Touch ID' : 'Impressão Digital';
        case 'iris':
          return 'Reconhecimento de Íris';
        default:
          return 'Autenticação Biométrica';
      }
    } catch (error) {
      console.error('Erro ao obter descrição da biometria:', error);
      return 'Autenticação Biométrica';
    }
  }
}

export const biometricService = new BiometricService();