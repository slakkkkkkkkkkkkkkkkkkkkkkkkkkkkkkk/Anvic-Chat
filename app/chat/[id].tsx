import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { chatService } from '@/services/endpoints/chat';
import { Message } from '@/services/types';
import { mediaService, MediaFile } from '@/services/media';
import { screenProtection } from '@/services/screenshot-protection';
import { typingService } from '@/services/typing';
import { favoritesService } from '@/services/favorites';
import MediaPicker from '@/components/ui/MediaPicker';
import AudioRecorder from '@/components/ui/AudioRecorder';
import MessageReactions from '@/components/ui/MessageReactions';
import MessageActions from '@/components/ui/MessageActions';
import ReadStatusIndicator from '@/components/ui/ReadStatusIndicator';
import TypingIndicator from '@/components/ui/TypingIndicator';

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { id: conversationId, userName, avatar, otherUserId } = useLocalSearchParams();
  
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [reactions, setReactions] = useState<{ [messageId: string]: { [emoji: string]: string[] } }>({});
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Private mode detection
  const isPrivateMode = settings.sexyModeEnabled;

  useEffect(() => {
    if (isPrivateMode) {
      screenProtection.enableScreenProtection();
      return () => {
        screenProtection.disableScreenProtection();
      };
    }
  }, [isPrivateMode]);

  useEffect(() => {
    if (conversationId && user && otherUserId) {
      loadMessages();
      markAsRead();
      checkBlockStatus();

      // Subscribe to new messages
      const subscription = chatService.subscribeToMessages(
        conversationId as string,
        (payload) => {
          if (payload.new) {
            const newMsg = payload.new;
            chatService.getUserProfile(newMsg.sender_id).then(({ data: sender }) => {
              setMessages(prev => [...prev, { ...newMsg, sender }]);
            });
          }
        }
      );

      // Subscribe to typing updates
      const typingSubscription = typingService.subscribeToTyping(
        conversationId as string,
        (typingStatus) => {
          if (typingStatus.userId !== user.id) {
            setOtherUserTyping(typingStatus.isTyping);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
        typingSubscription.unsubscribe();
        typingService.cleanup();
      };
    }
  }, [conversationId, user, otherUserId]);

  // Auto-destruct messages when leaving private mode chat
  useEffect(() => {
    return () => {
      if (isPrivateMode && messages.length > 0) {
        setMessages([]);
      }
    };
  }, [isPrivateMode]);

  const showAlert = (title: string, message: string, actions?: any[]) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message, actions);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await chatService.getConversationMessages(conversationId as string);
      if (!error && data) {
        setMessages(data);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBlockStatus = async () => {
    if (!user || !otherUserId) return;

    try {
      const { data: blocked } = await chatService.isUserBlocked(user.id, otherUserId as string);
      setIsBlocked(blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;
    
    try {
      await chatService.markMessagesAsRead(conversationId as string, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user || sending || isBlocked) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    await typingService.stopTyping(conversationId as string, user.id);

    try {
      const { data, error } = await chatService.sendMessage(
        conversationId as string,
        user.id,
        messageText
      );

      if (error) {
        showAlert('Erro', 'Não foi possível enviar a mensagem');
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showAlert('Erro', 'Erro de conexão');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = async (text: string) => {
    setNewMessage(text);

    if (!user || !conversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length > 0) {
      // Start typing
      await typingService.updateTyping(
        conversationId as string, 
        user.id, 
        userName as string
      );

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        typingService.stopTyping(conversationId as string, user.id);
      }, 3000);
    } else {
      // Stop typing immediately if text is empty
      await typingService.stopTyping(conversationId as string, user.id);
    }
  };

  const handleMediaSelected = async (media: MediaFile) => {
    if (!conversationId || !user || isBlocked) return;

    setSending(true);
    try {
      const mediaMessage = `[${media.type.toUpperCase()}${media.encrypted ? ' 🔒' : ''}] ${media.name}`;
      
      const { data, error } = await chatService.sendMessage(
        conversationId as string,
        user.id,
        mediaMessage,
        media.type
      );

      if (error) {
        showAlert('Erro', 'Não foi possível enviar a mídia');
      }
    } catch (error) {
      console.error('Error sending media:', error);
      showAlert('Erro', 'Erro ao enviar mídia');
    } finally {
      setSending(false);
    }
  };

  const handleAudioRecorded = async (audio: MediaFile) => {
    await handleMediaSelected(audio);
  };

  const handleBlockUser = () => {
    if (!user || !otherUserId) return;

    const confirmBlock = async () => {
      try {
        const { error } = await chatService.blockUser(user.id, otherUserId as string);
        if (!error) {
          showAlert('Usuário Bloqueado', 'O usuário foi bloqueado com sucesso');
          setIsBlocked(true);
          router.back();
        } else {
          showAlert('Erro', 'Não foi possível bloquear o usuário');
        }
      } catch (error) {
        console.error('Error blocking user:', error);
        showAlert('Erro', 'Erro de conexão');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Bloquear ${userName}?`)) {
        confirmBlock();
      }
    } else {
      Alert.alert(
        'Bloquear Usuário',
        `Deseja bloquear ${userName}? Vocês não poderão mais se enviar mensagens.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Bloquear', style: 'destructive', onPress: confirmBlock },
        ]
      );
    }
  };

  const handleMessageLongPress = (messageId: string) => {
    setSelectedMessage(messageId);
    setActionsVisible(true);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // Update local state
    setReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: [...(prev[messageId]?.[emoji] || []), user.id]
      }
    }));
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // Update local state
    setReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: (prev[messageId]?.[emoji] || []).filter(id => id !== user.id)
      }
    }));
  };

  const handleToggleFavorite = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      const isFavorited = await favoritesService.isFavorited(messageId);
      
      if (isFavorited) {
        await favoritesService.removeFromFavorites(messageId);
        showAlert('Removido', 'Mensagem removida dos favoritos');
      } else {
        await favoritesService.addToFavorites(
          messageId,
          conversationId as string,
          message.content,
          message.sender?.full_name || message.sender?.username || 'Usuário',
          message.created_at,
          message.message_type as any
        );
        showAlert('Favoritado', 'Mensagem adicionada aos favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showAlert('Erro', 'Não foi possível favoritar a mensagem');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    if (sending) return 'sending';
    if (message.is_read) return 'read';
    return 'delivered';
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === user?.id;
    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1].sender_id !== item.sender_id);
    const messageReactions = reactions[item.id] || {};

    return (
      <TouchableOpacity
        onLongPress={() => handleMessageLongPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
          {showAvatar && !isMyMessage && (
            <Image
              source={{ 
                uri: avatar as string || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
              }}
              style={styles.messageAvatar}
            />
          )}
          {!showAvatar && !isMyMessage && <View style={styles.avatarSpacer} />}
          
          <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
              {item.content}
              {isPrivateMode && ' 🔒'}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                {formatMessageTime(item.created_at)}
              </Text>
              {isMyMessage && (
                <ReadStatusIndicator status={getMessageStatus(item) || 'sent'} />
              )}
            </View>
          </View>
        </View>

        <MessageReactions
          messageId={item.id}
          reactions={messageReactions}
          currentUserId={user?.id || ''}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, isPrivateMode && styles.privateHeader]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Image
              source={{ 
                uri: avatar as string || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>
                {userName || 'Usuário'}
                {isPrivateMode && ' 😈'}
              </Text>
              <Text style={styles.headerStatus}>
                {isBlocked ? 'Bloqueado' : 
                 otherUserTyping ? 'digitando...' :
                 isPrivateMode ? 'Modo Privado Ativo' : 'online'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {!isBlocked && (
              <>
                <TouchableOpacity style={styles.headerButton}>
                  <MaterialIcons name="videocam" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton}>
                  <MaterialIcons name="call" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleBlockUser}>
              <MaterialIcons name="block" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Private Mode Warning */}
        {isPrivateMode && (
          <View style={styles.privateModeWarning}>
            <MaterialIcons name="security" size={16} color="#ff6b6b" />
            <Text style={styles.privateModeText}>
              Modo Privado: Mensagens auto-destrutivas • Screenshots bloqueados
            </Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="chat" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isBlocked ? 'Usuário bloqueado' : 
                   isPrivateMode ? 'Conversa privada - Mensagens somem ao sair 😈' : 
                   'Inicie uma conversa'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            otherUserTyping ? (
              <TypingIndicator 
                isTyping={otherUserTyping} 
                userName={userName as string} 
              />
            ) : null
          }
        />

        {/* Input */}
        {!isBlocked && (
          <View style={[styles.inputContainer, isPrivateMode && styles.privateInputContainer]}>
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={() => setMediaPickerVisible(true)}
              >
                <MaterialIcons name="add" size={24} color={Colors.primary} />
              </TouchableOpacity>
              
              <AudioRecorder
                onAudioRecorded={handleAudioRecorded}
                enableEncryption={isPrivateMode}
                userId={user?.id}
                style={styles.audioButton}
              />
              
              <TextInput
                style={styles.textInput}
                placeholder={isPrivateMode ? "Mensagem privada... 😈" : "Digite uma mensagem..."}
                placeholderTextColor={Colors.textMuted}
                value={newMessage}
                onChangeText={handleTyping}
                multiline
                maxLength={1000}
              />
              
              <TouchableOpacity 
                style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color={!newMessage.trim() || sending ? Colors.textMuted : Colors.text} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isBlocked && (
          <View style={styles.blockedContainer}>
            <Text style={styles.blockedText}>Você bloqueou este usuário</Text>
          </View>
        )}

        {/* Media Picker Modal */}
        <MediaPicker
          visible={mediaPickerVisible}
          onClose={() => setMediaPickerVisible(false)}
          onMediaSelected={handleMediaSelected}
          enableEncryption={isPrivateMode}
          userId={user?.id}
        />

        {/* Message Actions Modal */}
        <MessageActions
          visible={actionsVisible}
          onClose={() => setActionsVisible(false)}
          messageId={selectedMessage || ''}
          isOwnMessage={selectedMessage ? messages.find(m => m.id === selectedMessage)?.sender_id === user?.id : false}
          isFavorited={false}
          onEdit={(messageId) => console.log('Edit:', messageId)}
          onDelete={(messageId) => console.log('Delete:', messageId)}
          onToggleFavorite={handleToggleFavorite}
          onReply={(messageId) => console.log('Reply:', messageId)}
          onForward={(messageId) => console.log('Forward:', messageId)}
          onCopy={(messageId) => console.log('Copy:', messageId)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  privateHeader: {
    borderBottomColor: '#ff6b6b',
    backgroundColor: '#ff6b6b10',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    color: Colors.success,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  privateModeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ff6b6b40',
  },
  privateModeText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginTop: 4,
  },
  avatarSpacer: {
    width: 36,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 2,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.text,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: Colors.text,
    opacity: 0.7,
    marginRight: 4,
  },
  otherMessageTime: {
    color: Colors.textMuted,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  privateInputContainer: {
    borderTopColor: '#ff6b6b40',
    backgroundColor: '#ff6b6b05',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    marginRight: 8,
    padding: 8,
  },
  audioButton: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  blockedContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  blockedText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
});