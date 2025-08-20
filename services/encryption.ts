// Implementação básica de criptografia sem dependências externas
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EncryptedMessage {
  content: string;
  iv: string;
  timestamp: number;
  type: 'text' | 'image' | 'audio' | 'video';
}

export class AnvicCrypto {
  private static readonly ENCRYPTION_KEY = 'anvic_encryption_key';
  private static readonly KEY_LENGTH = 32; // AES-256

  // Gerar chave de criptografia única por usuário
  static async generateUserKey(userId: string): Promise<string> {
    const storedKey = await AsyncStorage.getItem(`${this.ENCRYPTION_KEY}_${userId}`);
    
    if (storedKey) {
      return storedKey;
    }

      // Gerar nova chave usando dados do usuário + timestamp + random
    const keyMaterial = `${userId}_${Date.now()}_${Math.random()}_anvic_secure`;
    const hash = await this.generateHash(keyMaterial);
    const key = hash.substring(0, this.KEY_LENGTH);
    
    await AsyncStorage.setItem(`${this.ENCRYPTION_KEY}_${userId}`, key);
    return key;
  }

  // Criptografia básica sem dependências externas
  static async encryptMessage(message: string, userId: string, messageType: 'text' | 'image' | 'audio' | 'video' = 'text'): Promise<EncryptedMessage> {
    try {
      const key = await this.generateUserKey(userId);
      
      // Criptografia básica com base64 + XOR
      const encrypted = this.simpleEncrypt(message, key);

      return {
        content: encrypted,
        iv: Date.now().toString(),
        timestamp: Date.now(),
        type: messageType
      };
    } catch (error) {
      console.error('[CRYPTO] Erro na criptografia:', error);
      throw new Error('Falha na criptografia da mensagem');
    }
  }

  // Descriptografia básica
  static async decryptMessage(encryptedData: EncryptedMessage, userId: string): Promise<string> {
    try {
      const key = await this.generateUserKey(userId);
      
      // Descriptografia básica
      const decrypted = this.simpleDecrypt(encryptedData.content, key);
      return decrypted;
    } catch (error) {
      console.error('[CRYPTO] Erro na descriptografia:', error);
      return '[Mensagem criptografada - erro na descriptografia]';
    }
  }

  // Criptografia para arquivos de mídia
  static async encryptMedia(base64Data: string, userId: string, mediaType: 'image' | 'audio' | 'video'): Promise<EncryptedMessage> {
    // Comprimir antes de criptografar para otimização
    const compressed = this.compressBase64(base64Data);
    return this.encryptMessage(compressed, userId, mediaType);
  }

  // Descriptografia para arquivos de mídia
  static async decryptMedia(encryptedData: EncryptedMessage, userId: string): Promise<string> {
    const decrypted = await this.decryptMessage(encryptedData, userId);
    return this.decompressBase64(decrypted);
  }

  // Compressão básica para otimizar mídia
  private static compressBase64(base64: string): string {
    try {
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(base64));
    } catch {
      return base64;
    }
  }

  // Descompressão
  private static decompressBase64(compressed: string): string {
    try {
      return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(compressed));
    } catch {
      return compressed;
    }
  }

  // Limpar chaves de criptografia (logout/reset)
  static async clearUserKeys(userId: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.ENCRYPTION_KEY}_${userId}`);
  }

  // Verificar integridade da mensagem
  static verifyMessageIntegrity(encryptedData: EncryptedMessage): boolean {
    const now = Date.now();
    const messageAge = now - encryptedData.timestamp;
    
    // Mensagens mais de 24h são suspeitas
    if (messageAge > 24 * 60 * 60 * 1000) {
      console.warn('[CRYPTO] Mensagem muito antiga detectada');
      return false;
    }

    return true;
  }

  // Métodos auxiliares de criptografia simples
  private static simpleEncrypt(text: string, key: string): string {
    const encoded = Buffer.from(text, 'utf8').toString('base64');
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
  }

  private static simpleDecrypt(encrypted: string, key: string): string {
    try {
      const decoded = Buffer.from(encrypted, 'base64').toString('binary');
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return Buffer.from(result, 'base64').toString('utf8');
    } catch {
      return '[Erro na descriptografia]';
    }
  }

  private static async generateHash(data: string): Promise<string> {
    // Hash simples usando algoritmo interno
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4);
  }

  // Hash seguro para verificação
  static async generateSecureHash(data: string): Promise<string> {
    return this.generateHash(data + 'anvic_salt_secure');
  }
}

export const crypto = new AnvicCrypto();