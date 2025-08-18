import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { fileService, SharedFile } from '@/services/file-sharing';

interface FileShareModalProps {
  visible: boolean;
  onClose: () => void;
  onFileSelected: (file: SharedFile) => void;
}

export default function FileShareModal({
  visible,
  onClose,
  onFileSelected,
}: FileShareModalProps) {
  const [loading, setLoading] = useState(false);

  const handlePickFile = async () => {
    setLoading(true);
    try {
      const file = await fileService.pickDocument();
      if (file) {
        onFileSelected(file);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fileTypes = [
    {
      id: 'documents',
      title: 'Documentos',
      subtitle: 'PDF, DOC, TXT, XLS',
      icon: 'description',
      color: Colors.primary,
    },
    {
      id: 'archives',
      title: 'Arquivos Compactados',
      subtitle: 'ZIP, RAR, 7Z',
      icon: 'archive',
      color: '#FF6B6B',
    },
    {
      id: 'media',
      title: 'Mídia',
      subtitle: 'MP3, MP4, AVI, MOV',
      icon: 'movie',
      color: '#4ECDC4',
    },
    {
      id: 'all',
      title: 'Todos os Arquivos',
      subtitle: 'Qualquer tipo de arquivo',
      icon: 'folder',
      color: '#45B7D1',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compartilhar Arquivo</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <MaterialIcons name="attach-file" size={48} color={Colors.primary} />
            <Text style={styles.infoTitle}>Enviar Arquivos</Text>
            <Text style={styles.infoText}>
              Compartilhe documentos, imagens, vídeos e outros arquivos com facilidade.
            </Text>
          </View>

          <View style={styles.typesSection}>
            <Text style={styles.sectionTitle}>Tipos de Arquivo</Text>
            {fileTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeOption}
                onPress={handlePickFile}
                disabled={loading}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <MaterialIcons name={type.icon as any} size={24} color={type.color} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                  <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.limitsSection}>
            <Text style={styles.sectionTitle}>Informações</Text>
            <View style={styles.limitItem}>
              <MaterialIcons name="info" size={20} color={Colors.primary} />
              <Text style={styles.limitText}>Tamanho máximo: 100 MB por arquivo</Text>
            </View>
            <View style={styles.limitItem}>
              <MaterialIcons name="security" size={20} color={Colors.success} />
              <Text style={styles.limitText}>Todos os arquivos são verificados</Text>
            </View>
            <View style={styles.limitItem}>
              <MaterialIcons name="cloud-upload" size={20} color={Colors.warning} />
              <Text style={styles.limitText}>Upload seguro e criptografado</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.selectButton, loading && styles.selectButtonDisabled]}
            onPress={handlePickFile}
            disabled={loading}
          >
            {loading ? (
              <>
                <MaterialIcons name="hourglass-empty" size={20} color={Colors.text} />
                <Text style={styles.selectButtonText}>Selecionando...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="attach-file" size={20} color={Colors.text} />
                <Text style={styles.selectButtonText}>Selecionar Arquivo</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  infoSection: {
    alignItems: 'center',
    padding: 40,
    paddingBottom: 20,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  typesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  limitsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});