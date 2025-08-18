import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { Themes } from '@/constants/Themes';

interface MessageActionsProps {
  visible: boolean;
  onClose: () => void;
  messageId: string;
  isOwnMessage: boolean;
  isFavorited: boolean;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onToggleFavorite: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onForward: (messageId: string) => void;
  onCopy: (messageId: string) => void;
}

export default function MessageActions({
  visible,
  onClose,
  messageId,
  isOwnMessage,
  isFavorited,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReply,
  onForward,
  onCopy,
}: MessageActionsProps) {
  const { settings } = useSettings();
  const currentTheme = Themes[settings.theme];
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const showAlert = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (confirm(`${title}\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  const handleDelete = () => {
    showAlert(
      'Apagar Mensagem',
      'Esta ação não pode ser desfeita. Deseja continuar?',
      () => {
        onDelete(messageId);
        onClose();
      }
    );
  };

  const ActionButton = ({ 
    icon, 
    title, 
    onPress, 
    color = currentTheme.text,
    dangerous = false 
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
    dangerous?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.actionButton, dangerous && styles.dangerousAction]}
      onPress={() => {
        onPress();
        if (!dangerous) onClose();
      }}
      activeOpacity={0.7}
    >
      <MaterialIcons name={icon as any} size={20} color={dangerous ? Colors.error : color} />
      <Text style={[styles.actionText, { color: dangerous ? Colors.error : color }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.actionsContainer,
            { backgroundColor: currentTheme.surface, opacity: fadeAnim }
          ]}
        >
          <View style={[styles.handle, { backgroundColor: currentTheme.textMuted }]} />
          
          <Text style={[styles.title, { color: currentTheme.text }]}>
            Ações da Mensagem
          </Text>

          <View style={styles.actionsList}>
            <ActionButton
              icon="reply"
              title="Responder"
              onPress={() => onReply(messageId)}
            />

            <ActionButton
              icon="forward"
              title="Encaminhar"
              onPress={() => onForward(messageId)}
            />

            <ActionButton
              icon="content-copy"
              title="Copiar"
              onPress={() => onCopy(messageId)}
            />

            <ActionButton
              icon={isFavorited ? "favorite" : "favorite-border"}
              title={isFavorited ? "Desfavoritar" : "Favoritar"}
              onPress={() => onToggleFavorite(messageId)}
              color={isFavorited ? Colors.warning : currentTheme.text}
            />

            {isOwnMessage && (
              <>
                <ActionButton
                  icon="edit"
                  title="Editar"
                  onPress={() => onEdit(messageId)}
                />

                <ActionButton
                  icon="delete"
                  title="Apagar"
                  onPress={handleDelete}
                  dangerous
                />
              </>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionsList: {
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dangerousAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
});