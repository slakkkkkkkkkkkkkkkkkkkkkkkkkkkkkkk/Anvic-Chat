import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { chatService } from '@/services/endpoints/chat';
import { UserBlock } from '@/services/types';
import { useAuth } from '@/hooks/useAuth';

interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BlockedUsersModal({ visible, onClose }: BlockedUsersModalProps) {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadBlockedUsers();
    }
  }, [visible, user]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadBlockedUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await chatService.getBlockedUsers(user.id);
      if (!error && data) {
        setBlockedUsers(data);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (blockedUserId: string, userName: string) => {
    if (!user) return;

    const confirmUnblock = () => {
      performUnblock(blockedUserId);
    };

    if (Platform.OS === 'web') {
      if (confirm(`Desbloquear ${userName}?`)) {
        confirmUnblock();
      }
    } else {
      Alert.alert(
        'Desbloquear Usuário',
        `Deseja desbloquear ${userName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desbloquear', onPress: confirmUnblock },
        ]
      );
    }
  };

  const performUnblock = async (blockedUserId: string) => {
    if (!user) return;

    setUnblockingUserId(blockedUserId);
    try {
      const { error } = await chatService.unblockUser(user.id, blockedUserId);
      if (!error) {
        setBlockedUsers(prev => prev.filter(block => block.blocked_id !== blockedUserId));
        showAlert('Sucesso', 'Usuário desbloqueado com sucesso');
      } else {
        showAlert('Erro', 'Não foi possível desbloquear o usuário');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      showAlert('Erro', 'Erro de conexão');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const renderBlockedUser = ({ item }: { item: UserBlock }) => {
    const blockedUser = item.blocked_user;
    if (!blockedUser) return null;

    return (
      <View style={styles.userItem}>
        <Image
          source={{ 
            uri: blockedUser.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' 
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{blockedUser.full_name || blockedUser.username || 'Usuário'}</Text>
          <Text style={styles.userHandle}>@{blockedUser.username}</Text>
          <Text style={styles.blockedDate}>
            Bloqueado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, unblockingUserId === item.blocked_id && styles.unblockButtonDisabled]}
          onPress={() => handleUnblockUser(item.blocked_id, blockedUser.full_name || blockedUser.username || 'usuário')}
          disabled={unblockingUserId === item.blocked_id}
        >
          {unblockingUserId === item.blocked_id ? (
            <ActivityIndicator color={Colors.text} size="small" />
          ) : (
            <Text style={styles.unblockButtonText}>Desbloquear</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Usuários Bloqueados</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Carregando usuários bloqueados...</Text>
            </View>
          ) : blockedUsers.length > 0 ? (
            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUser}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="block" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum usuário bloqueado</Text>
              <Text style={styles.emptySubtext}>
                Usuários bloqueados aparecerão aqui
              </Text>
            </View>
          )}
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
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHandle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 2,
  },
  blockedDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  unblockButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});