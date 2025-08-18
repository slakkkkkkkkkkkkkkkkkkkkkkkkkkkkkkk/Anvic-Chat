import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Platform, Alert } from 'react-native';
import { AnvicCrypto } from './encryption';

export interface MediaFile {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  size?: number;
  duration?: number;
  encrypted?: boolean;
}

export interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
  mediaLibrary: boolean;
}

class AnvicMediaService {
  private recording: Audio.Recording | null = null;
  private permissions: MediaPermissions = {
    camera: false,
    microphone: false,
    mediaLibrary: false
  };

  // ============== SISTEMA DE PERMISSÕES ==============
  async requestAllPermissions(): Promise<MediaPermissions> {
    try {
      // Permissão da câmera
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      this.permissions.camera = cameraPermission.status === 'granted';

      // Permissão do microfone  
      const audioPermission = await Audio.requestPermissionsAsync();
      this.permissions.microphone = audioPermission.status === 'granted';

      // Permissão da galeria
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      this.permissions.mediaLibrary = mediaPermission.status === 'granted';

      return this.permissions;
    } catch (error) {
      console.error('[MEDIA] Erro ao solicitar permissões:', error);
      return this.permissions;
    }
  }

  getPermissions(): MediaPermissions {
    return this.permissions;
  }

  // ============== CAPTURA DE FOTOS ==============
  async capturePhoto(encrypt: boolean = false, userId?: string): Promise<MediaFile | null> {
    if (!this.permissions.camera) {
      const permission = await Camera.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        this.showPermissionAlert('câmera');
        return null;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: encrypt, // Só gerar base64 se for criptografar
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        let finalUri = asset.uri;
        
        if (encrypt && userId && asset.base64) {
          // Criptografar a imagem
          const encrypted = await AnvicCrypto.encryptMedia(asset.base64, userId, 'image');
          
          // Salvar versão criptografada temporariamente
          const encryptedPath = `${FileSystem.documentDirectory}encrypted_photo_${Date.now()}.enc`;
          await FileSystem.writeAsStringAsync(encryptedPath, JSON.stringify(encrypted));
          finalUri = encryptedPath;
        }

        return {
          uri: finalUri,
          type: 'image',
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize,
          encrypted: encrypt
        };
      }

      return null;
    } catch (error) {
      console.error('[MEDIA] Erro ao capturar foto:', error);
      return null;
    }
  }

  // ============== SELEÇÃO DE FOTOS DA GALERIA ==============
  async pickImage(encrypt: boolean = false, userId?: string): Promise<MediaFile | null> {
    if (!this.permissions.mediaLibrary) {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        this.showPermissionAlert('galeria');
        return null;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: encrypt,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        let finalUri = asset.uri;
        
        if (encrypt && userId && asset.base64) {
          const encrypted = await AnvicCrypto.encryptMedia(asset.base64, userId, 'image');
          const encryptedPath = `${FileSystem.documentDirectory}encrypted_image_${Date.now()}.enc`;
          await FileSystem.writeAsStringAsync(encryptedPath, JSON.stringify(encrypted));
          finalUri = encryptedPath;
        }

        return {
          uri: finalUri,
          type: 'image',
          name: `image_${Date.now()}.jpg`,
          size: asset.fileSize,
          encrypted: encrypt
        };
      }

      return null;
    } catch (error) {
      console.error('[MEDIA] Erro ao selecionar imagem:', error);
      return null;
    }
  }

  // ============== GRAVAÇÃO DE ÁUDIO ==============
  async startAudioRecording(): Promise<boolean> {
    if (!this.permissions.microphone) {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        this.showPermissionAlert('microfone');
        return false;
      }
    }

    try {
      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      // Configurações de gravação de alta qualidade
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      return true;
    } catch (error) {
      console.error('[MEDIA] Erro ao iniciar gravação:', error);
      return false;
    }
  }

  async stopAudioRecording(encrypt: boolean = false, userId?: string): Promise<MediaFile | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) return null;

      // Informações do arquivo
      const fileInfo = await FileSystem.getInfoAsync(uri);
      let finalUri = uri;

      if (encrypt && userId) {
        // Ler arquivo como base64 e criptografar
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        const encrypted = await AnvicCrypto.encryptMedia(base64Audio, userId, 'audio');
        const encryptedPath = `${FileSystem.documentDirectory}encrypted_audio_${Date.now()}.enc`;
        await FileSystem.writeAsStringAsync(encryptedPath, JSON.stringify(encrypted));
        finalUri = encryptedPath;
        
        // Remover arquivo original não criptografado
        await FileSystem.deleteAsync(uri);
      }

      const result: MediaFile = {
        uri: finalUri,
        type: 'audio',
        name: `audio_${Date.now()}.m4a`,
        size: fileInfo.exists ? fileInfo.size : undefined,
        encrypted: encrypt
      };

      this.recording = null;
      return result;
    } catch (error) {
      console.error('[MEDIA] Erro ao parar gravação:', error);
      this.recording = null;
      return null;
    }
  }

  // ============== GRAVAÇÃO DE VÍDEO ==============
  async captureVideo(encrypt: boolean = false, userId?: string): Promise<MediaFile | null> {
    if (!this.permissions.camera) {
      const permission = await Camera.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        this.showPermissionAlert('câmera');
        return null;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // Máximo 60 segundos
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let finalUri = asset.uri;

        if (encrypt && userId) {
          // Para vídeos, criptografar é mais complexo - implementar se necessário
          const base64Video = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          const encrypted = await AnvicCrypto.encryptMedia(base64Video, userId, 'video');
          const encryptedPath = `${FileSystem.documentDirectory}encrypted_video_${Date.now()}.enc`;
          await FileSystem.writeAsStringAsync(encryptedPath, JSON.stringify(encrypted));
          finalUri = encryptedPath;
        }

        return {
          uri: finalUri,
          type: 'video',
          name: `video_${Date.now()}.mp4`,
          size: asset.fileSize,
          duration: asset.duration,
          encrypted: encrypt
        };
      }

      return null;
    } catch (error) {
      console.error('[MEDIA] Erro ao capturar vídeo:', error);
      return null;
    }
  }

  // ============== DESCRIPTOGRAFIA DE MÍDIA ==============
  async decryptMedia(encryptedPath: string, userId: string): Promise<string | null> {
    try {
      const encryptedData = await FileSystem.readAsStringAsync(encryptedPath);
      const parsed = JSON.parse(encryptedData);
      
      const decryptedBase64 = await AnvicCrypto.decryptMedia(parsed, userId);
      
      // Criar arquivo temporário descriptografado
      const tempPath = `${FileSystem.documentDirectory}temp_decrypted_${Date.now()}.${parsed.type === 'image' ? 'jpg' : parsed.type === 'audio' ? 'm4a' : 'mp4'}`;
      await FileSystem.writeAsStringAsync(tempPath, decryptedBase64, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      return tempPath;
    } catch (error) {
      console.error('[MEDIA] Erro ao descriptografar mídia:', error);
      return null;
    }
  }

  // ============== LIMPEZA DE ARQUIVOS TEMPORÁRIOS ==============
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      const tempFiles = files.filter(file => 
        file.includes('temp_') || 
        file.includes('encrypted_') ||
        file.includes('decrypted_')
      );

      for (const file of tempFiles) {
        const filePath = `${FileSystem.documentDirectory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        // Remover arquivos com mais de 1 hora
        if (fileInfo.exists && fileInfo.modificationTime) {
          const now = Date.now();
          const fileAge = now - fileInfo.modificationTime * 1000;
          
          if (fileAge > 60 * 60 * 1000) { // 1 hora
            await FileSystem.deleteAsync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('[MEDIA] Erro na limpeza de arquivos:', error);
    }
  }

  // ============== UTILITÁRIOS ==============
  private showPermissionAlert(permission: string): void {
    if (Platform.OS === 'web') {
      console.log(`Permissão necessária: ${permission}`);
    } else {
      Alert.alert(
        'Permissão Necessária',
        `Para usar esta funcionalidade, é necessário permitir acesso ao ${permission}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurações', onPress: () => console.log('Abrir configurações') }
        ]
      );
    }
  }

  // Verificar se está gravando
  isRecording(): boolean {
    return this.recording !== null;
  }

  // Cancelar gravação
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      } catch (error) {
        console.error('[MEDIA] Erro ao cancelar gravação:', error);
      }
    }
  }
}

export const mediaService = new AnvicMediaService();