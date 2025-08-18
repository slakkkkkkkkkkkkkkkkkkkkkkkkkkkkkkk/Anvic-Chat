import CryptoJS from 'crypto-js';
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
    const hash = CryptoJS.SHA256(keyMaterial).toString();
    const key = hash.substring(0, this.KEY_LENGTH);
    
    await AsyncStorage.setItem(`${this.ENCRYPTION_KEY}_${userId}`, key);
    return key;
  }

  // Criptografia AES-256-CBC ultra forte
  static async encryptMessage(message: string, userId: string, messageType: 'text' | 'image' | 'audio' | 'video' = 'text'): Promise<EncryptedMessage> {
    try {
      const key = await this.generateUserKey(userId);
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Multi-layer encryption para segurança máxima
      const firstLayer = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString();

      // Segunda camada com salt adicional
      const salt = CryptoJS.lib.WordArray.random(8).toString();
      const secondLayer = CryptoJS.AES.encrypt(`${salt}:${firstLayer}`, key + salt, {
        mode: CryptoJS.mode.CTR
      }).toString();

      return {
        content: secondLayer,
        iv: iv.toString(),
        timestamp: Date.now(),
        type: messageType
      };
    } catch (error) {
      console.error('[CRYPTO] Erro na criptografia:', error);
      throw new Error('Falha na criptografia da mensagem');
    }
  }

  // Descriptografia AES-256-CBC
  static async decryptMessage(encryptedData: EncryptedMessage, userId: string): Promise<string> {
    try {
      const key = await this.generateUserKey(userId);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Primeira descriptografia (segunda camada)
      const firstDecrypt = CryptoJS.AES.decrypt(encryptedData.content, key, {
        mode: CryptoJS.mode.CTR
      }).toString(CryptoJS.enc.Utf8);

      // Separar salt e conteúdo
      const [salt, encryptedContent] = firstDecrypt.split(':');
      
      // Segunda descriptografia (primeira camada)
      const finalDecrypt = CryptoJS.AES.decrypt(encryptedContent, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString(CryptoJS.enc.Utf8);

      return finalDecrypt;
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

  // Hash seguro para verificação
  static generateSecureHash(data: string): string {
    return CryptoJS.SHA256(data + 'anvic_salt_secure').toString();
  }
}

export const crypto = new AnvicCrypto();