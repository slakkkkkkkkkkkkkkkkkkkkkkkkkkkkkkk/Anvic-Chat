import { supabase } from './supabase';

interface TypingStatus {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: string;
  userName?: string;
}

class TypingService {
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private currentlyTyping: Set<string> = new Set();

  // Iniciar indicação de digitação
  async startTyping(conversationId: string, userId: string, userName?: string): Promise<void> {
    try {
      // Limpar timeout anterior se existir
      const key = `${conversationId}_${userId}`;
      const existingTimeout = this.typingTimeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Marcar como digitando
      this.currentlyTyping.add(key);

      // Enviar status de digitação
      await supabase
        .channel(`typing_${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId,
            conversationId,
            isTyping: true,
            timestamp: new Date().toISOString(),
            userName
          }
        });

      // Auto-parar após 3 segundos de inatividade
      const timeout = setTimeout(() => {
        this.stopTyping(conversationId, userId);
      }, 3000);

      this.typingTimeouts.set(key, timeout);
    } catch (error) {
      console.error('Erro ao iniciar digitação:', error);
    }
  }

  // Parar indicação de digitação
  async stopTyping(conversationId: string, userId: string): Promise<void> {
    try {
      const key = `${conversationId}_${userId}`;
      
      // Limpar timeout
      const existingTimeout = this.typingTimeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeouts.delete(key);
      }

      // Remover da lista de digitando
      this.currentlyTyping.delete(key);

      // Enviar status de parada
      await supabase
        .channel(`typing_${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId,
            conversationId,
            isTyping: false,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Erro ao parar digitação:', error);
    }
  }

  // Verificar se está digitando
  isTyping(conversationId: string, userId: string): boolean {
    const key = `${conversationId}_${userId}`;
    return this.currentlyTyping.has(key);
  }

  // Inscrever-se em atualizações de digitação
  subscribeToTyping(
    conversationId: string, 
    onTypingUpdate: (typingStatus: TypingStatus) => void
  ) {
    return supabase
      .channel(`typing_${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        onTypingUpdate(payload as TypingStatus);
      })
      .subscribe();
  }

  // Limpar todos os timeouts (cleanup)
  cleanup(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.currentlyTyping.clear();
  }

  // Atualizar digitação (throttled)
  private lastTypingUpdate: Map<string, number> = new Map();
  
  async updateTyping(conversationId: string, userId: string, userName?: string): Promise<void> {
    const key = `${conversationId}_${userId}`;
    const now = Date.now();
    const lastUpdate = this.lastTypingUpdate.get(key) || 0;

    // Throttle para evitar spam (máximo 1 update por segundo)
    if (now - lastUpdate < 1000) {
      return;
    }

    this.lastTypingUpdate.set(key, now);
    await this.startTyping(conversationId, userId, userName);
  }
}

export const typingService = new TypingService();