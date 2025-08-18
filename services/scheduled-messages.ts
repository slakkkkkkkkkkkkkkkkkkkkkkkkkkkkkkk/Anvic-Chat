import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video';
  scheduledTime: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  sentAt?: string;
}

class ScheduledMessagesService {
  private static readonly SCHEDULED_KEY = 'anvic_scheduled_messages';
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startScheduleChecker();
  }

  // Agendar nova mensagem
  async scheduleMessage(
    conversationId: string,
    recipientId: string,
    content: string,
    scheduledTime: Date,
    messageType: 'text' | 'image' | 'audio' | 'video' = 'text'
  ): Promise<ScheduledMessage> {
    const scheduledMessage: ScheduledMessage = {
      id: `scheduled_${Date.now()}_${Math.random()}`,
      conversationId,
      recipientId,
      content,
      messageType,
      scheduledTime: scheduledTime.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const messages = await this.getScheduledMessages();
    messages.push(scheduledMessage);
    await this.saveScheduledMessages(messages);

    // Agendar notificação local
    await this.scheduleNotification(scheduledMessage);

    return scheduledMessage;
  }

  // Obter mensagens agendadas
  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const data = await AsyncStorage.getItem(ScheduledMessagesService.SCHEDULED_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar mensagens agendadas:', error);
      return [];
    }
  }

  // Obter mensagens pendentes
  async getPendingMessages(): Promise<ScheduledMessage[]> {
    const messages = await this.getScheduledMessages();
    return messages.filter(msg => msg.status === 'pending');
  }

  // Cancelar mensagem agendada
  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    try {
      const messages = await this.getScheduledMessages();
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'cancelled' as const } : msg
      );

      await this.saveScheduledMessages(updatedMessages);

      // Cancelar notificação
      await Notifications.cancelScheduledNotificationAsync(messageId);

      return true;
    } catch (error) {
      console.error('Erro ao cancelar mensagem:', error);
      return false;
    }
  }

  // Verificar e enviar mensagens que chegaram na hora
  private async checkAndSendDueMessages(): Promise<void> {
    try {
      const messages = await this.getScheduledMessages();
      const now = new Date();

      for (const message of messages) {
        if (message.status === 'pending' && new Date(message.scheduledTime) <= now) {
          await this.sendScheduledMessage(message);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar mensagens agendadas:', error);
    }
  }

  // Enviar mensagem agendada
  private async sendScheduledMessage(message: ScheduledMessage): Promise<void> {
    try {
      // Aqui integraria com o sistema de chat para enviar a mensagem
      // Por agora, apenas marcamos como enviada
      
      const messages = await this.getScheduledMessages();
      const updatedMessages = messages.map(msg =>
        msg.id === message.id 
          ? { ...msg, status: 'sent' as const, sentAt: new Date().toISOString() }
          : msg
      );

      await this.saveScheduledMessages(updatedMessages);

      // Notificar que a mensagem foi enviada
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Mensagem Enviada',
          body: 'Sua mensagem agendada foi enviada com sucesso!',
        },
        trigger: null,
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem agendada:', error);
      
      // Marcar como falha
      const messages = await this.getScheduledMessages();
      const updatedMessages = messages.map(msg =>
        msg.id === message.id ? { ...msg, status: 'failed' as const } : msg
      );
      await this.saveScheduledMessages(updatedMessages);
    }
  }

  // Agendar notificação
  private async scheduleNotification(message: ScheduledMessage): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Mensagem Agendada',
          body: `Enviando: "${message.content.substring(0, 50)}..."`,
        },
        trigger: {
          date: new Date(message.scheduledTime),
        },
        identifier: message.id,
      });
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
    }
  }

  // Salvar mensagens
  private async saveScheduledMessages(messages: ScheduledMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ScheduledMessagesService.SCHEDULED_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error('Erro ao salvar mensagens agendadas:', error);
    }
  }

  // Iniciar verificador de horários
  private startScheduleChecker(): void {
    // Verificar a cada minuto
    this.intervalId = setInterval(() => {
      this.checkAndSendDueMessages();
    }, 60000);
  }

  // Parar verificador
  stopScheduleChecker(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Obter estatísticas
  async getScheduleStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const messages = await this.getScheduledMessages();
    
    return {
      total: messages.length,
      pending: messages.filter(m => m.status === 'pending').length,
      sent: messages.filter(m => m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length,
      cancelled: messages.filter(m => m.status === 'cancelled').length,
    };
  }
}

export const scheduledMessagesService = new ScheduledMessagesService();