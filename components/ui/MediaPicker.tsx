import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { mediaService, MediaFile } from '@/services/media';

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onMediaSelected: (media: MediaFile) => void;
  enableEncryption?: boolean;
  userId?: string;
}

export default function MediaPicker({ 
  visible, 
  onClose, 
  onMediaSelected, 
  enableEncryption = false,
  userId 
}: MediaPickerProps) {
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleMediaAction = async (action: string) => {
    if (loading) return;

    setLoading(true);
    try {
      let result: MediaFile | null = null;

      switch (action) {
        case 'camera':
          result = await mediaService.capturePhoto(enableEncryption, userId);
          break;
        case 'gallery':
          result = await mediaService.pickImage(enableEncryption, userId);
          break;
        case 'video':
          result = await mediaService.captureVideo(enableEncryption, userId);
          break;
        default:
          break;
      }

      if (result) {
        onMediaSelected(result);
        onClose();
      }
    } catch (error) {
      console.error('[MEDIA PICKER] Erro:', error);
      showAlert('Erro', 'Não foi possível processar a mídia');
    } finally {
      setLoading(false);
    }
  };

  const MediaOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    color = Colors.primary 
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.mediaOption}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={24} color={Colors.text} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
        {enableEncryption && (
          <View style={styles.encryptionBadge}>
            <MaterialIcons name="lock" size={12} color={Colors.text} />
            <Text style={styles.encryptionText}>Criptografado</Text>
          </View>
        )}
      </View>
      {loading && <MaterialIcons name="hourglass-empty" size={20} color={Colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {enableEncryption ? 'Mídia Privada 😈' : 'Selecionar Mídia'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {enableEncryption && (
          <View style={styles.privacyNotice}>
            <MaterialIcons name="security" size={20} color="#ff6b6b" />
            <Text style={styles.privacyText}>
              Modo Privado Ativo - Mídia será criptografada
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <MediaOption
            icon="camera-alt"
            title="Câmera"
            subtitle="Tirar foto ou gravar vídeo"
            onPress={() => handleMediaAction('camera')}
            color={Colors.primary}
          />

          <MediaOption
            icon="photo-library"
            title="Galeria"
            subtitle="Escolher foto da galeria"
            onPress={() => handleMediaAction('gallery')}
            color="#10B981"
          />

          <MediaOption
            icon="videocam"
            title="Gravar Vídeo"
            subtitle="Capturar vídeo com a câmera"
            onPress={() => handleMediaAction('video')}
            color="#F59E0B"
          />

          {/* Opção de áudio será implementada no chat */}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {enableEncryption 
              ? '🔒 Todas as mídias serão criptografadas com AES-256' 
              : '📁 Mídia será salva normalmente'
            }
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b20',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  privacyText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  encryptionText: {
    color: '#ff6b6b',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});